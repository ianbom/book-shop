<?php

use App\Support\BookReferenceName;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['categories' => 'name', 'pre_order_codes' => 'code'] as $table => $field) {
            $seen = [];
            foreach (DB::table($table)->orderBy('id')->get(['id', $field]) as $row) {
                $key = BookReferenceName::key($row->{$field});
                if ($key === '' || mb_strlen($key) > 150 || isset($seen[$key])) {
                    throw new RuntimeException("Konflik normalisasi {$table}: ID {$row->id} ({$row->{$field}}). Koreksi data sebelum migration; tidak ada data yang digabung otomatis.");
                }
                $seen[$key] = $row->id;
            }
        }

        foreach (['categories' => 'name', 'pre_order_codes' => 'code'] as $table => $field) {
            Schema::table($table, fn (Blueprint $table) => $table->string('normalized_key', 150)->nullable());
            foreach (DB::table($table)->get(['id', $field]) as $row) {
                DB::table($table)->where('id', $row->id)->update(['normalized_key' => BookReferenceName::key($row->{$field})]);
            }
            Schema::table($table, function (Blueprint $table): void {
                $table->string('normalized_key', 150)->nullable(false)->change();
                $table->unique('normalized_key');
            });
        }
        Schema::table('books', fn (Blueprint $table) => $table->uuid('import_row_key')->nullable()->unique());
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table): void {
            $table->dropUnique(['import_row_key']);
            $table->dropColumn('import_row_key');
        });
        foreach (['categories', 'pre_order_codes'] as $name) {
            Schema::table($name, function (Blueprint $table): void {
                $table->dropUnique(['normalized_key']);
                $table->dropColumn('normalized_key');
            });
        }
    }
};
