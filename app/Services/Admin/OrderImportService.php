<?php

namespace App\Services\Admin;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Models\Book;
use App\Models\Category;
use App\Models\Order;
use App\Models\PreOrderCode;
use App\Models\User;
use App\Support\BookReferenceName;
use App\Support\OrderImportMoney as Money;
use App\Support\XlsxArchive;
use DateTimeInterface;
use Illuminate\Contracts\Cache\LockProvider;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use OpenSpout\Common\Entity\Cell\FormulaCell;
use OpenSpout\Common\Entity\Cell\NumericCell;
use OpenSpout\Reader\XLSX\Reader;
use Throwable;

class OrderImportService
{
    public const HEADERS = ['kode order', 'email customer', 'nama customer', 'nama buku', 'kode PO', 'kategori buku', 'qty', 'harga satuan', 'discount', 'total dp', 'total sudah dibayar', 'harga total', 'eta', 'kode pos', 'alamat', 'status pesanan', 'berat perbuku (gram)'];

    public const FIELDS = ['order_code', 'email', 'customer_name', 'title', 'pre_order_code', 'categories', 'quantity', 'unit_price', 'discount', 'historical_dp', 'historical_paid', 'line_total', 'eta', 'postal_code', 'address', 'status', 'weight'];

    /** @return array<string, mixed> */
    public function read(string $path): array
    {
        XlsxArchive::check($path);
        $reader = new Reader;
        $rows = [];
        $warnings = [];
        $found = false;
        try {
            $reader->open($path);
            foreach ($reader->getSheetIterator() as $sheet) {
                if ($sheet->getName() !== 'Sheet1') {
                    $warnings[] = 'Sheet tambahan tidak diimpor: '.$sheet->getName();

                    continue;
                }
                if ($found) {
                    throw ValidationException::withMessages(['file' => 'Sheet1 harus tepat satu.']);
                }
                $found = true;
                $mapping = null;
                foreach ($sheet->getRowIterator() as $number => $row) {
                    $cells = $row->getCells();
                    if ($mapping === null) {
                        $mapping = [];
                        $seen = [];
                        foreach ($cells as $index => $cell) {
                            $header = is_string($cell->getValue()) ? mb_strtolower(trim($cell->getValue())) : '';
                            if ($header === '' || isset($seen[$header])) {
                                throw ValidationException::withMessages(['file' => 'Header kosong atau berulang.']);
                            }
                            $seen[$header] = true;
                            $position = array_search($header, array_map('mb_strtolower', self::HEADERS), true);
                            if ($position === false) {
                                $warnings[] = 'Kolom tidak didukung: '.$header;
                            } else {
                                $mapping[$index] = self::FIELDS[$position];
                            }
                        }
                        if (array_diff(self::FIELDS, $mapping) !== []) {
                            throw ValidationException::withMessages(['file' => 'Header wajib hilang. Gunakan template import pesanan.']);
                        }

                        continue;
                    }
                    $data = array_fill_keys(self::FIELDS, '');
                    $errors = [];
                    foreach ($cells as $index => $cell) {
                        if (! isset($mapping[$index])) {
                            continue;
                        }
                        $field = $mapping[$index];
                        $value = $cell->getValue();
                        $data[$field] = is_float($value) ? json_encode($value, JSON_THROW_ON_ERROR) : (is_scalar($value) ? trim((string) $value) : '');
                        // ponytail: numeric money >= 1e12 requires text correction; raw XML decimals would lift this ceiling.
                        if ($cell instanceof NumericCell && is_float($value) && abs($value) >= 1_000_000_000_000
                            && in_array($field, ['unit_price', 'discount', 'historical_dp', 'historical_paid', 'line_total'], true)) {
                            $errors[$field] = ['Presisi nominal numerik tidak aman. Koreksi sebagai teks desimal literal.'];
                        }
                        if (mb_strlen($data[$field]) > 20000) {
                            throw ValidationException::withMessages(['file' => 'Isi sel terlalu panjang.']);
                        }
                        if ($cell instanceof FormulaCell || $value instanceof DateTimeInterface) {
                            $errors[$field] = ['Gunakan nilai literal; ETA harus teks YYYY-MM.'];
                        }
                        if ($cell instanceof NumericCell && in_array($field, ['order_code', 'email', 'pre_order_code', 'postal_code'], true)) {
                            $errors[$field] = ['Identifier harus teks. Periksa digit/nol awal melalui koreksi.'];
                        }
                    }
                    if (! array_filter($data, fn ($value) => $value !== '')) {
                        continue;
                    }
                    if (count($rows) >= 1000) {
                        throw ValidationException::withMessages(['file' => 'Maksimal 1.000 baris per file.']);
                    }
                    $rows[] = ['id' => (string) Str::uuid(), 'number' => $number, 'data' => $data, 'source_errors' => $errors, 'decisions' => [], 'order_id' => null];
                }
            }
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            throw ValidationException::withMessages(['file' => 'File Excel tidak dapat dibaca.']);
        } finally {
            $reader->close();
        }
        if (! $found || $rows === []) {
            throw ValidationException::withMessages(['file' => 'Sheet1 tidak ditemukan atau kosong.']);
        }

        return $this->preview(['id' => (string) Str::uuid(), 'rows' => $rows, 'group_ids' => [], 'warnings' => $warnings]);
    }

