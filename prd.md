# PRD — Wonder Book E-Commerce

## 1. Document Information

**Product Name:** Wonder Book  
**Document Type:** Product Requirements Document (PRD)  
**Platform:** Web Application  
**Primary Stack:** Laravel, Inertia.js, React, TypeScript, Tailwind CSS, shadcn/ui, MySQL  
**Primary Roles:** Admin, Customer  
**Architecture Type:** Single-store e-commerce  
**Authentication:** Admin only  
**Customer Account:** Not required  
**Payment Flow:** Manual via WhatsApp  
**Order Model:** One book type per order, multiple quantity allowed  
**Last Updated:** September 2, 2026

---

# 2. Product Overview

Wonder Book adalah website e-commerce buku sederhana yang berfokus pada katalog buku, pemesanan tanpa login, komunikasi transaksi melalui WhatsApp, dan tracking pesanan menggunakan kode order.

Website dirancang untuk satu toko buku dan tidak menggunakan konsep tenant atau multi-store.

Customer tidak perlu membuat akun. Customer cukup memilih sebuah buku, menentukan jumlah buku yang ingin dibeli, mengisi data diri dan alamat, kemudian membuat pesanan.

Setelah pesanan berhasil dibuat, sistem menghasilkan kode order unik dan customer diarahkan ke WhatsApp admin untuk melanjutkan komunikasi pembayaran.

Customer dapat menggunakan kode order untuk mengecek perkembangan pesanan tanpa perlu login.

Admin memiliki dashboard terproteksi untuk mengelola buku, kategori, stok, pesanan, pembayaran, dan perubahan status pesanan.

---

# 3. Product Goals

Tujuan utama produk:

1. Menyediakan katalog buku yang mudah dijelajahi.
2. Memungkinkan customer membeli buku tanpa registrasi atau login.
3. Menyederhanakan proses checkout.
4. Menghubungkan order website dengan komunikasi WhatsApp.
5. Memberikan kode order unik untuk setiap transaksi.
6. Menyediakan sistem tracking order tanpa akun customer.
7. Memudahkan admin mengelola buku, kategori, stok, pembayaran, dan pesanan.
8. Menyimpan histori perubahan status pesanan.
9. Menyimpan histori perubahan stok.
10. Menjaga histori transaksi tetap konsisten walaupun data buku berubah di masa depan.

---

# 4. Non-Goals

Fitur berikut tidak termasuk dalam scope awal:

- Login customer
- Registrasi customer
- Customer dashboard
- Customer profile
- Wishlist
- Shopping cart multi-product
- Multi-store
- Multi-tenant
- Marketplace
- Seller dashboard
- Payment gateway
- Upload bukti pembayaran oleh customer melalui website
- Live chat internal
- Voucher
- Coupon
- Loyalty point
- Product review
- Product rating
- Checkout multi-book
- Shipping API integration
- Automatic shipping fee calculation
- Automatic payment verification
- Inventory multi-warehouse

---

# 5. User Roles

## 5.1 Customer

Customer tidak memiliki akun.

Customer dapat:

- membuka website
- melihat katalog buku
- mencari buku
- melihat kategori
- membuka detail buku
- melihat stok buku
- memilih jumlah buku
- melakukan checkout
- mengisi data diri
- membuat order
- mendapatkan kode order
- diarahkan ke WhatsApp admin
- melakukan pembayaran secara manual
- mengirim bukti pembayaran melalui WhatsApp
- mengecek status order menggunakan kode order

Customer tidak dapat:

- login
- register
- melihat order lain
- membeli lebih dari satu jenis buku dalam satu order
- mengubah status pesanan
- mengubah informasi pembayaran

---

## 5.2 Admin

Admin memiliki akun dan harus login.

Admin dapat:

- login ke dashboard
- logout
- melihat dashboard
- mengelola buku
- mengelola gambar buku
- mengelola kategori
- mengelola stok
- melihat seluruh order
- mencari order
- memfilter order
- melihat detail order
- melihat data customer dari order
- mengubah status order
- mengelola status pembayaran
- upload bukti pembayaran
- melihat histori perubahan status
- melihat histori perubahan stok
- mengubah informasi toko

---

# 6. Core Business Rules

## 6.1 Single Store

Website hanya memiliki satu toko.

Tidak ada:

- tenant
- tenant_id
- store_id pada setiap resource
- konsep multi-store

---

## 6.2 Customer Without Account

Customer tidak memiliki akun.

Data customer disimpan sebagai snapshot pada tabel `orders`.

Data customer meliputi:

- nama
- nomor WhatsApp
- email
- alamat
- catatan opsional

---

## 6.3 One Book Type Per Order

Satu order hanya dapat memiliki satu jenis buku.

