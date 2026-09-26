<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voucher_usages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('voucher_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('order_id')->unique();
            $table->decimal('discount_amount', 15, 2);
            $table->timestamp('created_at')->useCurrent();
            $table->index('voucher_id');
            $table->index('user_id');
            $table->index(['voucher_id', 'user_id']);
            $table->foreign('voucher_id')->references('id')->on('vouchers')->restrictOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->restrictOnDelete();
            $table->foreign('order_id')->references('id')->on('orders')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voucher_usages');
    }
};
