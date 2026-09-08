<?php

namespace Database\Seeders;

use App\Models\StoreSetting;
use Illuminate\Database\Seeder;

class StoreSettingSeeder extends Seeder
{
    public function run(): void
    {
        $setting = StoreSetting::withTrashed()->firstOrNew(['id' => 1]);
        $setting->fill([
            'whatsapp_number' => '628117866977',
            'email' => 'maharaniebella@gmail.com',
            'address' => 'Safira Blue Resort Blok G1, Jl. Kisuryo Jatisel, Kedungturi, Taman, Sidoarjo',
        ]);
        $setting->deleted_at = null;
        $setting->save();
    }
}
