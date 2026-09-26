<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_settings', function (Blueprint $table) {
            $table->id();
            $table->string('store_name', 150);
            $table->string('whatsapp_number', 30)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('phone', 30)->nullable();
            $table->text('address')->nullable();
            $table->text('couriers');
            $table->string('shipper_contact_name', 150)->nullable();
            $table->string('shipper_contact_phone', 30)->nullable();
            $table->string('shipper_contact_email', 150)->nullable();
            $table->string('shipper_organization', 150)->nullable();
            $table->string('origin_contact_name', 150);
            $table->string('origin_contact_phone', 30);
            $table->string('origin_contact_email', 150)->nullable();
            $table->text('origin_address');
            $table->text('origin_note')->nullable();
            $table->string('origin_postal_code', 10)->nullable();
            $table->string('origin_area_id', 150)->nullable();
            $table->string('origin_location_id', 150)->nullable();
            $table->decimal('origin_latitude', 10, 7)->nullable();
            $table->decimal('origin_longitude', 10, 7)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_settings');
    }
};
