# Import Pesanan Lawas dan Pelunasan Transfer

Tanggal spesifikasi: 29 Oktober 2026.

Status: spesifikasi perubahan yang akan diimplementasikan. Penambahan dokumen ini tidak berarti fitur sudah tersedia. Keputusan bisnis yang sudah disepakati dibedakan dari rancangan teknis dan hal yang masih perlu dikonfirmasi.

## Aturan import Excel terbaru — 3 November 2026

Aturan ini menggantikan ketentuan status dan pengiriman import yang bertentangan di bawah; tidak mengubah checkout website atau pesanan tersimpan.

- Status Excel hanya `processing`, `delivered`, `completed`. `delivered` dipetakan ke `shipping`; admin menyelesaikan manual ke `completed`.
- `delivered`/`completed` wajib alamat dan kode pos teks lima digit pada setiap baris. `total sudah dibayar` wajib sama dengan `harga total` tiap baris; nominal berbeda ditolak. DP tetap informasi.
- Keduanya disimpan lunas dengan snapshot `order_shipping_addresses`, read-only bagi customer, tanpa bukti transfer, shipment, booking, saldo, atau stok fiktif. Ongkir historis tidak dicatat; nilai default nol bukan berarti gratis.
- `processing` boleh tanpa alamat/kode pos. Jika diisi, format tetap divalidasi; nilai asli hanya metadata, tidak dibuat snapshot pengiriman. Customer wajib memilih alamat/pengiriman lalu membayar sisa buku + ongkir melalui alur pelunasan existing.
- Pengecualian admin hanya import original `delivered`, status sekarang `shipping`, paid, snapshot lengkap, outstanding nol, tujuan `completed`. Arsip lama tidak dibuka kembali.

## 1. Tujuan dan Batas Fitur

Admin membutuhkan cara memasukkan pesanan lawas dari Excel beserta customer, buku, kategori, kode preorder (PO), ETA, dan riwayat pembayaran. Customer kemudian dapat melihat pesanan tersebut, memilih pengiriman, dan melunasi sisa tagihan dengan mengunggah bukti transfer langsung pada pesanan.

| Aspek            | Pesanan baru dari website                        | Pesanan lawas hasil import                                      |
| ---------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| Pembuatan        | Keranjang dan checkout                           | Excel, pemeriksaan draf, penyimpanan admin                      |
| Pembayaran       | Saldo wallet, seperti sekarang                   | Pembayaran historis dan pelunasan transfer yang disetujui admin |
| Pemilihan ongkir | Saat checkout                                    | Setelah import, ketika customer menyiapkan pelunasan            |
| Pengurangan stok | Mengikuti checkout yang sudah ada                | Tidak mengurangi stok saat import                               |
| Jenis item       | Ready stock atau preorder sesuai aturan checkout | Seluruh item bertipe preorder                                   |
| Voucher          | Mengikuti fitur website                          | Diskon baris dari Excel; bukan pemakaian voucher baru           |

Fitur ini tidak mengganti checkout wallet, tidak menjadikan transfer sebagai pilihan pembayaran pesanan website, dan tidak mengubah pesanan lama secara massal. Aturan pemisahan ready stock dan kode PO pada checkout website tetap berlaku. Import bukan checkout keranjang; jangan menerapkan pembatasan kelompok checkout kepada data historis tanpa keputusan bisnis tambahan.

## 2. Keputusan Bisnis yang Sudah Disepakati

- Baris dengan kode order sama dalam satu Excel menjadi satu pesanan berisi banyak item.
- Kode order yang sudah ada di database merupakan konflik pemblokir. Admin harus mengganti kode pada draf; import tidak memperbarui atau menggabungkan pesanan database.
- Admin boleh mengedit seluruh hasil pembacaan Excel sebelum menyimpan. Izin memperbarui berlaku pada draf, bukan menimpa pesanan yang sudah ada.
- Nilai harga, diskon, DP, dan pembayaran merupakan nilai masing-masing baris. Nilai tersebut dijumlahkan sesuai kelompok pesanan.
- Total DP hanya informasi historis. Pengurang tagihan adalah total sudah dibayar, bukan DP.
- Pelunasan baru wajib mencakup seluruh sisa harga buku beserta ongkir, bukan cicilan tambahan.
- Bukti transfer baru harus disetujui admin sebelum dihitung sebagai pembayaran.
- Import tidak mengurangi stok dan tidak membuat pergerakan stok keluar.
- Semua item hasil import adalah preorder; kode PO dan ETA berasal dari Excel.
- SKU, ISBN, penulis, dan dimensi boleh kosong. Jangan mengisi nilai fiktif untuk melewati validasi.
- Nama buku yang sama secara ternormalisasi menggunakan satu master buku. Master baru mengambil kode PO dan ETA dari baris pertama yang cocok; metadata PO/ETA master yang sudah ada tidak ditimpa.
- Kode PO dan ETA setiap item pesanan harus disimpan sebagai snapshot, terpisah dari metadata master buku.
- Akun baru menggunakan password awal `customer123`, wajib diganti pada login pertama, tanpa verifikasi email. Password customer yang sudah ada tidak diubah.

