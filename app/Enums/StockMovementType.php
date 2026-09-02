<?php

namespace App\Enums;

enum StockMovementType: string
{
    case Initial = 'initial';
    case AdjustmentIn = 'adjustment_in';
    case AdjustmentOut = 'adjustment_out';
    case Order = 'order';
    case Cancellation = 'cancellation';
}
