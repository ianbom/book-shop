<?php

namespace Tests\Feature\Admin;

use App\Models\Book;
use App\Models\PreOrderCode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PreOrderCodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_schema_and_one_to_many_relationship_preserve_archived_codes(): void
    {
        $this->assertTrue(Schema::hasColumns('pre_order_codes', ['id', 'code', 'created_at', 'updated_at', 'deleted_at']));
        $this->assertContains('pre_order_codes', array_column(Schema::getForeignKeys('books'), 'foreign_table'));
        $this->assertTrue(collect(Schema::getIndexes('books'))->contains(fn (array $index) => $index['columns'] === ['pre_order_code_id']));
        $code = PreOrderCode::create(['code' => 'PO-2026']);
        $books = Book::factory()->count(2)->create(['sale_type' => 'preorder', 'pre_order_code_id' => $code->id]);
        $this->assertCount(2, $code->books);
        $code->delete();
        $this->assertTrue($books->first()->fresh()->preOrderCode->trashed());
    }

    public function test_only_admin_can_access_the_code_endpoints(): void
    {
        $code = PreOrderCode::create(['code' => 'PO-ADMIN']);
        $this->get(route('admin.pre-order-codes.index'))->assertRedirect(route('login'));
        $this->actingAs(User::factory()->create(['role' => 'customer']));
        $this->get(route('admin.pre-order-codes.index'))->assertForbidden();
        $this->post(route('admin.pre-order-codes.store'), ['code' => 'OTHER'])->assertForbidden();
        $this->patch(route('admin.pre-order-codes.update', $code), ['code' => 'OTHER'])->assertForbidden();
        $this->delete(route('admin.pre-order-codes.destroy', $code))->assertForbidden();
        $this->getJson(route('admin.pre-order-codes.books', $code))->assertForbidden();
    }

    public function test_index_searches_paginates_and_counts_only_non_deleted_books(): void
    {
        $this->admin();
        $code = PreOrderCode::create(['code' => 'PO-MATCH']);
        Book::factory()->create(['sale_type' => 'preorder', 'pre_order_code_id' => $code->id, 'is_active' => true]);
        Book::factory()->create(['sale_type' => 'preorder', 'pre_order_code_id' => $code->id, 'is_active' => false]);
        Book::factory()->create(['sale_type' => 'preorder', 'pre_order_code_id' => $code->id])->delete();
        foreach (range(1, 21) as $number) {
            PreOrderCode::create(['code' => sprintf('OTHER-%02d', $number)]);
        }
        PreOrderCode::create(['code' => 'PO-HIDDEN'])->delete();

        $this->get(route('admin.pre-order-codes.index'))->assertInertia(fn (Assert $page) => $page
            ->component('admin/pre-order-codes/index')->has('preOrderCodes.data', 20)->where('preOrderCodes.meta.total', 22));
        $this->get(route('admin.pre-order-codes.index', ['search' => 'MATCH']))->assertInertia(fn (Assert $page) => $page
            ->has('preOrderCodes.data', 1)->where('preOrderCodes.data.0.code', 'PO-MATCH')
            ->where('preOrderCodes.data.0.books_count', 2)->where('filters.search', 'MATCH'));
    }

    public function test_admin_can_create_edit_and_soft_delete_a_code_with_books(): void
    {
        $this->admin();
        $this->post(route('admin.pre-order-codes.store'), ['code' => '  PO-NEW  '])->assertSessionHasNoErrors()->assertRedirect();
        $code = PreOrderCode::where('code', 'PO-NEW')->firstOrFail();
        $this->patch(route('admin.pre-order-codes.update', $code), ['code' => 'PO-NEW'])->assertSessionHasNoErrors();
        $this->patch(route('admin.pre-order-codes.update', $code), ['code' => 'PO-EDITED'])->assertSessionHasNoErrors();
        $book = Book::factory()->create(['sale_type' => 'preorder', 'pre_order_code_id' => $code->id]);
        $this->delete(route('admin.pre-order-codes.destroy', $code))->assertRedirect();
        $this->assertSoftDeleted($code);
        $this->assertSame($code->id, $book->fresh()->pre_order_code_id);
        $this->getJson(route('admin.pre-order-codes.books', $code))->assertNotFound();
    }

    public function test_search_validates_input_and_accepts_zero_as_a_code(): void
    {
        $this->admin();
        PreOrderCode::create(['code' => '0']);
        PreOrderCode::create(['code' => 'PO-OTHER']);
        $this->get(route('admin.pre-order-codes.index', ['search' => '0']))->assertInertia(fn (Assert $page) => $page
            ->has('preOrderCodes.data', 1)->where('preOrderCodes.data.0.code', '0'));
        $this->getJson(route('admin.pre-order-codes.index', ['search' => ['invalid']]))->assertUnprocessable()->assertJsonValidationErrors('search');
        $this->getJson(route('admin.pre-order-codes.index', ['search' => str_repeat('A', 101)]))->assertUnprocessable()->assertJsonValidationErrors('search');
    }

    public function test_code_validation_reserves_deleted_codes_and_rejects_invalid_values(): void
    {
        $this->admin();
        PreOrderCode::create(['code' => 'RESERVED'])->delete();
        $existing = PreOrderCode::create(['code' => 'EXISTING']);
        foreach (['', '   ', str_repeat('A', 101), 'RESERVED'] as $value) {
            $this->post(route('admin.pre-order-codes.store'), ['code' => $value])->assertSessionHasErrors('code');
        }
        $this->patch(route('admin.pre-order-codes.update', $existing), ['code' => 'RESERVED'])->assertSessionHasErrors('code');
    }

    public function test_books_endpoint_is_paginated_scoped_and_excludes_deleted_books(): void
    {
        $this->admin();
        $code = PreOrderCode::create(['code' => 'PO-BOOKS']);
        Book::factory()->count(11)->create(['sale_type' => 'preorder', 'pre_order_code_id' => $code->id, 'is_active' => false]);
        Book::factory()->create(['sale_type' => 'preorder', 'pre_order_code_id' => $code->id])->delete();
        Book::factory()->create();
        $this->getJson(route('admin.pre-order-codes.books', $code))->assertOk()
            ->assertJsonCount(10, 'data')->assertJsonPath('meta.total', 11)
            ->assertJsonStructure(['data' => [['id', 'title', 'author', 'stock', 'is_active']]]);
        $this->getJson(route('admin.pre-order-codes.books', [$code, 'page' => 2]))->assertJsonCount(1, 'data');
        $empty = PreOrderCode::create(['code' => 'EMPTY']);
        $this->getJson(route('admin.pre-order-codes.books', $empty))->assertJsonCount(0, 'data')->assertJsonPath('meta.total', 0);
    }

    public function test_preorder_requires_an_existing_non_deleted_code_on_create_and_update(): void
    {
        $this->admin();
        $deleted = PreOrderCode::create(['code' => 'DELETED']);
        $deleted->delete();
        $book = Book::factory()->create();
        foreach ([null, 999999, $deleted->id] as $id) {
            $data = $this->bookData(['sale_type' => 'preorder', 'preorder_estimated_date' => '2027-01-01', 'pre_order_code_id' => $id]);
            $this->post(route('admin.books.store'), $data)->assertSessionHasErrors('pre_order_code_id');
            $this->put(route('admin.books.update', $book), $data)->assertSessionHasErrors('pre_order_code_id');
        }
    }

    public function test_ready_stock_rejects_a_code_on_create_and_update(): void
    {
        $this->admin();
        $code = PreOrderCode::create(['code' => 'PO-READY']);
        $book = Book::factory()->create();
        $data = $this->bookData(['pre_order_code_id' => $code->id]);
        $this->post(route('admin.books.store'), $data)->assertSessionHasErrors('pre_order_code_id');
        $this->put(route('admin.books.update', $book), $data)->assertSessionHasErrors('pre_order_code_id');
    }

    public function test_preorder_assignment_and_switch_to_ready_stock_are_persisted(): void
    {
        $this->admin();
        $code = PreOrderCode::create(['code' => 'PO-SAVE']);
        $data = $this->bookData(['sale_type' => 'preorder', 'preorder_estimated_date' => '2027-01-01', 'pre_order_code_id' => $code->id]);
        $this->post(route('admin.books.store'), $data)->assertSessionHasNoErrors()->assertRedirect();
        $book = Book::where('slug', $data['slug'])->firstOrFail();
        $this->assertSame($code->id, $book->pre_order_code_id);
        $this->put(route('admin.books.update', $book), [...$data, 'sale_type' => 'ready_stock', 'pre_order_code_id' => null])->assertSessionHasNoErrors();
        $this->assertNull($book->fresh()->pre_order_code_id);
    }

    public function test_deleted_code_can_only_be_retained_by_its_current_book(): void
    {
        $this->admin();
        $old = PreOrderCode::create(['code' => 'PO-OLD']);
        $new = PreOrderCode::create(['code' => 'PO-NEW']);
        $book = Book::factory()->create(['sale_type' => 'preorder', 'preorder_estimated_date' => '2027-01-01', 'pre_order_code_id' => $old->id]);
        $old->delete();
        $data = $this->bookData($book->getAttributes());
        $this->put(route('admin.books.update', $book), $data)->assertSessionHasNoErrors();
        $other = Book::factory()->create();
        $this->put(route('admin.books.update', $other), [...$data, 'slug' => $other->slug])->assertSessionHasErrors('pre_order_code_id');
        $this->put(route('admin.books.update', $book), [...$data, 'pre_order_code_id' => $new->id])->assertSessionHasNoErrors();
        $this->put(route('admin.books.update', $book), $data)->assertSessionHasErrors('pre_order_code_id');
    }

    public function test_book_forms_exclude_deleted_options_but_expose_the_current_archived_code(): void
    {
        $this->admin();
        $active = PreOrderCode::create(['code' => 'ACTIVE']);
        $deleted = PreOrderCode::create(['code' => 'ARCHIVED']);
        $book = Book::factory()->create(['sale_type' => 'preorder', 'pre_order_code_id' => $deleted->id]);
        $deleted->delete();
        $this->get(route('admin.books.create'))->assertInertia(fn (Assert $page) => $page
            ->has('preOrderCodes', 1)->where('preOrderCodes.0.id', $active->id));
        $this->get(route('admin.books.edit', $book))->assertInertia(fn (Assert $page) => $page
            ->has('preOrderCodes', 1)->where('book.pre_order_code_id', $deleted->id)
            ->where('book.pre_order_code.code', 'ARCHIVED')->where('book.pre_order_code.is_deleted', true));
    }

    private function admin(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
    }

    private function bookData(array $overrides = []): array
    {
        return [...Book::factory()->make()->getAttributes(), 'initial_stock' => 0, 'category_ids' => [], ...$overrides];
    }
}
