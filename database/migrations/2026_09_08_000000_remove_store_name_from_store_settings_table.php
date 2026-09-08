<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('store_settings', 'store_name')) {
            Schema::table('store_settings', function (Blueprint $table) {
                $table->dropColumn('store_name');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('store_settings', 'store_name')) {
            Schema::table('store_settings', function (Blueprint $table) {
                $table->string('store_name', 150)->default('Wonder Book');
            });
        }
    }
};
