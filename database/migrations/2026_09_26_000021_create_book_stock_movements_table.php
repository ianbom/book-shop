<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('book_stock_movements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('book_id');
            $table->unsignedBigInteger('order_id')->nullable();
            $table->unsignedBigInteger('order_item_id')->nullable();
            $table->unsignedBigInteger('changed_by')->nullable();
            $table->enum('type', ['initial', 'adjustment_in', 'adjustment_out', 'order', 'cancellation', 'preorder_fulfillment']);
            $table->integer('quantity');
            $table->integer('stock_before');
            $table->integer('stock_after');
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index('book_id');
            $table->index('order_id');
            $table->index('order_item_id');
            $table->index('changed_by');
            $table->index('type');
            $table->index('created_at');
            $table->foreign('book_id')->references('id')->on('books')->restrictOnDelete();
            $table->foreign('order_id')->references('id')->on('orders')->restrictOnDelete();
            $table->foreign('order_item_id')->references('id')->on('order_items')->restrictOnDelete();
            $table->foreign('changed_by')->references('id')->on('users')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('book_stock_movements');
    }
};
