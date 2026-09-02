<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Books\StoreBookRequest;
use App\Http\Requests\Admin\Books\UpdateBookRequest;
use App\Http\Requests\Admin\Books\UpdateBookStatusRequest;
use App\Http\Resources\Admin\BookResource;
use App\Http\Resources\Admin\CategoryResource;
use App\Models\Book;
use App\Models\Category;
use App\Services\Admin\BookService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookController extends Controller
{
    public function __construct(private readonly BookService $service) {}

    public function index(Request $request): Response
    {
        $active = match ($request->string('status')->toString()) {
            'active' => true,
            'inactive' => false,
            default => null,
        };

        $books = Book::query()
            ->with(['categories:id,name,slug', 'images' => fn ($query) => $query->orderBy('sort_order')])
            ->search($request->string('search')->toString())
            ->active($active)
            ->when($request->integer('category'), fn ($query, int $category) => $query->whereHas('categories', fn ($query) => $query->whereKey($category)))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/books/index', [
            'books' => BookResource::collection($books),
            'categories' => CategoryResource::collection(Category::query()->orderBy('name')->get()),
            'filters' => $request->only(['search', 'category', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/books/create', [
            'categories' => CategoryResource::collection(Category::query()->orderBy('name')->get()),
        ]);
    }

    public function store(StoreBookRequest $request): RedirectResponse
    {
        $book = $this->service->create($request->validated(), $request->user());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Buku berhasil dibuat.']);

        return to_route('admin.books.show', $book);
    }

    public function show(Book $book): Response
    {
        $book->load(['categories', 'images' => fn ($query) => $query->orderBy('sort_order'), 'stockMovements' => fn ($query) => $query->with('changedBy')->latest()->limit(10)]);

        return Inertia::render('admin/books/show', ['book' => new BookResource($book)]);
    }

    public function edit(Book $book): Response
    {
        $book->load(['categories', 'images' => fn ($query) => $query->orderBy('sort_order')]);

        return Inertia::render('admin/books/edit', [
            'book' => new BookResource($book),
            'categories' => CategoryResource::collection(Category::query()->orderBy('name')->get()),
        ]);
    }

    public function update(UpdateBookRequest $request, Book $book): RedirectResponse
    {
        $this->service->update($book, $request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Buku berhasil diperbarui.']);

        return to_route('admin.books.show', $book);
    }

    public function destroy(Book $book): RedirectResponse
    {
        $book->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Buku berhasil dihapus.']);

        return to_route('admin.books.index');
    }

    public function updateStatus(UpdateBookStatusRequest $request, Book $book): RedirectResponse
    {
        $book->update($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Status buku berhasil diperbarui.']);

        return back();
    }
}
