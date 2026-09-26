<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('wallet_id');
            $table->unsignedBigInteger('topup_id')->nullable();
            $table->unsignedBigInteger('order_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->enum('type', ['topup_credit', 'order_payment', 'order_refund', 'admin_adjustment_credit', 'admin_adjustment_debit']);
            $table->enum('direction', ['credit', 'debit']);
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_before', 15, 2);
            $table->decimal('balance_after', 15, 2);
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index('wallet_id');
            $table->index('topup_id');
            $table->index('order_id');
            $table->index('created_by');
            $table->index('type');
            $table->index('direction');
            $table->index('created_at');
            $table->foreign('wallet_id')->references('id')->on('wallets')->restrictOnDelete();
            $table->foreign('topup_id')->references('id')->on('wallet_topups')->restrictOnDelete();
            $table->foreign('order_id')->references('id')->on('orders')->restrictOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
