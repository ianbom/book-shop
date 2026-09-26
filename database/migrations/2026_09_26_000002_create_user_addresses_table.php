<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_addresses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('label', 100)->nullable();
            $table->string('destination_contact_name', 150);
            $table->string('destination_contact_phone', 30);
            $table->string('destination_contact_email', 150)->nullable();
            $table->text('destination_address');
            $table->text('destination_note')->nullable();
            $table->string('destination_postal_code', 10)->nullable();
            $table->string('destination_area_id', 150)->nullable();
            $table->string('destination_location_id', 150)->nullable();
            $table->decimal('destination_latitude', 10, 7)->nullable();
            $table->decimal('destination_longitude', 10, 7)->nullable();
            $table->string('province_name', 150)->nullable();
            $table->string('city_name', 150)->nullable();
            $table->string('district_name', 150)->nullable();
            $table->string('subdistrict_name', 150)->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->index('user_id');
            $table->index('destination_postal_code');
            $table->index('destination_area_id');
            $table->index('destination_location_id');
            $table->index(['user_id', 'is_default']);
            $table->foreign('user_id')->references('id')->on('users')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_addresses');
    }
};
