<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipment_status_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shipment_id');
            $table->enum('status', ['pending', 'booked', 'pickup', 'in_transit', 'delivered', 'cancelled', 'failed']);
            $table->string('provider_status', 100)->nullable();
            $table->text('description')->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index('shipment_id');
            $table->index('status');
            $table->index('provider_status');
            $table->index('occurred_at');
            $table->index('created_at');
            $table->foreign('shipment_id')->references('id')->on('shipments')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipment_status_histories');
    }
};
