<?php

namespace App\Services\Admin;

use App\Http\Requests\Admin\Books\StoreBookRequest;
use App\Models\Book;
use App\Models\Category;
use App\Models\PreOrderCode;
use App\Models\User;
use App\Support\BookReferenceName;
use DateTimeInterface;
use Illuminate\Contracts\Cache\Lock;
use Illuminate\Contracts\Cache\LockProvider;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use LogicException;
use OpenSpout\Common\Entity\Cell\FormulaCell;
use OpenSpout\Common\Entity\Cell\NumericCell;
use OpenSpout\Reader\XLSX\Reader;
use Throwable;
use ZipArchive;

class BookImportService
{
    public const HEADERS = ['Judul', 'Penulis', 'ISBN', 'SKU', 'Deskripsi', 'Harga', 'Stok Awal', 'Berat (gram)', 'Panjang (cm)', 'Lebar (cm)', 'Tinggi (cm)', 'Kategori', 'Jenis Penjualan', 'Kode Preorder', 'Estimasi Preorder', 'Catatan Preorder', 'Status Aktif'];

    public const FIELDS = ['title', 'author', 'isbn', 'sku', 'description', 'price', 'initial_stock', 'weight', 'length', 'width', 'height', 'categories', 'sale_type', 'pre_order_code', 'preorder_estimated_date', 'preorder_note', 'is_active'];

    public function lock(string $key): Lock
    {
        $store = Cache::store('file')->getStore();
        if (! $store instanceof LockProvider) {
            throw new LogicException('File cache must support atomic locks.');
        }

        return $store->lock($key, 900);
    }

