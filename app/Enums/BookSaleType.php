<?php

namespace App\Enums;

enum BookSaleType: string
{
    case ReadyStock = 'ready_stock';
    case Preorder = 'preorder';
}