Contoh valid:

```text
Atomic Habits × 1
Atomic Habits × 3
Atomic Habits × 10
```

Contoh tidak valid:

```text
Atomic Habits × 1
Clean Code × 2
```

Karena aturan tersebut:

- tidak diperlukan tabel `order_items`
- tidak diperlukan cart multi-product
- order langsung berelasi dengan satu `book_id`
- quantity dapat lebih dari satu

---

## 6.4 Book Snapshot

Order harus menyimpan snapshot informasi buku.

Field snapshot:

- book_title
- book_isbn
- book_author
- unit_price

Tujuan:

Jika admin mengubah:

- judul
- ISBN
- author
- harga

maka transaksi lama tetap menampilkan data buku pada saat transaksi dilakukan.

---

## 6.5 Customer Snapshot

Data customer tersimpan langsung di order.

Order tidak bergantung pada tabel customer.

Hal ini penting karena:

- customer tidak login
- tidak ada customer account
- alamat customer pada transaksi lama tidak boleh berubah apabila data customer berbeda pada transaksi berikutnya

---

# 7. Customer Journey

## 7.1 Browse Catalog

Flow:

```text
Home
↓
Catalog
↓
Book Detail
↓
Select Quantity
↓
Buy Now
```

Tidak ada cart multi-product.

---

## 7.2 Book Detail

Customer dapat melihat:

- gambar utama
- galeri gambar
- judul buku
- author
- ISBN
- kategori
- harga
- stok
- sinopsis / deskripsi
- quantity selector
- tombol Buy Now

Apabila:

```text
stock = 0
```

maka customer tidak dapat melakukan checkout.

---

## 7.3 Quantity Selection

Customer dapat menentukan quantity.

Contoh:

```text
[-] 3 [+]
```

Validasi:

```text
quantity >= 1
quantity <= current stock
```

---

# 8. Checkout Flow

Checkout dilakukan langsung dari satu buku.

Flow:

```text
Book Detail
↓
Select Quantity
↓
Buy Now
↓
Checkout
↓
Fill Customer Information
↓
Review Order
↓
Create Order
↓
Generate Order Code
↓
Order Success
↓
WhatsApp Admin
```

---

# 9. Checkout Form

Field customer:

## Required

- Nama lengkap
- Nomor WhatsApp
- Alamat

## Optional

- Email
- Catatan

System information:

- book_id
- quantity

Frontend tidak boleh menentukan harga final.

Backend harus mengambil harga dari tabel `books`.

---

# 10. Order Calculation

Backend menentukan:

```text
unit_price = books.price

subtotal =
unit_price × quantity

total =
subtotal + shipping_cost
```

Contoh:

```text
Atomic Habits

Price:
Rp125.000

Quantity:
3

Subtotal:
Rp375.000

Shipping:
Rp20.000

Total:
Rp395.000
```

Frontend tidak boleh menjadi sumber kebenaran untuk:

- unit_price
- subtotal
- total

---

# 11. Order Creation Transaction

Order creation wajib dilakukan menggunakan database transaction.

Flow backend:

```text
START TRANSACTION

1. Get book
2. Validate book is active
3. Validate stock
4. Lock stock if required
5. Calculate current price
6. Generate unique order code
7. Create order
8. Reduce book stock
9. Create stock movement
10. Create initial order status history
11. COMMIT
```

Jika terjadi error:

```text
ROLLBACK
```

Tujuannya menghindari:

- order tercipta tetapi stok tidak berkurang
- stok berkurang tetapi order gagal tercipta
- histori status tidak tercatat

---

# 12. Order Code

Setiap order mempunyai kode unik.

Contoh:

```text
BK-K7X29P4D
BK-X92LM81Q
BK-A82PD4L7
```

Requirement:

- unik
- sulit ditebak
- bukan database ID
- dapat digunakan customer untuk tracking
- dapat disertakan pada pesan WhatsApp

Database ID tidak boleh digunakan sebagai public order identifier.

---

# 13. Order Success Page

Setelah order berhasil, customer melihat:

- informasi bahwa order berhasil dibuat
- kode order
- nama buku
- quantity
- total
- status awal
- tombol WhatsApp admin
- tombol Track Order

Customer harus diberi informasi bahwa kode order perlu disimpan.

---

# 14. WhatsApp Integration

Website tidak menggunakan payment gateway.

Setelah order dibuat, customer diarahkan ke WhatsApp admin.

Nomor WhatsApp admin berasal dari:

```text
store_settings.whatsapp_number
```

Pesan WhatsApp dapat dibuat otomatis.

Contoh:

```text
Halo Admin,

Saya ingin melanjutkan pesanan.

Kode Order:
BK-K7X29P4D

Nama:
Ian

Buku:
Atomic Habits

Jumlah:
3

Total:
Rp395.000

Mohon informasi pembayaran.
```

