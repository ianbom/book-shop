<?php

namespace App\Services\Admin;

use App\Models\Book;
use App\Models\BookImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BookImageService
{
    /**
     * @param  array<int, UploadedFile>  $files
     * @param  array<int, string|null>  $altTexts
     * @return Collection<int, BookImage>
     */
    public function storeMany(Book $book, array $files, array $altTexts = [], ?int $primaryIndex = null): Collection
    {
        return DB::transaction(function () use ($book, $files, $altTexts, $primaryIndex): Collection {
            $nextSortOrder = (int) $book->images()->max('sort_order') + 1;
            $hasPrimary = $book->images()->where('is_primary', true)->exists();

            return collect($files)->map(function (UploadedFile $file, int $index) use ($book, $altTexts, $primaryIndex, $nextSortOrder, &$hasPrimary): BookImage {
                $isPrimary = $primaryIndex === $index || (! $hasPrimary && $index === 0);

                if ($isPrimary) {
                    $book->images()->update(['is_primary' => false]);
                    $hasPrimary = true;
                }

                return $book->images()->create([
                    'image_path' => $this->storeFile($book, $file),
                    'alt_text' => $altTexts[$index] ?? null,
                    'sort_order' => $nextSortOrder + $index,
                    'is_primary' => $isPrimary,
                ]);
            });
        });
    }

    /** @param array{alt_text?: string|null, is_primary: bool} $attributes */
    public function update(Book $book, BookImage $image, array $attributes, ?UploadedFile $file = null): BookImage
    {
        $oldPath = $image->image_path;

        DB::transaction(function () use ($book, $image, $attributes, $file): void {
            if ($attributes['is_primary']) {
                $book->images()->whereKeyNot($image->id)->update(['is_primary' => false]);
            }

            if ($file) {
                $attributes['image_path'] = $this->storeFile($book, $file);
            }

            $image->update($attributes);
        });

        if ($file && $oldPath !== $image->image_path && ! BookImage::withTrashed()->where('image_path', $oldPath)->exists()) {
            Storage::disk('public')->delete($oldPath);
        }

        return $image->refresh();
    }

    /** @param array<int, int> $imageIds */
    public function reorder(Book $book, array $imageIds): void
    {
        $images = $book->images()->whereIn('id', $imageIds)->get()->keyBy('id');

        if ($images->count() !== count($imageIds)) {
            abort(422, 'Urutan gambar tidak valid.');
        }

        DB::transaction(function () use ($imageIds, $images): void {
            foreach ($imageIds as $sortOrder => $imageId) {
                $images[$imageId]->update(['sort_order' => $sortOrder]);
            }
        });
    }

    public function delete(Book $book, BookImage $image): void
    {
        DB::transaction(function () use ($book, $image): void {
            $wasPrimary = $image->is_primary;
            $image->delete();

            if ($wasPrimary) {
                $book->images()->orderBy('sort_order')->first()?->update(['is_primary' => true]);
            }
        });
    }

    private function storeFile(Book $book, UploadedFile $file): string
    {
        return $file->storeAs(
            "books/{$book->slug}",
            Str::ulid().'.'.$file->extension(),
            'public',
        );
    }
}
