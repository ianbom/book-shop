<?php

namespace App\Services\Admin;

use App\Models\Book;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class BookService
{
    public function __construct(
        private readonly BookImageService $images,
        private readonly InventoryService $inventory,
    ) {}

    /** @param array<string, mixed> $data */
    public function create(array $data, User $admin): Book
    {
        /** @var array<int, int> $categoryIds */
        $categoryIds = Arr::pull($data, 'category_ids', []);
        /** @var array<int, UploadedFile> $images */
        $images = Arr::pull($data, 'images', []);
        /** @var array<int, string|null> $altTexts */
        $altTexts = Arr::pull($data, 'image_alt_texts', []);
        $primaryImageIndex = Arr::pull($data, 'primary_image_index');
        $initialStock = (int) Arr::pull($data, 'initial_stock');
        $data['stock'] = $initialStock;

        return DB::transaction(function () use ($data, $categoryIds, $images, $altTexts, $primaryImageIndex, $initialStock, $admin): Book {
            $book = Book::create($data);
            $book->categories()->sync($categoryIds);
            $this->inventory->recordInitial($book, $initialStock, $admin);
            $this->images->storeMany($book, $images, $altTexts, $primaryImageIndex);

            return $book->load(['categories', 'images']);
        });
    }

    /** @param array<string, mixed> $data */
    public function update(Book $book, array $data): Book
    {
        /** @var array<int, int> $categoryIds */
        $categoryIds = Arr::pull($data, 'category_ids', []);

        return DB::transaction(function () use ($book, $data, $categoryIds): Book {
            $book->update($data);
            $book->categories()->sync($categoryIds);

            return $book->load(['categories', 'images']);
        });
    }
}
