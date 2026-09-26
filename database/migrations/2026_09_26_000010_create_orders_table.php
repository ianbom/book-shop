<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code', 50)->unique();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('address_id')->nullable();
            $table->unsignedBigInteger('voucher_id')->nullable();
            $table->decimal('subtotal', 15, 2);
            $table->decimal('voucher_discount', 15, 2)->default(0);
            $table->decimal('shipping_cost', 15, 2)->default(0);
            $table->decimal('total', 15, 2);
            $table->decimal('wallet_amount', 15, 2);
            $table->enum('status', ['pending', 'waiting_preorder', 'processing', 'packing', 'shipping', 'completed', 'cancelled'])->default('pending');
            $table->enum('payment_status', ['unpaid', 'paid', 'partially_refunded', 'refunded'])->default('unpaid');
            $table->text('customer_note')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('user_id');
            $table->index('address_id');
            $table->index('voucher_id');
            $table->index('status');
            $table->index('payment_status');
            $table->index('created_at');
            $table->foreign('user_id')->references('id')->on('users')->restrictOnDelete();
            $table->foreign('address_id')->references('id')->on('user_addresses')->restrictOnDelete();
            $table->foreign('voucher_id')->references('id')->on('vouchers')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
