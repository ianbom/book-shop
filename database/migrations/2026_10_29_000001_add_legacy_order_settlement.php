<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->boolean('must_change_password')->default(false));
        Schema::table('books', fn (Blueprint $table) => $table->string('author', 200)->nullable()->change());
        Schema::table('order_shipping_addresses', fn (Blueprint $table) => $table->string('destination_contact_phone', 30)->nullable()->change());
        Schema::table('orders', function (Blueprint $table) {
            $table->string('source', 20)->default('website')->index();
            $table->uuid('import_group_key')->nullable()->unique();
            $table->json('import_metadata')->nullable();
            $table->timestamp('shipping_selected_at')->nullable();
        });
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('pre_order_code')->nullable()->index();
            $table->decimal('line_discount', 15, 2)->default(0);
            $table->decimal('historical_dp', 15, 2)->default(0);
            $table->decimal('historical_paid', 15, 2)->default(0);
            $table->uuid('import_row_key')->nullable()->unique();
            $table->unsignedInteger('import_row_number')->nullable();
        });
        Schema::create('order_payment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->restrictOnDelete();
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->uuid('submission_key')->unique();
            $table->decimal('amount', 15, 2);
            $table->string('proof_path');
            $table->string('proof_sha256', 64)->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->unsignedTinyInteger('pending_slot')->nullable()->default(1);
            $table->json('bank_account_snapshot');
            $table->string('billing_fingerprint', 64);
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('reason')->nullable();
            $table->timestamps();
            $table->unique(['order_id', 'pending_slot']);
            $table->index(['status', 'created_at']);
        });
        $valid = "((status = 'pending' AND pending_slot IS NOT NULL AND pending_slot = 1) OR (status IN ('approved', 'rejected') AND pending_slot IS NULL))";
        if (DB::getDriverName() === 'sqlite') {
            foreach (['INSERT', 'UPDATE'] as $operation) {
                $condition = str_replace(['status', 'pending_slot'], ['NEW.status', 'NEW.pending_slot'], $valid);
                DB::unprepared("CREATE TRIGGER payment_slot_{$operation} BEFORE {$operation} ON order_payment_submissions WHEN NOT {$condition} BEGIN SELECT RAISE(ABORT, 'Invalid payment pending slot'); END");
            }
        } else {
            DB::statement("ALTER TABLE order_payment_submissions ADD CONSTRAINT payment_pending_slot_check CHECK ({$valid})");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('order_payment_submissions');
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropUnique(['import_row_key']);
            $table->dropIndex(['pre_order_code']);
            $table->dropColumn(['pre_order_code', 'line_discount', 'historical_dp', 'historical_paid', 'import_row_key', 'import_row_number']);
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['import_group_key']);
            $table->dropIndex(['source']);
            $table->dropColumn(['source', 'import_group_key', 'import_metadata', 'shipping_selected_at']);
        });
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('must_change_password'));
        // Nullable historical data is retained; rollback must not fabricate authors or contacts.
    }
};
