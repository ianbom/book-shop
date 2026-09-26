<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case WaitingPreorder = 'waiting_preorder';
    case Processing = 'processing';
    case Packing = 'packing';
    case Shipping = 'shipping';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
