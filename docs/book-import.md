# Import Buku Excel

1. Buka **Admin > Buku > Import Excel**, unduh template.
2. Isi sheet **Buku**. Sheet **Petunjuk** dan **Contoh** tidak diimport.
3. Unggah `.xlsx` (maksimal 5 MB / 1.000 buku), periksa tabel pratinjau.
4. Gunakan **Edit** untuk memperbaiki data atau memilih referensi yang mirip/diarsipkan. Koreksi belum menulis data master.
5. Pilih **Simpan Buku Ini**, atau **Simpan Semua** setelah seluruh baris tersisa valid.
6. Ganti sampul placeholder melalui **Edit Buku / Gambar**.

## Format

- Kolom wajib: judul, penulis, harga, stok awal, berat. Preorder juga wajib kode dan estimasi.
- ISBN, SKU, kode preorder: teks, bukan angka Excel; pertahankan angka nol di depan.
- Harga/dimensi: angka tanpa pemisah ribuan atau satuan; berat gram, dimensi cm.
- Kategori: pisahkan dengan titik koma (`Novel; Anak`).
- Jenis penjualan: `Ready Stock` atau `Preorder`; kosong berarti ready stock.
- Estimasi preorder: teks `YYYY-MM` atau `YYYY-MM-DD`, atau tanggal Excel.
- Status aktif: `Ya` / `Tidak`; kosong berarti aktif.
- Formula perlu diganti nilai biasa melalui koreksi. Macro, tautan eksternal, workbook tidak aman ditolak.

## Integritas Data

- SKU, ISBN, atau judul + penulis yang sama dengan buku database/file ditolak; import tidak mengubah buku lama.
- Referensi mengabaikan kapital, spasi, tanda hubung, underscore, dan variasi Unicode NFKC.
- Referensi mirip perlu keputusan admin. Referensi diarsipkan hanya dipulihkan setelah konfirmasi.
- Referensi baru dibuat ketika buku disimpan, bukan saat upload/koreksi.
- Setiap penyimpanan bersifat transaksional; kegagalan membatalkan seluruh buku dalam permintaan tersebut. Pengulangan penyimpanan baris sama tidak menggandakan buku/stok.
- Draf tersimpan sementara pada file cache, terikat admin dan sesi, kedaluwarsa sesuai masa sesi. Jangan gunakan untuk penyimpanan jangka panjang.
- Stok awal, termasuk preorder, dicatat melalui layanan inventori yang sudah ada.

## Deployment

Jalankan migration normal dan build frontend sesuai prosedur deployment. Migration menambah `normalized_key` unik pada kategori/kode preorder serta `books.import_row_key` untuk idempotensi. Migration berhenti sebelum perubahan schema jika referensi lama memiliki normalisasi kosong, terlalu panjang, atau duplikat. Koreksi konflik terlebih dahulu; tidak ada penggabungan/penghapusan otomatis. Tidak memerlukan `migrate:fresh`.

Pastikan direktori file cache dan public storage dapat ditulis. Template: `resources/templates/book-import-template.xlsx`; sampul: `resources/images/book-placeholder.png`.
