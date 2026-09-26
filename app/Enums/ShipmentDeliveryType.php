<?php

namespace App\Enums;

enum ShipmentDeliveryType: string
{
    case Now = 'now';
    case Scheduled = 'scheduled';
}
