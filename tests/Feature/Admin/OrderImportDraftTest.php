<?php

use App\Enums\UserRole;
use App\Models\Book;
use App\Models\Category;
use App\Models\Order;
use App\Models\PreOrderCode;
use App\Models\User;
use App\Services\Admin\OrderImportService;
use App\Services\Admin\OrderStatusService;
use App\Services\Customer\OrderSettlementService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function legacyRow(array $replace = []): array
{
    return array_replace(['order_code' => 'LAWAS-001', 'email' => 'customer@example.com', 'customer_name' => 'Customer', 'title' => 'Buku Pertama', 'pre_order_code' => 'PO-01', 'categories' => 'Novel', 'quantity' => '2', 'unit_price' => '60000', 'discount' => '10000', 'historical_dp' => '50000', 'historical_paid' => '80000', 'line_total' => '110000', 'eta' => '2026-12', 'postal_code' => '01234', 'address' => 'Jalan Lama 12', 'status' => 'processing', 'weight' => '300'], $replace);
}

function legacyWorkbook(array $rows, ?array $headers = null): string
{
    $path = tempnam(sys_get_temp_dir(), 'legacy-order-').'.xlsx';
    $writer = new Writer;
    $writer->openToFile($path);
    $writer->getCurrentSheet()->setName('Sheet1');
    $writer->addRow(Row::fromValues($headers ?? OrderImportService::HEADERS));
    foreach ($rows as $row) {
        $writer->addRow(Row::fromValues(array_values($row)));
    }
    $writer->close();

    return $path;
}

it('previews grouped source rows with exact totals without business writes', function () {
    $service = app(OrderImportService::class);
    $path = legacyWorkbook([legacyRow(), legacyRow(['title' => 'Buku Kedua', 'quantity' => '1', 'unit_price' => '50000', 'discount' => '5000', 'historical_dp' => '20000', 'historical_paid' => '10000', 'line_total' => '45000', 'weight' => '500'])]);
    try {
        $state = $service->read($path);
        $group = $state['groups'][0];
        expect($group['errors'])->toBe([])->and($group['subtotal'])->toBe('155000.00')->and($group['historical_dp'])->toBe('70000.00')->and($group['historical_paid'])->toBe('90000.00')->and($group['outstanding_books'])->toBe('65000.00')->and($group['weight'])->toBe(1100);
        expect($state['rows'][0]['data']['postal_code'])->toBe('01234');
        expect(Book::count())->toBe(0)->and(Order::count())->toBe(0)->and(User::count())->toBe(0);
    } finally {
        unlink($path);
    }
});

