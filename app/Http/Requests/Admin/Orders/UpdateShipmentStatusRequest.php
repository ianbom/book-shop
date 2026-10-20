<?php

namespace App\Http\Requests\Admin\Orders;

use App\Enums\ShipmentStatus;
use App\Models\Order;
use App\Models\Shipment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateShipmentStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $order = $this->route('order');
        $shipment = $this->route('shipment');
        abort_unless($order instanceof Order && $shipment instanceof Shipment && $shipment->order_id === $order->id, 404);

        return $this->user() !== null;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(ShipmentStatus::class)],
            'description' => ['required', 'string', 'max:1000'],
        ];
    }
}