---

# 15. Payment Flow

Flow pembayaran:

```text
Customer membuat order
↓
Status = Pending
↓
Payment Status = Unpaid
↓
Customer membuka WhatsApp
↓
Admin memberikan informasi pembayaran
↓
Customer transfer
↓
Customer mengirim bukti transfer melalui WhatsApp
↓
Admin memverifikasi
↓
Admin upload bukti pembayaran ke dashboard
↓
Payment Status diperbarui
```

---

# 16. Payment Status

Status pembayaran:

```text
unpaid
paid
rejected
```

## unpaid

Belum ada pembayaran terverifikasi.

## paid

Pembayaran sudah diterima / diverifikasi admin.

## rejected

Bukti pembayaran tidak valid atau ditolak.

---

# 17. Payment Proof

Customer tidak upload bukti pembayaran melalui website.

Flow:

```text
Customer
↓
WhatsApp
↓
Send Payment Proof
↓
Admin Downloads Image
↓
Admin Uploads to Dashboard
```

Admin dapat memasukkan:

- image_path
- payment_amount
- paid_at
- note

Satu order dapat mempunyai beberapa payment proof apabila diperlukan.

---

# 18. Order Status

Status pesanan:

```text
pending
packing
shipping
completed
cancelled
```

Display label:

| Internal  | Display           |
| --------- | ----------------- |
| pending   | Pending           |
| packing   | Proses Packing    |
| shipping  | Proses Pengiriman |
| completed | Selesai           |
| cancelled | Cancel            |

---

# 19. Order Status Lifecycle

Flow normal:

```text
pending
↓
packing
↓
shipping
↓
completed
```

Cancellation:

```text
pending
↓
cancelled
```

atau sesuai policy admin yang ditentukan kemudian.

---

# 20. Current Status vs History

Tabel `orders` menyimpan:

```text
status
```

sebagai current status.

Tabel:

```text
order_status_histories
```

menyimpan seluruh histori.

Contoh:

```text
02 Sep 10:00 - pending
02 Sep 14:20 - packing
03 Sep 08:30 - shipping
05 Sep 13:00 - completed
```

Tidak diperlukan field:

- ordered_at
- completed_at
- cancelled_at

Karena:

- waktu order dibuat = `orders.created_at`
- waktu perubahan status = `order_status_histories.created_at`

---

# 21. Order Tracking

Customer dapat membuka halaman:

```text
/track-order
```

Customer memasukkan:

```text
order_code
```

Contoh:

```text
BK-K7X29P4D
```

System menampilkan:

- kode order
- buku
- quantity
- total
- current status
- payment status
- timeline status

---

# 22. Tracking Timeline

Contoh:

```text
✓ Pesanan Dibuat
  02 Sep 2026, 10:00

✓ Proses Packing
  02 Sep 2026, 14:20

● Proses Pengiriman
  03 Sep 2026, 08:30

○ Selesai
```

Timeline diambil dari:

```text
order_status_histories
```

---

# 23. Stock Management

`books.stock` merupakan stok terkini.

Setiap perubahan stok dicatat pada:

```text
book_stock_movements
```

Tujuan:

- audit stok
- mengetahui sumber perubahan stok
- mengetahui stok sebelum dan sesudah perubahan
- membantu debugging inventory mismatch

---

# 24. Stock Movement Types

```text
initial
adjustment_in
adjustment_out
order
cancellation
```

## initial

Stok awal buku.

## adjustment_in

Admin menambah stok secara manual.

## adjustment_out

Admin mengurangi stok secara manual.

## order

Stok berkurang karena customer membuat order.

## cancellation

Stok dikembalikan karena order dibatalkan.

---

# 25. Stock Movement Example

Initial stock:

```text
stock_before = 0
quantity = 20
stock_after = 20
type = initial
```

Customer membeli 3:

```text
stock_before = 20
quantity = -3
stock_after = 17
type = order
```

Order dibatalkan:

```text
stock_before = 17
quantity = +3
stock_after = 20
type = cancellation
```

---

# 26. Order Cancellation & Stock Restore

Ketika order dibatalkan dan stok sebelumnya sudah dikurangi:

1. Update order status menjadi `cancelled`
2. Create `order_status_histories`
3. Restore stock
4. Create `book_stock_movements` dengan type `cancellation`

Semua operasi disarankan dilakukan di dalam satu database transaction.

System harus mencegah stok dikembalikan dua kali untuk order yang sama.

---

# 27. Admin Authentication

Route admin wajib diproteksi.

Flow:

```text
/admin/login
↓
Authentication
↓
Admin Dashboard
```

