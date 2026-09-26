<?php

namespace Tests\Feature\Database;

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_seeder_populates_latest_schema_without_duplicates(): void
    {
        Storage::fake('public');
        config(['admin' => [
            'name' => 'Admin Toko',
            'email' => 'admin@example.test',
            'password' => 'secret-password',
        ]]);
        config(['store' => [
            'store_name' => 'Buku Order',
            'couriers' => 'jne',
            'origin_contact_name' => 'Admin Toko',
            'origin_contact_phone' => '628117866977',
            'origin_address' => 'Alamat asal',
            'origin_postal_code' => '61257',
        ]]);

        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(UserRole::Admin, User::firstOrFail()->role);
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('store_settings', 1);
        $this->assertDatabaseCount('categories', 7);
        $this->assertDatabaseCount('books', 23);
        $this->assertDatabaseCount('book_stock_movements', 23);
    }
}
