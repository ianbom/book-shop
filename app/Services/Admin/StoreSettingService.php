<?php

namespace App\Services\Admin;

use App\Models\StoreSetting;

class StoreSettingService
{
    /** @param array<string, mixed> $data */
    public function update(array $data): StoreSetting
    {
        $setting = StoreSetting::query()->firstOrNew(['id' => 1]);
        $setting->fill($data);
        $setting->save();

        return $setting;
    }
}