Admin menggunakan:

- email
- password

Customer tidak dapat mengakses route admin.

---

# 28. Admin Dashboard

Dashboard memberikan ringkasan informasi utama.

Contoh data:

- jumlah buku aktif
- total stok buku
- total order
- pending order
- packing order
- shipping order
- completed order
- cancelled order
- unpaid order
- paid order
- recent orders

Dashboard tidak perlu terlalu kompleks.

---

# 29. Book Management

Admin dapat:

- melihat daftar buku
- menambah buku
- membuka detail buku
- edit buku
- soft delete buku
- mengaktifkan / menonaktifkan buku
- mengelola stok
- mengelola kategori buku
- mengelola gambar buku

---

# 30. Book Fields

Data utama buku:

- title
- slug
- ISBN
- author
- description / synopsis
- price
- stock
- is_active

---

# 31. Book Images

Satu buku dapat memiliki banyak gambar.

Field:

- book_id
- image_path
- alt_text
- sort_order
- is_primary

Admin dapat:

- upload gambar
- menghapus gambar
- menentukan gambar utama
- mengubah urutan gambar

Satu buku idealnya hanya mempunyai satu primary image.

---

# 32. Categories

Admin dapat:

- melihat kategori
- membuat kategori
- mengedit kategori
- menghapus kategori

Relasi:

```text
Books ↔ Categories
```

bersifat many-to-many.

Contoh:

```text
Atomic Habits

Self Improvement
Psychology
Productivity
```

---

# 33. Book Activation

`books.is_active` digunakan untuk menentukan apakah buku dapat dijual.

Jika:

```text
is_active = false
```

maka buku tidak ditampilkan sebagai buku yang dapat dibeli.

Data buku tetap tersimpan untuk kebutuhan histori.

---

# 34. Admin Order Management

Admin dapat melihat daftar order dengan informasi:

- order code
- customer name
- WhatsApp
- book
- quantity
- total
- order status
- payment status
- created_at

Admin dapat:

- search
- filter
- sort
- open detail

---

# 35. Admin Order Filters

Minimal filter:

- Pending
- Packing
- Shipping
- Completed
- Cancelled
- Unpaid
- Paid
- Rejected

Search dapat mencakup:

- order code
- customer name
- phone
- email
- book title

---

# 36. Admin Order Detail

Halaman order detail menampilkan:

## Order

- order code
- created_at
- status
- payment status

## Customer

- name
- phone
- email
- address
- note

## Book

- title
- ISBN
- author
- unit price
- quantity

## Payment

- subtotal
- shipping cost
- total
- payment proofs

## Timeline

- seluruh order status history

---

# 37. Admin Status Update

Ketika admin mengubah status:

```text
pending → packing
```

system harus:

1. update `orders.status`
2. insert `order_status_histories`
3. simpan `changed_by`
4. simpan `created_at`
5. optional note

Update status dan histori idealnya berada dalam satu database transaction.

---

# 38. Store Settings

Karena website hanya memiliki satu toko, konfigurasi disimpan pada:

```text
store_settings
```

Informasi:

- store_name
- whatsapp_number
- email
- address

Nomor WhatsApp digunakan untuk redirect customer setelah order.

---

# 39. Database Design

Implementasi database menggunakan migration Laravel terpisah untuk setiap tabel domain. Model Eloquent menggunakan typed relationship, cast backed enum untuk status, serta default model yang mencerminkan default database.

## Enums

```dbml
Enum order_status {
  pending
  packing
  shipping
  completed
  cancelled
}

Enum payment_status {
  unpaid
  paid
  rejected
}

Enum stock_movement_type {
  initial
  adjustment_in
  adjustment_out
  order
  cancellation
}
```

---

# 40. Final Database Schema

