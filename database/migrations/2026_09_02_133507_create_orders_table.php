<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code', 50)->unique();
            $table->string('customer_name', 150);
            $table->string('customer_phone', 30)->index();
            $table->string('customer_email', 150)->nullable()->index();
            $table->text('customer_address');
            $table->text('customer_note')->nullable();
            $table->foreignId('book_id')->constrained()->restrictOnDelete();
            $table->string('book_title');
            $table->string('book_isbn', 50)->nullable();
            $table->string('book_author', 200)->nullable();
            $table->decimal('unit_price', 15, 2);
            $table->integer('quantity');
            $table->decimal('subtotal', 15, 2);
            $table->decimal('shipping_cost', 15, 2)->default(0);
            $table->decimal('total', 15, 2);
            $table->enum('status', ['pending', 'packing', 'shipping', 'completed', 'cancelled'])->default('pending')->index();
            $table->enum('payment_status', ['unpaid', 'paid', 'rejected'])->default('unpaid')->index();
            $table->timestamps();
            $table->softDeletes();

            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
