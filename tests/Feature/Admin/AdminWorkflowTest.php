<?php

namespace Tests\Feature\Admin;

use App\Enums\OrderStatus;
use App\Enums\StockMovementType;
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
        $admin = User::factory()->create();
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
        $admin = User::factory()->create();
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
        $admin = User::factory()->create();
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
        $admin = User::factory()->create();

        $this->actingAs($admin)->post(route('admin.books.store'), [
            'title' => 'Clean Code',
            'slug' => 'clean-code',
            'isbn' => '9780132350884',
            'author' => 'Robert C. Martin',
            'description' => 'A handbook of agile software craftsmanship.',
            'price' => 125000,
            'initial_stock' => 8,
            'category_ids' => [],
            'is_active' => true,
            'images' => [UploadedFile::fake()->image('cover.webp')],
        ])->assertRedirect();

        $book = Book::where('slug', 'clean-code')->firstOrFail();
        $this->assertSame(8, $book->stock);
        $this->assertDatabaseHas('book_stock_movements', ['book_id' => $book->id, 'type' => StockMovementType::Initial->value, 'quantity' => 8, 'changed_by' => $admin->id]);
        Storage::disk('public')->assertExists($book->images()->firstOrFail()->image_path);
    }

    public function test_stock_adjustment_rejects_negative_result(): void
    {
        $admin = User::factory()->create();
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
        $admin = User::factory()->create();
        $book = Book::factory()->create(['stock' => 5]);
        $order = Order::factory()->create(['book_id' => $book->id, 'quantity' => 2, 'status' => OrderStatus::Pending]);

        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => OrderStatus::Cancelled->value])->assertRedirect();

        $this->assertSame(7, $book->fresh()->stock);
        $this->assertSame(1, BookStockMovement::where('order_id', $order->id)->where('type', StockMovementType::Cancellation)->count());

        $this->actingAs($admin)->patch(route('admin.orders.status', $order), ['status' => OrderStatus::Cancelled->value])->assertSessionHasErrors('status');
        $this->assertSame(7, $book->fresh()->stock);
    }
}
