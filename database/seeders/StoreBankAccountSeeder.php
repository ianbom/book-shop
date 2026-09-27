<?php

namespace Database\Seeders;

use App\Models\StoreSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Validator;

class StoreBankAccountSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = config('store.bank_accounts', []);
        if ($accounts === []) {
            return;
        }

        $data = Validator::make(['bank_accounts' => $accounts], [
            'bank_accounts' => ['array', 'max:10'],
            'bank_accounts.*' => ['array:bank_name,account_holder,account_number'],
            'bank_accounts.*.bank_name' => ['required', 'string', 'max:100'],
            'bank_accounts.*.account_holder' => ['required', 'string', 'max:150'],
            'bank_accounts.*.account_number' => ['required', 'string', 'regex:/^[0-9]{6,34}$/'],
        ])->validate();

        StoreSetting::query()->findOrFail(1)->update($data);
    }
}
