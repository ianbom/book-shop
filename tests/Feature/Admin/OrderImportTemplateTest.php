<?php

use App\Models\User;
use App\Services\Admin\OrderImportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use OpenSpout\Common\Entity\Cell\FormulaCell;
use OpenSpout\Reader\XLSX\Reader;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('opens the dedicated order import page', function () {
    $this->withoutVite()->actingAs(User::factory()->create(['role' => 'admin']))
        ->get('/admin/orders/import')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('admin/orders/import')->where('draft', null));
});

it('distributes a header only import sheet with separate literal examples and instructions', function () {
    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->get('/admin/orders/import/template')->assertOk()->assertDownload('template-import-pesanan.xlsx');
    $reader = new Reader;
    $reader->open(resource_path('templates/order-import-template.xlsx'));
    $sheets = [];
    try {
        foreach ($reader->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $row) {
                $sheets[$sheet->getName()][] = $row->toArray();
                foreach ($row->getCells() as $cell) {
                    expect($cell)->not->toBeInstanceOf(FormulaCell::class);
                }
            }
        }
    } finally {
        $reader->close();
    }
    expect(OrderImportService::HEADERS)->toHaveCount(17)->not->toContain('berat perbuku');
    expect($sheets['Sheet1'])->toBe([OrderImportService::HEADERS])->and($sheets)->toHaveKeys(['Petunjuk', 'Contoh']);
    expect($sheets['Contoh'][0])->toBe(OrderImportService::HEADERS);
    expect($sheets['Contoh'][1][0])->toBe('LAWAS-001')->and($sheets['Contoh'][2][0])->toBe('LAWAS-001');
    $instructions = implode(' ', array_merge(...$sheets['Petunjuk']));
    expect($instructions)->toContain('YYYY-MM')->toContain('DP')->toContain('Sheet1')->toContain('1000')->toContain('5 MB')
        ->toContain('processing, delivered, completed')->toContain('shipping')->toContain('5 digit')->toContain('sama harga total');
    expect(array_values(array_unique(array_column(array_slice($sheets['Contoh'], 1), 15))))->toBe(['processing', 'delivered', 'completed']);
    foreach (array_slice($sheets['Contoh'], 1) as $example) {
        if (in_array($example[15], ['delivered', 'completed'], true)) {
            expect($example[10])->toBe($example[11])->and($example[13])->toBe('01234')->and($example[14])->not->toBeEmpty();
        }
    }
});
