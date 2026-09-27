<?php

namespace App\Services\Customer;

use App\Enums\BookSaleType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\StockMovementType;
use App\Enums\VoucherType;
use App\Enums\WalletTransactionDirection;
use App\Enums\WalletTransactionType;
use App\Models\Book;
use App\Models\Order;
use App\Models\StoreSetting;
use App\Models\User;
use App\Models\Voucher;
use App\Models\Wallet;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(private readonly BiteshipRates $rates, private readonly CartListService $cartList) {}

    public function page(User $user): array
    {
        $items = $this->cartList->get($user);
        $subtotal = (float) $items['subtotal'];
        $vouchers = Voucher::query()->where('is_active', true)
            ->where('min_order_amount', '<=', $subtotal)
            ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
            ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', now()))
            ->where(fn ($query) => $query->whereNull('usage_limit')->orWhereRaw('(select count(*) from voucher_usages where voucher_id = vouchers.id) < vouchers.usage_limit'))
            ->whereRaw('(select count(*) from voucher_usages where voucher_id = vouchers.id and user_id = ?) < vouchers.per_user_limit', [$user->id])
            ->orderBy('code')->get(['id', 'code', 'name', 'type', 'value', 'max_discount']);

        return [...$items, 'addresses' => $user->addresses()->orderByDesc('is_default')->orderBy('id')->get(),
            'vouchers' => $vouchers, 'wallet_balance' => $user->wallet?->balance ?? '0.00'];
    }

    public function rates(User $user, int $addressId): array
    {
        $address = $user->addresses()->findOrFail($addressId);
        $items = $this->items($user);
        $setting = StoreSetting::query()->first();
        if (! $setting) {
            throw ValidationException::withMessages(['shipping' => 'Alamat asal toko belum tersedia.']);
        }

        return $this->rates->get($this->rates->payload($setting, $address, $items));
    }

    public function create(User $user, array $data): Order
    {
        $address = $user->addresses()->findOrFail($data['address_id']);
        $setting = StoreSetting::query()->first();
        if (! $setting) {
            throw ValidationException::withMessages(['shipping' => 'Alamat asal toko belum tersedia.']);
        }

        $payload = $this->rates->payload($setting, $address, $this->items($user));
        $rate = collect($this->rates->get($payload))->first(fn (array $rate) => $rate['courier_company'] === $data['courier_company']
            && $rate['courier_type'] === $data['courier_type']);
        if (! $rate || (int) round((float) $data['shipping_cost'] * 100) !== (int) round((float) $rate['price'] * 100)) {
            throw ValidationException::withMessages(['shipping_cost' => 'Tarif berubah atau layanan tidak tersedia. Pilih ulang ekspedisi.']);
        }

        return DB::transaction(function () use ($user, $data, $payload, $rate): Order {
            User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $wallet = Wallet::query()->where('user_id', $user->id)->lockForUpdate()->first();
            $cart = $user->cart()->lockForUpdate()->first();
            $address = $user->addresses()->whereKey($data['address_id'])->lockForUpdate()->firstOrFail();
            $setting = StoreSetting::query()->lockForUpdate()->firstOrFail();
            $items = $cart?->items()->orderBy('book_id')->lockForUpdate()->get() ?? collect();
            $books = Book::query()->whereIn('id', $items->pluck('book_id'))->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            $items->each(fn ($item) => $item->setRelation('book', $books->get($item->book_id)));

            if ($this->rates->payload($setting, $address, $items) !== $payload) {
                throw ValidationException::withMessages(['shipping' => 'Keranjang atau alamat berubah. Perbarui tarif pengiriman.']);
            }

            $subtotal = 0;
            $preorder = false;
            foreach ($items as $item) {
                $book = $item->book;
                if (! $book || ! $book->is_active || $item->quantity < 1 || $book->weight < 1
                    || ($book->sale_type === BookSaleType::ReadyStock && $book->stock < $item->quantity)) {
                    throw ValidationException::withMessages(['items' => 'Buku tidak tersedia atau stok tidak mencukupi. Periksa keranjang.']);
                }
                $preorder = $preorder || $book->sale_type === BookSaleType::Preorder;
                $subtotal += (int) round((float) $book->price * 100) * $item->quantity;
            }

            $voucher = isset($data['voucher_id']) ? Voucher::query()->whereKey($data['voucher_id'])->lockForUpdate()->first() : null;
            if (isset($data['voucher_id']) && ! $voucher) {
                throw ValidationException::withMessages(['voucher_id' => 'Voucher tidak tersedia.']);
            }
            $discount = $this->discount($voucher, $user, $subtotal);
            $shipping = (int) round((float) $rate['price'] * 100);
            $total = $subtotal - $discount + $shipping;
            if (! $wallet || (int) round((float) $wallet->balance * 100) < $total) {
                throw ValidationException::withMessages(['wallet_balance' => 'Saldo tidak mencukupi. Isi ulang saldo sebelum checkout.']);
            }

            $order = Order::query()->create([
                'order_code' => 'ORD-'.Str::upper(Str::random(10)),
                'user_id' => $user->id, 'address_id' => $address->id, 'voucher_id' => $voucher?->id,
                'subtotal' => $this->money($subtotal), 'voucher_discount' => $this->money($discount),
                'shipping_cost' => $this->money($shipping), 'total' => $this->money($total),
                'wallet_amount' => $this->money($total),
                'status' => $preorder ? OrderStatus::WaitingPreorder : OrderStatus::Pending,
                'payment_status' => PaymentStatus::Paid, 'customer_note' => $data['customer_note'] ?? null,
            ]);
            $order->shippingAddress()->create([
                'source_address_id' => $address->id,
                ...Arr::only($address->getAttributes(), [
                    'destination_contact_name', 'destination_contact_phone', 'destination_contact_email',
                    'destination_address', 'destination_note', 'destination_postal_code', 'destination_area_id',
                    'destination_location_id', 'destination_latitude', 'destination_longitude',
                    'province_name', 'city_name', 'district_name', 'subdistrict_name',
                ]),
            ]);
            $shipment = $order->shipments()->create([
                'shipment_code' => 'SHP-'.Str::upper(Str::random(10)),
                'courier_company' => $rate['courier_company'], 'courier_type' => $rate['courier_type'],
                'courier_service_name' => $rate['courier_service_name'], 'price' => $rate['price'],
                'duration' => $rate['duration'], 'rate_response' => $rate['rate_response'],
            ]);
            $shipment->statusHistories()->create([
                'status' => $shipment->status,
                'description' => 'Shipment menunggu diproses oleh admin.',
            ]);

            foreach ($items as $item) {
                $book = $item->book;
                $orderItem = $order->items()->create([
                    'book_id' => $book->id, 'name' => $book->title, 'description' => $book->description,
                    'category' => $book->shipping_category, 'sku' => $book->sku,
                    'value' => $book->price, 'quantity' => $item->quantity, 'weight' => $book->weight,
                    'height' => $book->height, 'length' => $book->length, 'width' => $book->width,
                    'isbn' => $book->isbn, 'author' => $book->author,
                    'subtotal' => $this->money((int) round((float) $book->price * 100) * $item->quantity),
                    'sale_type' => $book->sale_type, 'preorder_estimated_date' => $book->preorder_estimated_date,
                ]);
                $shipment->items()->create(['order_item_id' => $orderItem->id, 'quantity' => $item->quantity]);
                if ($book->sale_type === BookSaleType::ReadyStock) {
                    $before = $book->stock;
                    $book->update(['stock' => $before - $item->quantity]);
                    $book->stockMovements()->create([
                        'order_id' => $order->id, 'order_item_id' => $orderItem->id,
                        'changed_by' => $user->id, 'type' => StockMovementType::Order,
                        'quantity' => -$item->quantity, 'stock_before' => $before,
                        'stock_after' => $book->stock,
                    ]);
                }
            }

            if ($voucher) {
                $voucher->usages()->create(['user_id' => $user->id, 'order_id' => $order->id, 'discount_amount' => $this->money($discount)]);
            }
            $before = (int) round((float) $wallet->balance * 100);
            $wallet->update(['balance' => $this->money($before - $total)]);
            $wallet->transactions()->create([
                'order_id' => $order->id, 'created_by' => $user->id,
                'type' => WalletTransactionType::OrderPayment,
                'direction' => WalletTransactionDirection::Debit, 'amount' => $this->money($total),
                'balance_before' => $this->money($before), 'balance_after' => $this->money($before - $total),
            ]);
            $order->statusHistories()->create([
                'status' => $order->status,
                'changed_by' => $user->id,
                'note' => 'Pesanan dibuat melalui checkout wallet.',
            ]);
            $cart->items()->delete();

            return $order;
        }, 3);
    }

    private function items(User $user): Collection
    {
        $items = $user->cart?->items()->with('book')->orderBy('book_id')->get() ?? collect();
        if ($items->isEmpty()) {
            throw ValidationException::withMessages(['items' => 'Keranjang kosong. Tambahkan buku sebelum checkout.']);
        }

        return $items;
    }

    private function discount(?Voucher $voucher, User $user, int $subtotal): int
    {
        if (! $voucher) {
            return 0;
        }
        if (! $voucher->is_active || ($voucher->starts_at && $voucher->starts_at->isFuture())
            || ($voucher->ends_at && $voucher->ends_at->isPast())
            || $subtotal < (int) round((float) $voucher->min_order_amount * 100)
            || ($voucher->usage_limit !== null && $voucher->usages()->count() >= $voucher->usage_limit)
            || $voucher->usages()->where('user_id', $user->id)->count() >= $voucher->per_user_limit) {
            throw ValidationException::withMessages(['voucher_id' => 'Voucher tidak tersedia atau batas penggunaan tercapai.']);
        }
        $amount = $voucher->type === VoucherType::Fixed
            ? (int) round((float) $voucher->value * 100)
            : (int) round($subtotal * (float) $voucher->value / 100);
        if ($voucher->type === VoucherType::Percentage && $voucher->max_discount !== null) {
            $amount = min($amount, (int) round((float) $voucher->max_discount * 100));
        }

        return min($subtotal, max(0, $amount));
    }

    private function money(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }
}