## 3. Sumber Excel dan Pemetaan Data

Acuan saat dokumen dibuat adalah `template-order.xlsx`, sheet `Sheet1`, dengan satu baris header dan belum ada contoh data. File sementara Excel `~$template-order.xlsx` bukan template dan tidak boleh diproses.

| Header yang tersedia   | Arti dan tujuan penyimpanan                                  |
| ---------------------- | ------------------------------------------------------------ |
| `kode order`           | Identitas dan kunci pengelompokan pesanan                    |
| `email customer`       | Pencocokan akun pemilik pesanan                              |
| `nama customer`        | Nama akun baru dan informasi draf                            |
| `nama buku`            | Pencocokan master dan snapshot nama item                     |
| `kode PO`              | Referensi PO serta snapshot kode pada item                   |
| `kategori buku`        | Referensi kategori master buku                               |
| `qty`                  | Jumlah buku pada baris                                       |
| `harga satuan`         | Harga historis per buku, bukan otomatis harga master terkini |
| `discount`             | Potongan nominal untuk keseluruhan baris, bukan persentase   |
| `total dp`             | Informasi DP historis per baris                              |
| `total sudah dibayar`  | Pembayaran historis aktual per baris                         |
| `harga total`          | Hasil harga satuan dikali qty dikurangi discount             |
| `eta`                  | Estimasi preorder milik item historis                        |
| `kode pos`             | Kode pos tujuan, diperlakukan sebagai teks                   |
| `alamat`               | Alamat historis untuk diperiksa customer                     |
| `status pesanan`       | Status historis yang perlu dipetakan ke status aplikasi      |
| `berat perbuku (gram)` | Berat satu buku dalam gram, wajib bilangan bulat positif     |

Template belum memiliki nomor telepon, SKU, ISBN, penulis, dan dimensi. Empat atribut buku terakhir boleh null. Nomor telepon serta kelengkapan alamat yang diperlukan pengiriman harus dilengkapi customer sebelum meminta tarif atau mengajukan pembayaran.

Rancangan validasi: kode order, email, nama customer, nama buku, kode PO, kategori, qty, nominal, ETA, dan berat harus cukup untuk membentuk pesanan valid. Qty berupa bilangan bulat positif; berat positif; nominal tidak negatif; diskon tidak melebihi harga satuan dikali qty. Nominal kosong tidak boleh diam-diam dianggap nol tanpa aturan template yang jelas. Nilai nol ditulis eksplisit pada contoh template.

Header wajib yang hilang, email tidak valid, tanggal ambigu, angka tidak valid, serta konflik data ditampilkan sebagai kesalahan, bukan dibetulkan dengan tebakan. Formula Excel tidak dieksekusi oleh aplikasi; hasil yang tidak dapat dibaca dengan aman perlu dikoreksi menjadi nilai literal. Kolom yang tidak didukung tidak boleh dibuang diam-diam: tampilkan pemberitahuan.

Hanya `berat perbuku (gram)` yang digunakan. Kolom lama tidak didukung dan tidak menjadi fallback; file tanpa header gram ditolak. Total berat dihitung dari berat gram per buku dikalikan qty.

## 4. Alur Admin dari Upload sampai Tersimpan

### 4.1 Menyiapkan dan mengunggah Excel

1. Admin membuka menu import pesanan, terpisah dari import master buku yang sudah ada.
2. Halaman menyediakan template, petunjuk kolom, contoh nominal, serta penjelasan perbedaan DP dan pembayaran.
3. Admin mengunggah file XLSX. Sistem memeriksa hak akses, tipe file, ukuran, jumlah baris, dan struktur header.
4. Sistem membaca file melalui OpenSpout yang sudah terpasang, tanpa menambahkan dependency hanya untuk fungsi pembacaan ini.
5. Hasil pembacaan disimpan sebagai draf sementara yang terikat admin dan sesi. Belum ada akun, master, pesanan, stok, atau pembayaran bisnis yang dibuat.

### 4.2 Halaman hasil import

