<?php

namespace App\Services\Customer;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Requests\Customer\SaveAddressRequest;
use App\Models\Order;
use App\Models\OrderPaymentSubmission;
use App\Models\OrderShippingAddress;
use App\Models\StoreSetting;
use App\Models\User;
use App\Models\UserAddress;
use App\Support\OrderImportMoney as Money;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class OrderSettlementService
{
    private const ADDRESS_FIELDS = ['destination_contact_name', 'destination_contact_phone', 'destination_contact_email', 'destination_address', 'destination_note', 'destination_postal_code', 'destination_area_id', 'destination_location_id', 'destination_latitude', 'destination_longitude', 'province_name', 'city_name', 'district_name', 'subdistrict_name'];

    public function __construct(private readonly BiteshipRates $rates) {}

    /** @return array{subtotal: string, historical_dp: string, historical_paid: string, approved_paid: string, outstanding_books: string, shipping_cost: string, total: string, outstanding: string, weight: int, shipping_selected: bool, books_paid: bool} */
    public function summary(Order $order): array
    {
        $subtotal = $dp = $paid = $approved = $weight = 0;
        foreach ($order->items()->get() as $item) {
            $subtotal = Money::add($subtotal, Money::cents($item->subtotal));
            $dp = Money::add($dp, Money::cents($item->historical_dp));
            $paid = Money::add($paid, Money::cents($item->historical_paid));
            $weight += $item->weight * $item->quantity;
        }
        foreach ($order->paymentSubmissions()->where('status', 'approved')->get() as $submission) {
            $approved = Money::add($approved, Money::cents($submission->amount));
        }
        $shipping = Money::cents($order->shipping_cost);
        $total = Money::add($subtotal, $shipping);
        $received = Money::add($paid, $approved);
        if ($paid > $subtotal || $received > $total) {
            $this->invalid('Tagihan tidak konsisten. Hubungi admin.');
        }

        return [
            'subtotal' => Money::decimal($subtotal), 'historical_dp' => Money::decimal($dp),
            'historical_paid' => Money::decimal($paid), 'approved_paid' => Money::decimal($approved),
            'outstanding_books' => Money::decimal(max(0, $subtotal - $received)),
            'shipping_cost' => Money::decimal($shipping), 'total' => Money::decimal($total),
            'outstanding' => Money::decimal($total - $received), 'weight' => $weight,
            'shipping_selected' => $order->shipping_selected_at !== null,
            'books_paid' => $paid >= $subtotal,
        ];
    }

    /** @return array<int, array<string, mixed>> */
    public function rates(Order $order, UserAddress $address): array
    {
        $order = Order::query()->findOrFail($order->id);
        $this->mutable($order);
        $this->shippingAvailable($order);
        $address = UserAddress::query()->where('user_id', $order->user_id)->findOrFail($address->id);
        $setting = StoreSetting::query()->firstOrFail();

        return $this->rates->get($this->payload($order, $address, $setting), exact: true);
    }

    /** @param array<string, mixed> $data */
    public function selectShipping(Order $order, User $user, array $data): void
    {
        $order = $this->owned($order, $user);
        $this->mutable($order);
        $this->shippingAvailable($order);
        Validator::make($data, [
            'address_id' => ['required', 'integer'], 'courier_company' => ['required', 'string', 'max:100'],
            'courier_type' => ['required', 'string', 'max:100'], 'shipping_cost' => ['required', 'string'],
        ])->validate();
        $address = $user->addresses()->whereKey($data['address_id'])->firstOrFail();
        $setting = StoreSetting::query()->firstOrFail();
        $payload = $this->payload($order, $address, $setting);
        $context = $this->selectionContext($order, $address, $setting);
        $rate = $this->verifiedRate($payload, $data);

        DB::transaction(function () use ($order, $user, $data, $context, $rate): void {
            $order = $this->owned($order, $user, lock: true);
            $this->mutable($order);
            $this->shippingAvailable($order);
            if (Order::query()->whereKey($order->id)->whereNull('shipping_selected_at')->update(['shipping_selected_at' => now()]) !== 1) {
                $this->invalid('Pengiriman sudah dipilih. Muat ulang halaman.');
            }
            $address = $user->addresses()->lockForUpdate()->whereKey($data['address_id'])->firstOrFail();
            $setting = StoreSetting::query()->lockForUpdate()->firstOrFail();
            if ($context !== $this->selectionContext($order, $address, $setting)) {
                $this->invalid('Item, alamat, atau toko berubah. Pilih ulang pengiriman.');
            }
            $shipments = $order->shipments()->lockForUpdate()->get();
            if ($shipments->count() > 1 || $shipments->contains(fn ($shipment) => $shipment->status->value !== 'pending' || $shipment->biteship_order_id !== null)) {
                $this->invalid('Pengiriman telah diproses. Hubungi admin.');
            }
            $order->shippingAddress()->updateOrCreate([], ['source_address_id' => $address->id, ...Arr::only($address->getAttributes(), self::ADDRESS_FIELDS)]);
            $shipment = $order->shipments()->updateOrCreate([], [
                'shipment_code' => $shipments->value('shipment_code') ?? 'SHP-'.Str::upper(Str::random(10)),
                ...Arr::only($rate, ['courier_company', 'courier_type', 'courier_service_name', 'price', 'duration']),
                'rate_response' => [...$rate['rate_response'], '_settlement_payload_hash' => $this->hash($this->payload($order, $address, $setting))],
            ]);
            $shipment->items()->delete();
            foreach ($order->items()->get() as $item) {
                $shipment->items()->create(['order_item_id' => $item->id, 'quantity' => $item->quantity]);
            }
            $shipment->statusHistories()->create(['status' => 'pending', 'description' => 'Pengiriman dipilih customer; belum dibooking.', 'occurred_at' => now()]);
            $summary = $this->summary($order);
            $order->update(['address_id' => $address->id, 'shipping_cost' => $rate['price'], 'total' => Money::decimal(Money::add(Money::cents($summary['subtotal']), Money::cents($rate['price'])))]);
        }, 3);
    }

    /** @param array<string, mixed> $data */
    public function submit(Order $order, User $user, array $data, UploadedFile $proof): OrderPaymentSubmission
    {
        $order = $this->owned($order, $user);
        Validator::make([...$data, 'proof' => $proof], [
            'submission_key' => ['required', 'uuid'], 'amount' => ['required', 'string'],
            'bank_account_index' => ['required', 'integer', 'min:0'],
            'proof' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'extensions:jpg,jpeg,png,pdf', 'max:5120'],
        ])->validate();
        $amount = Money::decimal(Money::cents($data['amount']));
        $proofHash = hash_file('sha256', $proof->getRealPath());
        if ($proofHash === false) {
            throw new RuntimeException('Bukti transfer gagal dibaca.');
        }
        if ($existing = $order->paymentSubmissions()->where('submission_key', $data['submission_key'])->first()) {
            return $this->retry($existing, $user, $amount, $proofHash, (int) $data['bank_account_index']);
        }
        $this->mutable($order);
        if (! $order->shipping_selected_at || $this->summary($order)['outstanding'] !== $amount || Money::cents($amount) === 0) {
            $this->invalid('Pilih pengiriman dan bayar seluruh sisa tagihan positif. Jika sisa nol, hubungi admin.');
        }
        $address = $order->shippingAddress()->firstOrFail();
        $setting = StoreSetting::query()->firstOrFail();
        $shipment = $order->shipments()->sole();
        $payload = $this->payload($order, $address, $setting);
        if (($shipment->rate_response['_settlement_payload_hash'] ?? null) !== $this->hash($payload)) {
            $this->invalid('Tarif atau alamat berubah. Hubungi admin.');
        }
        $bank = $this->bank($setting, (int) $data['bank_account_index']);
        $fingerprint = $this->fingerprint($order);
        $settingHash = $this->hash($setting->getAttributes());
        $this->verifiedRate($payload, ['courier_company' => $shipment->courier_company, 'courier_type' => $shipment->courier_type, 'shipping_cost' => $order->shipping_cost], locked: true);
        $path = null;
        try {
            return DB::transaction(function () use ($order, $user, $data, $amount, $proof, $proofHash, $bank, $fingerprint, $settingHash, &$path): OrderPaymentSubmission {
                $order = $this->owned($order, $user, lock: true);
                if ($existing = $order->paymentSubmissions()->where('submission_key', $data['submission_key'])->first()) {
                    return $this->retry($existing, $user, $amount, $proofHash, (int) $data['bank_account_index']);
                }
                $this->mutable($order);
                $setting = StoreSetting::query()->lockForUpdate()->firstOrFail();
                $shipment = $order->shipments()->sole();
                $payload = $this->payload($order, $order->shippingAddress()->firstOrFail(), $setting);
                if (($shipment->rate_response['_settlement_payload_hash'] ?? null) !== $this->hash($payload)
                    || $fingerprint !== $this->fingerprint($order) || $settingHash !== $this->hash($setting->getAttributes()) || $this->summary($order)['outstanding'] !== $amount) {
                    $this->invalid('Tagihan berubah. Periksa ulang sebelum mengunggah.');
                }
                $path = $proof->storeAs('order-payments', Str::uuid().'.'.$proof->extension(), 'local');
                if ($path === false) {
                    throw new RuntimeException('Bukti transfer gagal disimpan.');
                }

                return $order->paymentSubmissions()->create([
                    'uploaded_by' => $user->id, 'submission_key' => $data['submission_key'], 'amount' => $amount,
                    'proof_path' => $path, 'proof_sha256' => $proofHash, 'status' => 'pending', 'pending_slot' => 1,
                    'bank_account_snapshot' => [...$bank, 'index' => (int) $data['bank_account_index']], 'billing_fingerprint' => $fingerprint,
                ]);
            });
        } catch (Throwable $exception) {
            if (is_string($path) && ! OrderPaymentSubmission::query()->where('proof_path', $path)->exists()) {
                Storage::disk('local')->delete($path);
            }
            throw $exception;
        }
    }

    public function fingerprint(Order $order): string
    {
        return $this->hash([
            Arr::only($order->getAttributes(), ['id', 'source', 'subtotal', 'shipping_cost', 'total', 'shipping_selected_at']),
            $order->items()->orderBy('id')->get()->map(fn ($item) => $item->getAttributes())->all(),
            Arr::only($order->shippingAddress()->firstOrFail()->getAttributes(), self::ADDRESS_FIELDS),
            $order->shipments()->orderBy('id')->get()->map(fn ($shipment) => Arr::only($shipment->getAttributes(), ['id', 'courier_company', 'courier_type', 'price']))->all(),
        ]);
    }

    public function assertFulfillable(Order $order): void
    {
        if ($order->isImported() && ($order->isArchivedImport() || ! $order->shipping_selected_at || $order->payment_status !== PaymentStatus::Paid
            || ! $order->paymentSubmissions()->where('status', 'approved')->exists() || $this->summary($order)['outstanding'] !== '0.00')) {
            $this->invalid('Pesanan import belum memiliki pengiriman dan pelunasan yang disetujui.');
        }
    }

    private function owned(Order $order, User $user, bool $lock = false): Order
    {
        abort_unless($order->user_id === $user->id && $user->role->value === 'customer', 403);

        return Order::query()->where('user_id', $user->id)->when($lock, fn ($query) => $query->lockForUpdate())->findOrFail($order->id);
    }

    private function mutable(Order $order): void
    {
        if (! $order->isImported() || $order->isArchivedImport() || ! in_array($order->status, [OrderStatus::Pending, OrderStatus::WaitingPreorder, OrderStatus::Processing, OrderStatus::Packing], true)
            || $order->payment_status === PaymentStatus::Paid || $order->paymentSubmissions()->whereIn('status', ['pending', 'approved'])->exists()) {
            $this->invalid('Pesanan tidak dapat diubah atau sedang menunggu pemeriksaan pembayaran.');
        }
    }

    private function shippingAvailable(Order $order): void
    {
        if ($order->shipping_selected_at !== null) {
            $this->invalid('Pengiriman sudah dipilih. Muat ulang halaman.');
        }
    }

    /** @return array<string, mixed> */
    private function payload(Order $order, UserAddress|OrderShippingAddress $address, StoreSetting $setting): array
    {
        Validator::make($address->getAttributes(), Arr::except((new SaveAddressRequest)->rules(), ['label']))->validate();
        $items = $order->items()->orderBy('id')->get();
        if ($items->isEmpty() || $items->contains(fn ($item) => $item->quantity < 1 || $item->weight < 1)) {
            $this->invalid('Item atau berat pengiriman belum lengkap.');
        }

        foreach ($items as $item) {
            Validator::make($item->getAttributes(), [
                'height' => ['nullable', 'numeric', 'gt:0'],
                'length' => ['nullable', 'numeric', 'gt:0'],
                'width' => ['nullable', 'numeric', 'gt:0'],
            ])->validate();
        }

        return $this->rates->orderPayload($setting, $address, $items);
    }

    private function selectionContext(Order $order, UserAddress $address, StoreSetting $setting): string
    {
        return $this->hash([$this->payload($order, $address, $setting), $order->items()->orderBy('id')->get()->map(fn ($item) => $item->getAttributes())->all(), $address->getAttributes(), $setting->getAttributes()]);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function verifiedRate(array $payload, array $data, bool $locked = false): array
    {
        $rate = collect($this->rates->get($payload, exact: true))->first(fn ($rate) => $rate['courier_company'] === $data['courier_company'] && $rate['courier_type'] === $data['courier_type']);
        if (! $rate || Money::cents($rate['price']) !== Money::cents($data['shipping_cost'])) {
            $this->invalid($locked ? 'Tarif berubah atau layanan tidak tersedia. Hubungi admin.' : 'Tarif berubah atau layanan tidak tersedia. Pilih ulang pengiriman.');
        }

        return $rate;
    }

    /** @return array<string, mixed> */
    private function bank(StoreSetting $setting, int $index): array
    {
        $bank = $setting->bank_accounts[$index] ?? [];
        Validator::make($bank, ['bank_name' => ['required', 'string', 'max:100'], 'account_holder' => ['required', 'string', 'max:150'], 'account_number' => ['required', 'string', 'regex:/^[0-9]{6,34}$/']])->validate();

        return Arr::only($bank, ['bank_name', 'account_holder', 'account_number']);
    }

    private function retry(OrderPaymentSubmission $submission, User $user, string $amount, string $proofHash, int $index): OrderPaymentSubmission
    {
        if ($submission->uploaded_by !== $user->id || $submission->amount !== $amount || $submission->proof_sha256 !== $proofHash || ($submission->bank_account_snapshot['index'] ?? null) !== $index) {
            $this->invalid('Kunci pengajuan telah dipakai untuk data berbeda.');
        }

        return $submission;
    }

    /** @param array<array-key, mixed> $value */
    private function hash(array $value): string
    {
        return hash('sha256', json_encode($value, JSON_THROW_ON_ERROR));
    }

    private function invalid(string $message): never
    {
        throw ValidationException::withMessages(['settlement' => $message]);
    }
}