```dbml
Enum order_status {
  pending
  packing
  shipping
  completed
  cancelled
}

Enum payment_status {
  unpaid
  paid
  rejected
}

Enum stock_movement_type {
  initial
  adjustment_in
  adjustment_out
  order
  cancellation
}

Table users {
  id bigint [pk, increment]
  name varchar(150) [not null]
  email varchar(150) [not null, unique]
  password varchar(255) [not null]
  email_verified_at timestamp
  remember_token varchar(100)
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp

  indexes {
    email [unique]
  }
}

Table store_settings {
  id bigint [pk, increment]
  store_name varchar(150) [not null]
  whatsapp_number varchar(30) [not null]
  email varchar(150)
  address text
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp
}

Table categories {
  id bigint [pk, increment]
  name varchar(150) [not null]
  slug varchar(180) [not null, unique]
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp

  indexes {
    name
    slug [unique]
  }
}

Table books {
  id bigint [pk, increment]
  title varchar(255) [not null]
  slug varchar(255) [not null, unique]
  isbn varchar(50)
  author varchar(200) [not null]
  description text
  price decimal(15,2) [not null]
  stock integer [not null, default: 0]
  is_active boolean [not null, default: true]
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp

  indexes {
    slug [unique]
    isbn
    title
    author
    is_active
  }
}

Table book_images {
  id bigint [pk, increment]
  book_id bigint [not null]
  image_path varchar(500) [not null]
  alt_text varchar(255)
  sort_order integer [not null, default: 0]
  is_primary boolean [not null, default: false]
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp

  indexes {
    book_id
    (book_id, sort_order)
  }
}

Table book_categories {
  id bigint [pk, increment]
  book_id bigint [not null]
  category_id bigint [not null]
  created_at timestamp
  updated_at timestamp

  indexes {
    (book_id, category_id) [unique]
    book_id
    category_id
  }
}

Table orders {
  id bigint [pk, increment]

  order_code varchar(50) [not null, unique]

  customer_name varchar(150) [not null]
  customer_phone varchar(30) [not null]
  customer_email varchar(150)
  customer_address text [not null]
  customer_note text

  book_id bigint [not null]

  book_title varchar(255) [not null]
  book_isbn varchar(50)
  book_author varchar(200)

  unit_price decimal(15,2) [not null]
  quantity integer [not null]
  subtotal decimal(15,2) [not null]
  shipping_cost decimal(15,2) [not null, default: 0]
  total decimal(15,2) [not null]

  status order_status [not null, default: 'pending']
  payment_status payment_status [not null, default: 'unpaid']

  created_at timestamp
  updated_at timestamp
  deleted_at timestamp

  indexes {
    order_code [unique]
    book_id
    customer_phone
    customer_email
    status
    payment_status
    created_at
  }
}

Table payment_proofs {
  id bigint [pk, increment]
  order_id bigint [not null]
  uploaded_by bigint [not null]
  image_path varchar(500) [not null]
  payment_amount decimal(15,2)
  paid_at timestamp
  note text
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp

  indexes {
    order_id
    uploaded_by
  }
}

Table order_status_histories {
  id bigint [pk, increment]
  order_id bigint [not null]
  status order_status [not null]
  changed_by bigint
  note text
  created_at timestamp [not null]
  deleted_at timestamp

  indexes {
    order_id
    status
    created_at
  }
}

Table book_stock_movements {
  id bigint [pk, increment]
  book_id bigint [not null]
  order_id bigint
  changed_by bigint
  type stock_movement_type [not null]
  quantity integer [not null]
  stock_before integer [not null]
  stock_after integer [not null]
  note text
  created_at timestamp [not null]
  deleted_at timestamp

  indexes {
    book_id
    order_id
    changed_by
    type
    created_at
  }
}

Ref: book_images.book_id > books.id

Ref: book_categories.book_id > books.id
Ref: book_categories.category_id > categories.id

Ref: orders.book_id > books.id

Ref: payment_proofs.order_id > orders.id
Ref: payment_proofs.uploaded_by > users.id

Ref: order_status_histories.order_id > orders.id
Ref: order_status_histories.changed_by > users.id

Ref: book_stock_movements.book_id > books.id
Ref: book_stock_movements.order_id > orders.id
Ref: book_stock_movements.changed_by > users.id
```

---

# 41. Entity Relationships

```text
USERS
  │
  ├──────────── PAYMENT_PROOFS
  │
  ├──────────── ORDER_STATUS_HISTORIES
  │
  └──────────── BOOK_STOCK_MOVEMENTS


CATEGORIES
    │
    │ N:M
    ▼
BOOK_CATEGORIES
    │
    ▼
BOOKS
  │
  ├──────────── BOOK_IMAGES
  │
  ├──────────── ORDERS
  │                │
  │                ├──── PAYMENT_PROOFS
  │                │
  │                └──── ORDER_STATUS_HISTORIES
  │
  └──────────── BOOK_STOCK_MOVEMENTS


STORE_SETTINGS
```

## Foreign Key Deletion Rules

- `book_images.book_id` menggunakan cascade untuk penghapusan permanen buku.
- `book_categories.book_id` dan `book_categories.category_id` menggunakan cascade.
- `orders.book_id` menggunakan restrict untuk menjaga snapshot dan histori transaksi.
- `payment_proofs.order_id` dan `payment_proofs.uploaded_by` menggunakan restrict.
- `order_status_histories.order_id` menggunakan restrict; `changed_by` menjadi `NULL` jika user dihapus permanen.
- `book_stock_movements.book_id` dan `order_id` menggunakan restrict; `changed_by` menjadi `NULL` jika user dihapus permanen.

---

# 42. Recommended Laravel Model Relationships

