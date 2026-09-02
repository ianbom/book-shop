<?php

namespace App\Services\Admin;

use App\Models\StoreSetting;

class StoreSettingService
{
    /** @param array<string, mixed> $data */
    public function update(array $data): StoreSetting
    {
        $setting = StoreSetting::withTrashed()->firstOrNew(['id' => 1]);
        $setting->fill($data);

        if ($setting->exists && $setting->trashed()) {
            $setting->restore();
        }

        $setting->save();

        return $setting;
    }
}