Setelah upload, admin masuk ke halaman baru berisi tabel hasil import, bukan langsung kembali ke daftar pesanan. Halaman menampilkan nomor baris sumber, seluruh data yang dapat diperiksa, kelompok kode order, jumlah item, total buku, DP, pembayaran historis, sisa buku, berat gabungan, dan kesalahan.

Tampilkan penanda data yang akan dibuat, data master yang digunakan kembali, konflik kode order database, kecocokan referensi yang meragukan, dan status simpan. Ongkir pada tahap ini ditampilkan sebagai "Belum dipilih", bukan "Gratis".

Admin dapat membuka modal untuk mengedit seluruh kolom draf. Validasi ulang dilakukan di server; perubahan kode order mengelompokkan ulang baris, sedangkan perubahan qty, berat, harga, diskon, atau pembayaran menghitung ulang ringkasan. Nilai turunan ditampilkan sebagai hasil perhitungan, bukan angka bebas yang dapat menyimpang dari sumbernya.

### 4.3 Pengelompokan dan konflik

- Kode sama dalam file berarti satu pesanan. Kesamaan baris tidak otomatis berarti duplikat yang boleh dihapus; admin tetap harus memeriksanya.
- Satu kelompok harus memiliki satu customer. Email berbeda pada kode sama memblokir kelompok tersebut sampai diperbaiki atau dipisahkan melalui penggantian kode.
- Alamat atau status yang bertentangan dalam kelompok juga memerlukan koreksi; jangan mengambil baris pertama tanpa pemberitahuan.
- Kode yang sudah tersimpan di database tidak boleh digunakan untuk pesanan import baru, termasuk jika pesanan lama dibuat oleh admin yang sama.
- Setelah admin mengubah kode, sistem memeriksa ulang konflik pada draf dan database. Pemeriksaan diulang ketika commit, bukan hanya saat preview.

### 4.4 Menyimpan hasil pemeriksaan

Rancangan interaksi: sediakan "Simpan pesanan ini" dan "Simpan semua pesanan valid". Unit penyimpanan adalah satu kelompok order lengkap, bukan satu baris item dalam kelompok. Dengan demikian ongkir, pembayaran, dan total tidak terpecah karena admin menyimpan sebagian buku.

Setiap kelompok disimpan dalam transaksi tersendiri: akun yang diperlukan, referensi, master baru, order, item, snapshot, dan riwayat awal berhasil bersama atau dibatalkan bersama. Aksi semua memproses kelompok valid, melewati kelompok bermasalah, lalu menampilkan hasil per kelompok. Kelompok gagal tetap dapat dikoreksi; kelompok berhasil tidak dapat diedit ulang melalui draf.

Gunakan identitas draf dan kelompok yang stabil, penguncian, serta constraint unik untuk mencegah penyimpanan berulang dan konflik serentak. Master bersama hanya dihapus lewat rollback transaksi yang membuatnya, bukan melalui pembersihan yang dapat merusak hasil kelompok lain.

Draf kedaluwarsa menampilkan pesan yang jelas dan meminta upload ulang. Jangan menjanjikan draf sebagai arsip permanen. Simpan metadata audit hasil commit agar pesanan dapat ditelusuri ke file, kelompok, nomor baris, dan admin pengimpor tanpa mempertahankan file berisi data pribadi selamanya.

## 5. Akun dan Master Data

### 5.1 Customer

Email dinormalisasi untuk pencocokan agar perbedaan kapital tidak membuat akun baru. Jika customer sudah ada, gunakan akun tersebut tanpa mereset password atau menimpa profil diam-diam. Akun baru dibuat sebagai customer, password di-hash, dan ditandai wajib mengganti password.

Email yang terkait akun admin, akun terhapus, atau identitas yang ambigu harus menghasilkan konflik untuk pemeriksaan, bukan perubahan role, pemulihan akun, maupun reset password otomatis. Tidak ada pengiriman password atau notifikasi massal sebagai efek samping import tanpa rancangan tambahan.

Password bersama memiliki risiko akses oleh pihak yang mengetahui email customer. Wajib ganti password adalah keputusan yang sudah dipilih, bukan bukti verifikasi kepemilikan email. Terapkan rate limit login dan jangan mengekspos password hash, daftar kredensial, atau data customer melalui halaman publik.

### 5.2 Buku, kategori, dan kode PO

Gunakan kembali normalisasi referensi yang sudah tersedia pada `app/Support/BookReferenceName.php`. Perbedaan kapital tidak membentuk referensi berbeda. Kemiripan yang tidak identik tidak boleh otomatis digabung; admin memilih referensi yang benar atau mengoreksi namanya. Referensi terarsip tidak dipulihkan diam-diam.

