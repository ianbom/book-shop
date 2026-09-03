<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\Customer\BookResource;
use App\Models\Book;
use App\Models\Category;
use App\Models\StoreSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(Request $request): Response
    {
        $bookQuery = fn () => Book::query()
            ->active()
            ->with([
                'categories:id,name,slug',
                'images' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('sort_order'),
            ]);

        $featuredBooks = $bookQuery()
            ->orderBy('title')
            ->limit(10)
            ->get();

        $latestBooks = $bookQuery()
            ->latest()
            ->limit(5)
            ->get();

        return Inertia::render('customer/home', [
            'categories' => Category::query()->orderBy('name')->get(['id', 'name', 'slug']),
            'featuredBooks' => $this->books($featuredBooks, $request),
            'latestBooks' => $this->books($latestBooks, $request),
            'storeSettings' => $this->storeSettings(),
        ]);
    }

    /** @param iterable<Book> $books @return list<array<string, mixed>> */
    private function books(iterable $books, Request $request): array
    {
        return collect($books)
            ->map(fn (Book $book) => (new BookResource($book))->resolve($request))
            ->values()
            ->all();
    }

    /** @return array{store_name: string, whatsapp_number: string, email: ?string, address: ?string} */
    private function storeSettings(): array
    {
        $settings = StoreSetting::query()->first();

        return [
            'store_name' => $settings?->store_name ?? 'Wonder Book',
            'whatsapp_number' => $settings?->whatsapp_number ?? '+62 812-3456-7890',
            'email' => $settings?->email ?? 'halo@bukuorder.id',
            'address' => $settings?->address,
        ];
    }
}
