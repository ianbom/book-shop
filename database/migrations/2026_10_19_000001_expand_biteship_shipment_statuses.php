<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const LEGACY = ['pending', 'booked', 'pickup', 'in_transit', 'delivered', 'cancelled', 'failed'];

    private const PROVIDER = ['confirmed', 'scheduled', 'allocated', 'picking_up', 'picked', 'on_hold', 'dropping_off', 'return_in_transit', 'returned', 'rejected', 'disposed', 'courier_not_found'];

    public function up(): void
    {
        $this->changeStatuses([...self::LEGACY, ...self::PROVIDER]);
    }

    public function down(): void
    {
        foreach (['shipments', 'shipment_status_histories'] as $table) {
            if (DB::table($table)->whereNotIn('status', self::LEGACY)->exists()) {
                throw new RuntimeException('Rollback ditolak: status Biteship baru masih digunakan.');
            }
        }
        $this->changeStatuses(self::LEGACY);
    }

    /** @param list<string> $statuses */
    private function changeStatuses(array $statuses): void
    {
        Schema::table('shipments', function (Blueprint $table) use ($statuses): void {
            $table->enum('status', $statuses)->default('pending')->change();
        });
        Schema::table('shipment_status_histories', function (Blueprint $table) use ($statuses): void {
            $table->enum('status', $statuses)->change();
        });
    }
};
