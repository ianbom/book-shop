<?php

namespace App\Services\Customer;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\StockMovementType;
use App\Models\Book;
use App\Models\BookStockMovement;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(private readonly WhatsAppService $whatsApp) {}

    /** @param array<string, mixed> $data @return array{order: Order, whatsapp_url: string} */
    public function create(array $data): array
    {
        $whatsappNumber = $this->whatsApp->storeNumberOrFail();

        $order = DB::transaction(function () use ($data): Order {
            $book = Book::query()->lockForUpdate()->findOrFail($data['book_id']);

            if (! $book->is_active) {
                throw ValidationException::withMessages(['book_id' => 'Buku ini sudah tidak tersedia untuk dipesan.']);
            }

            $quantity = (int) $data['quantity'];
            if ($book->stock < $quantity) {
                throw ValidationException::withMessages(['quantity' => "Stok buku tidak mencukupi. Stok tersedia saat ini: {$book->stock}."]);
            }

            $unitPrice = (float) $book->price;
            $subtotal = round($unitPrice * $quantity, 2);
            $shippingCost = 0.0;
            $total = $subtotal + $shippingCost;
            $stockBefore = $book->stock;
            $stockAfter = $stockBefore - $quantity;

            $order = Order::create([
                'order_code' => $this->orderCode(),
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'customer_email' => $data['customer_email'] ?? null,
                'customer_address' => $data['customer_address'],
                'customer_note' => $data['customer_note'] ?? null,
                'book_id' => $book->id,
                'book_title' => $book->title,
                'book_isbn' => $book->isbn,
                'book_author' => $book->author,
                'unit_price' => $unitPrice,
                'quantity' => $quantity,
                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'total' => $total,
                'status' => OrderStatus::Pending,
                'payment_status' => PaymentStatus::Unpaid,
            ]);

            $book->update(['stock' => $stockAfter]);

            BookStockMovement::create([
                'book_id' => $book->id,
                'order_id' => $order->id,
                'type' => StockMovementType::Order,
                'quantity' => -$quantity,
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter,
                'note' => 'Stok berkurang karena pesanan customer.',
            ]);

            OrderStatusHistory::create([
                'order_id' => $order->id,
                'status' => OrderStatus::Pending,
                'note' => 'Pesanan dibuat oleh customer.',
            ]);

            return $order;
        });

        return [
            'order' => $order,
            'whatsapp_url' => $this->whatsApp->url($whatsappNumber, $this->whatsappMessage($order)),
        ];
    }

    private function orderCode(): string
    {
        do {
            $code = 'BK-'.Str::upper(Str::random(8));
        } while (Order::query()->where('order_code', $code)->exists());

        return $code;
    }

    private function whatsappMessage(Order $order): string
    {
        $message = implode("\n", [
            'Halo Admin Buku Order,',
            '',
            'Saya ingin melanjutkan pesanan berikut:',
            '',
            "Kode Order: {$order->order_code}",
            '',
            "Nama: {$order->customer_name}",
            "No. WhatsApp: {$order->customer_phone}",
            '',
            "Buku: {$order->book_title}",
            "Penulis: {$order->book_author}",
            "Jumlah: {$order->quantity}",
            "Harga Satuan: {$this->rupiah($order->unit_price)}",
            "Subtotal: {$this->rupiah($order->subtotal)}",
            "Biaya Pengiriman: {$this->rupiah($order->shipping_cost)}",
            "Total: {$this->rupiah($order->total)}",
            '',
            'Alamat:',
            $order->customer_address,
            '',
            'Catatan:',
            $order->customer_note ?: '-',
            '',
            'Mohon informasi untuk proses pembayaran.',
        ]);

        return $message;
    }

    private function rupiah(string|float $value): string
    {
        return 'Rp'.number_format((float) $value, 0, ',', '.');
    }
}
