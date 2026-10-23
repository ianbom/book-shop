<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Book;
use App\Models\Category;
use App\Models\PreOrderCode;
use App\Models\User;
use App\Services\Admin\BookImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Reader\XLSX\Reader;
use OpenSpout\Writer\XLSX\Writer;
use Tests\TestCase;

class BookImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_download_template_and_preview_without_creating_master_data(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Admin]));
        $this->get('/admin/books/import/template')->assertOk()->assertDownload('template-import-buku.xlsx');
        $response = $this->post('/admin/books/import', ['file' => $this->workbook([$this->validRow()])]);
        $response->assertSessionHasNoErrors()->assertRedirect();
        $this->withCookie(config('session.cookie'), session()->getId());
        $this->get($response->headers->get('Location'))->assertOk();
        $this->assertDatabaseCount('books', 0);
        $this->assertDatabaseCount('categories', 0);
        $this->assertDatabaseCount('pre_order_codes', 0);
    }

    public function test_normalized_reference_names_are_unique_even_in_manual_forms(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Admin]));
        Category::create(['name' => 'Novel Anak', 'slug' => 'novel-anak']);
        PreOrderCode::create(['code' => 'PO-001']);
        $this->post('/admin/categories', ['name' => '  NOVEL_ANAK ', 'slug' => 'other-slug'])
            ->assertSessionHasErrors('name');
        $this->post('/admin/pre-order-codes', ['code' => 'po 001'])->assertSessionHasErrors('code');
    }

    public function test_import_commits_once_and_records_stock_and_placeholder(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $this->actingAs($admin);
        $response = $this->post('/admin/books/import', ['file' => $this->workbook([$this->validRow()])]);
        $url = $response->headers->get('Location');
        $response->assertSessionHasNoErrors();
        $this->withCookie(config('session.cookie'), session()->getId());
        $this->post($url.'/commit')->assertSessionHasNoErrors();
        $this->post($url.'/commit')->assertSessionHasNoErrors();
        $this->assertDatabaseCount('books', 1);
        $this->assertDatabaseCount('book_stock_movements', 1);
        $book = Book::firstOrFail();
        $this->assertSame(5, $book->stock);
        $this->assertSame(2, $book->categories()->count());
        Storage::disk('public')->assertExists($book->images()->firstOrFail()->image_path);
    }

    public function test_customer_cannot_upload_books(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Customer]));
        $this->post('/admin/books/import', ['file' => $this->workbook([$this->validRow()])])->assertForbidden();
    }

    public function test_bulk_is_blocked_by_invalid_rows_but_single_save_and_modal_correction_work(): void
    {
        Storage::fake('public');
        $this->actingAs(User::factory()->create(['role' => UserRole::Admin]));
        $invalid = $this->validRow();
        $invalid[0] = 'Buku Kedua';
        $invalid[2] = '002';
        $invalid[3] = 'SKU-002';
        $invalid[5] = '-10';
        $response = $this->post('/admin/books/import', ['file' => $this->workbook([$this->validRow(), $invalid])]);
        $url = $response->headers->get('Location');
        $this->withCookie(config('session.cookie'), session()->getId());
        $draft = $this->get($url)->viewData('page')['props']['draft'];
        $this->post($url.'/commit')->assertSessionHasErrors('import');
        $this->assertDatabaseCount('books', 0);
        $this->post($url.'/commit', ['row_id' => $draft['rows'][0]['id']])->assertSessionHasNoErrors();
        $this->assertDatabaseCount('books', 1);
        $data = array_combine(BookImportService::FIELDS, $invalid);
        $data['price'] = '120000';
        $data = array_map(fn ($value) => (string) $value, $data);
        $this->patch($url.'/rows/'.$draft['rows'][1]['id'], ['data' => $data, 'decisions' => []])->assertSessionHasNoErrors();
        $this->post($url.'/commit')->assertSessionHasNoErrors();
        $this->assertDatabaseCount('books', 2);
        $this->assertDatabaseCount('categories', 2);
    }

    public function test_preorder_reuses_normalized_references_and_retains_inactive_stock(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $category = Category::create(['name' => 'Novel Anak', 'slug' => 'novel-anak']);
        $code = PreOrderCode::create(['code' => 'PO-2026']);
        $values = $this->validRow();
        $values[11] = ' NOVEL_ANAK ; novel-anak';
        $values[12] = 'Preorder';
        $values[13] = 'po 2026';
        $values[14] = '2026-11';
        $values[16] = 'Tidak';
        $service = app(BookImportService::class);
        $rows = $service->read($this->workbook([$values]));
        $this->assertSame('valid', $rows[0]['status'], json_encode($rows[0]['errors']));
        $service->commit($rows, null, $admin);
        $book = Book::firstOrFail();
        $this->assertFalse($book->is_active);
        $this->assertSame(5, $book->stock);
        $this->assertSame($code->id, $book->pre_order_code_id);
        $this->assertSame('2026-11-01', $book->preorder_estimated_date->format('Y-m-d'));
        $this->assertSame([$category->id], $book->categories()->pluck('categories.id')->all());
    }

    public function test_similar_and_archived_references_require_explicit_decisions(): void
    {
        $category = Category::create(['name' => 'Novel', 'slug' => 'novel']);
        $service = app(BookImportService::class);
        $values = $this->validRow();
        $values[11] = 'Novell';
        $rows = $service->read($this->workbook([$values]));
        $this->assertArrayHasKey('categories', $rows[0]['errors']);
        $rows[0]['decisions']['categories:novell'] = 'use:'.$category->id;
        $this->assertSame('valid', $service->validateRows($rows)[0]['status']);
        $category->delete();
        $rows[0]['data']['categories'] = 'Novel';
        $rows[0]['decisions'] = [];
        $this->assertSame('error', $service->validateRows($rows)[0]['status']);
        $rows[0]['decisions']['categories:novel'] = 'restore:'.$category->id;
        $this->assertSame('valid', $service->validateRows($rows)[0]['status']);
        $this->assertTrue($category->fresh()->trashed());
    }

    public function test_duplicate_rows_and_existing_books_are_rejected(): void
    {
        $service = app(BookImportService::class);
        $rows = $service->read($this->workbook([$this->validRow(), $this->validRow()]));
        $this->assertSame(['error', 'error'], array_column($rows, 'status'));
        Book::factory()->create(['title' => 'BUKU BARU', 'author' => 'penulis']);
        $rows = $service->read($this->workbook([$this->validRow()]));
        $this->assertArrayHasKey('title', $rows[0]['errors']);
    }

    public function test_placeholder_failure_rolls_back_books_references_and_stock(): void
    {
        Storage::fake('public');
        Storage::shouldReceive('disk')->with('public')->andReturnSelf();
        Storage::shouldReceive('put')->once()->andReturnFalse();
        Storage::shouldReceive('delete')->once()->andReturnTrue();
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $service = app(BookImportService::class);
        $rows = $service->read($this->workbook([$this->validRow()]));
        try {
            $service->commit($rows, null, $admin);
            $this->fail('Expected storage failure');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString('placeholder', $exception->getMessage());
        }
        $this->assertDatabaseCount('books', 0);
        $this->assertDatabaseCount('categories', 0);
        $this->assertDatabaseCount('book_stock_movements', 0);
    }

    public function test_draft_is_not_accessible_to_another_admin(): void
    {
        $this->actingAs(User::factory()->create(['role' => UserRole::Admin]));
        $response = $this->post('/admin/books/import', ['file' => $this->workbook([$this->validRow()])]);
        $this->withCookie(config('session.cookie'), session()->getId());
        $this->actingAs(User::factory()->create(['role' => UserRole::Admin]));
        $this->get($response->headers->get('Location'))->assertNotFound();
        $this->assertDatabaseCount('books', 0);
    }

    public function test_formulas_and_numeric_identifiers_need_manual_review(): void
    {
        $values = $this->validRow();
        $values[2] = 1234567890;
        $values[5] = '=100+200';
        $rows = app(BookImportService::class)->read($this->workbook([$values]));
        $this->assertArrayHasKey('isbn', $rows[0]['errors']);
        $this->assertArrayHasKey('price', $rows[0]['errors']);
    }

    public function test_unsafe_external_links_are_rejected(): void
    {
        $file = $this->workbook([$this->validRow()]);
        $path = tempnam(sys_get_temp_dir(), 'unsafe-workbook-');
        copy($file->getPathname(), $path);
        $zip = new \ZipArchive;
        $zip->open($path);
        $zip->addFromString('xl/externalLinks/link.xml', '<link/>');
        $zip->close();
        $file = UploadedFile::fake()->createWithContent('unsafe.xlsx', file_get_contents($path));
        unlink($path);
        $this->expectException(ValidationException::class);
        app(BookImportService::class)->read($file);
    }

    public function test_files_over_row_limit_are_rejected_without_master_writes(): void
    {
        try {
            app(BookImportService::class)->read($this->workbook(array_fill(0, 1001, $this->validRow())));
            $this->fail('Expected row limit validation');
        } catch (ValidationException $exception) {
            $this->assertStringContainsString('1.000', $exception->errors()['file'][0]);
        }
        $this->assertDatabaseCount('books', 0);
        $this->assertDatabaseCount('categories', 0);
    }

    public function test_supplied_template_has_exact_headers_and_examples_are_not_imported(): void
    {
        $reader = new Reader;
        $reader->open(resource_path('templates/book-import-template.xlsx'));
        $sheets = [];
        foreach ($reader->getSheetIterator() as $sheet) {
            $sheets[] = $sheet->getName();
            if ($sheet->getName() === 'Buku') {
                foreach ($sheet->getRowIterator() as $row) {
                    $this->assertSame(BookImportService::HEADERS, $row->toArray());
                    break;
                }
            }
        }
        $reader->close();
        $this->assertSame(['Buku', 'Petunjuk', 'Contoh'], $sheets);
        $file = new UploadedFile(resource_path('templates/book-import-template.xlsx'), 'template.xlsx', null, null, true);
        $this->expectException(ValidationException::class);
        app(BookImportService::class)->read($file);
    }

    public function test_restoring_reference_on_commit_does_not_duplicate_it(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $category = Category::create(['name' => 'Novel', 'slug' => 'novel']);
        $category->delete();
        $values = $this->validRow();
        $values[11] = 'novel';
        $service = app(BookImportService::class);
        $rows = $service->read($this->workbook([$values]));
        $rows[0]['decisions']['categories:novel'] = 'restore:'.$category->id;
        $service->commit($rows, null, $admin);
        $this->assertFalse($category->fresh()->trashed());
        $this->assertDatabaseCount('categories', 1);
        $this->assertSame([$category->id], Book::firstOrFail()->categories()->pluck('categories.id')->all());
    }

    public function test_excel_false_stays_inactive_and_long_titles_fit_placeholder_metadata(): void
    {
        Storage::fake('public');
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $values = $this->validRow();
        $values[0] = str_repeat('B', 255);
        $values[16] = false;
        $service = app(BookImportService::class);
        $rows = $service->read($this->workbook([$values]));
        $this->assertFalse($rows[0]['data']['is_active']);
        $service->commit($rows, null, $admin);
        $book = Book::firstOrFail();
        $this->assertFalse($book->is_active);
        $this->assertLessThanOrEqual(255, mb_strlen($book->images()->firstOrFail()->alt_text));
    }

    private function validRow(): array
    {
        return ['Buku Baru', 'Penulis', '0012345678901', 'SKU-001', 'Deskripsi', 100000, 5, 500, 20, 13, 2, 'Novel; Anak', 'Ready Stock', '', '', '', 'Ya'];
    }

    private function workbook(array $rows): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'book-import-');
        $writer = new Writer;
        $writer->openToFile($path);
        $writer->getCurrentSheet()->setName('Buku');
        $writer->addRow(Row::fromValues(BookImportService::HEADERS));
        foreach ($rows as $row) {
            $writer->addRow(Row::fromValues($row));
        }
        $writer->close();
        $file = UploadedFile::fake()->createWithContent('books.xlsx', file_get_contents($path));
        unlink($path);

        return $file;
    }
}