    /**
     * @param  array<string, mixed>  $state
     * @return array<string, mixed>
     */
    public function preview(array $state): array
    {
        $books = Book::withTrashed()->get();
        $references = ['categories' => Category::withTrashed()->get(), 'pre_order_code' => PreOrderCode::withTrashed()->get()];
        $groups = [];
        $codes = array_map(fn ($row) => strtoupper(trim($row['data']['order_code'] ?? '')), $state['rows']);
        $state['group_ids'] = array_intersect_key($state['group_ids'] ?? [], array_fill_keys($codes, true));
        foreach ($state['rows'] as &$row) {
            $defaults = array_fill_keys(self::FIELDS, '');
            $data = array_replace($defaults, array_intersect_key($row['data'], $defaults));
            unset($row['source_errors']['legacy_weight']);
            $data['order_code'] = strtoupper(trim($data['order_code']));
            $data['email'] = mb_strtolower(trim($data['email']));
            foreach (['customer_name', 'title', 'pre_order_code', 'categories'] as $field) {
                $data[$field] = BookReferenceName::display($data[$field]);
            }
            $row['data'] = $data;
            $row['errors'] = $row['source_errors'] ?? [];
            $row['references'] = [];
            $row['book'] = null;
            $row['totals'] = null;
            $code = $data['order_code'];
            if (! isset($state['group_ids'][$code])) {
                $previous = $row['group_id'] ?? null;
                $state['group_ids'][$code] = $previous && ! in_array($previous, $state['group_ids'], true)
                    ? $previous : (string) Str::uuid();
            }
            $row['group_id'] = $state['group_ids'][$code];
            if ($row['order_id'] === null) {
                $validator = Validator::make($data, [
                    'order_code' => ['required', 'string', 'max:50', 'regex:/\A[A-Z0-9][A-Z0-9_-]*\z/'],
                    'email' => ['required', 'email', 'max:255'], 'customer_name' => ['required', 'string', 'max:255'],
                    'title' => ['required', 'string', 'max:255'], 'pre_order_code' => ['required', 'string', 'max:100'],
                    'categories' => ['required', 'string', 'max:2000'], 'quantity' => ['required', 'regex:/\A[1-9][0-9]{0,5}\z/'],
                    'eta' => ['required', 'date_format:Y-m'],
                    'postal_code' => [Rule::requiredIf(in_array($data['status'], ['delivered', 'completed'], true)), 'nullable', 'regex:/\A[0-9]{5}\z/'],
                    'address' => [Rule::requiredIf(in_array($data['status'], ['delivered', 'completed'], true)), 'nullable', 'string', 'max:10000'],
                    'status' => ['required', Rule::in(['processing', 'delivered', 'completed'])],
                ]);
                $row['errors'] = array_replace($row['errors'], $validator->errors()->toArray());
                $weight = $data['weight'];
                if (! preg_match('/\A[1-9][0-9]{0,6}\z/', $weight)) {
                    $row['errors']['weight'] = ['Berat perbuku (gram) wajib bilangan bulat positif, maksimal 9.999.999.'];
                }
                $money = [];
                foreach (['unit_price', 'discount', 'historical_dp', 'historical_paid', 'line_total'] as $field) {
                    try {
                        $money[$field] = Money::cents($data[$field]);
                    } catch (ValidationException $exception) {
                        $row['errors'][$field] = ['Nominal literal wajib diisi, maksimal dua desimal tanpa pemisah ribuan.'];
                    }
                }
                if (in_array($data['status'], ['delivered', 'completed'], true)
                    && isset($money['historical_paid'], $money['line_total'])
                    && $money['historical_paid'] !== $money['line_total']) {
                    $row['errors']['historical_paid'] = ['Delivered dan completed wajib lunas: total sudah dibayar harus sama dengan harga total.'];
                }
                if (isset($money['unit_price'], $money['discount'], $money['historical_dp'], $money['historical_paid'], $money['line_total']) && ! isset($row['errors']['quantity'])) {
                    try {
                        $gross = Money::multiply($money['unit_price'], (int) $data['quantity']);
                        if ($money['discount'] > $gross) {
                            $row['errors']['discount'] = ['Diskon melebihi harga kotor.'];
                        } elseif ($gross - $money['discount'] !== $money['line_total']) {
                            $row['errors']['line_total'] = ['Harga total tidak cocok: '.Money::decimal($gross - $money['discount'])];
                        }
                        $row['totals'] = [...$money, 'gross' => $gross, 'net' => $gross - min($gross, $money['discount']), 'weight' => (int) $weight * (int) $data['quantity']];
                    } catch (ValidationException $exception) {
                        $row['errors']['unit_price'] = ['Total melebihi batas nominal.'];
                    }
                }
                $row['book'] = $this->resolve('book', $data['title'], $books, 'title', $row['decisions']);
                foreach (['categories', 'pre_order_code'] as $field) {
                    foreach ($field === 'categories' ? explode(';', $data[$field]) : [$data[$field]] as $name) {
                        $row['references'][] = $this->resolve($field, trim($name), $references[$field], $field === 'categories' ? 'name' : 'code', $row['decisions']);
                    }
                }
                foreach ([$row['book'], ...$row['references']] as $reference) {
                    if ($reference['error']) {
                        $row['errors'][$reference['key']] = [$reference['error']];
                    }
                }
            }
            $groups[$code][] = $row;
        }
        unset($row);
        $state['groups'] = [];
        foreach ($groups as $code => $rows) {
            $errors = [];
            $saved = collect($rows)->firstWhere('order_id', '!=', null);
            $recovered = Order::where('import_group_key', $state['group_ids'][$code])->first();
            if ($recovered) {
                $saved = ['order_id' => $recovered->id];
                foreach ($state['rows'] as &$row) {
                    if ($row['group_id'] === $state['group_ids'][$code]) {
                        $row['order_id'] = $recovered->id;
                        $row['errors'] = [];
                    }
                }
                unset($row);
            }
            if (! $saved) {
                foreach (['email', 'address', 'postal_code', 'status'] as $field) {
                    if (count(array_unique(array_column(array_column($rows, 'data'), $field))) !== 1) {
                        $errors[] = 'Data kelompok bertentangan: '.$field;
                    }
                }
                if (collect($rows)->contains(fn ($row) => $row['errors'] !== [])) {
                    $errors[] = 'Perbaiki kesalahan baris dalam kelompok.';
                }
                if (Order::whereRaw('upper(order_code) = ?', [$code])->exists()) {
                    $errors[] = 'Kode order sudah tersimpan. Ganti kode draf.';
                }
                $users = User::withTrashed()->whereRaw('lower(email) = ?', [$rows[0]['data']['email']])->get();
                if ($users->count() > 1 || $users->contains(fn ($user) => $user->trashed() || $user->role !== UserRole::Customer)) {
                    $errors[] = 'Email terkait akun admin, terhapus, atau ambigu.';
                }
                if ($users->isEmpty() && count(array_unique(array_column(array_column($rows, 'data'), 'customer_name'))) !== 1) {
                    $errors[] = 'Nama customer baru bertentangan.';
                }
            }
            $totals = ['subtotal' => 0, 'historical_dp' => 0, 'historical_paid' => 0, 'weight' => 0];
            foreach ($rows as $row) {
                if ($row['totals']) {
                    try {
                        $totals['subtotal'] = Money::add($totals['subtotal'], $row['totals']['net']);
                        $totals['historical_dp'] = Money::add($totals['historical_dp'], $row['totals']['historical_dp']);
                        $totals['historical_paid'] = Money::add($totals['historical_paid'], $row['totals']['historical_paid']);
                        $totals['weight'] += $row['totals']['weight'];
                    } catch (ValidationException $exception) {
                        $errors[] = 'Total kelompok melebihi batas nominal.';
                    }
                }
            }
            if ($recovered) {
                $totals = ['subtotal' => 0, 'historical_dp' => 0, 'historical_paid' => 0, 'weight' => 0];
                foreach ($recovered->items as $item) {
                    $totals['subtotal'] = Money::add($totals['subtotal'], Money::cents($item->subtotal));
                    $totals['historical_dp'] = Money::add($totals['historical_dp'], Money::cents($item->historical_dp));
                    $totals['historical_paid'] = Money::add($totals['historical_paid'], Money::cents($item->historical_paid));
                    $totals['weight'] += $item->weight * $item->quantity;
                }
            }
            if ($totals['historical_paid'] > $totals['subtotal']) {
                $errors[] = 'Pembayaran historis melebihi total buku.';
            }
            $state['groups'][] = ['id' => $state['group_ids'][$code], 'code' => (string) $code, 'row_ids' => array_column($rows, 'id'), 'order_id' => $saved['order_id'] ?? null, 'errors' => $saved ? [] : $errors, 'subtotal' => Money::decimal($totals['subtotal']), 'historical_dp' => Money::decimal($totals['historical_dp']), 'historical_paid' => Money::decimal($totals['historical_paid']), 'outstanding_books' => Money::decimal(max(0, $totals['subtotal'] - $totals['historical_paid'])), 'weight' => $totals['weight']];
        }

        return $state;
    }

