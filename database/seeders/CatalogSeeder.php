<?php

namespace Database\Seeders;

use App\Enums\StockMovementType;
use App\Models\Book;
use App\Models\BookStockMovement;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
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

    /** @param array<string, mixed> $data @param array<string, Category> $categories */
    private function book(array $data, array $categories): void
    {
        $genres = $data['genres'];
        $imageUrl = $data['image_url'];
        unset($data['genres'], $data['image_url']);
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
            $book->categories()->sync(collect($genres)->map(fn (string $genre) => $categories[$genre]->id)->all());

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

        if ($imageUrl && ! $book->images()->exists()) {
            $path = "books/{$book->slug}/cover.jpg";
            $response = Http::retry(2, 250)->timeout(20)->get($imageUrl);
            $response->throw();
            if (! Storage::disk('public')->put($path, $response->body())) {
                throw new RuntimeException("Gagal menyimpan cover buku {$book->title}.");
            }
            $book->images()->create([
                'image_path' => $path,
                'alt_text' => "Cover buku {$book->title}",
                'sort_order' => 0,
                'is_primary' => true,
            ]);
        }
    }

    /** @return list<array<string, mixed>> */
    private function books(): array
    {
        $covers = [
            'photo-1543002588-bfa74002ed7e', 'photo-1512820790803-83ca734da794',
            'photo-1521587760476-6c12a4b040da', 'photo-1495446815901-a7297e633e8d',
            'photo-1519682337058-a94d519337bc', 'photo-1532012197267-da84d127e765',
            'photo-1544947950-fa07a98d237f', 'photo-1495640388908-05fa85288e61',
            'photo-1516979187457-637abb4f9353', 'photo-1524995997946-a1c2e315a42f',
            'photo-1531072901881-d644216d4bf9', 'photo-1517842645767-c639042777db',
            'photo-1544716278-ca5e3f4abd8c', 'photo-1512820790803-83ca734da794',
            'photo-1497633762265-9d179a990aa6', 'photo-1513001900722-370f803f498d',
            'photo-1541963463532-d68292c34b19', 'photo-1519681393784-d120267933ba',
            'photo-1476275466078-4007374efbbe', 'photo-1526243741027-444d633d7365',
        ];
        $titles = [
            ['Jejak Senja di Ujung Kota', 'Nadia Pramesti', ['fiksi', 'romansa'], 89000, 24],
            ['Peta Rahasia Negeri Awan', 'Raka Mahendra', ['fantasi'], 115000, 12],
            ['Malam Terakhir di Rumah Tua', 'Dimas Ardhana', ['misteri', 'fiksi'], 98000, 18],
            ['Langit yang Memilih Kita', 'Alya Kirana', ['romansa', 'fiksi'], 92000, 20],
            ['Membangun Produk Digital', 'Bima Satriyo', ['teknologi', 'bisnis'], 145000, 10],
            ['Kebiasaan Kecil, Hasil Besar', 'Sinta Wulandari', ['pengembangan-diri', 'bisnis'], 105000, 16],
            ['Kronik Penjaga Bintang', 'Aruna Wijaya', ['fantasi'], 128000, 9],
            ['Kode di Balik Jendela', 'Fajar Nugraha', ['misteri', 'teknologi'], 110000, 14],
            ['Sebelum Hujan Berhenti', 'Maya Lestari', ['romansa'], 87000, 21],
            ['Dasar-Dasar Pemrograman Modern', 'Reno Aditya', ['teknologi'], 155000, 8],
            ['Strategi Bisnis Sederhana', 'Gita Permata', ['bisnis'], 132000, 11],
            ['Berani Mulai Hari Ini', 'Niken Larasati', ['pengembangan-diri'], 99000, 25],
            ['Perpustakaan Tengah Malam', 'Yusuf Ramadhan', ['fiksi', 'misteri'], 108000, 13],
            ['Pangeran dari Utara', 'Tara Kencana', ['fantasi', 'romansa'], 119000, 15],
            ['Seni Memahami Diri', 'Bagas Prakoso', ['pengembangan-diri'], 101000, 19],
            ['Algoritma untuk Semua', 'Citra Anggraini', ['teknologi'], 139000, 7],
            ['Kopi, Surat, dan Kenangan', 'Rani Oktavia', ['romansa', 'fiksi'], 85000, 22],
            ['Kasus di Balik Kabut', 'Adrian Malik', ['misteri'], 97000, 17],
            ['Pemimpin yang Bertumbuh', 'Dewi Anindita', ['bisnis', 'pengembangan-diri'], 125000, 12],
            ['Taman Rahasia Arcapolis', 'Ilham Fadli', ['fantasi', 'fiksi'], 134000, 10],
        ];

        return collect($titles)->values()->map(function (array $book, int $index) use ($covers): array {
            [$title, $author, $genres, $price, $stock] = $book;
            $slug = Str::slug($title);

            return [
                'title' => $title,
                'slug' => $slug,
                'isbn' => '978602'.str_pad((string) ($index + 1000000), 10, '0', STR_PAD_LEFT),
                'author' => $author,
                'description' => "Sinopsis {$title} karya {$author}.",
                'price' => $price,
                'stock' => $stock,
                'is_active' => true,
                'genres' => $genres,
                'image_url' => "https://images.unsplash.com/{$covers[$index]}?auto=format&fit=crop&w=900&q=85",
            ];
        })->all();
    }
}
