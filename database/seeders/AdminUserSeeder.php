<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $values = [
            'name' => config('admin.name'),
            'email' => config('admin.email'),
            'password' => config('admin.password'),
        ];

        if (array_filter($values) === []) {
            return;
        }

        if (count(array_filter($values)) !== count($values)) {
            throw new RuntimeException('ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be configured together.');
        }

        User::withTrashed()->updateOrCreate(
            ['email' => $values['email']],
            [
                'name' => $values['name'],
                'password' => Hash::make($values['password']),
                'email_verified_at' => now(),
                'deleted_at' => null,
            ],
        );
    }
}
