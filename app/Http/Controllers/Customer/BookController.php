<?php

namespace App\Http\Controllers\Customer;

use App\Enums\BookSaleType;
use App\Http\Controllers\Controller;
use App\Http\Resources\Customer\BookResource;
use App\Models\Book;
use App\Models\Category;
use App\Models\PreOrderCode;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookController extends Controller
{
    public function index(Request $request): Response
    {
        $request->validate(['pre_order_code_id' => ['nullable', 'integer', 'min:1']]);
        $preOrderCodeId = $request->integer('pre_order_code_id');
        $sort = $request->string('sort')->toString();
        $availability = $request->string('availability')->toString();
        $rawCategories = $request->input('categories', $request->input('category', []));
        $selectedCategories = is_array($rawCategories)
            ? array_values(array_filter($rawCategories))
            : ($rawCategories ? array_values(array_filter(explode(',', (string) $rawCategories))) : []);

        $books = Book::query()
            ->active()
            ->with([
                'categories:id,name,slug',
                'preOrderCode:id,code',
                'images' => fn ($query) => $query->orderByDesc('is_primary')->orderBy('sort_order'),
            ])
            ->search($request->string('search')->toString())
            ->inCategory($selectedCategories)
            ->when($preOrderCodeId, fn ($query) => $query->where('sale_type', BookSaleType::Preorder)->where('pre_order_code_id', $preOrderCodeId))
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
            'preOrderCodes' => PreOrderCode::withTrashed()
                ->whereHas('books', fn (Builder $query) => $query->where('is_active', true)->where('sale_type', BookSaleType::Preorder))
                ->orderBy('code')->get(['id', 'code']),
            'filters' => [
                'pre_order_code_id' => $preOrderCodeId ? (string) $preOrderCodeId : '',
                'search' => $request->string('search')->toString(),
                'categories' => $selectedCategories,
                'category' => implode(',', $selectedCategories),
                'availability' => in_array($availability, ['available', 'out_of_stock'], true) ? $availability : '',
                'sort' => in_array($sort, ['latest', 'title_asc', 'title_desc', 'price_asc', 'price_desc'], true) ? $sort : 'latest',
            ],
        ]);
    }
}