Pencocokan nama buku menggunakan normalisasi yang konsisten. Jika beberapa master sudah cocok, minta penyelesaian konflik di draf. Master baru menggunakan placeholder gambar yang tersedia, tipe preorder, dan atribut nullable sesuai data. Harga historis tetap disimpan pada item, bukan dibaca ulang dari harga katalog untuk menagih customer.

Master yang sama boleh dipakai beberapa item dengan PO/ETA historis berbeda. Simpan snapshot nama, harga, qty, berat, diskon, PO, dan ETA pada masing-masing item. Perubahan master setelah import tidak boleh mengubah riwayat, filter PO, ETA, ongkir, atau nominal pesanan tersebut.

Import tidak memanggil pengurangan stok maupun membuat stok awal dari qty pesanan. Stok awal dan status publikasi master baru masih perlu dikonfirmasi; keduanya bukan alasan menambahkan persediaan fiktif.

## 6. Perhitungan Harga, DP, dan Sisa Tagihan

Untuk setiap baris:

```text
nilai_kotor_baris = harga_satuan * qty
total_baris = nilai_kotor_baris - discount
harga_total_excel harus sama dengan total_baris
```

Untuk satu pesanan:

```text
total_buku = jumlah(total_baris)
total_dp_historis = jumlah(total_dp)
pembayaran_historis = jumlah(total_sudah_dibayar)
pembayaran_transfer_disetujui = jumlah(pembayaran baru berstatus approved)
sisa_buku_awal = total_buku - pembayaran_historis
total_tagihan = total_buku + ongkir_terpilih
sisa_tagihan = total_tagihan - pembayaran_historis - pembayaran_transfer_disetujui
```

DP tidak muncul sebagai pengurang. Diskon Excel tidak dipotong lagi sebagai voucher. Pembayaran historis tidak dibuat sebagai top-up maupun debit wallet. Gunakan representasi nominal eksak mengikuti presisi database, bukan floating-point untuk perhitungan keuangan.

| Total buku | Total DP | Sudah dibayar | Sisa buku sebelum ongkir |
| ---------- | -------- | ------------- | ------------------------ |
| Rp120.000  | Rp50.000 | Rp0           | Rp120.000                |
| Rp120.000  | Rp50.000 | Rp80.000      | Rp40.000                 |

Contoh dua baris dengan kode `LAWAS-001`:

| Baris | Harga satuan | Qty | Discount | Total baris | DP       | Sudah dibayar | Berat per buku |
| ----- | ------------ | --- | -------- | ----------- | -------- | ------------- | -------------- |
| 1     | Rp60.000     | 2   | Rp10.000 | Rp110.000   | Rp50.000 | Rp80.000      | 300 gram       |
| 2     | Rp50.000     | 1   | Rp5.000  | Rp45.000    | Rp20.000 | Rp10.000      | 500 gram       |

Hasil: satu pesanan, tiga eksemplar, total buku Rp155.000, DP Rp70.000, pembayaran historis Rp90.000, sisa buku Rp65.000, dan berat 1.100 gram. Jika ongkir terpilih Rp20.000, customer melunasi Rp85.000. Persetujuan pembayaran tersebut menghasilkan total pembayaran Rp175.000 dan sisa nol.

Jika harga total Excel tidak cocok dengan rumus, tampilkan keduanya dan minta koreksi. Kelebihan pembayaran historis tidak boleh disembunyikan dengan memaksa sisa menjadi nol; tandai untuk penanganan sesuai keputusan bisnis yang belum ditetapkan.

## 7. Alur Customer setelah Import

1. Customer login. Customer baru memakai password awal, lalu diarahkan ke halaman wajib ganti password sebelum dashboard atau pesanan dapat diakses.
2. Customer lama tetap menggunakan kredensialnya. Tidak ada kewajiban mengganti password akibat import jika akunnya tidak dibuat oleh proses ini.
3. Customer membuka daftar dan detail pesanan miliknya. Tampilkan label pesanan import, item, kode PO, ETA bulan/tahun, status pesanan, status pembayaran, dan status pengiriman secara terpisah.
4. Rincian tagihan menampilkan harga, qty, diskon, total buku, DP informasional, pembayaran historis, pembayaran baru yang disetujui, ongkir, dan sisa tagihan.
5. Customer memeriksa alamat historis, memilih atau melengkapi alamat tujuan, kode pos, penerima, dan kontak yang diperlukan.
6. Sistem meminta tarif berdasarkan seluruh item pesanan, bukan keranjang customer saat ini. Customer memilih ekspedisi dan layanan untuk satu pesanan gabungan.
7. Sistem menampilkan nominal pelunasan akhir. Customer membayar seluruh sisa beserta ongkir ke rekening tujuan yang ditampilkan aplikasi, kemudian mengunggah bukti transfer.
8. Pesanan menampilkan status menunggu pemeriksaan. Saldo wallet tidak didebit maupun dikreditkan; bukti pending belum mengurangi tagihan.
9. Jika ditolak, customer melihat alasan lalu mengajukan bukti kembali. Bukti lama dipertahankan sebagai riwayat, bukan ditimpa.
10. Jika disetujui, pembayaran tercatat sekali, sisa dihitung ulang, dan pesanan ditandai lunas apabila seluruh tagihan telah terpenuhi. Proses pemenuhan tetap mengikuti kesiapan preorder.

