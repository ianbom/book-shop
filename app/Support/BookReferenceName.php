<?php

namespace App\Support;

use Normalizer;

class BookReferenceName
{
    public static function display(string $value): string
    {
        return trim(preg_replace('/\s+/u', ' ', Normalizer::normalize($value, Normalizer::FORM_KC) ?: $value));
    }

    public static function key(string $value): string
    {
        return preg_replace('/[\s\p{Pd}_]+/u', '', mb_convert_case(self::display($value), MB_CASE_FOLD, 'UTF-8'));
    }

    public static function similar(string $left, string $right, bool $code = false): bool
    {
        $left = self::key($left);
        $right = self::key($right);
        if ($left === $right || min(mb_strlen($left), mb_strlen($right)) < 4) {
            return false;
        }
        if ($code && preg_replace('/\D/u', '', $left) !== preg_replace('/\D/u', '', $right)) {
            return false;
        }

        return levenshtein($left, $right) <= (max(mb_strlen($left), mb_strlen($right)) <= 8 ? 1 : 2);
    }
}