    /**
     * @param  array<string, mixed>  $state
     * @return array{group_id: string, status: string, order_id?: int, errors: list<string>}
     */
    public function commitGroup(array $state, string $groupId, User $admin): array
    {
        abort_unless($admin->role === UserRole::Admin && ! $admin->trashed(), 403);

        $store = Cache::store('file')->getStore();
        if (! $store instanceof LockProvider) {
            throw new \RuntimeException('Cache import tidak mendukung lock.');
        }

        return $store->lock('order-import-commit', 120)->block(10, function () use ($state, $groupId, $admin): array {
            return DB::transaction(function () use ($state, $groupId, $admin): array {
                $state = $this->preview($state);
                $group = collect($state['groups'])->firstWhere('id', $groupId);
                abort_if($group === null, 404);
                if ($group['order_id']) {
                    return ['group_id' => $groupId, 'status' => 'saved', 'order_id' => $group['order_id'], 'errors' => []];
                }
                if ($group['errors'] !== []) {
                    return ['group_id' => $groupId, 'status' => 'invalid', 'errors' => $group['errors']];
                }
                $rows = collect($state['rows'])->where('group_id', $groupId)->values();
                $first = $rows->first()['data'];
                $customer = User::withTrashed()->whereRaw('lower(email) = ?', [$first['email']])->lockForUpdate()->first();
                if (! $customer) {
                    $customer = new User(['name' => $first['customer_name'], 'email' => $first['email'], 'password' => 'customer123']);
                    $customer->forceFill(['role' => UserRole::Customer, 'must_change_password' => true])->save();
                }
                $settled = in_array($first['status'], ['delivered', 'completed'], true);
                $status = $first['status'] === 'delivered' ? OrderStatus::Shipping->value : $first['status'];
                $order = Order::create([
                    'order_code' => $group['code'], 'user_id' => $customer->id,
                    'subtotal' => $group['subtotal'], 'total' => $group['subtotal'], 'wallet_amount' => '0.00',
                    'status' => $status, 'payment_status' => $settled ? 'paid' : 'unpaid',
                    'source' => 'imported', 'import_group_key' => $groupId,
                    'import_metadata' => [
                        'admin_id' => $admin->id, 'filename' => basename(str_replace('\\', '/', $state['name'] ?? 'orders.xlsx')),
                        'draft_id' => $state['id'], 'group_id' => $groupId, 'original_status' => $first['status'],
                        'source_rows' => $rows->map(fn ($row) => ['id' => $row['id'], 'number' => $row['number']])->all(),
                        'original_address' => ['address' => $first['address'], 'postal_code' => $first['postal_code']],
                    ],
                ]);
                foreach ($rows as $row) {
                    $book = $row['book']['id'] ? Book::query()->whereKey($row['book']['id'])->firstOrFail() : null;
                    if (! $book) {
                        $book = Book::withTrashed()->get()->first(fn ($book) => BookReferenceName::key($book->title) === BookReferenceName::key($row['data']['title']));
                    }
                    if (! $book) {
                        $source = collect($state['rows'])->first(fn ($candidate) => BookReferenceName::key($candidate['data']['title']) === BookReferenceName::key($row['data']['title']));
                        if ($source['errors'] !== []) {
                            throw ValidationException::withMessages(['group' => 'Perbaiki baris sumber pertama buku sebelum menyimpan.']);
                        }
                        $categoryIds = [];
                        $poId = null;
                        foreach ($source['references'] as $reference) {
                            if ($reference['field'] === 'pre_order_code') {
                                $poId = $reference['id'] ?? PreOrderCode::firstOrCreate(['normalized_key' => BookReferenceName::key($reference['input'])], ['code' => $reference['input']])->id;
                            } else {
                                $categoryIds[] = $reference['id'] ?? Category::firstOrCreate(['normalized_key' => BookReferenceName::key($reference['input'])], ['name' => $reference['input'], 'slug' => 'import-'.Str::uuid()])->id;
                            }
                        }
                        $book = Book::create([
                            'title' => $source['data']['title'], 'slug' => 'import-'.Str::uuid(), 'author' => null,
                            'price' => $source['data']['unit_price'], 'weight' => (int) $source['data']['weight'],
                            'stock' => 0, 'is_active' => false, 'sale_type' => 'preorder',
                            'pre_order_code_id' => $poId, 'preorder_estimated_date' => $source['data']['eta'].'-01',
                        ]);
                        $book->categories()->sync(array_unique($categoryIds));
                    }
                    $data = $row['data'];
                    $order->items()->create([
                        'book_id' => $book->id, 'name' => $data['title'], 'value' => $data['unit_price'],
                        'quantity' => (int) $data['quantity'], 'weight' => (int) $data['weight'],
                        'subtotal' => $data['line_total'], 'line_discount' => $data['discount'],
                        'historical_dp' => $data['historical_dp'], 'historical_paid' => $data['historical_paid'],
                        'sale_type' => 'preorder', 'pre_order_code' => $data['pre_order_code'], 'preorder_estimated_date' => $data['eta'].'-01',
                        'import_row_key' => $row['id'], 'import_row_number' => $row['number'],
                    ]);
                }
                if ($settled) {
                    $order->shippingAddress()->create([
                        'destination_contact_name' => $first['customer_name'], 'destination_contact_phone' => null,
                        'destination_contact_email' => $first['email'], 'destination_address' => $first['address'],
                        'destination_postal_code' => $first['postal_code'], 'created_at' => now(),
                    ]);
                }
                $order->statusHistories()->create(['status' => $status, 'changed_by' => $admin->id, 'note' => 'Import pesanan lawas.', 'created_at' => now()]);

                return ['group_id' => $groupId, 'status' => 'saved', 'order_id' => $order->id, 'errors' => []];
            });
        });
    }

