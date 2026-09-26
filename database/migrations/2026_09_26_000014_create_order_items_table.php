<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('book_id')->nullable();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('category', 50)->default('others');
            $table->string('sku', 100)->nullable();
            $table->decimal('value', 15, 2);
            $table->integer('quantity');
            $table->integer('weight');
            $table->decimal('height', 8, 2)->nullable();
            $table->decimal('length', 8, 2)->nullable();
            $table->decimal('width', 8, 2)->nullable();
            $table->string('isbn', 50)->nullable();
            $table->string('author', 200)->nullable();
            $table->decimal('subtotal', 15, 2);
            $table->enum('sale_type', ['ready_stock', 'preorder']);
            $table->date('preorder_estimated_date')->nullable();
            $table->timestamp('preorder_ready_at')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('order_id');
            $table->index('book_id');
            $table->index('sku');
            $table->index('sale_type');
            $table->index('preorder_estimated_date');
            $table->foreign('order_id')->references('id')->on('orders')->restrictOnDelete();
            $table->foreign('book_id')->references('id')->on('books')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
