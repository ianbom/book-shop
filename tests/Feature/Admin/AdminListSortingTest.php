<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Book;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminListSortingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create(['role' => UserRole::Admin]));
    }

    public function test_books_sort_in_both_directions_and_default_to_newest(): void
    {
        $ids = [];
        foreach ([['Alpha', '9.50', 2], ['Beta', '10.25', 10], ['Zulu', '100.00', 20]] as $index => [$name, $price, $stock]) {
            $ids[] = Book::factory()->create([
                'title' => $name, 'author' => $name, 'price' => $price, 'stock' => $stock,
                'created_at' => '2026-10-0'.($index + 1),
            ])->id;
        }

        foreach (['title', 'author', 'price', 'stock'] as $sort) {
            foreach (['asc', 'desc'] as $direction) {
                $this->get(route('admin.books.index', compact('sort', 'direction')))
                    ->assertInertia(fn (Assert $page) => $page
                        ->where('books.data', fn ($rows) => $rows->pluck('id')->all() === ($direction === 'asc' ? $ids : array_reverse($ids)))
                        ->where('filters.sort', $sort)->where('filters.direction', $direction));
            }
        }
        $this->get(route('admin.books.index'))->assertInertia(fn (Assert $page) => $page
            ->where('books.data.0.id', $ids[2]));
    }

    public function test_orders_sort_displayed_values_in_both_directions_including_archived_customers(): void
    {
        $ids = [];
        foreach ([['Alpha', '9.50'], ['Beta', '10.25'], ['Zulu', '100.00']] as $index => [$name, $amount]) {
            $customer = User::factory()->create(['name' => $name]);
            $order = Order::factory()->create([
                'order_code' => 'ORD-'.$name, 'user_id' => $customer->id,
                'subtotal' => $amount, 'shipping_cost' => $amount, 'total' => $amount,
                'created_at' => '2026-10-0'.($index + 1),
            ]);
            $ids[] = $order->id;
            foreach ([20, $index + 1] as $day) {
                OrderItem::create([
                    'order_id' => $order->id, 'name' => $name, 'sale_type' => 'preorder',
                    'preorder_estimated_date' => sprintf('2026-10-%02d', $day),
                    'sku' => 'PO-'.$index.'-'.$day, 'value' => 100, 'quantity' => 1, 'weight' => 500, 'subtotal' => 100,
                ]);
            }
            if ($index === 1) {
                $customer->delete();
            }
        }

        foreach (['order_code', 'customer_name', 'subtotal', 'shipping_cost', 'total', 'created_at', 'eta'] as $sort) {
            foreach (['asc', 'desc'] as $direction) {
                $this->get(route('admin.orders.index', compact('sort', 'direction')))
                    ->assertInertia(fn (Assert $page) => $page
                        ->where('orders.data', fn ($rows) => $rows->pluck('id')->all() === ($direction === 'asc' ? $ids : array_reverse($ids)))
                        ->where('filters.sort', $sort)->where('filters.direction', $direction));
            }
        }
        $this->get(route('admin.orders.index'))->assertInertia(fn (Assert $page) => $page
            ->where('orders.data.0.id', $ids[2]));
    }

    public function test_missing_customer_shipping_and_eta_sort_last_in_both_directions(): void
    {
        $missing = Order::factory()->create([
            'user_id' => User::factory()->create(['name' => '   '])->id,
            'source' => 'imported', 'shipping_selected_at' => null, 'shipping_cost' => 0,
        ]);
        $known = Order::factory()->create(['shipping_cost' => 0]);
        OrderItem::create([
            'order_id' => $known->id, 'name' => 'Buku', 'sale_type' => 'preorder',
            'preorder_estimated_date' => '2026-10-20', 'sku' => 'PO-1',
            'value' => 100, 'quantity' => 1, 'weight' => 500, 'subtotal' => 100,
        ]);

        foreach (['customer_name', 'shipping_cost', 'eta'] as $sort) {
            foreach (['asc', 'desc'] as $direction) {
                $this->get(route('admin.orders.index', compact('sort', 'direction')))
                    ->assertInertia(fn (Assert $page) => $page
                        ->where('orders.data.0.id', $known->id)->where('orders.data.1.id', $missing->id));
            }
        }
    }

    public function test_ties_are_stable_across_pages_and_pagination_preserves_filters(): void
    {
        $bookIds = Book::factory()->count(16)->create(['title' => 'Stable', 'author' => 'Stable', 'price' => 100])->pluck('id')->sort()->values()->all();
        $orderIds = Order::factory()->count(16)->create(['subtotal' => 100])->pluck('id')->sort()->values()->all();
        foreach ([['books', 'price', ['search' => 'Stable', 'status' => 'active'], $bookIds], ['orders', 'subtotal', ['status' => 'pending'], $orderIds]] as [$list, $sort, $filters, $ids]) {
            if ($list === 'books') {
                Book::query()->update(['is_active' => true]);
            }
            foreach (['asc', 'desc'] as $direction) {
                $params = array_merge($filters, compact('sort', 'direction'));
                $this->get(route('admin.'.$list.'.index', $params))->assertInertia(fn (Assert $page) => $page
                    ->where($list.'.data', fn ($rows) => $rows->pluck('id')->all() === array_slice($ids, 0, 15))
                    ->where($list.'.links.next', function (string $url) use ($params) {
                        parse_str(parse_url($url, PHP_URL_QUERY), $query);

                        return array_intersect_assoc($query, $params) === $params;
                    }));
                $this->get(route('admin.'.$list.'.index', array_merge($params, ['page' => 2])))
                    ->assertInertia(fn (Assert $page) => $page->has($list.'.data', 1)->where($list.'.data.0.id', $ids[15]));
            }
        }
    }

    public function test_sort_parameters_reject_unknown_columns_directions_and_arrays(): void
    {
        foreach (['books', 'orders'] as $list) {
            foreach ([['sort' => 'users.password'], ['sort' => ['price']], ['direction' => 'invalid'], ['direction' => ['asc']]] as $params) {
                $this->get(route('admin.'.$list.'.index', $params))->assertSessionHasErrors(array_key_first($params));
            }
        }
    }
}
