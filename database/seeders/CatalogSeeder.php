<?php

namespace Database\Seeders;

use App\Enums\StockMovementType;
use App\Models\Book;
use App\Models\BookStockMovement;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $categories = collect([
            ['name' => 'Fiksi', 'slug' => 'fiksi'],
            ['name' => 'Fantasi', 'slug' => 'fantasi'],
            ['name' => 'Misteri', 'slug' => 'misteri'],
            ['name' => 'Romansa', 'slug' => 'romansa'],
            ['name' => 'Teknologi', 'slug' => 'teknologi'],
            ['name' => 'Bisnis', 'slug' => 'bisnis'],
            ['name' => 'Pengembangan Diri', 'slug' => 'pengembangan-diri'],
        ])->mapWithKeys(fn (array $category) => [$category['slug'] => $this->category($category)])->all();

        foreach ($this->books() as $data) {
            $this->book($data, $categories);
        }
    }

    /** @param array{name: string, slug: string} $data */
    private function category(array $data): Category
    {
        $category = Category::withTrashed()->firstOrNew(['slug' => $data['slug']]);
        $category->fill($data);
        if ($category->exists && $category->trashed()) {
            $category->restore();
        }
        $category->save();

        return $category;
    }

    /**
     * @param  array{title: string, slug: string, isbn: null, author: string, description: string, price: int, stock: int, is_active: bool, genres: list<string>, image_file: string}  $data
     * @param  array<string, Category>  $categories
     */
    private function book(array $data, array $categories): void
    {
        $genres = $data['genres'];
        $imageFile = $data['image_file'];
        unset($data['genres'], $data['image_file']);
        $stock = (int) $data['stock'];

        $book = DB::transaction(function () use ($data, $genres, $categories, $stock): Book {
            $book = Book::withTrashed()->firstOrNew(['slug' => $data['slug']]);
            $new = ! $book->exists;
            $book->fill($data);
            if ($new) {
                $book->stock = $stock;
            }
            if ($book->exists && $book->trashed()) {
                $book->restore();
            }
            $book->save();
            $book->categories()->sync(array_map(fn (string $genre) => $categories[$genre]->id, $genres));

            if ($new && $stock > 0) {
                BookStockMovement::create([
                    'book_id' => $book->id,
                    'type' => StockMovementType::Initial,
                    'quantity' => $stock,
                    'stock_before' => 0,
                    'stock_after' => $stock,
                ]);
            }

            return $book;
        });

        $sourcePath = public_path($imageFile);
        if (! is_file($sourcePath)) {
            throw new RuntimeException("Cover buku tidak ditemukan: {$sourcePath}");
        }

        $imagePath = "books/{$book->slug}/cover.jpeg";
        $disk = Storage::disk('public');
        if (! $disk->exists($imagePath)) {
            $contents = file_get_contents($sourcePath);
            if ($contents === false || ! $disk->put($imagePath, $contents)) {
                throw new RuntimeException("Gagal menyimpan cover buku {$book->title}.");
            }
        }

        $book->images()->update(['is_primary' => false]);
        $book->images()->updateOrCreate(
            ['image_path' => $imagePath],
            [
                'alt_text' => "Cover buku {$book->title}",
                'sort_order' => 0,
                'is_primary' => true,
            ],
        );
    }

    /**
     * @return list<array{title: string, slug: string, isbn: null, author: string, description: string, price: int, stock: int, is_active: bool, genres: list<string>, image_file: string}>
     */
    private function books(): array
    {
        $books = [
            ['1.jpeg', 'Be Awesome, Be Cool', 'Warda Artist', ['pengembangan-diri']],
            ['2.jpeg', 'The World Without You', 'Joshua Henkin', ['fiksi', 'romansa']],
            ['3.jpeg', 'Serenity', 'Steven Knight', ['misteri', 'fiksi']],
            ['4.jpeg', 'The Son', 'Florian Zeller', ['fiksi']],
            ['5.jpeg', 'Esperanza', 'Department of Economics', ['bisnis']],
            ['6.jpeg', 'In the Fire', 'Connor Allyn', ['misteri', 'fiksi']],
            ['7.jpeg', 'Gernika', 'Koldo Serra', ['fiksi']],
            ['8.jpeg', '7 Days', 'Tidak tercantum', ['romansa', 'fiksi']],
            ['9.jpeg', 'Hidden Figures', 'Margot Lee Shetterly', ['teknologi', 'pengembangan-diri']],
            ['10.jpeg', 'What If It Works: Just Do It', 'Tidak tercantum', ['pengembangan-diri']],
            ['11.jpeg', 'Success: Elon Musk', 'Success Media', ['bisnis']],
            ['12.jpeg', 'The Lost City of Z', 'David Grann', ['fiksi', 'misteri']],
            ['13.jpeg', 'Business: Anas Azwar', 'Anas Azwar', ['bisnis']],
            ['14.jpeg', 'The Youngest Billionaire', 'Forbes', ['bisnis']],
            ['15.jpeg', 'Inspire: The Future of Leadership', 'Inspire Magazine', ['bisnis', 'pengembangan-diri']],
            ['16.jpeg', 'Building Multi-Billionaire Start Up', 'Vick Stone', ['bisnis']],
            ['17.jpeg', 'Innovisual: The Best Actor', 'Innovisual', ['teknologi']],
            ['18.jpeg', 'I Was Born With the Devil in Me', 'H. H. Holmes', ['misteri']],
            ['19.jpeg', 'CEO Times: Mauricio Fernandez Piqueras', 'CEO Times', ['bisnis']],
            ['20.jpeg', 'The Moneychanger', 'Federico Veiroj', ['misteri', 'fiksi']],
            ['21.jpeg', 'Stella: A Life', 'Tidak tercantum', ['fiksi']],
            ['22.jpeg', 'Oppenheimer: The Destroyer of Worlds', 'Christopher Nolan', ['teknologi', 'fiksi']],
            ['23.jpeg', 'Maria Stuart', 'Stefan Zweig', ['fiksi', 'romansa']],
        ];

        $data = [];
        foreach ($books as $index => $book) {
            [$imageFile, $title, $author, $genres] = $book;
            $slug = Str::slug($title);

            $data[] = [
                'title' => $title,
                'slug' => $slug,
                'isbn' => null,
                'author' => $author,
                'description' => "Koleksi {$title} karya {$author}.",
                'price' => 79000 + ($index * 3000),
                'stock' => 10 + ($index % 11),
                'is_active' => true,
                'genres' => $genres,
                'image_file' => "boks/{$imageFile}",
            ];
        }

        return $data;
    }
}
