<?php

namespace Tests\Unit\Models;

use App\Models\Book;
use App\Models\BookCategory;
use App\Models\BookStockMovement;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\PaymentProof;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Tests\TestCase;

class RelationshipTest extends TestCase
{
    public function test_book_and_category_relations_have_expected_types(): void
    {
        $book = new Book;
        $category = new Category;

        $this->assertInstanceOf(HasMany::class, $book->images());
        $this->assertInstanceOf(BelongsToMany::class, $book->categories());
        $this->assertInstanceOf(HasMany::class, $book->orders());
        $this->assertInstanceOf(HasMany::class, $book->stockMovements());
        $this->assertInstanceOf(BelongsToMany::class, $category->books());
    }

    public function test_order_and_audit_relations_have_expected_types(): void
    {
        $order = new Order;
        $paymentProof = new PaymentProof;
        $statusHistory = new OrderStatusHistory;
        $stockMovement = new BookStockMovement;
        $user = new User;

        $this->assertInstanceOf(BelongsTo::class, $order->book());
        $this->assertInstanceOf(HasMany::class, $order->paymentProofs());
        $this->assertInstanceOf(HasMany::class, $order->statusHistories());
        $this->assertInstanceOf(HasMany::class, $order->stockMovements());
        $this->assertInstanceOf(BelongsTo::class, $paymentProof->order());
        $this->assertInstanceOf(BelongsTo::class, $paymentProof->uploadedBy());
        $this->assertInstanceOf(BelongsTo::class, $statusHistory->order());
        $this->assertInstanceOf(BelongsTo::class, $statusHistory->changedBy());
        $this->assertInstanceOf(BelongsTo::class, $stockMovement->book());
        $this->assertInstanceOf(BelongsTo::class, $stockMovement->order());
        $this->assertInstanceOf(BelongsTo::class, $stockMovement->changedBy());
        $this->assertInstanceOf(HasMany::class, $user->paymentProofs());
        $this->assertInstanceOf(HasMany::class, $user->orderStatusHistories());
        $this->assertInstanceOf(HasMany::class, $user->bookStockMovements());
    }

    public function test_book_category_is_an_incrementing_pivot_model(): void
    {
        $bookCategory = new BookCategory;

        $this->assertInstanceOf(Pivot::class, $bookCategory);
        $this->assertTrue($bookCategory->getIncrementing());
        $this->assertInstanceOf(BelongsTo::class, $bookCategory->book());
        $this->assertInstanceOf(BelongsTo::class, $bookCategory->category());
    }
}