    /** @return list<array<string, mixed>> */
    public function read(UploadedFile $file): array
    {
        $this->checkArchive($file->getPathname());
        $reader = new Reader;
        $rows = [];
        $found = false;
        try {
            $reader->open($file->getPathname());
            foreach ($reader->getSheetIterator() as $sheet) {
                if ($sheet->getName() !== 'Buku') {
                    continue;
                }
                if ($found) {
                    throw ValidationException::withMessages(['file' => 'Sheet Buku harus tepat satu.']);
                }
                $found = true;
                $header = false;
                foreach ($sheet->getRowIterator() as $number => $row) {
                    $cells = $row->getCells();
                    if (! $header) {
                        if (array_map(fn ($cell) => is_string($cell->getValue()) ? trim($cell->getValue()) : '', $cells) !== self::HEADERS) {
                            throw ValidationException::withMessages(['file' => 'Header sheet Buku tidak sesuai. Gunakan template yang disediakan.']);
                        }
                        $header = true;

                        continue;
                    }
                    if (count($cells) > count(self::FIELDS)) {
                        throw ValidationException::withMessages(['file' => "Kolom tambahan tidak didukung pada baris {$number}."]);
                    }
                    $data = array_fill_keys(self::FIELDS, '');
                    $errors = [];
                    foreach ($cells as $index => $cell) {
                        $field = self::FIELDS[$index];
                        $value = $cell->getValue();
                        $data[$field] = $value instanceof DateTimeInterface ? $value->format('Y-m-d') : (is_scalar($value) ? trim((string) $value) : '');
                        if ($field === 'is_active' && is_bool($value)) {
                            $data[$field] = $value ? '1' : '0';
                        }
                        if (mb_strlen($data[$field]) > 20000) {
                            throw ValidationException::withMessages(['file' => "Isi sel terlalu panjang pada baris {$number}."]);
                        }
                        if ($cell instanceof FormulaCell) {
                            $errors[$field] = ['Formula tidak diizinkan. Masukkan nilai biasa melalui Edit.'];
                        }
                        if ($cell instanceof NumericCell && in_array($field, ['isbn', 'sku', 'pre_order_code'], true)) {
                            $errors[$field] = ['Identifier harus berupa teks agar angka nol dan digit panjang tidak hilang. Periksa melalui Edit.'];
                        }
                    }
                    if (count(array_filter($data, fn ($value) => $value !== '')) === 0) {
                        continue;
                    }
                    if (count($rows) >= 1000) {
                        throw ValidationException::withMessages(['file' => 'Maksimal 1.000 baris buku per file.']);
                    }
                    $rows[] = ['id' => (string) Str::uuid(), 'number' => $number, 'data' => $data, 'source_errors' => $errors, 'decisions' => [], 'book_id' => null];
                }
            }
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            throw ValidationException::withMessages(['file' => 'File Excel tidak dapat dibaca. Pastikan file tidak rusak atau terenkripsi.']);
        } finally {
            $reader->close();
        }
        if (! $found || $rows === []) {
            throw ValidationException::withMessages(['file' => 'Sheet Buku tidak ditemukan atau belum berisi buku.']);
        }

        return $this->validateRows($rows);
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    public function validateRows(array $rows): array
    {
        $catalogs = [
            'categories' => Category::withTrashed()->get()->map(fn ($item) => ['id' => $item->id, 'label' => $item->name, 'key' => $item->getAttribute('normalized_key'), 'deleted' => $item->trashed()])->all(),
            'pre_order_code' => PreOrderCode::withTrashed()->get()->map(fn ($item) => ['id' => $item->id, 'label' => $item->code, 'key' => $item->getAttribute('normalized_key'), 'deleted' => $item->trashed()])->all(),
        ];
        foreach ($rows as &$row) {
            $row['data'] = $this->normalize($row['data']);
            foreach (['categories', 'pre_order_code'] as $field) {
                $names = $field === 'categories' ? $this->categoryNames($row['data']['categories']) : [$row['data']['pre_order_code']];
                foreach ($names as $name) {
                    if ($name !== '' && ! collect($catalogs[$field])->contains('key', BookReferenceName::key($name))) {
                        $catalogs[$field][] = ['id' => null, 'label' => $name, 'key' => BookReferenceName::key($name), 'deleted' => false];
                    }
                }
            }
        }
        unset($row);

        $existing = [];
        $imported = Book::withTrashed()->whereIn('import_row_key', array_column($rows, 'id'))->pluck('id', 'import_row_key')->all();
        $needed = [];
        $occurrences = [];
        foreach ($rows as $index => $row) {
            foreach ($this->identifiers($row['data']) as $identifier) {
                $needed[$identifier] = true;
                $occurrences[$identifier][] = $index;
            }
        }
        foreach (Book::withTrashed()->select('id', 'title', 'author', 'isbn', 'sku', 'import_row_key')->lazyById(500) as $book) {
            foreach ($this->identifiers($book->only(['title', 'author', 'isbn', 'sku'])) as $identifier) {
                if (isset($needed[$identifier])) {
                    $existing[$identifier][] = $book->id;
                }
            }
        }

        $rules = (new StoreBookRequest)->rules();
        unset($rules['pre_order_code_id'], $rules['category_ids'], $rules['category_ids.*']);
        $rules['pre_order_code'] = ['required_if:sale_type,preorder', 'prohibited_unless:sale_type,preorder', 'nullable', 'string', 'max:100'];
        $rules['categories'] = ['nullable', 'string', 'max:10000'];
        $rules['description'] = ['nullable', 'string', 'max:20000'];
        $rules['preorder_note'] = ['nullable', 'string', 'max:20000'];
        $rules['preorder_estimated_date'] = ['required_if:sale_type,preorder', 'nullable', 'date_format:Y-m-d'];

        foreach ($rows as $index => &$row) {
            $row['book_id'] = $imported[$row['id']] ?? $row['book_id'];
            $row['references'] = [];
            if ($row['book_id']) {
                $row['status'] = 'saved';
                $row['errors'] = [];

                continue;
            }
            $data = $row['data'];
            $data['slug'] = $this->slug($row);
            $validationData = array_map(fn ($value) => $value === '' ? null : $value, $data);
            $errors = Validator::make($validationData, $rules, [
                'required' => ':attribute wajib diisi.',
                'required_if' => ':attribute wajib diisi untuk buku preorder.',
                'prohibited_unless' => ':attribute hanya boleh diisi untuk buku preorder.',
                'numeric' => ':attribute harus berupa angka tanpa pemisah ribuan.',
                'integer' => ':attribute harus berupa bilangan bulat.',
                'min' => 'Nilai :attribute minimal :min.',
                'max' => ':attribute melewati batas :max.',
                'decimal' => ':attribute maksimal dua angka desimal.',
                'date_format' => ':attribute harus berupa YYYY-MM atau YYYY-MM-DD yang valid.',
                'boolean' => ':attribute harus Ya atau Tidak.',
                'enum' => ':attribute harus Ready Stock atau Preorder.',
            ], array_combine(self::FIELDS, self::HEADERS))->errors()->toArray();
            $errors = array_merge_recursive($errors, $row['source_errors']);
            foreach ($this->identifiers($data) as $identifier) {
                if (isset($existing[$identifier]) || count($occurrences[$identifier]) > 1) {
                    $field = str_starts_with($identifier, 'identity:') ? 'title' : explode(':', $identifier, 2)[0];
                    $errors[$field][] = 'Buku duplikat: SKU, ISBN, atau kombinasi judul dan penulis sudah digunakan di database/file ini.';
                }
            }
            foreach (['categories', 'pre_order_code'] as $field) {
                if ($field === 'pre_order_code' && $data['sale_type'] !== 'preorder') {
                    continue;
                }
                $names = $field === 'categories' ? $this->categoryNames($data[$field]) : [$data[$field]];
                if (count($names) > 50) {
                    $errors[$field][] = 'Maksimal 50 kategori per buku.';

                    continue;
                }
                foreach ($names as $name) {
                    if ($name === '') {
                        continue;
                    }
                    $reference = $this->reference($field, $name, $catalogs[$field], $row['decisions']);
                    $row['references'][] = $reference;
                    if ($reference['error']) {
                        $errors[$field][] = $reference['error'];
                    }
                }
            }
            $row['errors'] = $errors;
            $row['status'] = $errors === [] ? 'valid' : 'error';
        }
        unset($row);

        return $rows;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    public function commit(array $rows, ?string $rowId, User $admin): array
    {
        return $this->lock('book-import-commit')->block(5, function () use ($rows, $rowId, $admin): array {
            $rows = $this->validateRows($rows);
            $selected = array_filter($rows, fn ($row) => $row['book_id'] === null && ($rowId === null || $row['id'] === $rowId));
            if (collect($selected)->contains('status', 'error')) {
                throw ValidationException::withMessages(['import' => 'Perbaiki seluruh baris yang dipilih sebelum menyimpan.']);
            }
            $paths = [];
            try {
                DB::transaction(function () use (&$rows, $selected, $admin, &$paths): void {
                    foreach ($selected as $index => $row) {
                        $categories = [];
                        $categoryLabels = [];
                        $codeId = null;
                        $codeLabel = '';
                        foreach ($row['references'] as $reference) {
                            $id = $this->saveReference($reference);
                            if ($reference['field'] === 'categories') {
                                $categories[] = $id;
                                $categoryLabels[] = $reference['resolved']['label'] ?? $reference['input'];
                            } else {
                                $codeId = $id;
                                $codeLabel = $reference['resolved']['label'] ?? $reference['input'];
                            }
                        }
                        $data = $row['data'];
                        unset($data['categories'], $data['pre_order_code']);
                        $data = array_map(fn ($value) => $value === '' ? null : $value, $data);
                        $data['slug'] = $this->slug($row);
                        $data['category_ids'] = array_unique($categories);
                        $data['pre_order_code_id'] = $codeId;
                        $book = app(BookService::class)->create($data, $admin);
                        $book->forceFill(['import_row_key' => $row['id']])->save();
                        $path = 'books/'.$book->slug.'/placeholder.png';
                        $paths[] = $path;
                        $contents = file_get_contents(resource_path('images/book-placeholder.png'));
                        if ($contents === false || ! Storage::disk('public')->put($path, $contents)) {
                            throw new \RuntimeException('Tidak dapat menyimpan gambar placeholder.');
                        }
                        $book->images()->create(['image_path' => $path, 'alt_text' => mb_substr('Sampul belum tersedia: '.$book->title, 0, 255), 'sort_order' => 0, 'is_primary' => true]);
                        $rows[$index]['book_id'] = $book->id;
                        $rows[$index]['data']['categories'] = implode('; ', array_unique($categoryLabels));
                        $rows[$index]['data']['pre_order_code'] = $codeLabel;
                        $rows[$index]['status'] = 'saved';
                        $rows[$index]['errors'] = [];
                    }
                });
            } catch (Throwable $exception) {
                Storage::disk('public')->delete($paths);
                throw $exception;
            }

            return $rows;
        });
    }

    /**
     * @param  array<int, array<string, mixed>>  $catalog
     * @param  array<string, string>  $decisions
     * @return array<string, mixed>
     */
    private function reference(string $field, string $name, array $catalog, array $decisions): array
    {
        $key = BookReferenceName::key($name);
        $decisionKey = $field.':'.$key;
        $match = collect($catalog)->first(fn ($item) => $item['key'] === $key && $item['id'] !== null);
        $suggestions = array_values(array_filter($catalog, fn ($item) => BookReferenceName::similar($name, $item['label'], $field === 'pre_order_code')));
        $decision = $decisions[$decisionKey] ?? '';
        $resolved = $match;
        $error = null;
        if ($key === '' || mb_strlen($key) > 150 || mb_strlen($name) > ($field === 'categories' ? 150 : 100)) {
            $error = 'Nama referensi kosong atau terlalu panjang.';
        } elseif ($match && ! $match['deleted']) {
            $decision = 'use:'.$match['id'];
        } elseif (preg_match('/^(use|restore):(\d+)$/', $decision, $parts)) {
            $resolved = collect($catalog)->first(fn ($item) => $item['id'] === (int) $parts[2]);
            if (! $resolved || $resolved['deleted'] !== ($parts[1] === 'restore')) {
                $error = 'Pilihan referensi sudah tidak tersedia. Pilih ulang.';
            }
        } elseif ($match) {
            $error = "{$name} diarsipkan. Konfirmasi pemulihan atau ubah nama.";
        } elseif ($suggestions !== [] && $decision !== 'create') {
            $error = "{$name} mirip referensi lain. Pilih referensi atau konfirmasi nama baru.";
        } elseif ($decision !== '' && $decision !== 'create') {
            $error = 'Keputusan referensi tidak valid.';
        } else {
            $decision = 'create';
        }

        return ['field' => $field, 'key' => $decisionKey, 'input' => $name, 'match' => $match, 'suggestions' => $suggestions, 'decision' => $decision, 'resolved' => $resolved, 'error' => $error];
    }

    /** @param array<string, mixed> $reference */
    private function saveReference(array $reference): int
    {
        $class = $reference['field'] === 'categories' ? Category::class : PreOrderCode::class;
        if (str_starts_with($reference['decision'], 'use:') || str_starts_with($reference['decision'], 'restore:')) {
            $model = $class::withTrashed()->lockForUpdate()->whereKey($reference['resolved']['id'])->firstOrFail();
            if ($model->trashed()) {
                if (! str_starts_with($reference['decision'], 'restore:')) {
                    throw ValidationException::withMessages(['import' => 'Referensi telah diarsipkan. Tinjau ulang.']);
                }
                $model->restore();
            }

            return $model->id;
        }
        $key = BookReferenceName::key($reference['input']);
        $model = $class::withTrashed()->where('normalized_key', $key)->lockForUpdate()->first();
        if ($model) {
            if ($model->trashed()) {
                throw ValidationException::withMessages(['import' => 'Referensi telah diarsipkan. Tinjau ulang.']);
            }

            return $model->id;
        }
        $label = BookReferenceName::display($reference['input']);

        return $reference['field'] === 'categories'
            ? Category::create(['name' => $label, 'slug' => mb_substr(Str::slug($label) ?: 'kategori', 0, 160).'-'.substr(hash('sha256', $key), 0, 12)])->id
            : PreOrderCode::create(['code' => $label])->id;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalize(array $data): array
    {
        $data = array_replace(array_fill_keys(self::FIELDS, ''), $data);
        $data['sale_type'] = match (BookReferenceName::key((string) $data['sale_type'])) {
            '', 'readystock' => 'ready_stock', 'preorder' => 'preorder', default => $data['sale_type'],
        };
        $data['is_active'] = is_bool($data['is_active']) ? $data['is_active'] : match (mb_strtolower((string) $data['is_active'])) {
            '', 'ya', 'true', '1' => true, 'tidak', 'false', '0' => false, default => $data['is_active'],
        };
        if (preg_match('/^\d{4}-\d{2}$/', $data['preorder_estimated_date'])) {
            $data['preorder_estimated_date'] .= '-01';
        }

        return $data;
    }

    /** @return list<string> */
    private function categoryNames(string $value): array
    {
        $names = [];
        foreach (explode(';', $value) as $name) {
            $name = BookReferenceName::display($name);
            if ($name !== '') {
                $names[BookReferenceName::key($name)] = $name;
            }
        }

        return array_values($names);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return list<string>
     */
    private function identifiers(array $data): array
    {
        $keys = [];
        foreach (['sku', 'isbn'] as $field) {
            if (! empty($data[$field])) {
                $keys[] = $field.':'.BookReferenceName::key((string) $data[$field]);
            }
        }
        if (! empty($data['title']) && ! empty($data['author'])) {
            $keys[] = 'identity:'.BookReferenceName::key($data['title']).'|'.BookReferenceName::key($data['author']);
        }

        return $keys;
    }

    /** @param array<string, mixed> $row */
    private function slug(array $row): string
    {
        return mb_substr(Str::slug($row['data']['title']) ?: 'buku', 0, 200).'-'.str_replace('-', '', $row['id']);
    }

    private function checkArchive(string $path): void
    {
        $zip = new ZipArchive;
        if ($zip->open($path) !== true) {
            throw ValidationException::withMessages(['file' => 'File harus berupa workbook .xlsx yang valid.']);
        }
        try {
            if ($zip->numFiles > 2000 || $zip->locateName('xl/workbook.xml') === false || $zip->locateName('[Content_Types].xml') === false) {
                throw new \RuntimeException;
            }
            $total = 0;
            for ($index = 0; $index < $zip->numFiles; $index++) {
                $stat = $zip->statIndex($index);
                if ($stat === false) {
                    throw new \RuntimeException;
                }
                $name = str_replace('\\', '/', $stat['name']);
                $total += $stat['size'];
                if ($total > 100 * 1024 * 1024 || $stat['size'] > 30 * 1024 * 1024
                    || $stat['encryption_method'] !== 0
                    || preg_match('#(^/|(^|/)\.\.(/|$)|^[a-z]:|vbaProject|externalLinks)#i', $name)) {
                    throw new \RuntimeException;
                }
                if (preg_match('/\.(xml|rels)$/i', $name)) {
                    $xml = $zip->getFromIndex($index);
                    if ($xml === false || str_contains($xml, "\0") || preg_match('/<!DOCTYPE|<!ENTITY|TargetMode\s*=\s*[\'"]External|macroEnabled/i', $xml)) {
                        throw new \RuntimeException;
                    }
                }
            }
        } catch (Throwable $exception) {
            throw ValidationException::withMessages(['file' => 'Workbook tidak aman, terenkripsi, atau melebihi batas ekstraksi (100 MB). Gunakan template tanpa macro/tautan eksternal.']);
        } finally {
            $zip->close();
        }
    }
}