it('accepts source workbooks containing email and web hyperlinks', function (string $target, string $relationshipType) {
    $path = legacyWorkbook([legacyRow()]);
    try {
        $zip = new ZipArchive;
        $zip->open($path);
        $zip->addFromString('xl/worksheets/_rels/sheet1.xml.rels',
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="'.$relationshipType.'" Target="'.$target.'" TargetMode="External"/>'
            .'</Relationships>');
        $zip->close();
        $state = app(OrderImportService::class)->read($path);
        expect($state['groups'][0]['errors'])->toBe([])
            ->and($state['rows'][0]['data']['email'])->toBe('customer@example.com');
        $this->assertDatabaseCount('orders', 0);
    } finally {
        unlink($path);
    }
})->with([
    ['mailto:customer@example.com', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink'],
    ['https://example.com', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink'],
    ['https://example.com', 'http://purl.oclc.org/ooxml/officeDocument/relationships/hyperlink'],
]);

it('still rejects external workbook relationships when hyperlinks are allowed', function () {
    $path = legacyWorkbook([legacyRow()]);
    try {
        $zip = new ZipArchive;
        $zip->open($path);
        $zip->addFromString('xl/_rels/workbook.xml.rels',
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/externalLink" Target="https://example.com/workbook.xlsx" TargetMode="External"/>'
            .'</Relationships>');
        $zip->close();
        expect(fn () => app(OrderImportService::class)->read($path))->toThrow(ValidationException::class);
        $this->assertDatabaseCount('orders', 0);
    } finally {
        unlink($path);
    }
});

it('marks every unsaved source row with an existing order code and clears the error after correction', function () {
    Order::factory()->create(['order_code' => 'LAWAS-001']);
    $admin = User::factory()->create(['role' => 'admin']);
    $service = app(OrderImportService::class);
    $message = 'Kode order sudah tersimpan. Ganti kode draf.';
    $path = legacyWorkbook([
        legacyRow(['order_code' => ' lawas-001 ']),
        legacyRow(['email' => 'invalid-email']),
        legacyRow(['order_code' => 'OTHER']),
    ]);
    try {
        $state = $service->read($path);
        $state['rows'][0]['source_errors']['order_code'] = ['Identifier harus teks.'];
        $state = $service->preview($service->preview($state));
        expect($state['groups'][0]['errors'])->toContain($message)
            ->and($state['rows'][0]['errors']['order_code'])->toBe(['Identifier harus teks.', $message])
            ->and($state['rows'][1]['errors']['order_code'])->toBe([$message])
            ->and($state['rows'][1]['errors'])->toHaveKey('email')
            ->and($state['rows'][2]['errors'])->toBe([])
            ->and($service->commitGroup($state, $state['groups'][0]['id'], $admin)['status'])->toBe('invalid');
        $this->assertDatabaseCount('orders', 1);

        unset($state['rows'][0]['source_errors']['order_code']);
        $state['rows'][0]['data']['order_code'] = 'NEW-001';
        $state = $service->preview($state);
        expect($state['rows'][0]['errors'])->toBe([])
            ->and($state['rows'][1]['errors']['order_code'])->toBe([$message]);

        $state['rows'][1]['data']['order_code'] = 'NEW-001';
        $state = $service->preview($state);
        expect($state['groups'][0]['errors'])->not->toContain($message)
            ->and($state['rows'][1]['errors'])->not->toHaveKey('order_code')
            ->and($state['rows'][1]['errors'])->toHaveKey('email');
    } finally {
        unlink($path);
    }
});

it('returns duplicate order code errors on every source pagination page', function () {
    Order::factory()->create(['order_code' => 'LAWAS-001']);
    $this->withoutVite()->actingAs(User::factory()->create(['role' => 'admin']));
    $path = legacyWorkbook(array_fill(0, 26, legacyRow()));
    try {
        $response = $this->post('/admin/orders/import', [
            'file' => new UploadedFile($path, 'duplicates.xlsx', null, null, true),
        ])->assertSessionHasNoErrors()->assertRedirect();
        $url = $response->headers->get('Location');
        $this->withCookie(config('session.cookie'), session()->getId());
        foreach ([1 => 25, 2 => 1] as $pageNumber => $count) {
            $this->get($url.'?page='.$pageNumber)->assertInertia(fn (AssertableInertia $page) => $page
                ->has('draft.rows', $count)
                ->where('draft.rows', fn ($rows) => $rows->every(fn ($row) => $row['errors']['order_code'] === ['Kode order sudah tersimpan. Ganti kode draf.']))
                ->where('draft.groups.0.errors', fn ($errors) => $errors->contains('Kode order sudah tersimpan. Ganti kode draf.')));
        }
    } finally {
        if (is_file($path)) {
            unlink($path);
        }
    }
});

it('imports processing without a shipping snapshot even when Excel supplies an address', function (bool $withAddress) {
    $path = legacyWorkbook([legacyRow($withAddress ? [] : ['address' => '', 'postal_code' => ''])]);
    try {
        $service = app(OrderImportService::class);
        $state = $service->read($path);
        expect($state['groups'][0]['errors'])->toBe([]);
        $result = $service->commitGroup($state, $state['groups'][0]['id'], User::factory()->create(['role' => 'admin']));
        $order = Order::findOrFail($result['order_id']);
        expect($order->status->value)->toBe('processing')->and($order->payment_status->value)->toBe('unpaid')
            ->and($order->shippingAddress)->toBeNull()->and($order->shipping_selected_at)->toBeNull();
    } finally {
        unlink($path);
    }
})->with([true, false]);

it('imports fully paid delivered and completed with literal address snapshots', function (string $status, string $stored) {
    $path = legacyWorkbook([legacyRow(['status' => $status, 'historical_paid' => '110000'])]);
    try {
        $service = app(OrderImportService::class);
        $state = $service->read($path);
        expect($state['groups'][0]['errors'])->toBe([]);
        $result = $service->commitGroup($state, $state['groups'][0]['id'], User::factory()->create(['role' => 'admin']));
        $order = Order::findOrFail($result['order_id']);
        expect($order->status->value)->toBe($stored)->and($order->payment_status->value)->toBe('paid')
            ->and($order->import_metadata['original_status'])->toBe($status)
            ->and($order->shippingAddress->destination_postal_code)->toBe('01234')
            ->and($order->shippingAddress->destination_address)->toBe('Jalan Lama 12')
            ->and($order->statusHistories()->firstOrFail()->status->value)->toBe($stored)
            ->and($order->isArchivedImport())->toBeTrue()
            ->and(app(OrderSettlementService::class)->summary($order)['outstanding'])->toBe('0.00');
        $this->assertDatabaseCount('shipments', 0);
        $this->assertDatabaseCount('order_payment_submissions', 0);
        $this->assertDatabaseCount('wallet_transactions', 0);
    } finally {
        unlink($path);
    }
})->with([['delivered', 'shipping'], ['completed', 'completed']]);

it('lets admin complete only an eligible delivered import without fabricated fulfillment', function () {
    $path = legacyWorkbook([legacyRow(['status' => 'delivered', 'historical_paid' => '110000'])]);
    try {
        $admin = User::factory()->create(['role' => 'admin']);
        $service = app(OrderImportService::class);
        $state = $service->read($path);
        $result = $service->commitGroup($state, $state['groups'][0]['id'], $admin);
        $order = Order::findOrFail($result['order_id']);
        $statuses = app(OrderStatusService::class);
        expect($statuses->canCompleteImportedDelivery($order))->toBeTrue();
        $this->withoutVite()->actingAs($admin)->get('/admin/orders/'.$order->id)->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('order.can_complete_imported_delivery', true));
        $this->patch('/admin/orders/'.$order->id.'/status', ['status' => 'completed'])->assertSessionHasNoErrors();
        expect($order->fresh()->status->value)->toBe('completed')->and($order->statusHistories()->count())->toBe(2)
            ->and($statuses->canCompleteImportedDelivery($order->fresh()))->toBeFalse();
        $this->patch('/admin/orders/'.$order->id.'/status', ['status' => 'completed'])->assertSessionHasErrors('status');
        expect($order->statusHistories()->count())->toBe(2);
        foreach (['shipments', 'order_payment_submissions', 'wallet_transactions', 'book_stock_movements'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
    } finally {
        unlink($path);
    }
});

it('keeps incomplete delivered imports and old archives closed to admin transitions', function (string $invalid) {
    $admin = User::factory()->create(['role' => 'admin']);
    $order = Order::factory()->create(['source' => 'imported', 'status' => 'shipping', 'payment_status' => 'paid', 'import_metadata' => ['original_status' => 'delivered']]);
    $order->items()->create(['name' => 'Buku', 'sale_type' => 'preorder', 'value' => '100', 'subtotal' => '100', 'historical_paid' => '100', 'quantity' => 1, 'weight' => 300]);
    if ($invalid !== 'address') {
        $order->shippingAddress()->create(['destination_contact_name' => 'Customer', 'destination_address' => 'Alamat', 'destination_postal_code' => '01234']);
    }
    if ($invalid === 'old') {
        $order->update(['import_metadata' => ['original_status' => 'shipping']]);
    } elseif ($invalid === 'payment') {
        $order->update(['payment_status' => 'unpaid']);
    } elseif ($invalid === 'balance') {
        $order->items()->update(['historical_paid' => '90']);
    }
    $this->actingAs($admin)->patch('/admin/orders/'.$order->id.'/status', ['status' => 'completed'])->assertSessionHasErrors('status');
    expect($order->fresh()->status->value)->toBe('shipping')->and($order->statusHistories()->count())->toBe(0);
})->with(['address', 'old', 'payment', 'balance']);

it('rejects unsupported import statuses', function (string $status) {
    $path = legacyWorkbook([legacyRow(['status' => $status])]);
    try {
        expect(app(OrderImportService::class)->read($path)['rows'][0]['errors'])->toHaveKey('status');
    } finally {
        unlink($path);
    }
})->with(['pending', 'waiting_preorder', 'packing', 'shipping', 'cancelled']);

it('requires complete address and exact full payment for settled imports', function (string $status, array $invalid, string $field) {
    $path = legacyWorkbook([legacyRow(['status' => $status, 'historical_paid' => '110000', ...$invalid])]);
    try {
        $service = app(OrderImportService::class);
        $state = $service->read($path);
        expect($state['rows'][0]['errors'])->toHaveKey($field)
            ->and($service->commitGroup($state, $state['groups'][0]['id'], User::factory()->create(['role' => 'admin']))['status'])->toBe('invalid');
        $this->assertDatabaseCount('orders', 0);
    } finally {
        unlink($path);
    }
})->with(['delivered', 'completed'])->with([
    [['address' => ''], 'address'], [['postal_code' => ''], 'postal_code'],
    [['historical_paid' => '80000'], 'historical_paid'], [['historical_paid' => '120000'], 'historical_paid'],
]);

it('requires the gram header instead of the old weight header', function () {
    $headers = OrderImportService::HEADERS;
    $headers[array_search('berat perbuku (gram)', $headers, true)] = 'berat perbuku';
    $path = legacyWorkbook([legacyRow()], $headers);
    try {
        expect(fn () => app(OrderImportService::class)->read($path))
            ->toThrow(ValidationException::class);
    } finally {
        gc_collect_cycles();
        unlink($path);
    }
});

it('ignores the unsupported old weight column even when its value differs', function () {
    $path = legacyWorkbook([array_values([...legacyRow(), 'legacy_weight' => '999'])], [...OrderImportService::HEADERS, 'berat perbuku']);
    try {
        $state = app(OrderImportService::class)->read($path);
        expect($state['warnings'])->toContain('Kolom tidak didukung: berat perbuku')
            ->and($state['rows'][0]['data'])->not->toHaveKey('legacy_weight')
            ->and($state['rows'][0]['errors'])->toBe([])
            ->and($state['groups'][0]['weight'])->toBe(600);
    } finally {
        unlink($path);
    }
});

it('requires positive literal integer grams', function (string $weight) {
    $path = legacyWorkbook([legacyRow(['weight' => $weight])]);
    try {
        $state = app(OrderImportService::class)->read($path);
        expect($state['rows'][0]['errors'])->toHaveKey('weight')
            ->and($state['groups'][0]['errors'])->not->toBeEmpty();
    } finally {
        unlink($path);
    }
})->with(['', '0', '-1', '1.5', '10000000', 'abc']);

it('blocks old draft weight fallback and allows explicit gram correction', function () {
    $service = app(OrderImportService::class);
    $admin = User::factory()->create(['role' => 'admin']);
    $path = legacyWorkbook([legacyRow()]);
    try {
        $state = $service->read($path);
        unset($state['rows'][0]['data']['weight']);
        $state['rows'][0]['data']['legacy_weight'] = '999';
        $state['rows'][0]['source_errors']['legacy_weight'] = ['Old error'];
        $state = $service->preview($state);
        expect($state['rows'][0]['data'])->not->toHaveKey('legacy_weight')
            ->and($state['rows'][0]['source_errors'])->not->toHaveKey('legacy_weight')
            ->and($state['rows'][0]['errors'])->toHaveKey('weight')
            ->and($service->commitGroup($state, $state['groups'][0]['id'], $admin)['status'])->toBe('invalid');
        $this->assertDatabaseCount('orders', 0);
        $state['rows'][0]['data']['weight'] = '450';
        $state = $service->preview($state);
        expect($state['groups'][0]['weight'])->toBe(900)
            ->and($service->commitGroup($state, $state['groups'][0]['id'], $admin)['status'])->toBe('saved')
            ->and(Book::firstOrFail()->weight)->toBe(450)
            ->and(Order::firstOrFail()->items()->firstOrFail()->weight)->toBe(450);
    } finally {
        unlink($path);
    }
});

it('requires text correction for numeric money beyond safe spreadsheet precision', function () {
    $path = legacyWorkbook([legacyRow([
        'quantity' => '1', 'unit_price' => 1234567890123.45, 'discount' => 0,
        'historical_dp' => 0, 'historical_paid' => 0, 'line_total' => 1234567890123.45,
    ])]);
    try {
        $state = app(OrderImportService::class)->read($path);
        expect($state['rows'][0]['source_errors'])->toHaveKeys(['unit_price', 'line_total']);
        expect($state['groups'][0]['errors'])->not->toBeEmpty();
    } finally {
        unlink($path);
    }
});

it('commits a complete group once without wallet stock or shipment effects', function () {
    $service = app(OrderImportService::class);
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $path = legacyWorkbook([legacyRow(), legacyRow(['pre_order_code' => 'PO-02', 'eta' => '2027-01'])]);
    try {
        $state = $service->read($path);
        $state['name'] = 'orders.xlsx';
        $groupId = $state['groups'][0]['id'];
        $result = $service->commitGroup($state, $groupId, $admin);
        expect($result['status'])->toBe('saved');
        $retry = $service->commitGroup($state, $groupId, $admin);
        expect($retry['order_id'])->toBe($result['order_id']);
        $order = Order::findOrFail($result['order_id']);
        expect($order->items()->count())->toBe(2)->and($order->source)->toBe('imported')->and($order->subtotal)->toBe('220000.00')
            ->and($order->wallet_amount)->toBe('0.00')->and($order->shipping_selected_at)->toBeNull()
            ->and($order->user->must_change_password)->toBeTrue()->and($order->user->email_verified_at)->toBeNull()
            ->and(Hash::check('customer123', $order->user->password))->toBeTrue()
            ->and($order->items->pluck('pre_order_code')->all())->toBe(['PO-01', 'PO-02'])
            ->and($order->items->pluck('weight')->all())->toBe([300, 300]);
        expect(Book::count())->toBe(1)->and(Book::first()->stock)->toBe(0)->and(Book::first()->is_active)->toBeFalse()
            ->and(Book::first()->author)->toBeNull()->and(Book::first()->preOrderCode->code)->toBe('PO-01')
            ->and(Book::first()->weight)->toBe(300);
        $this->assertDatabaseCount('wallet_transactions', 0);
        $this->assertDatabaseCount('book_stock_movements', 0);
        $this->assertDatabaseCount('shipments', 0);
    } finally {
        unlink($path);
    }
});

it('rolls back the entire group when the final history write fails and permits a clean retry', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $service = app(OrderImportService::class);
    $path = legacyWorkbook([legacyRow()]);
    try {
        $state = $service->read($path);
        DB::unprepared("CREATE TEMP TRIGGER fail_import_history BEFORE INSERT ON order_status_histories BEGIN SELECT RAISE(ABORT, 'injected history failure'); END");
        try {
            expect(fn () => $service->commitGroup($state, $state['groups'][0]['id'], $admin))
                ->toThrow(QueryException::class);
            foreach (['orders', 'order_items', 'order_shipping_addresses', 'books', 'categories', 'pre_order_codes', 'order_status_histories'] as $table) {
                $this->assertDatabaseCount($table, 0);
            }
            $this->assertDatabaseCount('users', 1);
        } finally {
            DB::unprepared('DROP TRIGGER fail_import_history');
        }
        $result = $service->commitGroup($state, $state['groups'][0]['id'], $admin);
        expect($result['status'])->toBe('saved');
        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseCount('wallet_transactions', 0);
        $this->assertDatabaseCount('book_stock_movements', 0);
    } finally {
        unlink($path);
    }
});

it('preserves saved preview totals and existing customer credentials', function () {
    $customer = User::factory()->create(['email' => 'CUSTOMER@example.com', 'name' => 'Existing']);
    $password = $customer->password;
    $admin = User::factory()->create(['role' => 'admin']);
    $service = app(OrderImportService::class);
    $path = legacyWorkbook([legacyRow()]);
    try {
        $state = $service->read($path);
        $result = $service->commitGroup($state, $state['groups'][0]['id'], $admin);
        $state = $service->preview($state);
        $state = $service->preview($state);
        expect($state['groups'][0]['subtotal'])->toBe('110000.00')->and($state['groups'][0]['historical_paid'])->toBe('80000.00');
        expect($state['groups'][0]['errors'])->toBe([])
            ->and($state['rows'][0]['errors'])->toBe([])
            ->and($state['rows'][0]['order_id'])->toBe($result['order_id']);
        expect(Order::findOrFail($result['order_id'])->user_id)->toBe($customer->id)
            ->and($customer->fresh()->name)->toBe('Existing')->and($customer->fresh()->password)->toBe($password)
            ->and($customer->fresh()->must_change_password)->toBeFalse();
    } finally {
        unlink($path);
    }
});

it('provides active sorted master suggestions and saves free text corrections only in the draft', function () {
    $poZ = PreOrderCode::create(['code' => 'Z-PO']);
    $poA = PreOrderCode::create(['code' => 'A-PO']);
    PreOrderCode::create(['code' => 'Deleted PO'])->delete();
    $categoryZ = Category::factory()->create(['name' => 'Z Novel']);
    $categoryA = Category::factory()->create(['name' => 'A Novel']);
    Category::factory()->create(['name' => 'Deleted category'])->delete();
    $this->withoutVite()->actingAs(User::factory()->create(['role' => 'admin']));
    $path = legacyWorkbook([legacyRow()]);
    try {
        $response = $this->post('/admin/orders/import', ['file' => new UploadedFile($path, 'orders.xlsx', null, null, true)])->assertRedirect();
        $url = $response->headers->get('Location');
        $this->withCookie(config('session.cookie'), session()->getId());
        $response = $this->get($url)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
            ->where('preOrderCodes', [['id' => $poA->id, 'label' => 'A-PO'], ['id' => $poZ->id, 'label' => 'Z-PO']])
            ->where('categories', [['id' => $categoryA->id, 'label' => 'A Novel'], ['id' => $categoryZ->id, 'label' => 'Z Novel']]));
        $draft = $response->viewData('page')['props']['draft'];
        foreach ([['pre_order_code' => 'A-PO', 'categories' => 'A Novel; Z Novel'], ['pre_order_code' => 'CUSTOM-42', 'categories' => 'Kategori bebas; A Novel']] as $values) {
            $values += ['eta' => '2027-03', 'status' => 'processing'];
            $this->patch($url.'/rows/'.$draft['rows'][0]['id'].'?page=1', ['data' => $values, 'decisions' => []])->assertSessionHasNoErrors()->assertRedirect($url.'?page=1');
            $updated = $this->get($url)->assertOk()->viewData('page')['props']['draft']['rows'][0];
            expect($updated['data'])->toMatchArray($values)->and($updated['errors'])->not->toHaveKeys(['eta', 'status']);
        }
        $this->assertDatabaseCount('pre_order_codes', 3);
        $this->assertDatabaseCount('categories', 3);
        $this->assertDatabaseCount('books', 0);
        $this->assertDatabaseCount('orders', 0);
    } finally {
        if (is_file($path)) {
            unlink($path);
        }
    }
});

it('binds HTTP drafts to their owner session and locks saved rows', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $this->withoutVite()->actingAs($admin);
    $path = legacyWorkbook([legacyRow()]);
    try {
        $file = new UploadedFile($path, 'orders.xlsx', null, null, true);
        $response = $this->post('/admin/orders/import', ['file' => $file])->assertSessionHasNoErrors()->assertRedirect();
        $url = $response->headers->get('Location');
        $this->withCookie(config('session.cookie'), session()->getId());
        $draft = $this->get($url)->assertOk()->viewData('page')['props']['draft'];
        $this->patch($url.'/rows/'.$draft['rows'][0]['id'], ['data' => ['customer_name' => 'Corrected'], 'decisions' => []])->assertSessionHasNoErrors();
        $this->post($url.'/commit', ['group_id' => $draft['groups'][0]['id']])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', ['email' => 'customer@example.com', 'name' => 'Corrected']);
        $this->patch($url.'/rows/'.$draft['rows'][0]['id'], ['data' => ['title' => 'Changed'], 'decisions' => []])->assertConflict();
        $this->actingAs(User::factory()->create(['role' => 'admin']))->get($url)->assertNotFound();
        $this->actingAs($admin);
        $this->travel(121)->minutes();
        $this->get($url)->assertStatus(410);
    } finally {
        if (is_file($path)) {
            unlink($path);
        }
    }
});

