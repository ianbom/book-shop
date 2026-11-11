<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\PreOrderCode;
use App\Services\Admin\OrderImportService;
use Illuminate\Contracts\Cache\LockProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class OrderImportController extends Controller
{
    public function __construct(private readonly OrderImportService $imports) {}

    public function index(): Response
    {
        return Inertia::render('admin/orders/import', ['draft' => null, 'fields' => OrderImportService::FIELDS, 'headers' => OrderImportService::HEADERS]);
    }

    public function template(): BinaryFileResponse
    {
        return response()->download(resource_path('templates/order-import-template.xlsx'), 'template-import-pesanan.xlsx');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx', 'extensions:xlsx', 'max:5120']]);
        $state = $this->imports->read($request->file('file')->getPathname());
        $state += [
            'name' => basename(str_replace('\\', '/', $request->file('file')->getClientOriginalName())),
            'owner' => $request->user()->id, 'session' => hash('sha256', $request->session()->getId()),
            'expires_at' => now()->addMinutes((int) config('session.lifetime', 120))->timestamp,
        ];
        $request->session()->put('order_imports.'.$state['id'], ['owner' => $state['owner'], 'expires_at' => $state['expires_at']]);
        $this->save($state);

        return to_route('admin.orders.import.show', $state['id']);
    }

    public function show(Request $request, string $draft): Response
    {
        return $this->locks()->lock('order-import-draft:'.$draft, 120)->block(5, function () use ($request, $draft): Response {
            $state = $this->imports->preview($this->load($request, $draft));
            $this->save($state);
            $page = max(1, min((int) $request->query('page', 1), max(1, (int) ceil(count($state['rows']) / 25))));

            return Inertia::render('admin/orders/import', [
                'draft' => [
                    'id' => $state['id'], 'name' => $state['name'], 'expires_at' => $state['expires_at'],
                    'rows' => array_slice($state['rows'], ($page - 1) * 25, 25), 'groups' => $state['groups'],
                    'warnings' => $state['warnings'], 'results' => $state['results'] ?? [],
                    'page' => $page, 'pages' => max(1, (int) ceil(count($state['rows']) / 25)),
                ],
                'fields' => OrderImportService::FIELDS, 'headers' => OrderImportService::HEADERS,
                'preOrderCodes' => PreOrderCode::orderBy('code')->get(['id', 'code'])->map(fn ($item) => ['id' => $item->id, 'label' => $item->code]),
                'categories' => Category::orderBy('name')->get(['id', 'name'])->map(fn ($item) => ['id' => $item->id, 'label' => $item->name]),
            ]);
        });
    }

    public function update(Request $request, string $draft, string $row): RedirectResponse
    {
        $data = $request->validate([
            'data' => ['required', 'array:'.implode(',', OrderImportService::FIELDS)],
            'data.*' => ['nullable', 'string', 'max:20000'],
            'decisions' => ['present', 'array', 'max:100'],
            'decisions.*' => ['nullable', 'string', 'regex:/\A(create|use:[0-9]+)?\z/'],
        ]);

        return $this->mutate($request, $draft, function (array $state) use ($data, $row): array {
            $index = array_search($row, array_column($state['rows'], 'id'), true);
            abort_if($index === false, 404);
            abort_if($state['rows'][$index]['order_id'] !== null, 409, 'Kelompok sudah tersimpan.');
            $values = array_map(fn ($value) => trim($value ?? ''), $data['data']);
            $code = strtoupper($values['order_code'] ?? $state['rows'][$index]['data']['order_code']);
            abort_if(collect($state['groups'])->contains(fn ($group) => $group['code'] === $code && $group['order_id'] !== null), 409, 'Kelompok sudah tersimpan.');
            $state['rows'][$index]['data'] = array_replace($state['rows'][$index]['data'], $values);
            foreach (array_keys($values) as $field) {
                unset($state['rows'][$index]['source_errors'][$field]);
            }
            $state['rows'][$index]['decisions'] = $data['decisions'];

            return $state;
        });
    }

    public function commit(Request $request, string $draft): RedirectResponse
    {
        $request->validate(['group_id' => ['nullable', 'uuid']]);

        return $this->mutate($request, $draft, function (array $state) use ($request): array {
            $groups = $state['groups'];
            if ($request->filled('group_id')) {
                $groups = array_values(array_filter($groups, fn ($group) => $group['id'] === $request->input('group_id')));
                abort_if($groups === [], 404);
            }
            $state['results'] = [];
            foreach ($groups as $group) {
                try {
                    $state['results'][] = $this->imports->commitGroup($state, $group['id'], $request->user());
                } catch (ValidationException $exception) {
                    $state['results'][] = ['group_id' => $group['id'], 'status' => 'invalid', 'errors' => collect($exception->errors())->flatten()->all()];
                } catch (\Throwable) {
                    // Do not log source rows, addresses, or initial credentials through SQL exception bindings.
                    $state['results'][] = ['group_id' => $group['id'], 'status' => 'failed', 'errors' => ['Penyimpanan gagal. Tinjau draf lalu coba lagi.']];
                }
                $state = $this->imports->preview($state);
                $this->save($state);
            }

            return $state;
        });
    }

    private function locks(): LockProvider
    {
        $store = Cache::store('file')->getStore();
        if (! $store instanceof LockProvider) {
            throw new \RuntimeException('Cache import tidak mendukung lock.');
        }

        return $store;
    }

    /** @param callable(array<string, mixed>): array<string, mixed> $operation */
    private function mutate(Request $request, string $draft, callable $operation): RedirectResponse
    {
        return $this->locks()->lock('order-import-draft:'.$draft, 120)->block(5, function () use ($request, $draft, $operation): RedirectResponse {
            $state = $this->imports->preview($this->load($request, $draft));
            $state = $this->imports->preview($operation($state));
            $this->save($state);

            return to_route('admin.orders.import.show', ['draft' => $draft, 'page' => $request->query('page', 1)]);
        });
    }

    /** @return array<string, mixed> */
    private function load(Request $request, string $id): array
    {
        $guard = $request->session()->get('order_imports.'.$id);
        abort_unless(Str::isUuid($id) && is_array($guard) && $guard['owner'] === $request->user()->id, 404);
        abort_if($guard['expires_at'] <= now()->timestamp, 410, 'Draf import kedaluwarsa. Unggah ulang Excel.');
        $state = Cache::store('file')->get('order-import:'.$id);
        abort_unless(is_array($state) && $state['owner'] === $request->user()->id
            && hash_equals($state['session'], hash('sha256', $request->session()->getId())), 404);

        return $state;
    }

    /** @param array<string, mixed> $state */
    private function save(array $state): void
    {
        Cache::store('file')->put('order-import:'.$state['id'], $state, max(1, $state['expires_at'] - now()->timestamp));
    }
}
