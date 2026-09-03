<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\Customer\BookResource;
use App\Models\Book;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookController extends Controller
{
    public function index(Request $request): Response
    {
        $sort = $request->string('sort')->toString();
        $availability = $request->string('availability')->toString();

        $books = Book::query()
            ->active()
            ->with([
                'categories:id,name,slug',
                'images' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('sort_order'),
            ])
            ->search($request->string('search')->toString())
            ->inCategory($request->string('category')->toString())
            ->when($availability === 'available', fn ($query) => $query->where('stock', '>', 0))
            ->when($availability === 'out_of_stock', fn ($query) => $query->where('stock', 0));

        match ($sort) {
            'title_asc' => $books->orderBy('title'),
            'title_desc' => $books->orderByDesc('title'),
            'price_asc' => $books->orderBy('price'),
            'price_desc' => $books->orderByDesc('price'),
            default => $books->latest(),
        };

        return Inertia::render('customer/books/index', [
            'books' => BookResource::collection($books->paginate(12)->withQueryString()),
            'categories' => Category::query()->orderBy('name')->get(['id', 'name', 'slug']),
            'filters' => [
                'search' => $request->string('search')->toString(),
                'category' => $request->string('category')->toString(),
                'availability' => in_array($availability, ['available', 'out_of_stock'], true) ? $availability : '',
                'sort' => in_array($sort, ['latest', 'title_asc', 'title_desc', 'price_asc', 'price_desc'], true) ? $sort : 'latest',
            ],
        ]);
    }
}