Middleware wajib ganti password harus melindungi akses server, bukan sekadar menyembunyikan menu. Tetap izinkan halaman/aksi perubahan password dan logout. Perubahan password yang berhasil mencabut penanda wajib ganti; alur reset password perlu menangani penanda tersebut secara konsisten setelah password baru yang valid disimpan.

## 8. Pengiriman dan Pemeriksaan Bukti oleh Admin

### 8.1 Ongkir

Saat import, ongkir belum dihitung dan belum ada booking pengiriman. Biaya nol pada schema lama tidak cukup untuk membedakan "Belum dipilih" dari layanan gratis; diperlukan status pemilihan pengiriman atau penanda setara.

Berat adalah jumlah qty dikali berat per buku dari snapshot item. Dimensi yang tidak tersedia tidak diisi ukuran palsu; jika layanan tertentu memerlukannya, minta pelengkapan sebelum tarif dapat dipakai. Gunakan kembali transport/API tarif yang tersedia dengan pemetaan item pesanan khusus.

Tarif dan layanan diverifikasi di server sebelum pengajuan bukti. Jangan mempercayai nominal ongkir dari browser. Perubahan alamat, layanan, atau isi tagihan membatalkan pilihan tarif lama dan memerlukan perhitungan ulang sebelum pengajuan.

### 8.2 Review pembayaran

Admin membuka detail pesanan atau daftar pemeriksaan untuk melihat bukti, pemilik pesanan, nominal pelunasan, riwayat pembayaran, dan pilihan pengiriman. Admin menyetujui atau menolak dengan alasan yang terlihat pada customer.

Rancangan status pengajuan adalah `pending`, `approved`, dan `rejected`, terpisah dari status pesanan dan pengiriman. Batasi satu pengajuan pending per pesanan. Pengajuan hanya tersedia pada pesanan import yang memenuhi syarat pembayaran, bukan pesanan batal atau pesanan website.

Selama pengajuan pending, kunci perubahan alamat, layanan, ongkir, dan nominal terkait agar bukti diperiksa terhadap tagihan yang sama. Persetujuan memeriksa ulang status dan nominal di bawah row lock, lalu mencatat pembayaran serta perubahan status dalam satu transaksi. Klik persetujuan berulang tidak boleh menambah pembayaran lagi.

Bukti ditolak tidak menambah pembayaran. Bukti disetujui tidak dapat dihapus atau diedit untuk menghilangkan jejak transaksi. Koreksi, pembatalan, dan refund transfer memerlukan kebijakan tersendiri; jangan mengembalikannya otomatis ke wallet.

Jika buku sudah lunas secara historis tetapi ongkir belum dipilih, masih diperlukan penyelesaian pengiriman. Jika setelah pengiriman dipilih sisa benar-benar nol, jangan meminta transfer Rp0; mekanisme konfirmasi tanpa pembayaran baru harus dicatat sebagai kasus yang perlu ditetapkan sebelum implementasi pembayaran.

## 9. Perubahan Database dan Kontrak Data

Berikut rancangan kebutuhan data, bukan pernyataan bahwa kolomnya sudah dibuat. Nama final mengikuti konvensi proyek; jangan menduplikasi atribut yang sudah tersedia.

