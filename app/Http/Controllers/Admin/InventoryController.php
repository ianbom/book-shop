<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StockMovementType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Inventory\AdjustStockRequest;
use App\Http\Resources\Admin\BookResource;
use App\Http\Resources\Admin\BookStockMovementResource;
use App\Models\Book;
use App\Models\BookStockMovement;
use App\Services\Admin\InventoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function __construct(private readonly InventoryService $service) {}

    public function index(Request $request): Response
    {
        $books = Book::query()
            ->with(['images' => fn ($query) => $query->orderBy('sort_order')])
            ->with(['stockMovements' => fn ($query) => $query->latest()->limit(1)])
            ->search($request->string('search')->toString())
            ->orderBy('title')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/inventory/index', [
            'books' => BookResource::collection($books),
            'filters' => $request->only('search'),
        ]);
    }

    public function store(AdjustStockRequest $request): RedirectResponse
    {
        $book = Book::findOrFail($request->integer('book_id'));
        $this->service->adjust($book, StockMovementType::from($request->validated('type')), $request->integer('quantity'), $request->validated('note'), $request->user());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Stok berhasil disesuaikan.']);

        return back();
    }

    public function history(Request $request): Response
    {
        $movements = BookStockMovement::query()
            ->with(['book', 'order', 'changedBy'])
            ->when($request->integer('book'), fn ($query, int $book) => $query->where('book_id', $book))
            ->when(StockMovementType::tryFrom($request->string('type')->toString()), fn ($query, StockMovementType $type) => $query->where('type', $type))
            ->when($request->date('date_from'), fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($request->date('date_to'), fn ($query, $date) => $query->whereDate('created_at', '<=', $date))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/inventory/history', [
            'movements' => BookStockMovementResource::collection($movements),
            'books' => Book::query()->orderBy('title')->get(['id', 'title']),
            'filters' => $request->only(['book', 'type', 'date_from', 'date_to']),
        ]);
    }
}
