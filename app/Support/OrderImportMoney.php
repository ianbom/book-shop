<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

final class OrderImportMoney
{
    public const int MAX = 999999999999999;

    public static function cents(string $value): int
    {
        if (! preg_match('/\A(0|[1-9][0-9]{0,12})(?:\.([0-9]{1,2}))?\z/D', $value, $matches)) {
            throw ValidationException::withMessages(['amount' => 'Nominal harus literal positif atau nol, tanpa pemisah ribuan, maksimal dua desimal.']);
        }

        return ((int) $matches[1] * 100) + (int) str_pad($matches[2] ?? '', 2, '0');
    }

    public static function decimal(int $cents): string
    {
        self::range($cents);

        return intdiv($cents, 100).'.'.str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }

    public static function add(int $left, int $right): int
    {
        self::range($left);
        self::range($right);
        if ($left > self::MAX - $right) {
            self::overflow();
        }

        return $left + $right;
    }

    public static function multiply(int $cents, int $quantity): int
    {
        self::range($cents);
        if ($quantity < 1 || ($cents > 0 && $quantity > intdiv(self::MAX, $cents))) {
            self::overflow();
        }

        return $cents * $quantity;
    }

    private static function range(int $value): void
    {
        if ($value < 0 || $value > self::MAX) {
            self::overflow();
        }
    }

    private static function overflow(): never
    {
        throw ValidationException::withMessages(['amount' => 'Nominal melampaui batas penyimpanan.']);
    }
}