| Area                | Kondisi saat ini / kebutuhan perubahan                                                                                                                                                                                                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `orders`            | Sudah memiliki kode unik, user, subtotal, voucher discount, shipping cost, total, wallet amount, serta status. Tambahkan pembedaan asal/metode pembayaran, identitas import idempoten, ringkasan historis atau sumber agregasinya, serta status pemilihan pengiriman. `wallet_amount` import tidak diisi nilai transfer historis. |
| `order_items`       | Sudah memiliki snapshot nama, harga, qty, berat, dimensi, ISBN, penulis, sale type, subtotal, dan ETA. Tambahkan snapshot kode PO, diskon baris, DP historis, pembayaran historis, dan identitas baris sumber yang belum tersedia.                                                                                                |
| `users`             | Tambahkan penanda wajib ganti password; pertahankan role dan kredensial akun lama.                                                                                                                                                                                                                                                |
| `books`             | Audit nullable penulis/SKU/ISBN/dimensi pada schema dan validasi. Tipe preorder ditetapkan untuk master baru hasil import; master existing tidak diubah menjadi preorder secara diam-diam.                                                                                                                                        |
| Referensi           | Gunakan kategori, kode PO, pivot kategori buku, dan normalisasi unik yang sudah ada.                                                                                                                                                                                                                                              |
| Pembayaran langsung | Perlu record pengajuan berelasi ke order dengan pengunggah, nominal, lokasi bukti, status review, reviewer, waktu review, alasan, serta identitas idempoten. Riwayat historis Excel dan pembayaran baru tetap dapat dibedakan.                                                                                                    |
| Pengiriman          | Gunakan snapshot alamat dan data layanan yang sudah ada; pastikan tarif untuk pesanan import belum berarti shipment sudah dipesan.                                                                                                                                                                                                |
| Audit               | Catat admin import, asal baris/kelompok, perubahan status, dan keputusan pembayaran.                                                                                                                                                                                                                                              |

Total historis di order, jika disimpan sebagai ringkasan, wajib konsisten dengan item. Pembayaran approved memiliki satu sumber kebenaran; jangan menjumlahkan riwayat yang sama melalui dua tabel atau dua jenis agregat.

Gunakan migration tambahan non-destruktif. Pesanan lama diberi default asal website dan tetap memakai aturan wallet semula. Indeks/constraint melindungi kode order dan idempotensi. Jangan menghapus tabel, menulis ulang migration yang sudah terpasang, atau menjalankan `migrate:fresh` pada database aktif.

## 10. Perubahan Backend, Frontend, dan API

### 10.1 Import admin

- Acuan pola existing: `app/Services/Admin/BookImportService.php`, `app/Http/Controllers/Admin/BookImportController.php`, dan `resources/js/pages/admin/books/import.tsx`.
- Tambahkan service, controller, request, route, serta halaman import pesanan yang terpisah. Reuse utilitas normalisasi dan placeholder, bukan alur inventory import buku.
- Endpoint diperlukan untuk unduh template, upload draf, baca hasil berpaginasi, koreksi draf, simpan satu kelompok, dan simpan seluruh kelompok valid.
- Respons draf memuat ID stabil, nomor baris, data mentah yang relevan, nilai tervalidasi, pesan error per field/baris/kelompok, ringkasan, dan hasil commit.
- Route import ditempatkan sebelum route parameter order bila pola URL dapat bertabrakan. Semua aksi hanya untuk admin dan memvalidasi kepemilikan draf.

### 10.2 Pelunasan dan pengiriman customer

- Tambahkan endpoint milik customer untuk tarif pesanan import, pemilihan pengiriman, pengajuan bukti, dan akses bukti yang diizinkan.
- `app/Services/Customer/BiteshipRates.php` saat ini membentuk payload dari relasi buku. Tambahkan pemetaan dari snapshot item order; jangan mengambil harga/berat historis dari master terkini.
- `app/Services/Customer/CheckoutService.php` tetap menjadi alur wallet website; jangan mengubahnya menjadi layanan pembayaran campuran.
- Semua endpoint memeriksa kepemilikan order, asal pesanan, status, kelengkapan alamat, nominal server, dan status pengajuan.

### 10.3 Bukti dan persetujuan admin

- `app/Services/Admin/PaymentProofService.php` saat ini menunjukkan upload bukti oleh admin ke public storage dan penghapusan record; itu belum merupakan workflow persetujuan transfer customer.
- Source yang diperiksa merujuk `App\Models\PaymentProof`, tetapi file model tersebut tidak ditemukan pada daftar file saat penyusunan. Audit konsistensi model, relasi, migration, dan route sebelum memperluas fitur; jangan menganggap modul bukti existing sudah lengkap.
- Tambahkan atau lengkapi penyimpanan pengajuan dan ledger pembayaran yang sesuai. Pisahkan bukti historis/admin dari pengajuan customer jika memakai tabel yang sama agar record lama tidak otomatis dianggap pembayaran approved.
- Tambahkan request/aksi review dan resource dengan nominal, status, reviewer, alasan, serta riwayat. Bukti baru disimpan privat dan diakses melalui authorization, bukan URL publik langsung.

### 10.4 Halaman dan tipe frontend

