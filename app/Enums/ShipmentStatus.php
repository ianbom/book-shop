<?php

namespace App\Enums;

enum ShipmentStatus: string
{
    case Pending = 'pending';
    case Booked = 'booked';
    case Pickup = 'pickup';
    case InTransit = 'in_transit';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
    case Failed = 'failed';
    case Confirmed = 'confirmed';
    case Scheduled = 'scheduled';
    case Allocated = 'allocated';
    case PickingUp = 'picking_up';
    case Picked = 'picked';
    case OnHold = 'on_hold';
    case DroppingOff = 'dropping_off';
    case ReturnInTransit = 'return_in_transit';
    case Returned = 'returned';
    case Rejected = 'rejected';
    case Disposed = 'disposed';
    case CourierNotFound = 'courier_not_found';
}
