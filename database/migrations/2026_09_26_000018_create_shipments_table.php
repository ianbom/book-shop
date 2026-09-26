<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->string('shipment_code', 50)->unique();
            $table->string('courier_company', 100);
            $table->string('courier_type', 100);
            $table->enum('delivery_type', ['now', 'scheduled'])->default('now');
            $table->string('courier_service_name', 150)->nullable();
            $table->decimal('price', 15, 2);
            $table->string('duration', 100)->nullable();
            $table->json('rate_response')->nullable();
            $table->string('biteship_order_id', 150)->nullable();
            $table->string('tracking_id', 150)->nullable();
            $table->string('waybill_id', 150)->nullable();
            $table->string('courier_link', 500)->nullable();
            $table->string('biteship_status', 100)->nullable();
            $table->json('response_payload')->nullable();
            $table->enum('status', ['pending', 'booked', 'pickup', 'in_transit', 'delivered', 'cancelled', 'failed'])->default('pending');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('order_id');
            $table->index('biteship_order_id');
            $table->index('tracking_id');
            $table->index('waybill_id');
            $table->index('courier_company');
            $table->index('courier_type');
            $table->index('status');
            $table->foreign('order_id')->references('id')->on('orders')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
