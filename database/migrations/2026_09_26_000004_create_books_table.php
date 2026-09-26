<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('slug', 255)->unique();
            $table->string('isbn', 50)->nullable();
            $table->string('sku', 100)->nullable();
            $table->string('author', 200);
            $table->text('description')->nullable();
            $table->decimal('price', 15, 2);
            $table->string('shipping_category', 50)->default('others');
            $table->integer('weight');
            $table->decimal('height', 8, 2)->nullable();
            $table->decimal('length', 8, 2)->nullable();
            $table->decimal('width', 8, 2)->nullable();
            $table->integer('stock')->default(0);
            $table->enum('sale_type', ['ready_stock', 'preorder'])->default('ready_stock');
            $table->date('preorder_estimated_date')->nullable();
            $table->text('preorder_note')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->index('isbn');
            $table->index('sku');
            $table->index('title');
            $table->index('author');
            $table->index('sale_type');
            $table->index('preorder_estimated_date');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
