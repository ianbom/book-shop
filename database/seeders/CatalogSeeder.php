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
     * @param  array{title: string, slug: string, isbn: null, author: string, description: string, price: int, shipping_category: string, weight: int, stock: int, sale_type: string, is_active: bool, genres: list<string>, image_file: string}  $data
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
     * @return list<array{title: string, slug: string, isbn: null, author: string, description: string, price: int, shipping_category: string, weight: int, stock: int, sale_type: string, is_active: bool, genres: list<string>, image_file: string}>
     */
    private function books(): array
    {
        $books = [
            ['Cover Buku Anak.jpg.jpeg', 'Hari Ceria di Peternakan', 'Mira Puspita', ['fiksi'], 'Kisah tentang seorang anak yang menghabiskan hari menyenangkan bersama hewan-hewan ternaknya.'],
            ['Cover Buku Anak (1).jpg.jpeg', 'Petualangan di Hutan Pelangi', 'Raka Pratama', ['fantasi', 'fiksi'], 'Dua sahabat menjelajahi hutan penuh warna dan belajar saling membantu.'],
            ['Cover Buku Anak (2).jpg.jpeg', 'Kelinci Kecil yang Pemberani', 'Nadia Larasati', ['fiksi'], 'Seekor kelinci kecil menemukan keberanian saat menolong teman-temannya.'],
            ['Cover Buku Anak (3).jpg.jpeg', 'Rahasia Rumah Pohon', 'Dita Maharani', ['fiksi', 'misteri'], 'Sekelompok sahabat memecahkan teka-teki seru di rumah pohon mereka.'],
            ['Cover Buku Anak (4).jpg.jpeg', 'Gerbang Ajaib Negeri Angka', 'Raka Pratama', ['fantasi', 'pengembangan-diri'], 'Petualangan ajaib mengenalkan angka dan mengajak anak mencintai belajar.'],
            ['Cover Buku Anak (5).jpg.jpeg', 'Sahabat Kecil di Negeri Awan', 'Nadia Larasati', ['fantasi', 'fiksi'], 'Perjalanan ke negeri awan mengajarkan arti persahabatan dan menghargai perbedaan.'],
            ['Cover Buku Anak (6).jpg.jpeg', 'Kucing Baik Hati dan Teman Baru', 'Mira Puspita', ['fiksi'], 'Seekor kucing ramah membantu tetangga kecilnya dan menemukan teman baru.'],
            ['Cover Buku Anak (7).jpg.jpeg', 'Si Penjelajah Cilik dan Laut Biru', 'Dita Maharani', ['fiksi', 'pengembangan-diri'], 'Penjelajah cilik belajar menjaga laut dalam perjalanan penuh kejutan.'],
            ['Cover Buku Anak (8).jpg.jpeg', 'Bintang Kecil dan Mimpi Besar', 'Raka Pratama', ['fantasi', 'pengembangan-diri'], 'Kisah tentang anak yang berani berusaha untuk meraih cita-citanya.'],
            ['Cover Buku Anak (9).jpg.jpeg', 'Pesta Si Ayam Ceria', 'Dita Maharani', ['fiksi'], 'Pesta di halaman menjadi petualangan seru bagi ayam dan teman-temannya.'],
        ];

        $data = [];
        foreach ($books as $index => $book) {
            [$imageFile, $title, $author, $genres, $description] = $book;
            $slug = Str::slug($title);

            $data[] = [
                'title' => $title,
                'slug' => $slug,
                'isbn' => null,
                'author' => $author,
                'description' => $description,
                'price' => 79000 + ($index * 3000),
                'shipping_category' => 'others',
                'weight' => 500,
                'stock' => 10 + ($index % 11),
                'sale_type' => 'ready_stock',
                'is_active' => true,
                'genres' => $genres,
                'image_file' => "kid_books/{$imageFile}",
            ];
        }

        return $data;
    }
}
