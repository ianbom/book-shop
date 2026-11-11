<?php

use App\Support\OrderImportMoney;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

uses(TestCase::class);

it('parses and formats exact import money without floating point', function () {
    expect(OrderImportMoney::cents('60000'))->toBe(6000000)
        ->and(OrderImportMoney::cents('0.01'))->toBe(1)
        ->and(OrderImportMoney::cents('9999999999999.99'))->toBe(999999999999999)
        ->and(OrderImportMoney::decimal(999999999999999))->toBe('9999999999999.99');
});

it('rejects ambiguous negative excessive and overflowing money', function (string $value) {
    expect(fn () => OrderImportMoney::cents($value))->toThrow(ValidationException::class);
})->with(['', '-1', '1,000', '1.234', '1e3', '10000000000000', 'NaN', ' 1']);

it('checks multiplication and addition before exceeding database precision', function () {
    expect(OrderImportMoney::multiply(6000000, 2))->toBe(12000000)
        ->and(OrderImportMoney::add(11000000, 4500000))->toBe(15500000);
    expect(fn () => OrderImportMoney::multiply(999999999999999, 2))->toThrow(ValidationException::class);
    expect(fn () => OrderImportMoney::add(999999999999999, 1))->toThrow(ValidationException::class);
});