## User

```text
hasMany(PaymentProof)
hasMany(OrderStatusHistory)
hasMany(BookStockMovement)
```

## StoreSetting

```text
Tidak memiliki relasi database langsung.
```

## Book

```text
hasMany(BookImage)
belongsToMany(Category)
hasMany(Order)
hasMany(BookStockMovement)
```

## Category

```text
belongsToMany(Book)
```

## BookImage

```text
belongsTo(Book)
```

## BookCategory

```text
belongsTo(Book)
belongsTo(Category)
```

`BookCategory` adalah model pivot incrementing dengan primary key bigint.

## Order

```text
belongsTo(Book)
hasMany(PaymentProof)
hasMany(OrderStatusHistory)
hasMany(BookStockMovement)
```

## PaymentProof

```text
belongsTo(Order)
belongsTo(User, uploaded_by)
```

## OrderStatusHistory

```text
belongsTo(Order)
belongsTo(User, changed_by)
```

## BookStockMovement

```text
belongsTo(Book)
belongsTo(Order)
belongsTo(User, changed_by)
```

---

# 43. Suggested Public Routes

```text
/
```

Homepage.

```text
/books
```

Book catalog.

```text
/books/{slug}
```

Book detail.

```text
/books/{slug}/checkout
```

Checkout.

```text
/order-success/{orderCode}
```

Order success.

```text
/track-order
```

Order tracking form.

```text
/track-order/{orderCode}
```

Order tracking result.

---

# 44. Suggested Admin Routes

```text
/admin/login
```

Authentication.

```text
/admin
```

Dashboard.

```text
/admin/books
/admin/books/create
/admin/books/{book}
```

Book management.

```text
/admin/categories
```

Category management.

```text
/admin/orders
/admin/orders/{order}
```

Order management.

```text
/admin/stock
```

Stock history / management.

```text
/admin/settings
```

Store configuration.

---

# 45. UI / UX Direction

Frontend customer harus terasa seperti toko buku modern:

- catalog-first
- clean
- editorial
- minimal
- book-cover focused
- responsive
- mudah dipahami
- tidak seperti dashboard
- tidak seperti marketplace besar

Book covers menjadi focal point utama.

Hindari:

- terlalu banyak cards
- dashboard-like customer UI
- excessive gradients
- glassmorphism
- excessive shadows
- floating decorative elements
- generic SaaS layout

---

# 46. Design Color Direction

Brand direction yang sebelumnya dipilih:

## Primary Navy

```text
#0B1F3A
```

## Deep Navy

```text
#071426
```

## Primary Blue

```text
#2563EB
```

## Soft Blue

```text
#EAF2FF
```

## Base

```text
#FFFFFF
```

UI menggunakan putih sebagai fondasi dengan navy dan blue yang cukup terlihat untuk brand identity.

---

# 47. Frontend Technology

Frontend menggunakan:

- React
- TypeScript
- Inertia.js
- Tailwind CSS
- shadcn/ui

Principles:

- reusable components
- strict TypeScript
- responsive design
- server-driven navigation melalui Inertia
- minimal unnecessary client state

---

# 48. Backend Technology

Backend:

- Laravel
- MySQL

Responsibilities:

- authentication admin
- CRUD buku
- category management
- image handling
- order processing
- stock calculation
- status management
- payment proof
- WhatsApp redirect preparation
- order tracking
- validation
- database transaction

---

# 49. Security Requirements

## Admin Authentication

Admin routes menggunakan authentication middleware.

## Order Code

Jangan expose database ID untuk tracking customer.

Gunakan:

```text
order_code
```

yang sulit ditebak.

## Pricing

Harga tidak boleh dipercaya dari frontend.

Selalu:

```text
Book::find(book_id)->price
```

sebagai source of truth.

## Quantity

Backend wajib validasi:

```text
quantity >= 1
quantity <= available stock
```

## Upload

Payment proof harus divalidasi berdasarkan:

- image MIME
- extension
- size

## Mass Assignment

Gunakan:

- Form Request validation
- controlled fillable / guarded strategy

---

# 50. Data Integrity Requirements

System harus memastikan:

1. Order code selalu unik.
2. Quantity tidak boleh nol atau negatif.
3. Quantity tidak boleh melebihi stok.
4. Harga order berasal dari database.
5. Subtotal dihitung backend.
6. Total dihitung backend.
7. Stock movement selalu sesuai perubahan stok.
8. Status history tercatat ketika status berubah.
9. Stock tidak dikembalikan dua kali saat cancellation.
10. Satu buku-category relation tidak boleh duplicate.
11. Satu order hanya terhubung ke satu buku.
12. Foreign key menjaga audit trail order; hard delete order diblokir selama payment proof atau histori masih ada.
13. `changed_by` pada status history dan stock movement menjadi `NULL` bila user dihapus permanen.
14. Semua tabel bisnis menggunakan soft delete kecuali `book_categories`.