    /**
     * @param  Collection<int, Book>|Collection<int, Category>|Collection<int, PreOrderCode>  $catalog
     * @param  array<string, string|null>  $decisions
     * @return array{key: string, field: string, input: string, id: int|null, action: string, suggestions: array<int, array{id: mixed, label: mixed, deleted: bool}>, error: string|null}
     */
    private function resolve(string $field, string $name, Collection $catalog, string $label, array $decisions): array
    {
        $key = $field.':'.BookReferenceName::key($name);
        $matches = $catalog->filter(fn ($model) => BookReferenceName::key($model->$label) === BookReferenceName::key($name));
        $suggestions = $catalog->filter(fn ($model) => BookReferenceName::similar($name, $model->$label, $field === 'pre_order_code'))->map(fn ($model) => ['id' => $model->id, 'label' => $model->$label, 'deleted' => $model->trashed()])->values()->all();
        $decision = $decisions[$key] ?? '';
        $selected = null;
        $error = null;
        if (preg_match('/\Ause:(\d+)\z/', $decision, $parts)) {
            $selected = $catalog->firstWhere('id', (int) $parts[1]);
            if (! $selected || $selected->trashed()) {
                $error = 'Pilihan tidak tersedia atau diarsipkan; koreksi nama.';
            }
        } elseif ($matches->count() === 1 && ! $matches->first()->trashed()) {
            $selected = $matches->first();
        } elseif ($matches->isNotEmpty()) {
            $error = 'Nama ambigu atau diarsipkan; pilih master aktif atau koreksi nama.';
        } elseif ($suggestions !== [] && $decision !== 'create') {
            $error = 'Nama mirip referensi lain; pilih atau konfirmasi buat baru.';
        }
        if ($name === '' || mb_strlen($name) > ($field === 'categories' ? 150 : ($field === 'book' ? 255 : 100))) {
            $error = 'Nama wajib diisi dan tidak boleh terlalu panjang.';
        }

        return ['key' => $key, 'field' => $field, 'input' => $name, 'id' => $selected?->id, 'action' => $selected ? 'reuse' : 'create', 'suggestions' => $suggestions, 'error' => $error];
    }
}
