<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Books\ReorderBookImagesRequest;
use App\Http\Requests\Admin\Books\StoreBookImageRequest;
use App\Http\Requests\Admin\Books\UpdateBookImageRequest;
use App\Models\Book;
use App\Models\BookImage;
use App\Services\Admin\BookImageService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class BookImageController extends Controller
{
    public function __construct(private readonly BookImageService $service) {}

    public function store(StoreBookImageRequest $request, Book $book): RedirectResponse
    {
        $this->service->storeMany($book, $request->file('images', []), $request->input('alt_texts', []), $request->integer('primary_image_index') ?: null);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Gambar buku berhasil ditambahkan.']);

        return back();
    }

    public function update(UpdateBookImageRequest $request, Book $book, BookImage $image): RedirectResponse
    {
        $this->ensureOwnership($book, $image);
        $this->service->update($book, $image, $request->safe()->except('image'), $request->file('image'));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Gambar buku berhasil diperbarui.']);

        return back();
    }

    public function reorder(ReorderBookImagesRequest $request, Book $book): RedirectResponse
    {
        $this->service->reorder($book, $request->validated('image_ids'));

        return back();
    }

    public function destroy(Book $book, BookImage $image): RedirectResponse
    {
        $this->ensureOwnership($book, $image);
        $this->service->delete($book, $image);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Gambar buku berhasil dihapus.']);

        return back();
    }

    private function ensureOwnership(Book $book, BookImage $image): void
    {
        abort_unless($image->book_id === $book->id, 404);
    }
}