---

# 51. Soft Delete

Tables yang menggunakan soft delete:

- users
- store_settings
- categories
- books
- book_images
- orders
- payment_proofs
- order_status_histories
- book_stock_movements

`book_categories` tidak menggunakan soft delete. Pivot dihapus permanen agar unique constraint `(book_id, category_id)` tetap dijamin database.

Tujuan:

- menjaga histori
- menghindari kehilangan reference lama
- memungkinkan restore jika diperlukan

Order dan tabel audit tidak dihapus permanen melalui alur aplikasi.

Gunakan:

```text
cancelled
```

untuk membatalkan pesanan.

---

# 52. Order Deletion Policy

Admin tidak disarankan mempunyai fitur hard delete order. Order menggunakan soft delete bila pengarsipan diperlukan.

Order yang salah atau tidak dilanjutkan harus:

```text
status = cancelled
```

Hal ini menjaga:

- histori transaksi
- stock movement
- payment proof
- status history
- audit trail

---

# 53. Category Deletion Policy

Kategori menggunakan soft delete pada alur normal.

Jika kategori dihapus permanen, foreign key menghapus record `book_categories` terkait, tetapi tidak menghapus buku.

---

# 54. Book Deletion Policy

Buku menggunakan soft delete. `book_images` juga menggunakan soft delete.

Order lama tetap menyimpan:

- book_id jika tersedia
- book_title
- book_isbn
- book_author
- unit_price

Sehingga detail transaksi historis tetap dapat ditampilkan.

Jika force delete diperlukan, relasi pivot dan gambar dapat ikut terhapus, tetapi database menolak penghapusan buku yang masih dipakai order atau stock movement.

---

# 55. Search Requirements

## Customer Catalog

Search:

- title
- author
- ISBN

Filter:

- category

Optional future:

- price
- availability

## Admin Order

Search:

- order code
- customer name
- phone
- email
- book title

---

# 56. Pagination

Gunakan pagination untuk:

- catalog
- books admin
- orders admin
- stock movements
- categories jika jumlah data besar

Pagination sebaiknya diproses server-side oleh Laravel.

---

# 57. Validation

## Book

- title required
- slug unique
- price >= 0
- stock >= 0
- ISBN optional
- author required
- is_active boolean

## Checkout

- book_id exists
- quantity integer
- quantity >= 1
- name required
- phone required
- email valid jika diisi
- address required

## Category

- name required
- slug unique

## Payment Proof

- order exists
- valid image
- payment amount >= 0 jika diisi

---

# 58. Order Status Update Validation

System sebaiknya membatasi transisi status yang tidak valid.

Contoh recommended transition:

```text
pending → packing
pending → cancelled

packing → shipping
packing → cancelled

shipping → completed

completed → no further transition

cancelled → no further transition
```

Apabila bisnis mengizinkan perubahan lain, policy dapat disesuaikan.

---

# 59. Admin Dashboard Recommended Metrics

Minimal:

```text
Books
Active Books
Total Stock

Orders Today
Pending
Packing
Shipping
Completed
Cancelled

Unpaid
Paid
```

Optional:

- revenue
- most ordered book
- low stock
- recent transactions

---

# 60. Low Stock

Future-ready feature.

Admin dapat melihat buku dengan:

```text
stock <= threshold
```

Threshold dapat ditentukan di aplikasi.

Tidak perlu field database khusus pada versi awal.

---

# 61. Empty State

Public:

- no books available
- no search result

Admin:

- no orders
- no books
- no categories
- no payment proof
- no status history

UI harus memberikan action yang relevan.

---

# 62. Responsive Requirements

Website customer harus optimal pada:

- mobile
- tablet
- desktop

Customer checkout sangat penting untuk mobile karena proses dilanjutkan melalui WhatsApp.

Admin dashboard minimal usable pada:

- tablet
- desktop

Mobile admin support tetap dianjurkan.

---

# 63. Notifications

Versi awal tidak membutuhkan:

- email notification
- SMS
- WhatsApp API

WhatsApp dilakukan melalui redirect URL dengan prefilled message.

Future enhancement dapat menggunakan WhatsApp Business API.

---

# 64. Error Handling

Customer-facing error:

- book not found
- book inactive
- insufficient stock
- invalid quantity
- order not found
- invalid order code
- checkout failed

Admin errors:

- invalid status transition
- image upload failure
- stock adjustment error
- duplicate category
- duplicate slug

Error message harus user-friendly.

---

# 65. Logging

Recommended logging:

- checkout failures
- stock conflicts
- stock adjustments
- payment changes
- order status changes
- upload failures

Tidak perlu expose technical exception ke user.

---

# 66. Performance Requirements

Minimum considerations:

- eager load relations pada catalog dan admin list
- pagination
- index order_code
- index status
- index payment_status
- index book_id
- image optimization
- lazy-load book gallery
- avoid N+1 queries

---

# 67. Image Storage

Book images dan payment proof disimpan menggunakan Laravel Storage.

Recommended:

```text
storage/app/public/books/
storage/app/public/payment-proofs/
```

Production dapat menggunakan object storage seperti S3-compatible service jika dibutuhkan.

Database hanya menyimpan path.

---

# 68. Seed Data

Recommended seed:

## Admin

Satu akun admin development.

## Store Settings

Satu konfigurasi toko.

## Categories

Beberapa kategori contoh.

## Books

Beberapa sample books.

---

# 69. Testing Scope

## Unit / Feature Tests

Minimal mencakup:

### Checkout

- order dapat dibuat
- stok berkurang
- snapshot harga tersimpan
- status history tercipta
- stock movement tercipta
- order code unik

### Insufficient Stock

- order gagal
- stok tidak berubah

### Cancellation

- status berubah
- status history tercipta
- stock dikembalikan
- cancellation movement tercipta
- stock tidak dapat direstore dua kali

### Admin

- guest tidak dapat masuk admin
- admin dapat CRUD book
- admin dapat mengubah status
- admin dapat upload payment proof

### Tracking

- valid order code menampilkan order
- invalid order code menghasilkan error / not found

### Database dan Model

- migration membuat seluruh tabel domain dan soft delete column yang ditentukan
- relasi `hasMany`, `belongsTo`, dan `belongsToMany` mengarah ke model yang benar
- `BookCategory` tetap pivot incrementing tanpa soft delete
- status order, status pembayaran, dan tipe stock movement tercast ke backed enum

---

# 70. MVP Scope

MVP dianggap selesai ketika:

## Customer

- dapat membuka katalog
- dapat melihat detail buku
- dapat memilih quantity
- dapat checkout
- dapat membuat order
- dapat menerima order code
- dapat redirect ke WhatsApp admin
- dapat track order

## Admin

- dapat login
- dapat CRUD buku
- dapat upload multiple book images
- dapat CRUD categories
- dapat melihat orders
- dapat melihat detail order
- dapat mengubah status
- dapat mengubah payment status
- dapat upload payment proof
- dapat mengelola stok
- dapat melihat histori status
- dapat melihat histori stock
- dapat mengubah store settings

---

# 71. Future Enhancements

Fitur yang dapat ditambahkan tanpa mengubah core business model:

- WhatsApp Business API
- email notification
- shipping API
- automatic shipping fee
- courier tracking number
- printable invoice
- downloadable invoice
- dashboard analytics
- revenue report
- low-stock alert
- export orders CSV
- export report
- SEO management
- book recommendation
- featured books
- bestseller section
- promotional banner

---

# 72. Acceptance Criteria

Produk dapat dianggap memenuhi requirement apabila:

1. Admin dapat login.
2. Customer tidak perlu login.
3. Admin dapat membuat buku dengan banyak gambar.
4. Buku dapat memiliki banyak kategori.
5. Customer hanya dapat membeli satu jenis buku per order.
6. Customer dapat membeli quantity lebih dari satu.
7. Customer dapat mengisi nama, WhatsApp, email, alamat, dan catatan.
8. Backend menghasilkan order code unik.
9. Harga order berasal dari database.
10. Order menyimpan snapshot data buku.
11. Order menyimpan snapshot data customer.
12. Stok berkurang ketika order dibuat.
13. Stock movement tercatat.
14. Status awal order adalah pending.
15. Payment status awal adalah unpaid.
16. Initial status history tercatat.
17. Customer dapat diarahkan ke WhatsApp admin.
18. Customer dapat track order menggunakan order code.
19. Admin dapat mengubah status order.
20. Setiap perubahan status tercatat dalam history.
21. Admin dapat mengubah payment status.
22. Admin dapat upload bukti pembayaran.
23. Cancellation mengembalikan stock.
24. Order yang completed atau cancelled tetap memiliki histori transaksi yang utuh.
25. Tidak ada tenant atau tenant_id.
26. Tidak ada customer account.
27. Tidak ada order_items.
28. Seluruh primary key menggunakan bigint auto increment.
29. Migration domain dipisahkan satu file untuk setiap tabel.
30. Model mendefinisikan relasi Eloquent bertipe benar untuk seluruh foreign key.
31. Soft delete diterapkan pada seluruh tabel bisnis kecuali `book_categories`.