- Admin: menu dan halaman review import baru; daftar/detail order menampilkan asal, tagihan historis, snapshot PO/ETA, status pengiriman, serta pemeriksaan bukti.
- Customer: `resources/js/pages/customer/dashboard/orders/index.tsx` dan `resources/js/pages/customer/dashboard/orders/show.tsx` menampilkan rincian import dan aksi pelunasan yang sesuai status.
- Tambahkan halaman wajib ganti password, tampilan pemilihan pengiriman, unggah bukti, status pending, alasan penolakan, dan riwayat pembayaran. Reuse komponen form/modal yang ada.
- Sesuaikan resource backend, `resources/js/types/admin.ts`, dan tipe customer yang relevan agar nullable serta status baru konsisten. Cegah double submit di UI tanpa menjadikannya satu-satunya pengaman.
- Filter kode PO dan ETA order membaca snapshot item. Master yang diedit kemudian tidak boleh mengubah hasil pencarian riwayat import. ETA daftar tetap bulan/tahun dan memakai estimasi item terdekat sesuai pola yang sudah diminta.
- Pertahankan tampilan responsif, label wajib, placeholder yang membantu, pesan validasi, navigasi keyboard, dan akses modal.

### 10.5 Titik integrasi yang wajib diaudit

`app/Services/Admin/OrderStatusService.php` dan `app/Services/Customer/Dashboard/OrderCancellationService.php` perlu membedakan wallet dari transfer serta stok yang benar-benar pernah dikurangi. Pembatalan pesanan import tidak boleh membuat restock fiktif atau memanggil refund wallet untuk pembayaran transfer.

Audit pula perubahan ongkir admin, status pembayaran manual, booking shipment, pemenuhan preorder, daftar dashboard, dan laporan penjualan. Lunas secara historis atau melalui transfer tidak boleh membuat layanan yang mengharapkan debit wallet gagal. Status historis tidak boleh otomatis memesan shipment atau mengarang nomor resi.

## 11. Keamanan dan Konsistensi

- Validasi file berdasarkan konten dan ekstensi yang diizinkan; batasi ukuran dan baris menggunakan pola import existing. Jangan menjalankan macro, formula, atau URL yang berasal dari Excel.
- Pisahkan draf per admin dan sesi; gunakan lock dan masa kedaluwarsa. Jangan memasukkan email, alamat lengkap, password, atau bukti transfer ke log umum.
- Validasi MIME dan ukuran bukti, gunakan nama file yang dibuat server, dan batasi akses pemilik/admin. Kebijakan retensi bukti dan file import perlu ditetapkan.
- Terapkan authorization pada semua aksi server, termasuk unduh bukti dan pencarian tarif. ID order atau draf yang diketahui bukan izin akses.
- Commit dan approval memakai transaksi, row lock, constraint unik, dan validasi ulang. Bersihkan file yatim hanya jika terbukti milik operasi gagal tersebut.
- Gunakan kembali dependency dan pola proyek. Tidak ada payment gateway, integrasi bank otomatis, atau dependency baru yang diwajibkan fitur ini.

## 12. Skenario Pengujian dan Kriteria Penerimaan

| Area             | Skenario yang harus terbukti                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Upload           | Header/tipe/ukuran salah ditolak; workbook valid membuka review tanpa membuat data bisnis.                                                     |
| Draf             | Semua field sumber dapat dikoreksi; error, grouping, total, dan berat dihitung ulang di server; admin lain tidak dapat mengakses draf.         |
| Grouping         | Kode sama dalam file membentuk satu order; email/alamat/status bertentangan memblokir kelompok.                                                |
| Konflik database | Kode existing tidak ditimpa; mengganti kode menghilangkan konflik; dua commit serentak tidak membuat duplikat.                                 |
| Penyimpanan      | Simpan satu berarti seluruh item kelompok; simpan semua melaporkan hasil setiap kelompok; retry tidak menggandakan hasil.                      |
| Referensi        | Perbedaan kapital memakai referensi sama; kecocokan ambigu dan referensi terarsip memerlukan keputusan eksplisit.                              |
| Master/snapshot  | Judul sama menggunakan satu master; PO/ETA pertama berlaku pada master baru; master existing dan snapshot order lain tidak berubah.            |
| Nullable         | SKU, ISBN, penulis, dimensi kosong diterima di alur yang disesuaikan tanpa nilai fiktif.                                                       |
| Nominal          | Dua contoh DP dan contoh dua baris pada bagian 6 benar; diskon hanya sekali; mismatch harga total diblokir; nominal menggunakan presisi eksak. |
| Akun             | Email existing digunakan kembali tanpa reset; akun baru ter-hash dan wajib ganti password; endpoint order terblokir sebelum penggantian.       |
| Stok             | Import, pelunasan, dan pembatalan import tidak menciptakan stok keluar/masuk tanpa transaksi stok asal.                                        |
| Ongkir           | Satu order memakai berat gabungan snapshot; cart tidak memengaruhi tarif; belum dipilih bukan gratis; tarif browser palsu ditolak.             |
| Pembayaran       | Pelunasan parsial ditolak; pending/rejected tidak menambah paid; approval tepat sekali; bukti tidak dapat diakses customer lain.               |
| Konsistensi      | Perubahan tagihan saat pending ditolak; bukti approved tidak dapat dihapus untuk menghilangkan pembayaran.                                     |
| Regresi          | Checkout website tetap memotong wallet/stok sebagaimana semula, menjaga voucher, batas kode PO, dan refund berbasis ledger.                    |
| UI               | Review, modal koreksi, detail pesanan, unggah bukti, dan approval dapat dipakai pada desktop/mobile dengan keyboard.                           |

