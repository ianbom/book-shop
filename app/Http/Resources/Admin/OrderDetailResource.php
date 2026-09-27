<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderDetailResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $address = $this->shippingAddress;

        return [
            'id' => $this->id,
            'order_code' => $this->order_code,
            'status' => $this->status->value,
            'payment_status' => $this->payment_status->value,
            'customer_note' => $this->customer_note,
            'subtotal' => $this->subtotal,
            'voucher_discount' => $this->voucher_discount,
            'shipping_cost' => $this->shipping_cost,
            'total' => $this->total,
            'wallet_amount' => $this->wallet_amount,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'customer' => [
                'name' => $this->user?->name,
                'email' => $this->user?->email,
                'phone' => $this->user?->phone,
            ],
            'shipping_address' => $address ? [
                'recipient_name' => $address->destination_contact_name,
                'phone' => $address->destination_contact_phone,
                'email' => $address->destination_contact_email,
                'address' => $address->destination_address,
                'note' => $address->destination_note,
                'postal_code' => $address->destination_postal_code,
                'province' => $address->province_name,
                'city' => $address->city_name,
                'district' => $address->district_name,
                'subdistrict' => $address->subdistrict_name,
                'latitude' => $address->destination_latitude,
                'longitude' => $address->destination_longitude,
            ] : null,
            'items' => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'sku' => $item->sku,
                'isbn' => $item->isbn,
                'author' => $item->author,
                'description' => $item->description,
                'category' => $item->category,
                'sale_type' => $item->sale_type?->value,
                'preorder_estimated_date' => $item->preorder_estimated_date?->toDateString(),
                'preorder_ready_at' => $item->preorder_ready_at?->toISOString(),
                'quantity' => $item->quantity,
                'value' => $item->value,
                'subtotal' => $item->subtotal,
                'weight' => $item->weight,
            ]),
            'voucher' => $this->voucher ? [
                'code' => $this->voucher->code,
                'name' => $this->voucher->name,
                'discount' => $this->voucherUsage?->discount_amount,
            ] : null,
            'wallet_transactions' => $this->walletTransactions->map(fn ($transaction) => [
                'id' => $transaction->id,
                'type' => $transaction->type->value,
                'direction' => $transaction->direction->value,
                'amount' => $transaction->amount,
                'balance_before' => $transaction->balance_before,
                'balance_after' => $transaction->balance_after,
                'note' => $transaction->note,
                'created_at' => $transaction->created_at?->toISOString(),
            ]),
            'status_histories' => $this->statusHistories->map(fn ($history) => [
                'id' => $history->id,
                'status' => $history->status->value,
                'note' => $history->note,
                'changed_by' => $history->changedBy?->name,
                'created_at' => $history->created_at?->toISOString(),
            ]),
            'stock_movements' => $this->stockMovements->map(fn ($movement) => [
                'id' => $movement->id,
                'book_title' => $movement->book?->title,
                'order_item_id' => $movement->order_item_id,
                'type' => $movement->type->value,
                'quantity' => $movement->quantity,
                'stock_before' => $movement->stock_before,
                'stock_after' => $movement->stock_after,
                'note' => $movement->note,
                'changed_by' => $movement->changedBy?->name,
                'created_at' => $movement->created_at?->toISOString(),
            ]),
            'shipments' => $this->shipments->map(fn ($shipment) => [
                'id' => $shipment->id,
                'shipment_code' => $shipment->shipment_code,
                'status' => $shipment->status->value,
                'courier_company' => $shipment->courier_company,
                'courier_type' => $shipment->courier_type,
                'courier_service_name' => $shipment->courier_service_name,
                'delivery_type' => $shipment->delivery_type->value,
                'price' => $shipment->price,
                'duration' => $shipment->duration,
                'biteship_order_id' => $shipment->biteship_order_id,
                'tracking_id' => $shipment->tracking_id,
                'waybill_id' => $shipment->waybill_id,
                'courier_link' => $shipment->courier_link,
                'biteship_status' => $shipment->biteship_status,
                'created_at' => $shipment->created_at?->toISOString(),
                'items' => $shipment->items->map(fn ($shipmentItem) => [
                    'name' => $shipmentItem->orderItem?->name,
                    'quantity' => $shipmentItem->quantity,
                ]),
                'status_histories' => $shipment->statusHistories->map(fn ($history) => [
                    'id' => $history->id,
                    'status' => $history->status->value,
                    'provider_status' => $history->provider_status,
                    'description' => $history->description,
                    'occurred_at' => $history->occurred_at?->toISOString(),
                    'created_at' => $history->created_at?->toISOString(),
                ]),
            ]),
        ];
    }
}
