<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\CustomerResource;
use App\Models\CartItem;
use App\Models\User;
use App\Models\WalletTransaction;
use App\Services\Admin\CustomerListService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function __construct(private readonly CustomerListService $service) {}

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'verification_status' => ['nullable', Rule::in(['verified', 'unverified'])],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'sort' => ['nullable', Rule::in(CustomerListService::SORTS)],
            'sort_direction' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        return Inertia::render('admin/customers/index', [
            'customers' => CustomerResource::collection($this->service->paginate($filters)),
            'filters' => $filters,
        ]);
    }

    public function show(User $customer): Response
    {
        abort_unless($customer->role === UserRole::Customer, 404);

        $wallet = $customer->wallet()->first();
        $paginate = fn ($query, string $pageName) => $query
            ->paginate(10, ['*'], $pageName)
            ->withQueryString();

        return Inertia::render('admin/customers/show', [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'email_verified_at' => $customer->email_verified_at?->toISOString(),
                'created_at' => $customer->created_at?->toISOString(),
                'wallet_balance' => $wallet?->balance ?? '0.00',
            ],
            'addresses' => JsonResource::collection($paginate($customer->addresses()->withTrashed()->latest(), 'addresses_page')->through(fn ($address) => [
                'id' => $address->id,
                'label' => $address->label,
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
                'is_default' => $address->is_default,
                'deleted' => $address->trashed(),
            ])),
            'orders' => JsonResource::collection($paginate($customer->orders()->latest()->withCount('items'), 'orders_page')->through(fn ($order) => [
                'id' => $order->id,
                'order_code' => $order->order_code,
                'status' => $order->status->value,
                'payment_status' => $order->payment_status->value,
                'total' => $order->total,
                'items_count' => $order->items_count,
                'created_at' => $order->created_at?->toISOString(),
            ])),
            'topups' => JsonResource::collection($paginate($customer->walletTopups()->latest(), 'topups_page')->through(fn ($topup) => [
                'id' => $topup->id,
                'topup_code' => $topup->topup_code,
                'requested_amount' => $topup->requested_amount,
                'credited_amount' => $topup->credited_amount,
                'status' => $topup->status->value,
                'reviewed_at' => $topup->reviewed_at?->toISOString(),
                'created_at' => $topup->created_at?->toISOString(),
            ])),
            'transactions' => JsonResource::collection($paginate(WalletTransaction::query()->where('wallet_id', $wallet?->id ?? 0)->with(['order', 'topup'])->latest(), 'transactions_page')->through(fn ($transaction) => [
                'id' => $transaction->id,
                'type' => $transaction->type->value,
                'direction' => $transaction->direction->value,
                'amount' => $transaction->amount,
                'balance_before' => $transaction->balance_before,
                'balance_after' => $transaction->balance_after,
                'note' => $transaction->note,
                'order_code' => $transaction->order?->order_code,
                'topup_code' => $transaction->topup?->topup_code,
                'created_at' => $transaction->created_at?->toISOString(),
            ])),
            'vouchers' => JsonResource::collection($paginate($customer->voucherUsages()->with(['voucher', 'order'])->latest(), 'vouchers_page')->through(fn ($usage) => [
                'id' => $usage->id,
                'code' => $usage->voucher?->code,
                'name' => $usage->voucher?->name,
                'discount_amount' => $usage->discount_amount,
                'order_code' => $usage->order?->order_code,
                'created_at' => $usage->created_at?->toISOString(),
            ])),
            'cartItems' => JsonResource::collection($paginate(CartItem::query()->whereHas('cart', fn ($query) => $query->where('user_id', $customer->id))->with('book')->latest(), 'cart_page')->through(fn ($item) => [
                'id' => $item->id,
                'title' => $item->book?->title,
                'author' => $item->book?->author,
                'quantity' => $item->quantity,
                'price' => $item->book?->price,
            ])),
        ]);
    }
}