Pengujian memakai database terisolasi dan mock tarif/pengiriman. Tidak mengirim pembayaran, email massal, atau booking nyata. Jalankan test terfokus, typecheck, lint/static analysis, build terisolasi, dan pemeriksaan browser sebelum menyatakan implementasi selesai. Kegagalan bawaan codebase dilaporkan terpisah, bukan diperbaiki di luar scope.

## 13. Hal yang Belum Diputuskan

Bagian ini bukan persetujuan bisnis. Keputusan berikut perlu dikunci sebelum mengimplementasikan cabang terkait:

1. Kolom berat final: hanya `berat perbuku (gram)`, tanpa fallback kolom lama.
2. Format input ETA serta pemetaan `status pesanan`, termasuk order historis yang sudah terkirim, selesai, atau batal. Tanggal Excel dan teks ambigu tidak boleh ditebak.
3. Stok awal, harga katalog, dan status publikasi master baru. Rekomendasi aman adalah tidak menambah stok atau mempublikasikan buku sebelum data katalog dinyatakan layak.
4. Kelebihan pembayaran historis serta kasus tagihan nol setelah ongkir dipilih; jangan menciptakan kredit wallet atau transfer nol otomatis.
5. Pembatalan dan refund transfer/historis: pihak yang berwenang, kanal pengembalian, pencatatan, dan dampak status. Sampai diputuskan, jangan mengaktifkan refund otomatis untuk sumber tersebut.
6. Sumber rekening tujuan, aturan file bukti/retensinya, serta cara menyampaikan akses awal customer. Gunakan konfigurasi yang sudah tersedia jika mencukupi; jangan mengarang rekening atau mengirim kredensial massal.

## 14. Urutan Implementasi dan Rollout

1. Kunci format template dan keputusan pada bagian 13; audit schema/model existing serta buat fixture contoh dari workbook tanpa mengubah file sumber pengguna.
2. Tambahkan migration kompatibel, penanda asal, snapshot yang kurang, data pembayaran, serta kontrak resource/tipe. Pertahankan perilaku default pesanan website.
3. Implementasikan pembacaan Excel, draf, koreksi, grouping, validasi, deduplikasi master, commit transaksional, dan halaman hasil import.
4. Tambahkan pembuatan customer dan kewajiban ganti password, lalu uji akses akun baru maupun lama.
5. Implementasikan tarif dari snapshot order, pemilihan pengiriman, pelunasan transfer, bukti privat, serta approval/rejection yang idempoten.
6. Sesuaikan detail/daftar order, filter PO/ETA, status, pembatalan/inventory/refund guard, dan pemenuhan pesanan tanpa mengubah checkout wallet.
7. Jalankan seluruh kriteria penerimaan, dokumentasikan hasil dan celah validasi, lalu lakukan deployment melalui migration normal setelah backup dan pemeriksaan kompatibilitas.

Template distribusi nantinya disediakan di codebase untuk diunduh admin, dengan contoh dan petunjuk. `template-order.xlsx` milik pengguna tetap menjadi acuan input; dokumen ini tidak mengubah workbook tersebut. Pantau kegagalan import, konflik, pengajuan pending, dan approval dengan identitas audit non-sensitif, bukan isi lengkap data pribadi.

Fitur dianggap siap setelah alur admin sampai customer terbukti, data historis tidak berubah akibat perubahan master, import tidak mengganggu stok, pembayaran tidak dihitung ganda, dan checkout wallet lama tetap lulus regresi. Dokumen ini sendiri hanya menambahkan spesifikasi; tidak menjalankan migration ataupun mengaktifkan fitur.