it('preserves group identity through rename split and merge', function () {
    $service = app(OrderImportService::class);
    $path = legacyWorkbook([legacyRow(), legacyRow()]);
    try {
        $state = $service->read($path);
        $original = $state['groups'][0]['id'];
        foreach ($state['rows'] as &$row) {
            $row['data']['order_code'] = 'RENAMED';
        }
        unset($row);
        $state = $service->preview($state);
        expect($state['groups'][0]['id'])->toBe($original);
        $state['rows'][0]['data']['order_code'] = 'SPLIT';
        $state = $service->preview($state);
        $split = collect($state['groups'])->firstWhere('code', 'SPLIT')['id'];
        expect($split)->not->toBe($original)
            ->and(collect($state['groups'])->firstWhere('code', 'RENAMED')['id'])->toBe($original);
        $state['rows'][0]['data']['order_code'] = 'RENAMED';
        $state = $service->preview($state);
        expect($state['groups'])->toHaveCount(1)->and($state['groups'][0]['id'])->toBe($original)
            ->and(array_keys($state['group_ids']))->toBe(['RENAMED']);
    } finally {
        unlink($path);
    }
});

it('rejects moving an unsaved row into a saved group', function () {
    $this->withoutVite()->actingAs(User::factory()->create(['role' => 'admin']));
    $path = legacyWorkbook([legacyRow(), legacyRow(['order_code' => 'OTHER'])]);
    try {
        $response = $this->post('/admin/orders/import', ['file' => new UploadedFile($path, 'orders.xlsx', null, null, true)])->assertRedirect();
        $url = $response->headers->get('Location');
        $this->withCookie(config('session.cookie'), session()->getId());
        $draft = $this->get($url)->viewData('page')['props']['draft'];
        $this->post($url.'/commit', ['group_id' => $draft['groups'][0]['id']])->assertRedirect();
        $this->patch($url.'/rows/'.$draft['rows'][1]['id'], ['data' => ['order_code' => 'lawas-001'], 'decisions' => []])->assertConflict();
        expect(Order::firstOrFail()->items()->count())->toBe(1);
    } finally {
        if (is_file($path)) {
            unlink($path);
        }
    }
});

it('rejects customer uploads and non Excel files', function () {
    $this->actingAs(User::factory()->create(['role' => 'customer']))->post('/admin/orders/import')->assertForbidden();
    $this->actingAs(User::factory()->create(['role' => 'admin']))
        ->post('/admin/orders/import', ['file' => UploadedFile::fake()->create('orders.txt', 1)])
        ->assertSessionHasErrors('file');
});

it('blocks inconsistent groups invalid money invalid gram weight and database code conflicts', function () {
    $service = app(OrderImportService::class);
    $path = legacyWorkbook([legacyRow(), legacyRow(['email' => 'other@example.com', 'weight' => '0', 'discount' => '120001'])]);
    try {
        $state = $service->read($path);
        expect($state['groups'][0]['errors'])->not->toBeEmpty()->and($state['rows'][1]['errors'])->toHaveKeys(['weight', 'discount']);
    } finally {
        unlink($path);
    }
});
