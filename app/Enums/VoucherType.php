<?php

namespace App\Enums;

enum VoucherType: string
{
    case Fixed = 'fixed';
    case Percentage = 'percentage';
}
