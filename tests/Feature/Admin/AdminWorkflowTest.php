<?php

namespace Tests\Feature\Admin;

use App\Enums\OrderStatus;
use App\Enums\StockMovementType;
use App\Enums\UserRole;
use App\Models\Book;
use App\Models\BookStockMovement;
use App\Models\Category;
use App\Models\Order;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_paginated_admin_pages_expose_link_items_in_meta(): void
    {
        $admin = $this->admin();
        $pages = [
            ['admin.books.index', 'admin/books/index', 'books'],
            ['admin.categories.index', 'admin/categories/index', 'categories'],
            ['admin.orders.index', 'admin/orders/index', 'orders'],
            ['admin.inventory.index', 'admin/inventory/index', 'books'],
            ['admin.inventory.history', 'admin/inventory/history', 'movements'],
        ];

        foreach ($pages as [$route, $component, $property]) {
            $this->actingAs($admin)
                ->get(route($route))
                ->assertInertia(fn (Assert $page) => $page
                    ->component($component)
                    ->has("{$property}.meta.links"),
                );
        }
    }

    public function test_single_admin_resources_are_exposed_without_data_wrappers(): void
    {
        $admin = $this->admin();
        $book = Book::factory()->create();
        $order = Order::factory()->create(['book_id' => $book->id]);
        $setting = StoreSetting::factory()->create();

        $this->actingAs($admin)->get(route('admin.books.show', $book))
            ->assertInertia(fn (Assert $page) => $page->component('admin/books/show')->where('book.id', $book->id));
        $this->actingAs($admin)->get(route('admin.books.edit', $book))
            ->assertInertia(fn (Assert $page) => $page->component('admin/books/edit')->where('book.id', $book->id));
        $this->actingAs($admin)->get(route('admin.orders.show', $order))
            ->assertInertia(fn (Assert $page) => $page->component('admin/orders/show')->where('order.id', $order->id));
        $this->actingAs($admin)->get(route('admin.settings.edit'))
            ->assertInertia(fn (Assert $page) => $page->component('admin/settings/index')->where('setting.id', $setting->id));
    }

    public function test_nested_admin_resources_are_exposed_as_arrays(): void
    {
        $admin = $this->admin();
        $category = Category::factory()->create();
        $book = Book::factory()->create();
        $book->categories()->attach($category);
        BookStockMovement::create([
            'book_id' => $book->id,
            'changed_by' => $admin->id,
            'type' => StockMovementType::Initial,
            'quantity' => 1,
            'stock_before' => 0,
            'stock_after' => 1,
        ]);
        $order = Order::factory()->create(['book_id' => $book->id]);

        $this->actingAs($admin)->get(route('admin.books.show', $book))
            ->assertInertia(fn (Assert $page) => $page
                ->has('book.categories', 1)
                ->has('book.stock_movements', 1),
            );
        $this->actingAs($admin)->get(route('admin.orders.show', $order))
            ->assertInertia(fn (Assert $page) => $page
                ->has('order.payment_proofs', 0)
                ->has('order.status_histories', 0)
                ->has('order.stock_movements', 0),
            );
    }

    public function test_admin_can_create_book_with_image_and_initial_stock_movement(): void
    {
        Storage::fake('public');
        $admin = $this->admin();

        $this->actingAs($admin)->post(route('admin.books.store'), [
            'title' => 'Clean Code',
            'slug' => 'clean-code',
            'isbn' => '9780132350884',
            'sku' => 'BK-CLEAN-CODE',
            'author' => 'Robert C. Martin',
            'description' => 'A handbook of agile software craftsmanship.',
            'price' => 125000,
            'shipping_category' => 'others',
            'weight' => 500,
            'height' => '2.50',
            'length' => '20.00',
            'width' => '13.00',
            'sale_type' => 'preorder',
            'preorder_estimated_date' => '2026-10-15',
            'preorder_note' => 'Cetakan berikutnya.',
            'initial_stock' => 8,
            'category_ids' => [],
            'is_active' => true,
            'images' => [UploadedFile::fake()->image('cover.webp')],
        ])->assertRedirect();

        $book = Book::where('slug', 'clean-code')->firstOrFail();
        $this->assertSame(8, $book->stock);
        $this->assertDatabaseHas('books', [
            'id' => $book->id,
            'sku' => 'BK-CLEAN-CODE',
            'shipping_category' => 'others',
            'weight' => 500,
            'height' => '2.50',
            'length' => '20.00',
            'width' => '13.00',
            'sale_type' => 'preorder',
            'preorder_note' => 'Cetakan berikutnya.',
        ]);
        $this->assertSame(
            '2026-10-15',
            $book->preorder_estimated_date->format('Y-m-d'),
        );
        $this->assertDatabaseHas('book_stock_movements', ['book_id' => $book->id, 'type' => StockMovementType::Initial->value, 'quantity' => 8, 'changed_by' => $admin->id]);
        Storage::disk('public')->assertExists($book->images()->firstOrFail()->image_path);
        $this->actingAs($admin)->get(route('admin.books.edit', $book))
            ->assertInertia(fn (Assert $page) => $page
                ->where('book.sku', 'BK-CLEAN-CODE')
                ->where('book.weight', 500)
                ->where('book.height', '2.50')
                ->where('book.sale_type', 'preorder')
                ->where('book.preorder_estimated_date', '2026-10-15'),
            );
    }

    public function test_preorder_requires_weight_and_estimated_date(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post(route('admin.books.store'), [
            'title' => 'Buku Baru',
            'slug' => 'buku-baru',
            'author' => 'Penulis',
            'price' => 100000,
            'shipping_category' => 'others',
            'sale_type' => 'preorder',
            'initial_stock' => 0,
            'category_ids' => [],
            'is_active' => true,
        ])->assertSessionHasErrors(['weight', 'preorder_estimated_date']);

        $this->assertDatabaseCount('books', 0);
    }

    public function test_book_values_must_fit_shipping_and_price_columns(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post(route('admin.books.store'), [
            'title' => 'Buku Baru',
            'slug' => 'buku-baru',
            'author' => 'Penulis',
            'price' => '100000.123',
            'shipping_category' => 'others',
            'weight' => 0,
            'height' => -1,
            'length' => 1000000,
            'width' => '1.234',
            'sale_type' => 'ready_stock',
            'initial_stock' => 0,
            'category_ids' => [],
            'is_active' => true,
        ])->assertSessionHasErrors(['price', 'weight', 'height', 'length', 'width']);

        $this->assertDatabaseCount('books', 0);
    }

    public function test_editing_preorder_into_ready_stock_clears_preorder_data_without_changing_stock(): void
    {
        $admin = $this->admin();
        $book = Book::factory()->create([
            'weight' => 500,
            'stock' => 7,
            'sale_type' => 'preorder',
            'preorder_estimated_date' => '2026-10-15',
            'preorder_note' => 'Cetakan berikutnya.',
        ]);

        $this->actingAs($admin)->put(route('admin.books.update', $book), [
            'title' => $book->title,
            'slug' => $book->slug,
            'author' => $book->author,
            'price' => 125000,
            'sku' => 'BK-UPDATED',
            'shipping_category' => 'others',
            'weight' => 600,
            'height' => '3.00',
            'sale_type' => 'ready_stock',
            'preorder_estimated_date' => '2026-10-15',
            'preorder_note' => 'Tidak berlaku.',
            'category_ids' => [],
            'is_active' => true,
        ])->assertRedirect();

        $this->assertDatabaseHas('books', [
            'id' => $book->id,
            'sku' => 'BK-UPDATED',
            'weight' => 600,
            'height' => '3.00',
            'sale_type' => 'ready_stock',
            'preorder_estimated_date' => null,
            'preorder_note' => null,
            'stock' => 7,
        ]);
        $this->assertDatabaseCount('book_stock_movements', 0);
        $this->actingAs($admin)->get(route('admin.books.edit', $book))
            ->assertInertia(fn (Assert $page) => $page
                ->where('book.sku', 'BK-UPDATED')
                ->where('book.weight', 600)
                ->where('book.sale_type', 'ready_stock')
                ->where('book.preorder_estimated_date', null),
            );
    }

    public function test_stock_adjustment_rejects_negative_result(): void
    {
        $admin = $this->admin();
        $book = Book::factory()->create(['stock' => 2]);

        $this->actingAs($admin)->post(route('admin.inventory.adjustments.store'), [
            'book_id' => $book->id,
            'type' => StockMovementType::AdjustmentOut->value,
            'quantity' => 3,
        ])->assertSessionHasErrors('quantity');

        $this->assertSame(2, $book->fresh()->stock);
        $this->assertDatabaseCount('book_stock_movements', 0);
    }

    public function test_cancellation_restores_order_stock_once(): void
    {
        $admin = $this->admin();
        $book = Book::factory()->create(['stock' => 5]);
        $order = Order::factory()->create(['book_id' => $book->id, 'quantity' => 2, 'status' => OrderStatus::Pending]);

        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => OrderStatus::Cancelled->value])->assertRedirect();

        $this->assertSame(7, $book->fresh()->stock);
        $this->assertSame(1, BookStockMovement::where('order_id', $order->id)->where('type', StockMovementType::Cancellation)->count());

        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => OrderStatus::Cancelled->value])->assertSessionHasErrors('status');
        $this->assertSame(7, $book->fresh()->stock);
    }

    public function test_admin_can_update_shipping_cost_and_order_total(): void
    {
        $admin = $this->admin();
        $order = Order::factory()->create([
            'subtotal' => 125000,
            'shipping_cost' => 0,
            'total' => 125000,
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.orders.shipping-cost', $order), ['shipping_cost' => 18000])
            ->assertRedirect();

        $order->refresh();

        $this->assertSame('18000.00', $order->shipping_cost);
        $this->assertSame('143000.00', $order->total);
    }

    public function test_shipping_cost_must_be_a_non_negative_number(): void
    {
        $admin = $this->admin();
        $order = Order::factory()->create([
            'subtotal' => 125000,
            'shipping_cost' => 10000,
            'total' => 135000,
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.orders.shipping-cost', $order), ['shipping_cost' => -1])
            ->assertSessionHasErrors('shipping_cost');

        $order->refresh();

        $this->assertSame('10000.00', $order->shipping_cost);
        $this->assertSame('135000.00', $order->total);
    }

    private function admin(): User
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => UserRole::Admin])->save();

        return $admin;
    }
}
