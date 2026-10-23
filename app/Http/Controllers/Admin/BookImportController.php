<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\PreOrderCode;
use App\Services\Admin\BookImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class BookImportController extends Controller
{
    public function __construct(private readonly BookImportService $imports) {}

    public function template(): BinaryFileResponse
    {
        return response()->download(resource_path('templates/book-import-template.xlsx'), 'template-import-buku.xlsx');
    }

    public function index(): Response
    {
        return Inertia::render('admin/books/import', ['draft' => null]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:xlsx', 'extensions:xlsx', 'max:5120']]);
        $rows = $this->imports->read($request->file('file'));
        $id = (string) Str::uuid();
        $draft = [
            'id' => $id, 'name' => $request->file('file')->getClientOriginalName(),
            'owner' => $request->user()->id, 'session' => hash('sha256', $request->session()->getId()),
            'expires_at' => now()->addMinutes((int) config('session.lifetime', 120))->timestamp,
            'rows' => $rows,
        ];
        $request->session()->put('book_imports.'.$id, true);
        $this->save($draft);

        return to_route('admin.books.import.show', $id);
    }

    public function show(Request $request, string $draft): Response
    {
        return $this->imports->lock('book-import-draft:'.$draft)->block(5, function () use ($request, $draft): Response {
            $state = $this->load($request, $draft);
            $state['rows'] = $this->imports->validateRows($state['rows']);
            $this->save($state);
            $status = $request->string('status')->toString();
            $rows = array_values(array_filter($state['rows'], fn ($row) => ! in_array($status, ['valid', 'error', 'saved'], true) || $row['status'] === $status));
            $page = max(1, min((int) $request->query('page', 1), max(1, (int) ceil(count($rows) / 25))));
            $summary = ['total' => count($state['rows']), 'valid' => 0, 'error' => 0, 'saved' => 0];
            foreach ($state['rows'] as $row) {
                $summary[$row['status']]++;
            }

            return Inertia::render('admin/books/import', [
                'draft' => [
                    'id' => $draft, 'name' => $state['name'], 'expires_at' => $state['expires_at'],
                    'rows' => array_slice($rows, ($page - 1) * 25, 25), 'summary' => $summary,
                    'page' => $page, 'pages' => max(1, (int) ceil(count($rows) / 25)), 'status' => $status,
                ],
                'categories' => Category::withTrashed()->orderBy('name')->get(['id', 'name', 'deleted_at'])->map(fn ($item) => ['id' => $item->id, 'label' => $item->name, 'deleted' => $item->trashed()]),
                'preOrderCodes' => PreOrderCode::withTrashed()->orderBy('code')->get(['id', 'code', 'deleted_at'])->map(fn ($item) => ['id' => $item->id, 'label' => $item->code, 'deleted' => $item->trashed()]),
            ]);
        });
    }

    public function update(Request $request, string $draft, string $row): RedirectResponse
    {
        $request->validate([
            'data' => ['required', 'array:'.implode(',', BookImportService::FIELDS)],
            'data.*' => ['nullable', 'string', 'max:20000'],
            'decisions' => ['present', 'array', 'max:100'],
            'decisions.*' => ['nullable', 'string', 'regex:/^(create|(use|restore):\d+)?$/'],
        ]);

        return $this->mutate($request, $draft, function (array $state) use ($request, $row): array {
            $index = $this->rowIndex($state, $row);
            abort_if($state['rows'][$index]['book_id'] !== null, 409, 'Buku sudah disimpan. Gunakan halaman edit buku.');
            $data = array_map(fn ($value) => trim($value ?? ''), $request->input('data'));
            $state['rows'][$index]['data'] = array_replace($state['rows'][$index]['data'], $data);
            $state['rows'][$index]['source_errors'] = [];
            $state['rows'][$index]['decisions'] = $request->input('decisions');

            return $state;
        });
    }

    public function destroyRow(Request $request, string $draft, string $row): RedirectResponse
    {
        return $this->mutate($request, $draft, function (array $state) use ($row): array {
            $index = $this->rowIndex($state, $row);
            abort_if($state['rows'][$index]['book_id'] !== null, 409, 'Buku sudah disimpan.');
            unset($state['rows'][$index]);
            $state['rows'] = array_values($state['rows']);

            return $state;
        });
    }

    public function commit(Request $request, string $draft): RedirectResponse
    {
        $request->validate(['row_id' => ['nullable', 'uuid']]);

        return $this->mutate($request, $draft, function (array $state) use ($request): array {
            if ($request->filled('row_id')) {
                $this->rowIndex($state, $request->input('row_id'));
            }
            $state['rows'] = $this->imports->commit($state['rows'], $request->input('row_id'), $request->user());
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Buku berhasil disimpan. Baris yang sudah tersimpan tidak diimport ulang.']);

            return $state;
        });
    }

    private function mutate(Request $request, string $draft, callable $operation): RedirectResponse
    {
        return $this->imports->lock('book-import-draft:'.$draft)->block(5, function () use ($request, $draft, $operation): RedirectResponse {
            $state = $this->load($request, $draft);
            try {
                $state = $operation($state);
            } catch (Throwable $exception) {
                $state['rows'] = $this->imports->validateRows($state['rows']);
                $this->save($state);
                if ($exception instanceof ValidationException || $exception instanceof HttpExceptionInterface) {
                    throw $exception;
                }
                report($exception);
                throw ValidationException::withMessages(['import' => 'Penyimpanan gagal atau data telah berubah. Tidak ada buku dari permintaan ini yang disimpan. Tinjau ulang lalu coba lagi.']);
            }
            $state['rows'] = $this->imports->validateRows($state['rows']);
            $this->save($state);

            return to_route('admin.books.import.show', ['draft' => $draft, 'page' => $request->query('page', 1), 'status' => $request->query('status', '')]);
        });
    }

    /** @param array<string, mixed> $state */
    private function rowIndex(array $state, string $id): int
    {
        foreach ($state['rows'] as $index => $row) {
            if ($row['id'] === $id) {
                return $index;
            }
        }
        abort(404);
    }

    /** @return array<string, mixed> */
    private function load(Request $request, string $id): array
    {
        abort_unless(Str::isUuid($id) && $request->session()->get('book_imports.'.$id), 404);
        $state = Cache::store('file')->get('book-import:'.$id);
        abort_unless(is_array($state) && $state['owner'] === $request->user()->id
            && hash_equals($state['session'], hash('sha256', $request->session()->getId())), 404);
        abort_if($state['expires_at'] <= now()->timestamp, 410, 'Draf import kedaluwarsa. Unggah ulang Excel.');

        return $state;
    }

    /** @param array<string, mixed> $state */
    private function save(array $state): void
    {
        Cache::store('file')->put('book-import:'.$state['id'], $state, max(1, $state['expires_at'] - now()->timestamp));
    }
}
