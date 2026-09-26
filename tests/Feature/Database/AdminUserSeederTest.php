<?php

namespace Tests\Feature\Database;

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_seeder_restores_existing_user_and_assigns_admin_role(): void
    {
        config(['admin' => [
            'name' => 'Admin Toko',
            'email' => 'admin@example.test',
            'password' => 'secret-password',
        ]]);

        $user = User::factory()->create(['email' => 'admin@example.test']);
        $user->delete();

        $this->seed(AdminUserSeeder::class);
        $this->seed(AdminUserSeeder::class);

        $this->assertDatabaseCount('users', 1);
        $this->assertSame(UserRole::Admin, $user->fresh()->role);
        $this->assertNull($user->fresh()->deleted_at);
    }
}
