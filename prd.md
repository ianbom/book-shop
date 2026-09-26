# PRD — Buku Order E-Commerce

## 1. Document Information

**Product Name:** Buku Order  
**Document Type:** Product Requirements Document (PRD)  
**Platform:** Web Application  
**Architecture Type:** Single-store e-commerce  
**Primary Roles:** Admin, Customer  
**Primary Stack:** Laravel, Inertia.js, React, TypeScript, Tailwind CSS, shadcn/ui, MySQL  
**Shipping Provider:** Biteship  
**Order Payment:** Internal wallet / saldo  
**Wallet Top-up:** Manual transfer proof upload + admin verification  
**Order Model:** Multi-book order via cart  
**Book Fulfillment:** Ready Stock and Preorder  
**Last Updated:** September 26, 2026  
**PRD Source of Truth:** Database design `db.md` terbaru dan keputusan bisnis terbaru proyek Buku Order.

---

# 2. Product Overview

Buku Order adalah website e-commerce buku single-store yang menyediakan katalog buku publik dan area dashboard terautentikasi untuk customer serta admin.

Customer wajib memiliki akun untuk menggunakan fitur transaksi. Setelah login, customer dapat menyimpan alamat, menambahkan beberapa buku ke keranjang, memilih layanan pengiriman, menggunakan voucher, dan menyelesaikan checkout menggunakan saldo internal.

Saldo customer diperoleh melalui proses top-up manual. Customer menentukan nominal top-up dan mengunggah bukti transfer melalui website. Sistem tidak menyimpan data bank, nomor rekening, nama rekening, kartu ATM, atau metadata bank customer. Admin memverifikasi bukti transfer secara manual. Jika top-up disetujui, saldo wallet customer bertambah dan transaksi saldo dicatat dalam immutable wallet ledger.

Pengiriman terintegrasi dengan Biteship. Sistem menggunakan data asal pengiriman toko, alamat tujuan customer, berat/dimensi buku, serta isi cart untuk memperoleh pilihan dan biaya pengiriman. Setelah order siap dikirim, sistem dapat membuat shipment dan menyimpan data tracking Biteship.

Satu order dapat berisi banyak jenis buku dan dapat menghasilkan satu atau beberapa shipment. Dukungan multiple shipment disediakan untuk mengakomodasi split fulfillment, terutama ketika satu order berisi kombinasi ready stock dan preorder.

Website mendukung pembatalan order selama barang belum dikirim. Ketika order yang telah dibayar dibatalkan secara valid, saldo yang sebelumnya dipotong harus dikembalikan ke wallet customer dan dicatat sebagai transaksi refund.

---

# 3. Product Goals

Tujuan utama Buku Order adalah:

1. Menyediakan katalog buku yang mudah dijelajahi oleh pengunjung.
2. Menyediakan akun customer dengan dashboard pribadi.
3. Mendukung pembelian beberapa buku dalam satu checkout.
4. Menyediakan cart yang persisten per customer.
5. Menyediakan wallet sebagai metode pembayaran internal.
6. Menyediakan top-up saldo manual dengan bukti transfer.
7. Memastikan setiap perubahan saldo memiliki audit trail.
8. Mendukung voucher fixed maupun percentage.
9. Mendukung buku ready stock dan preorder.
10. Mengintegrasikan perhitungan tarif dan proses shipment melalui Biteship.
11. Menyimpan alamat customer agar dapat digunakan kembali.
12. Menyimpan snapshot alamat dan item agar histori order tidak berubah ketika data master berubah.
13. Mendukung tracking order dan shipment dari dashboard customer.
14. Mendukung pembatalan order sebelum pengiriman dengan refund saldo otomatis.
15. Menyediakan inventory audit trail.
16. Menyediakan dashboard admin untuk mengelola seluruh operasi toko.
17. Menjaga integritas data dengan database transaction, row locking, authorization, dan immutable ledger/history.
18. Menjaga arsitektur tetap sederhana sebagai single-store e-commerce tanpa multi-tenant.

---

# 4. Product Non-Goals

Fitur berikut tidak termasuk dalam scope inti versi ini:

- multi-store
- multi-tenant
- marketplace
- seller dashboard
- multiple seller
- COD
- penyimpanan rekening atau data bank customer
- penyimpanan data kartu ATM customer
- payment gateway untuk checkout order
- checkout langsung menggunakan kartu kredit/debit
- multi-currency
- multi-warehouse
- product review
- product rating
- wishlist
- loyalty tier
- affiliate system
- live chat internal
- bidding / auction
- subscription book service
- automatic top-up verification
- direct bank API integration
- complex warehouse management system

Fitur di atas dapat dipertimbangkan pada fase berikutnya apabila kebutuhan bisnis berubah.

---

# 5. User Roles

## 5.1 Customer

Customer memiliki akun dan harus login untuk menggunakan fitur transaksi.

Customer dapat:

- register
- login
- logout
- melihat dashboard
- mengelola profil
- melihat katalog buku
- mencari buku
- memfilter buku berdasarkan kategori
- melihat detail buku
- melihat informasi ready stock / preorder
- melihat estimasi tanggal preorder
- menambahkan buku ke cart
- mengubah quantity cart
- menghapus item cart
- menyimpan beberapa alamat
- menentukan alamat default
- memilih alamat ketika checkout
- melihat estimasi/tarif pengiriman
- memilih courier/service
- memasukkan voucher
- melihat subtotal, diskon, ongkir, dan total
- melihat saldo wallet
- membuat top-up
- upload bukti transfer top-up
- melihat status top-up
- checkout menggunakan saldo
- melihat daftar order miliknya
- melihat detail order miliknya
- melihat order status timeline
- melihat daftar shipment miliknya
- melihat detail/tracking shipment
- membatalkan order yang masih memenuhi syarat cancellation
- menerima refund kembali ke wallet ketika cancellation valid
- melihat riwayat transaksi wallet

Customer tidak dapat:

- melihat order customer lain
- melihat shipment customer lain
- melihat wallet customer lain
- menyetujui top-up
- mengubah saldo secara manual
- mengubah status order secara administratif
- mengubah data master buku
- mengubah stok
- membuat voucher
- mengakses route admin
- membatalkan order yang sudah memasuki fase pengiriman yang tidak dapat dibatalkan

---

## 5.2 Admin

Admin memiliki akun dan harus login.

Admin dapat:

- login
- logout
- melihat dashboard admin
- mengelola buku
- mengelola gambar buku
- mengelola kategori
- mengelola stok
- melihat inventory movement
- melihat semua customer
- melihat seluruh order
- melihat detail order
- mencari, memfilter, dan mengurutkan order
- mengubah status order sesuai transition rules
- mengelola proses preorder
- melihat seluruh shipment
- membuat/memproses shipment melalui Biteship
- melihat tracking shipment
- melihat request top-up
- melihat bukti transfer top-up
- approve top-up
- reject top-up
- melihat wallet transaction history
- melakukan wallet adjustment jika benar-benar diperlukan
- membuat voucher
- mengedit voucher
- mengaktifkan/menonaktifkan voucher
- melihat voucher usage
- mengelola store settings
- mengelola origin shipping data
- menentukan daftar courier yang digunakan
- membatalkan order jika masih memenuhi cancellation rules
- melihat order status history
- melihat shipment status history

---

# 6. Authentication and Authorization

## 6.1 Shared User Model

Admin dan customer menggunakan tabel `users` yang sama.

Role:

```text
admin
customer
```

Default role untuk akun baru adalah `customer`.

Informasi user:

- name
- email
- phone
- password
- role
- email verification timestamp
- remember token

---

## 6.2 Authorization

Frontend role-based hiding tidak boleh menjadi satu-satunya security layer.

Laravel harus membatasi akses melalui:

- authentication middleware
- role middleware
- policy / gate bila dibutuhkan
- ownership validation
- route grouping

Contoh:

```text
/admin/*
→ auth
→ role:admin
```

Customer routes:

```text
/dashboard
/orders/*
/shipments/*
/wallet/*
/topups/*
/addresses/*
/cart/*
/checkout/*
```

harus memerlukan `auth` dan role customer bila route tidak memang dibagi untuk kedua role.

---

## 6.3 Resource Ownership

Customer hanya boleh mengakses resource yang dimilikinya.

Contoh:

```text
order.user_id == auth.user.id
```

Hal yang sama berlaku untuk:

- address
- cart
- wallet
- top-up
- order
- shipment melalui order
- wallet transaction

Ownership harus diverifikasi di backend.

---

# 7. Application Layout Architecture

Admin dan customer menggunakan authenticated dashboard layout yang sama secara visual apabila struktur UI memang identik.

Recommended:

```text
resources/js/layouts/app-layout.tsx
```

Layout tersebut menangani:

- sidebar
- header
- breadcrumb
- user dropdown
- responsive navigation
- page content container

Navigation item disesuaikan berdasarkan role.

Customer storefront publik menggunakan layout terpisah:

```text
resources/js/layouts/customer-layout.tsx
```

Contoh pemisahan:

```text
CustomerLayout
├── Homepage
├── Catalog
├── Book Detail
└── Public informational pages

AppLayout
├── Admin Dashboard
└── Customer Dashboard
```

Page, route, controller, query, dan authorization admin/customer tetap dipisahkan walaupun layout digunakan bersama.

---

# 8. Public Storefront

## 8.1 Homepage

Homepage berfungsi sebagai storefront utama.

Minimal menampilkan:

- brand/logo
- navigation
- hero section
- featured books
- kategori
- buku terbaru
- highlight / benefit section
- CTA menuju katalog
- footer
- login/register access
- cart indicator ketika user sudah login

Homepage tetap dapat dibuka tanpa login.

---

## 8.2 Catalog

Customer/public dapat membuka daftar buku.

Kemampuan minimum:

- pagination server-side
- search
- filter kategori
- sorting
- link/detail action

Search minimal:

- title
- author
- ISBN

Filter minimal:

- category
- sale type jika dibutuhkan UI
- availability jika dibutuhkan UI

Sorting yang dapat disediakan:

- terbaru
- harga terendah
- harga tertinggi
- judul

Hanya buku aktif yang dapat ditawarkan untuk pembelian.

---

# 9. Book Management

## 9.1 Book Master Data

Setiap buku memiliki:

- title
- slug
- ISBN optional
- SKU optional
- author
- description
- price
- shipping category
- weight
- height optional
- length optional
- width optional
- stock
- sale type
- preorder estimated date
- preorder note
- active status

---

## 9.2 Shipping Physical Information

Buku membutuhkan data fisik untuk integrasi shipping.

`weight` disimpan dalam gram.

Dimensi:

- height
- length
- width

disimpan dalam sentimeter.

Weight wajib tersedia karena digunakan ketika meminta shipping rate.

Dimensi dapat bersifat optional sesuai kebutuhan shipping provider.

---

## 9.3 Ready Stock

Jika:

```text
sale_type = ready_stock
```

maka `books.stock` merepresentasikan physical ready stock.

Customer hanya boleh membeli quantity yang masih tersedia.

Backend harus memvalidasi stok ulang ketika checkout.

---

## 9.4 Preorder

Jika:

```text
sale_type = preorder
```

buku dapat tetap dibeli meskipun physical ready stock belum tersedia.

Informasi yang dapat ditampilkan:

- label preorder
- preorder estimated date
- preorder note

Estimasi PO pada saat order harus disnapshot ke `order_items`.

Hal ini memastikan perubahan estimasi master buku tidak mengubah histori order lama.

---

## 9.5 Active / Inactive Book

`is_active` menentukan apakah buku tersedia untuk ditawarkan.

Jika:

```text
is_active = false
```

customer tidak boleh melakukan pembelian baru.

Data lama tetap dipertahankan untuk histori transaksi.

---

# 10. Book Images

Satu buku dapat mempunyai banyak gambar.

Informasi:

- image path
- alt text
- sort order
- primary flag

Admin dapat:

- upload beberapa gambar
- menghapus gambar
- menentukan primary image
- mengubah urutan gambar

Idealnya satu buku hanya mempunyai satu primary image aktif.

File disimpan melalui Laravel Storage.

Database hanya menyimpan path.

---

# 11. Categories

Buku dan kategori menggunakan relasi many-to-many.

Satu buku dapat memiliki beberapa kategori.

Contoh:

```text
Atomic Habits
├── Self Improvement
├── Productivity
└── Psychology
```

Admin dapat:

- membuat kategori
- edit kategori
- soft delete kategori
- melihat jumlah buku per kategori

Relasi buku-kategori yang sama tidak boleh duplicate.

---

# 12. Customer Addresses

## 12.1 Address Book

Customer dapat mempunyai banyak alamat reusable.

Informasi alamat:

- label, misalnya Rumah/Kantor
- destination contact name
- destination contact phone
- destination contact email optional
- destination address
- destination note
- postal code
- Biteship area ID
- Biteship location ID
- latitude
- longitude
- province
- city
- district
- subdistrict
- default flag

---

## 12.2 Default Address

Satu customer dapat menentukan alamat default.

UI checkout sebaiknya otomatis memilih default address jika tersedia.

Application logic harus mencegah kondisi ambigu di mana terlalu banyak alamat dianggap default untuk customer yang sama.

---

## 12.3 Biteship Location Requirement

Address harus mempunyai data lokasi yang cukup untuk melakukan shipping request.

Sistem menggunakan salah satu atau kombinasi:

- destination postal code
- destination area ID
- destination coordinate

Untuk layanan yang memerlukan coordinate, latitude dan longitude harus tersedia.

---

# 13. Cart

## 13.1 One Active Cart Per Customer

Setiap customer mempunyai satu current cart.

Cart digunakan sebelum checkout.

---

## 13.2 Cart Items

Cart dapat berisi beberapa buku.

Data utama:

- cart
- book
- quantity

Constraint:

```text
(cart_id, book_id) unique
```

Artinya buku yang sama tidak membuat row kedua.

Jika customer menambahkan buku yang sama:

```text
quantity lama + quantity baru
```

---

## 13.3 Cart Validation

Backend harus memvalidasi:

- book exists
- book active
- quantity >= 1
- ready stock quantity tidak melebihi stock
- preorder masih tersedia untuk dibeli sesuai policy aplikasi
- harga di frontend bukan source of truth

Cart dapat menampilkan estimated subtotal, tetapi total final dihitung ulang ketika checkout.

---

# 14. Wallet

## 14.1 Wallet Concept

Setiap customer mempunyai satu wallet.

`wallets.balance` menyimpan current balance.

Contoh:

```text
Customer: Ian
Balance: Rp500.000
```

Wallet bukan ledger.

Seluruh perubahan saldo wajib dicatat pada `wallet_transactions`.

---

## 14.2 Wallet Creation

Wallet sebaiknya dibuat ketika:

- customer register, atau
- pertama kali wallet dibutuhkan

Recommended:

```text
new customer
→ create wallet
→ balance = 0
```

---

## 14.3 Wallet Transaction Ledger

Wallet transaction bersifat immutable audit trail.

Transaction types:

```text
topup_credit
order_payment
order_refund
admin_adjustment_credit
admin_adjustment_debit
```

Direction:

```text
credit
debit
```

`amount` selalu bernilai positif.

Direction menentukan apakah saldo naik atau turun.

Setiap transaction menyimpan:

- wallet
- topup reference optional
- order reference optional
- created by optional
- type
- direction
- amount
- balance before
- balance after
- note
- created at

---

# 15. Wallet Top-up

## 15.1 Top-up User Flow

Customer tidak mengisi data bank.

Customer hanya perlu:

1. menentukan nominal top-up
2. melakukan transfer sesuai instruksi pembayaran toko
3. upload bukti transfer
4. submit request
5. menunggu admin melakukan review

Tidak disimpan:

- nama bank customer
- nomor rekening customer
- nama pemilik rekening customer
- nomor kartu ATM
- transfer timestamp yang diketik customer
- metadata rekening pengirim

---

## 15.2 Top-up Data

Top-up menyimpan:

- topup code
- customer
- requested amount
- credited amount
- payment proof image
- status
- reviewing admin
- reviewed at
- admin note
- created at
- updated at

---

## 15.3 Top-up Status

Status:

```text
pending
approved
rejected
```

### Pending

Request baru dan belum diverifikasi.

### Approved

Bukti diterima dan admin menyetujui saldo.

### Rejected

Bukti tidak valid atau request ditolak.

---

## 15.4 Top-up Approval Transaction

Approval harus atomic.

Recommended flow:

```text
START TRANSACTION

1. Lock wallet_topups row
2. Validate status == pending
3. Lock customer wallet
4. Determine credited_amount
5. Change top-up status to approved
6. Set reviewed_by
7. Set reviewed_at
8. Increase wallet.balance
9. Create wallet transaction:
   type = topup_credit
   direction = credit
10. COMMIT
```

Jika proses gagal:

```text
ROLLBACK
```

Top-up yang sudah approved tidak boleh di-credit ulang.

---

## 15.5 Top-up Rejection

Rejection:

- status menjadi rejected
- reviewed_by disimpan
- reviewed_at disimpan
- admin_note dapat disimpan
- wallet balance tidak berubah
- wallet transaction tidak dibuat

---

# 16. Voucher

## 16.1 Voucher Types

Voucher mendukung:

```text
fixed
percentage
```

---

## 16.2 Voucher Data

Voucher mempunyai:

- code
- name
- description
- type
- value
- max discount optional
- minimum order amount
- usage limit optional
- per user limit
- starts at
- ends at
- active flag
- creator admin

---

## 16.3 Fixed Voucher

Contoh:

```text
Code: HEMAT50
Type: fixed
Value: 50.000
```

Subtotal:

```text
Rp300.000
```

Discount:

```text
Rp50.000
```

---

## 16.4 Percentage Voucher

Contoh:

```text
Code: HEMAT20
Type: percentage
Value: 20
Max Discount: Rp50.000
```

Subtotal:

```text
Rp300.000
```

20%:

```text
Rp60.000
```

Karena maksimum:

```text
Rp50.000
```

diskon aktual:

```text
Rp50.000
```

---

## 16.5 Voucher Validation

Backend harus memvalidasi:

- voucher exists
- voucher active
- current time >= starts_at jika ada
- current time <= ends_at jika ada
- subtotal memenuhi minimum order
- usage limit global belum habis
- per-user limit belum habis

Satu order menggunakan maksimum satu voucher pada rancangan saat ini.

---

## 16.6 Voucher Usage

Setelah checkout berhasil, sistem mencatat:

- voucher
- user
- order
- discount amount
- timestamp

Record ini digunakan untuk:

- global usage limit
- per-user usage limit
- audit discount

Policy pemulihan voucher setelah cancellation harus ditetapkan pada business layer. Default implementation harus konsisten dan diuji; jangan mengubah usage tanpa aturan eksplisit.

---

# 17. Checkout Overview

Checkout hanya tersedia untuk customer yang login.

Flow utama:

```text
Cart
↓
Validate Items
↓
Select Address
↓
Retrieve Shipping Rates
↓
Select Shipping Service
↓
Apply Voucher (optional)
↓
Review Order
↓
Validate Wallet Balance
↓
Create Order Transaction
↓
Wallet Debit
↓
Order Success
```

---

# 18. Shipping Rate Retrieval

Sistem menggunakan Biteship untuk memperoleh shipping rates.

Source data:

### Origin

Dari `store_settings`:

- origin contact
- origin address
- postal code / area ID / coordinate

### Destination

Dari selected `user_addresses`.

### Items

Dari:

- books
- cart_items

Minimum item data yang tersedia pada sistem:

- name
- value
- quantity
- weight

Optional item data:

- description
- category
- SKU
- height
- length
- width

---

# 19. Store Shipping Settings

Karena single-store, origin disimpan pada `store_settings`.

Store settings mencakup:

- store name
- WhatsApp number
- email
- phone
- address
- couriers
- shipper contact
- shipper organization
- origin contact
- origin address
- origin location data

Biteship API credential tidak boleh disimpan di database.

Credential harus berada pada:

```text
.env
config/services.php
```

---

# 20. Shipping Service Selection

Customer memilih salah satu shipping option hasil rate retrieval.

Data penting selected rate yang dipakai UI dan persisted ke shipment:

- courier company
- courier type
- courier service name
- price
- duration

Response lengkap provider dapat disimpan sebagai JSON `rate_response` untuk audit/debugging.

Tidak perlu menormalisasi seluruh field response menjadi kolom database jika website tidak menggunakannya.

---

# 21. Order Calculation

Backend adalah source of truth.

## 21.1 Item Subtotal

Untuk setiap item:

```text
item subtotal =
current book price × quantity
```

---

## 21.2 Order Subtotal

```text
subtotal =
SUM(order item subtotal)
```

---

## 21.3 Voucher Discount

```text
voucher_discount =
validated voucher result
```

Jika tidak ada voucher:

```text
voucher_discount = 0
```

---

## 21.4 Shipping Cost

```text
shipping_cost =
selected shipping rate charged to customer
```

Jika satu order menggunakan beberapa shipment, business layer harus memastikan total biaya shipping order konsisten dengan shipment strategy.

---

## 21.5 Total

```text
total =
subtotal
- voucher_discount
+ shipping_cost
```

---

## 21.6 Wallet Amount

Pada wallet-only checkout:

```text
wallet_amount = total
```

`wallet_amount` menyimpan saldo yang benar-benar didebit dari customer.

Nilai ini menjadi referensi refund ketika full cancellation.

---

# 22. Checkout Transaction

Checkout wajib menggunakan database transaction dan row locking pada resource kritis.

Recommended flow:

```text
START TRANSACTION

1. Load authenticated customer
2. Lock wallet
3. Load cart and items
4. Reload/lock relevant ready-stock books
5. Validate all books active
6. Validate quantities
7. Validate ready stock
8. Recalculate current prices
9. Validate voucher
10. Validate selected shipping data
11. Calculate subtotal
12. Calculate voucher discount
13. Calculate shipping cost
14. Calculate total
15. Validate wallet balance >= total
16. Generate unique order code
17. Create order
18. Create order item snapshots
19. Create immutable shipping address snapshot
20. Create voucher usage if applicable
21. Reduce ready stock
22. Create stock movements
23. Debit wallet
24. Create wallet transaction (order_payment)
25. Set payment status paid
26. Create initial order status history
27. Clear cart
28. COMMIT
```

Jika salah satu langkah gagal:

```text
ROLLBACK
```

Tidak boleh terjadi kondisi seperti:

- wallet terpotong tetapi order gagal dibuat
- order dibuat tetapi wallet tidak terpotong
- stok berkurang tetapi order gagal
- voucher usage tercatat tetapi checkout gagal

---

# 23. Order Code

Setiap order mempunyai public identifier unik.

Contoh:

```text
ORD-K7X29P4D
```

Requirement:

- unique
- tidak menggunakan database ID langsung
- mudah ditampilkan
- digunakan untuk support/customer reference

Database ID tetap digunakan sebagai internal key.

---

# 24. Order Item Snapshot

Order tidak boleh bergantung sepenuhnya pada current book master.

Setiap `order_items` menyimpan snapshot:

- name
- description
- category
- SKU
- value
- quantity
- weight
- dimensions
- ISBN
- author
- subtotal
- sale type
- preorder estimated date
- preorder ready timestamp

Tujuan:

Jika admin mengubah:

- title
- price
- description
- author
- ISBN
- dimensions
- weight
- preorder estimation

histori order lama tetap menampilkan informasi pada saat checkout.

---

# 25. Shipping Address Snapshot

Alamat reusable customer disimpan di `user_addresses`.

Saat checkout, selected address disalin ke:

```text
order_shipping_addresses
```

Snapshot mencakup seluruh destination data yang relevan.

Jika customer kemudian:

- mengedit alamat
- mengganti nomor telepon
- mengganti penerima
- menghapus address

historical order tetap menggunakan alamat yang digunakan pada checkout.

---

# 26. Order Status

Order status:

```text
pending
waiting_preorder
processing
packing
shipping
completed
cancelled
```

---

## 26.1 Pending

Order baru berhasil dibuat dan masuk ke proses fulfillment.

---

## 26.2 Waiting Preorder

Order mengandung item preorder yang belum siap dipenuhi.

---

## 26.3 Processing

Item order sedang diproses dan disiapkan untuk fulfillment.

---

## 26.4 Packing

Barang sedang dikemas.

---

## 26.5 Shipping

Barang telah masuk proses pengiriman.

---

## 26.6 Completed

Pesanan selesai.

---

## 26.7 Cancelled

Pesanan dibatalkan.

---

# 27. Order Status Lifecycle

## 27.1 Ready Stock Order

Recommended:

```text
pending
↓
processing
↓
packing
↓
shipping
↓
completed
```

---

## 27.2 Order Containing Preorder

Recommended:

```text
pending
↓
waiting_preorder
↓
processing
↓
packing
↓
shipping
↓
completed
```

---

## 27.3 Cancellation

Cancellation dapat terjadi dari eligible pre-shipment states.

Contoh:

```text
pending → cancelled
waiting_preorder → cancelled
processing → cancelled
packing → cancelled
```

Namun cancellation hanya diperbolehkan jika shipment belum berada pada kondisi yang dianggap sudah dikirim.

---

# 28. Order Payment Status

Payment status:

```text
unpaid
paid
partially_refunded
refunded
```

Dalam successful wallet checkout, payment status harus menjadi:

```text
paid
```

setelah wallet debit berhasil.

`unpaid` dapat digunakan sebagai transitional/internal state sebelum wallet debit selesai dalam transaction, tetapi successful committed checkout seharusnya konsisten dengan pembayaran wallet.

`partially_refunded` disediakan untuk kebutuhan partial refund/future use.

Full cancellation refund:

```text
paid → refunded
```

---

# 29. Order Status History

`orders.status` menyimpan current state.

`order_status_histories` menyimpan immutable timeline.

Setiap perubahan status wajib membuat history.

History menyimpan:

- order
- status
- changed by
- note
- created at

Contoh:

```text
26 Sep 10:00 - pending
26 Sep 10:05 - processing
26 Sep 13:00 - packing
27 Sep 09:00 - shipping
29 Sep 15:00 - completed
```

---

# 30. Preorder Fulfillment

## 30.1 Preorder Identification

`order_items.sale_type = preorder`

menandai item sebagai PO.

---

## 30.2 Estimated Date Snapshot

`preorder_estimated_date` merupakan snapshot estimasi pada saat purchase.

---

## 30.3 Preorder Ready

Ketika item sudah tersedia:

```text
preorder_ready_at
```

diisi.

Jika semua requirement fulfillment order sudah terpenuhi, order dapat berubah dari:

```text
waiting_preorder
→ processing
```

---

## 30.4 Preorder Stock Policy

`books.stock` merepresentasikan physical ready stock.

Membuat preorder tidak otomatis berarti physical stock dikurangi.

Ketika physical preorder stock datang atau dialokasikan, perubahan inventory dapat menggunakan:

```text
preorder_fulfillment
```

pada stock movement sesuai implementation policy.

---

# 31. Shipment Architecture

Satu order dapat mempunyai satu atau lebih shipment.

Relasi:

```text
orders
  └── shipments
        └── shipment_items
              └── order_items
```

Tujuan:

- mendukung split shipment
- mendukung ready-stock + preorder dalam satu checkout
- mengetahui item apa saja yang terdapat di setiap shipment

---

# 32. Shipment Code

Setiap shipment mempunyai kode unik.

Contoh:

```text
SHP-20260926-A82KD
```

Kode dapat digunakan sebagai provider reference identifier ketika membuat shipment Biteship.

---

# 33. Shipment Required Data

Shipment menyimpan data inti yang benar-benar digunakan aplikasi:

- order
- shipment code
- courier company
- courier type
- delivery type
- courier service name
- selected rate price
- duration
- selected rate response JSON
- Biteship order ID
- tracking ID
- waybill ID
- courier link
- Biteship status
- raw response payload
- normalized shipment status

Website tidak menyediakan COD sehingga field COD tidak diperlukan.

---

# 34. Shipment Items

`shipment_items` menentukan item dan quantity yang benar-benar terdapat dalam sebuah shipment.

Data:

- shipment
- order item
- quantity

Constraint:

```text
(shipment_id, order_item_id) unique
```

Contoh:

```text
Order:
Atomic Habits × 2
Limited Edition × 1 PO

Shipment A:
Atomic Habits × 2

Shipment B:
Limited Edition × 1
```

---

# 35. Biteship Create Shipment Flow

Recommended flow:

```text
Order Ready for Shipment
↓
Determine shipment items
↓
Use order shipping address snapshot
↓
Use store origin settings
↓
Use selected courier/company/type
↓
Build item payload from order_items + shipment_items
↓
Create Biteship order
↓
Store biteship_order_id
↓
Store tracking_id
↓
Store waybill_id
↓
Update shipment status
```

If provider call fails, local fulfillment state must remain recoverable and must not falsely mark shipment as shipped.

---

# 36. Shipment Status

Normalized shipment status:

```text
pending
booked
pickup
in_transit
delivered
cancelled
failed
```

---

## 36.1 Pending

Shipment record exists but provider booking/process has not completed.

## 36.2 Booked

Shipment has been successfully registered/booked.

## 36.3 Pickup

Courier has picked up the package.

## 36.4 In Transit

Package is moving through courier network.

## 36.5 Delivered

Package has been delivered.

## 36.6 Cancelled

Shipment was cancelled.

## 36.7 Failed

Shipment creation/process failed.

---

# 37. Shipment Tracking History

`shipments.status` menyimpan current normalized state.

`shipment_status_histories` menyimpan timeline provider events.

History menyimpan:

- shipment
- normalized status
- provider status
- description
- occurred_at
- raw payload
- created_at

Webhook/tracking update dapat menambahkan history baru.

Raw payload disimpan untuk:

- troubleshooting
- audit
- debugging provider differences

---

# 38. Customer Shipment Page

Customer dapat melihat daftar shipment yang terkait dengan order miliknya.

Minimal informasi list:

- shipment code
- order code
- courier
- service
- tracking/waybill jika tersedia
- current shipment status
- duration/estimate yang tersedia

Detail dapat menampilkan:

- item dalam shipment
- courier
- tracking identifiers
- tracking timeline
- destination summary
- link courier jika tersedia

---

# 39. Order Cancellation

## 39.1 Cancellation Requirement

Customer atau admin dapat membatalkan order **sebelum buku benar-benar dikirim**.

Cancellation tidak boleh hanya bergantung pada tombol frontend.

Backend harus memvalidasi:

- order ownership / admin authority
- current order state
- payment state
- shipment state
- stock restoration state
- refund state

---

## 39.2 Recommended Cancellable States

Order dapat dipertimbangkan cancellable ketika:

```text
pending
waiting_preorder
processing
packing
```

dengan syarat tidak ada shipment yang sudah memasuki:

```text
pickup
in_transit
delivered
```

Jika shipment sudah booked tetapi belum pickup, cancellation provider perlu diselesaikan sesuai integration flow sebelum order dianggap aman untuk direfund.

---

## 39.3 Non-Cancellable States

Customer tidak boleh cancel ketika fulfillment telah dianggap dikirim.

Minimal:

```text
shipping
completed
```

atau ketika salah satu shipment sudah:

```text
pickup
in_transit
delivered
```

---

# 40. Cancellation Refund

Jika order telah dibayar menggunakan wallet dan cancellation valid:

```text
refund amount = orders.wallet_amount
```

Bukan voucher discount dan bukan arbitrary frontend total.

Flow:

```text
Cancel Request
↓
Validate Cancellable
↓
Lock Order
↓
Validate payment_status != refunded
↓
Cancel eligible provider shipment if required
↓
Lock Wallet
↓
Credit wallet by wallet_amount
↓
Create wallet transaction:
  type = order_refund
  direction = credit
↓
Restore eligible ready stock
↓
Create stock movement cancellation
↓
Set order.payment_status = refunded
↓
Set order.status = cancelled
↓
Create order status history
↓
COMMIT
```

---

# 41. Cancellation Atomicity

Cancellation harus menggunakan database transaction dan row locking.

Tujuan:

- mencegah double refund
- mencegah stock restore dua kali
- mencegah order berubah saat cancellation
- menjaga wallet ledger konsisten

Recommended:

```text
lock order
lock wallet
lock relevant inventory rows
```

Idempotency guard:

```text
if payment_status == refunded
→ do not refund again
```

---

# 42. Stock Management

## 42.1 Current Stock

`books.stock` menyimpan current physical ready stock.

---

## 42.2 Stock Ledger

Setiap perubahan stock dicatat di:

```text
book_stock_movements
```

Movement types:

```text
initial
adjustment_in
adjustment_out
order
cancellation
preorder_fulfillment
```

---

## 42.3 Initial Stock

Contoh:

```text
stock_before = 0
quantity = +20
stock_after = 20
type = initial
```

---

## 42.4 Manual Adjustment In

```text
stock_before = 20
quantity = +5
stock_after = 25
type = adjustment_in
```

---

## 42.5 Manual Adjustment Out

```text
stock_before = 25
quantity = -2
stock_after = 23
type = adjustment_out
```

---

## 42.6 Ready Stock Order

```text
stock_before = 20
quantity = -3
stock_after = 17
type = order
```

---

## 42.7 Cancellation Restore

Jika item memang sebelumnya mengurangi stock:

```text
stock_before = 17
quantity = +3
stock_after = 20
type = cancellation
```

System tidak boleh mengembalikan stok untuk preorder yang tidak pernah mengurangi physical stock.

---

# 43. Inventory Concurrency

Checkout ready stock harus mencegah overselling.

Backend harus:

- reload current stock
- lock relevant book row jika perlu
- validate quantity
- update stock dalam transaction
- create movement dalam transaction

Dua concurrent checkout tidak boleh dapat membeli unit fisik yang sama melebihi stock.

---

# 44. Customer Dashboard

Dashboard customer menggunakan shared authenticated layout.

Recommended summary:

- current wallet balance
- pending top-up
- active orders
- preorder orders
- active shipments
- completed orders
- recent wallet transactions
- recent orders

Quick actions:

- Belanja Buku
- Lihat Cart
- Top Up Saldo
- Lihat Pesanan
- Kelola Alamat

---

# 45. Customer Navigation

Recommended:

```text
Dashboard
Pesanan Saya
Pengiriman
Keranjang
Saldo
  - Top Up
  - Riwayat Saldo
Alamat Saya
Profile
Kembali ke Toko
```

Navigation dapat dibuat role-aware dari satu shared sidebar.

---

# 46. Customer Order List

Customer hanya melihat order miliknya.

List minimal:

- order code
- item summary
- total
- order status
- payment status
- created date
- shipment summary

Filter recommended:

- active
- preorder
- shipping
- completed
- cancelled

---

# 47. Customer Order Detail

Menampilkan:

## Order

- order code
- created at
- status
- payment status

## Items

- cover
- name
- author
- quantity
- unit value
- subtotal
- ready stock / preorder
- preorder estimated date jika ada

## Pricing

- subtotal
- voucher discount
- shipping cost
- total
- wallet amount

## Address

- immutable order shipping address snapshot

## Voucher

- voucher code/name jika ada
- discount amount

## Shipment

- one or multiple shipment
- courier
- tracking
- status

## Timeline

- order status history

## Cancellation

Tombol cancel hanya tampil jika backend menyatakan order masih cancellable.

Frontend visibility bukan security rule.

---

# 48. Customer Wallet Page

Menampilkan:

- current balance
- top-up CTA
- transaction history

Transaction list:

- date
- type
- direction
- amount
- balance after
- related order/top-up jika ada

Credit/debit harus mudah dibedakan secara visual.

---

# 49. Customer Top-up Page

## Create Top-up

Form:

- requested amount
- payment proof image

Tidak ada input:

- bank name
- account number
- account holder
- ATM information

## Top-up List

Menampilkan:

- topup code
- requested amount
- credited amount
- status
- created date
- reviewed date
- admin note jika relevan

---

# 50. Admin Dashboard

Admin dashboard menampilkan operational overview.

Recommended metrics:

- total customers
- active books
- ready stock books
- preorder books
- total stock
- orders today
- pending orders
- waiting preorder
- processing
- packing
- shipping
- completed
- cancelled
- pending top-ups
- approved top-ups
- active shipments
- low-stock books

Recommended sections:

- recent orders
- pending top-up reviews
- low stock
- preorder needing attention
- shipments needing attention

---

# 51. Admin Navigation

Recommended:

```text
Dashboard

Catalog
  Books
  Categories

Orders

Shipping
  Shipments

Customers

Wallet
  Top Up Requests
  Wallet Transactions

Promotions
  Vouchers

Inventory
  Stock
  Stock History

Settings
```

---

# 52. Admin Customer Management

Admin dapat melihat customer list.

Minimal:

- name
- email
- phone
- current wallet balance
- total order count
- account created date

Detail customer dapat menampilkan:

- profile
- addresses
- wallet balance
- wallet transaction history
- top-up history
- order history
- shipment history

Admin tidak boleh melihat atau menyimpan customer bank/ATM information karena data tersebut bukan bagian sistem.

---

# 53. Admin Top-up Management

Admin top-up list:

- topup code
- customer
- requested amount
- current status
- created at

Detail:

- customer
- requested amount
- proof image
- status
- credited amount
- review information
- admin note

Actions:

```text
Approve
Reject
```

Top-up yang bukan pending tidak boleh diproses ulang.

---

# 54. Admin Voucher Management

Admin dapat:

- create
- edit
- activate/deactivate
- soft delete
- view usage

Form fields:

- code
- name
- description
- type
- value
- max discount
- min order
- usage limit
- per-user limit
- starts at
- ends at
- active

Validation harus sesuai voucher type.

---

# 55. Admin Book Management

Admin dapat:

- list books
- create
- detail
- edit
- soft delete
- activate/deactivate
- upload multiple images
- manage categories
- edit ready stock / preorder configuration
- maintain shipping physical data

Book form minimal:

- title
- slug
- ISBN
- SKU
- author
- description
- price
- stock
- category
- shipping category
- weight
- dimensions
- sale type
- preorder estimated date
- preorder note
- active

---

# 56. Admin Inventory Management

Inventory page menampilkan current stock.

Admin dapat membuat manual adjustment:

```text
adjustment_in
adjustment_out
```

Setiap adjustment wajib mencatat:

- book
- admin
- quantity signed
- stock before
- stock after
- type
- note
- created at

Tidak boleh mengubah stock tanpa corresponding stock movement.

---

# 57. Admin Order Management

Order list minimal:

- order code
- customer
- item count
- subtotal
- discount
- shipping
- total
- status
- payment status
- created at

Search:

- order code
- customer name
- email
- phone
- item/book name

Filter:

- order status
- payment status
- date
- ready/preorder composition jika dibutuhkan

Admin detail menampilkan seluruh data yang juga tersedia pada customer order detail ditambah operational actions.

---

# 58. Admin Shipment Management

Shipment list:

- shipment code
- order code
- customer
- courier
- service
- price
- tracking/waybill
- provider status
- normalized status
- updated at

Admin dapat:

- membuka detail
- membuat provider shipment ketika ready
- retry ketika creation failed sesuai policy
- melihat raw response
- melihat tracking history
- cancel shipment jika provider/business state mengizinkan

---

# 59. Admin Store Settings

Store setting merupakan single row / single-store configuration.

Admin dapat mengelola:

- store name
- WhatsApp
- email
- phone
- address
- enabled couriers
- shipper contact
- shipper organization
- origin contact
- origin address
- origin postal code
- origin area ID
- origin location ID
- origin coordinates

API key Biteship tidak boleh diedit melalui database settings apabila credential dikelola melalui environment.

---

# 60. Shared UI Components

Komponen reusable direkomendasikan untuk admin dan customer jika behavior sama.

Contoh:

```text
OrderStatusBadge
PaymentStatusBadge
ShipmentStatusBadge
TopupStatusBadge
OrderTimeline
ShipmentTimeline
MoneyFormatter
BookThumbnail
Pagination
EmptyState
```

Page admin/customer tetap boleh terpisah karena query dan actions berbeda.

---

# 61. Suggested Frontend Structure

```text
resources/js/
├── layouts/
│   ├── app-layout.tsx
│   └── customer-layout.tsx
│
├── pages/
│   ├── admin/
│   │   ├── dashboard.tsx
│   │   ├── books/
│   │   ├── categories/
│   │   ├── orders/
│   │   ├── shipments/
│   │   ├── customers/
│   │   ├── topups/
│   │   ├── vouchers/
│   │   ├── inventory/
│   │   └── settings/
│   │
│   └── customer/
│       ├── dashboard.tsx
│       ├── cart/
│       ├── checkout/
│       ├── orders/
│       ├── shipments/
│       ├── wallet/
│       ├── topups/
│       └── addresses/
│
└── components/
    ├── shared/
    ├── admin/
    └── customer/
```

---

# 62. Suggested Backend Structure

Recommended controller grouping:

```text
app/Http/Controllers/
├── Admin/
└── Customer/
```

Business logic tidak diletakkan seluruhnya di controller.

Recommended Services / Actions:

```text
CheckoutService
TopupApprovalService
OrderCancellationService
VoucherService
WalletService
BiteshipService
ShipmentService
StockService
PreorderFulfillmentService
```

Form Request digunakan untuk input validation.

Enums Laravel digunakan untuk status/type yang berkorespondensi dengan enum database.

---

# 63. Suggested Public Routes

```text
/
```

Homepage.

```text
/books
```

Catalog.

```text
/books/{slug}
```

Book detail.

Authentication routes:

```text
/login
/register
```

---

# 64. Suggested Customer Routes

```text
/dashboard

/cart

/checkout

/orders
/orders/{order}

/shipments
/shipments/{shipment}

/wallet
/wallet/transactions

/topups
/topups/create
/topups/{topup}

/addresses
/addresses/create
/addresses/{address}/edit

/profile
```

Action routes dapat menggunakan POST/PATCH/DELETE sesuai Laravel conventions.

---

# 65. Suggested Admin Routes

```text
/admin

/admin/books
/admin/categories

/admin/orders
/admin/orders/{order}

/admin/shipments
/admin/shipments/{shipment}

/admin/customers
/admin/customers/{customer}

/admin/topups
/admin/topups/{topup}

/admin/wallet-transactions

/admin/vouchers

/admin/inventory
/admin/inventory/history

/admin/settings
```

Semua route admin harus protected.

---

# 66. Database Domain Map

Database mempunyai domain utama berikut:

## Identity

- `users`

## Store / Shipping Origin

- `store_settings`

## Customer Address

- `user_addresses`

## Catalog

- `categories`
- `books`
- `book_images`
- `book_categories`

## Wallet

- `wallets`
- `wallet_topups`
- `wallet_transactions`

## Cart

- `carts`
- `cart_items`

## Promotion

- `vouchers`
- `voucher_usages`

## Orders

- `orders`
- `order_items`
- `order_shipping_addresses`
- `order_status_histories`

## Shipping

- `shipments`
- `shipment_items`
- `shipment_status_histories`

## Inventory

- `book_stock_movements`

---

# 67. Key Entity Relationships

```text
USERS
├── USER_ADDRESSES
├── WALLET
│   └── WALLET_TRANSACTIONS
├── WALLET_TOPUPS
├── CART
│   └── CART_ITEMS
├── ORDERS
│   ├── ORDER_ITEMS
│   ├── ORDER_SHIPPING_ADDRESSES
│   ├── ORDER_STATUS_HISTORIES
│   ├── VOUCHER_USAGE
│   └── SHIPMENTS
│       ├── SHIPMENT_ITEMS
│       └── SHIPMENT_STATUS_HISTORIES
└── VOUCHER_USAGES

BOOKS
├── BOOK_IMAGES
├── BOOK_CATEGORIES
├── CART_ITEMS
├── ORDER_ITEMS
└── BOOK_STOCK_MOVEMENTS

VOUCHERS
└── VOUCHER_USAGES
```

---

# 68. Soft Delete and Historical Data

Master/business data yang memiliki `deleted_at` menggunakan soft delete sesuai database design:

- users
- user addresses
- categories
- books
- vouchers

Historical immutable/ledger records sebaiknya tidak dihapus dari normal application flow.

Contoh:

- wallet transactions
- order status histories
- shipment status histories
- stock movements

Order tidak perlu dihapus ketika customer membatalkan.

Gunakan:

```text
status = cancelled
```

untuk menjaga audit trail.

---

# 69. Data Integrity Requirements

System harus menjamin:

1. Email user unique.
2. Satu wallet per user.
3. Satu cart per user.
4. Satu book hanya muncul sekali per cart.
5. Category relation tidak duplicate.
6. Order code unique.
7. Shipment code unique.
8. Voucher code unique.
9. Top-up code unique.
10. Quantity cart/order/shipment harus positif.
11. Harga final tidak dipercaya dari frontend.
12. Wallet balance tidak dapat menjadi negatif akibat checkout.
13. Wallet mutation selalu mempunyai ledger record.
14. Top-up approved tidak dapat di-credit dua kali.
15. Refund tidak dapat dilakukan dua kali.
16. Ready stock tidak dapat oversell.
17. Stock mutation mempunyai stock movement.
18. Cancellation restore tidak dapat dilakukan dua kali.
19. Status change mempunyai status history.
20. Customer hanya melihat resource miliknya.
21. Order item snapshot tidak berubah mengikuti master book.
22. Order address snapshot tidak berubah mengikuti user address.
23. Voucher usage limit divalidasi server-side.
24. Shipment items tidak boleh melebihi quantity order item yang belum dialokasikan.
25. Sum shipment item quantity untuk satu order item tidak boleh melebihi purchased quantity.
26. Successful wallet checkout harus menghasilkan order, debit wallet, wallet transaction, dan item snapshot secara konsisten.
27. Tidak ada customer banking data tersimpan dalam top-up.
28. Tidak ada COD flow.

---

# 70. Validation Requirements

## 70.1 User

- name required
- email required
- email unique
- email valid
- password memenuhi security policy
- role controlled by server/admin, bukan arbitrary customer input

---

## 70.2 Book

- title required
- slug required and unique
- author required
- price >= 0
- stock >= 0
- weight > 0
- dimensions >= 0 jika diisi
- sale type valid
- preorder estimated date required by UI/business policy untuk preorder jika ditetapkan
- active boolean

---

## 70.3 Address

- destination contact name required
- destination contact phone required
- destination address required
- email valid jika ada
- harus mempunyai data lokasi yang cukup untuk shipping service yang digunakan

---

## 70.4 Cart

- book exists
- book active
- quantity integer
- quantity >= 1
- ready stock quantity <= available stock

---

## 70.5 Top-up

- requested amount > 0
- proof required
- proof valid image
- MIME allowlist
- max upload size
- pending status required before approve/reject

---

## 70.6 Voucher

- code unique
- type valid
- value > 0
- percentage mempunyai nilai dalam range business-valid
- max discount >= 0 jika ada
- min order >= 0
- usage limits positif jika ada
- ends_at > starts_at jika keduanya ada

---

## 70.7 Checkout

- authenticated customer
- cart not empty
- valid address owned by customer
- current prices recalculated
- current stock validated
- voucher revalidated
- selected shipping rate valid
- wallet balance sufficient
- transaction atomic

---

## 70.8 Cancellation

- order owned by customer atau admin authorized
- order eligible
- shipment belum dikirim
- payment not already refunded
- cancellation processed atomically

---

# 71. File Upload Requirements

File upload saat ini:

- book images
- top-up proof image

Recommended storage:

```text
storage/app/public/books/
storage/app/public/topups/
```

Requirements:

- MIME validation
- file size limit
- generated safe filename
- do not trust original filename
- database stores path only

Production dapat menggunakan S3-compatible object storage tanpa mengubah domain model secara besar.

---

# 72. Security Requirements

## Authentication

- Laravel authentication
- secure password hashing
- session protection
- CSRF protection

## Authorization

- role middleware
- policies/ownership checks
- no frontend-only permission enforcement

## Wallet

- wallet balance mutation hanya dari trusted backend service
- row locking untuk critical mutation
- immutable ledger
- no arbitrary amount from frontend

## Checkout

- backend calculates price
- backend validates stock
- backend validates voucher
- backend validates wallet

## Upload

- MIME allowlist
- extension validation
- file size validation
- randomized filename

## Biteship

- API key only in environment/config
- raw provider errors tidak diexpose ke customer

## Sensitive Data

System tidak menyimpan customer bank/ATM information pada top-up.

---

# 73. Concurrency Requirements

Critical operations harus concurrency-safe:

- checkout
- top-up approval
- wallet adjustment
- order cancellation/refund
- stock adjustment
- voucher usage allocation

Gunakan:

- DB transaction
- `lockForUpdate()` pada row yang relevan
- unique constraints
- server-side idempotency guards

---

# 74. Error Handling

Customer-facing errors:

- login failed
- book not found
- book inactive
- insufficient stock
- invalid quantity
- cart empty
- invalid address
- shipping rate unavailable
- voucher invalid
- voucher expired
- voucher limit reached
- insufficient wallet balance
- checkout failed
- top-up upload failed
- order not found
- cancellation not allowed
- shipment not found

Admin errors:

- invalid status transition
- top-up already reviewed
- wallet conflict
- duplicate voucher code
- duplicate slug
- stock adjustment conflict
- provider shipment failure
- invalid shipment state

Technical stack traces tidak boleh ditampilkan kepada end user.

---

# 75. Logging Requirements

Recommended application logs:

- authentication anomalies
- checkout failures
- stock conflicts
- wallet transaction failures
- top-up approvals/rejections
- cancellation/refund failures
- voucher validation issues
- Biteship rate failures
- Biteship create shipment failures
- webhook processing failures
- upload failures
- admin stock adjustments
- admin wallet adjustments

Logging tidak boleh memasukkan password atau secrets.

---

# 76. Performance Requirements

Minimum:

- server-side pagination
- eager loading
- avoid N+1
- index fields sesuai database
- image optimization
- lazy loading book images
- cache static category/store configuration bila diperlukan
- debounce catalog search
- paginate large wallet/order/shipment history

Important indexed/filter fields telah dirancang pada database untuk:

- email
- role
- slug
- book title/author
- order code
- order status
- payment status
- top-up status
- shipment code/status
- wallet transaction references

---

# 77. UI/UX Direction

Customer storefront:

- modern
- clean
- editorial
- premium
- book-cover focused
- white dominant
- navy identity
- easy to browse
- mobile responsive
- not marketplace-like
- not dashboard-like

Authenticated dashboard:

- consistent shared layout
- clear sidebar
- compact data presentation
- status badges
- useful empty states
- responsive

Avoid:

- excessive gradients
- glassmorphism
- oversized shadows
- generic SaaS visuals
- unnecessary card nesting

---

# 78. Brand Color Direction

Recommended brand colors:

## White

```text
#FFFFFF
```

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

UI menggunakan putih sebagai foundation dengan navy/blue sebagai identity dan actions.

---

# 79. Frontend Technology Requirements

Frontend:

- React
- TypeScript
- Inertia.js
- Tailwind CSS
- shadcn/ui

Principles:

- strict TypeScript
- reusable components
- server-driven data melalui Inertia
- avoid unnecessary global client state
- responsive design
- accessible form labels
- consistent loading/error/empty states

---

# 80. Backend Technology Requirements

Backend:

- Laravel
- MySQL

Responsibilities:

- authentication
- authorization
- catalog management
- cart
- address management
- voucher validation
- wallet
- top-up
- checkout
- order lifecycle
- preorder fulfillment
- cancellation/refund
- stock
- Biteship integration
- shipment tracking
- file storage
- transactional integrity

---

# 81. Recommended Laravel Models

Models:

```text
User
StoreSetting
UserAddress
Category
Book
BookImage
BookCategory
Wallet
WalletTopup
WalletTransaction
Cart
CartItem
Voucher
Order
OrderItem
OrderShippingAddress
VoucherUsage
OrderStatusHistory
Shipment
ShipmentItem
ShipmentStatusHistory
BookStockMovement
```

---

# 82. Recommended Model Relationships

## User

```text
hasMany(UserAddress)
hasOne(Wallet)
hasMany(WalletTopup)
hasOne(Cart)
hasMany(Order)
hasMany(VoucherUsage)
```

Admin-side relation:

```text
hasMany(WalletTopup, reviewed_by)
hasMany(Voucher, created_by)
hasMany(OrderStatusHistory, changed_by)
hasMany(BookStockMovement, changed_by)
hasMany(WalletTransaction, created_by)
```

## Book

```text
hasMany(BookImage)
belongsToMany(Category)
hasMany(CartItem)
hasMany(OrderItem)
hasMany(BookStockMovement)
```

## Wallet

```text
belongsTo(User)
hasMany(WalletTransaction)
```

## Cart

```text
belongsTo(User)
hasMany(CartItem)
```

## Order

```text
belongsTo(User)
belongsTo(UserAddress, address_id)
belongsTo(Voucher)
hasMany(OrderItem)
hasOne(OrderShippingAddress)
hasMany(OrderStatusHistory)
hasMany(Shipment)
```

## Shipment

```text
belongsTo(Order)
hasMany(ShipmentItem)
hasMany(ShipmentStatusHistory)
```

---

# 83. Dashboard Data Separation

Walaupun admin dan customer menggunakan visual layout yang sama:

- controller dipisah
- route dipisah
- query dipisah
- authorization dipisah
- page boleh dipisah
- reusable UI component boleh shared

Contoh:

```text
Admin/OrderController
Customer/OrderController
```

Customer query selalu scoped ke:

```text
user_id = authenticated user
```

---

# 84. Pagination

Server-side pagination digunakan untuk:

- public catalog
- admin books
- admin customers
- admin orders
- admin shipments
- admin top-ups
- admin wallet transactions
- vouchers jika banyak
- stock movement history
- customer orders
- customer shipments
- customer wallet transactions
- customer top-ups

---

# 85. Search and Filter Requirements

## Catalog

Search:

- title
- author
- ISBN

Filter:

- category
- ready/preorder jika dibutuhkan
- active only untuk public

## Admin Books

Search:

- title
- author
- ISBN
- SKU

Filter:

- active
- sale type
- category
- stock state

## Admin Orders

Search:

- order code
- customer
- item name

Filter:

- status
- payment status
- date

## Admin Top-ups

Search:

- topup code
- customer

Filter:

- pending
- approved
- rejected

## Shipments

Search:

- shipment code
- order code
- Biteship order ID
- tracking ID
- waybill

Filter:

- shipment status
- courier
- date

---

# 86. Empty States

Public:

- no books
- no category results
- no search results

Customer:

- empty cart
- no addresses
- no orders
- no shipments
- no wallet transactions
- no top-ups

Admin:

- no pending top-up
- no orders
- no shipment
- no voucher
- no stock history

Empty states harus memberikan action relevan.

---

# 87. Responsive Requirements

Public/customer storefront:

- mobile
- tablet
- desktop

Customer dashboard:

- mobile
- tablet
- desktop

Admin dashboard:

- desktop-first
- tablet usable
- mobile support recommended

Checkout dan top-up harus sangat usable pada mobile karena customer mungkin upload proof dari smartphone.

---

# 88. Notifications

Database saat ini tidak mendefinisikan notification domain.

MVP tidak mewajibkan:

- email notification
- SMS
- push notification
- WhatsApp Business API

UI dashboard sendiri menjadi source informasi status.

Future enhancement dapat menambahkan notification system tanpa mengubah core order domain.

---

# 89. Testing Scope

Automated tests minimal mencakup domain kritis.

## 89.1 Authentication

- customer register
- customer login
- admin login
- customer tidak dapat membuka admin route
- guest tidak dapat membuka protected dashboard

---

## 89.2 Cart

- add item
- duplicate add increases quantity
- update quantity
- remove item
- ready stock quantity validation
- inactive book cannot be purchased

---

## 89.3 Address

- customer CRUD own address
- customer cannot modify other user address
- default address behavior
- address snapshot remains after source edit

---

## 89.4 Top-up

- customer can upload proof
- no bank data required
- top-up starts pending
- admin can approve pending request
- approve credits wallet once
- approve creates wallet ledger
- second approve is blocked
- reject does not change balance

---

## 89.5 Voucher

- fixed voucher
- percentage voucher
- max discount
- min order
- start/end time
- usage limit
- per-user limit
- inactive voucher rejected

---

## 89.6 Checkout

- multi-book checkout succeeds
- price recalculated server-side
- voucher applied
- shipping included
- wallet sufficient
- wallet debit created
- order items snapshotted
- address snapshotted
- stock reduced for ready stock
- stock movements created
- cart cleared
- insufficient wallet fails without partial mutation
- insufficient stock fails without wallet debit

---

## 89.7 Preorder

- preorder can be ordered according to policy
- preorder snapshot retained
- waiting_preorder status
- preorder ready timestamp
- transition to processing

---

## 89.8 Cancellation

- eligible order can cancel
- non-eligible shipped order cannot cancel
- wallet refunded
- order payment becomes refunded
- order status becomes cancelled
- wallet transaction order_refund created
- ready stock restored only if previously deducted
- stock movement cancellation created
- double cancellation cannot double refund
- double cancellation cannot restore stock twice

---

## 89.9 Shipment

- shipment can contain subset of order items
- shipment quantity cannot exceed purchased quantity
- Biteship response identifiers saved
- tracking history inserted
- customer cannot view other user's shipment
- failed provider request handled safely

---

## 89.10 Inventory

- initial stock
- adjustment in
- adjustment out
- order deduction
- cancellation restoration
- concurrent ready-stock checkout does not oversell

---

# 90. Seed Data

Development seed recommended:

## Admin

One admin account.

## Customer

One sample customer.

## Store Setting

One store configuration including shipping origin.

## Categories

Sample categories.

## Books

Sample ready-stock and preorder books.

## Wallet

Sample customer wallet.

## Voucher

At least:

- one fixed
- one percentage

---

# 91. MVP Scope

MVP dianggap selesai ketika fitur berikut berfungsi end-to-end.

## Customer

- register/login/logout
- browse catalog
- book detail
- multi-book cart
- manage addresses
- see wallet balance
- submit top-up proof
- see top-up status
- receive approved top-up balance
- retrieve shipping options
- select courier
- apply voucher
- checkout using wallet
- see orders
- see preorder state
- see shipment
- see tracking timeline
- cancel eligible order
- receive wallet refund after cancellation
- view wallet transaction history

## Admin

- login/logout
- dashboard
- customer list/detail
- CRUD books
- multiple book images
- categories
- inventory adjustment/history
- top-up review
- wallet transaction history
- voucher management
- order list/detail
- order status management
- preorder handling
- shipment/Biteship handling
- shipment tracking
- store/shipping settings

---

# 92. Future Enhancements

Potential future features:

- payment gateway for automatic wallet top-up
- automatic bank transfer verification
- WhatsApp Business API
- email notifications
- push notifications
- wishlist
- product review/rating
- invoice PDF
- printable packing slip
- revenue report
- inventory threshold configuration
- low-stock notification
- export CSV/Excel
- dashboard analytics
- bestseller
- book recommendations
- promotional banners
- loyalty/reward program
- multi-warehouse
- advanced returns/RMA
- partial cancellation UI
- partial refund workflow

Future features should not compromise immutable wallet/order/inventory audit trails.

---

# 93. Acceptance Criteria

Produk dianggap memenuhi requirement ketika:

1. Admin dan customer dapat login sesuai role.
2. Customer baru dapat mempunyai wallet.
3. Customer dapat mempunyai satu active cart.
4. Customer dapat menambahkan beberapa jenis buku ke cart.
5. Satu buku tidak duplicate sebagai row terpisah dalam cart.
6. Public dapat melihat buku aktif.
7. Admin dapat CRUD buku.
8. Buku dapat memiliki banyak gambar.
9. Buku dapat mempunyai banyak kategori.
10. Buku memiliki physical shipping information termasuk weight.
11. Buku mendukung ready stock.
12. Buku mendukung preorder.
13. Customer dapat menyimpan beberapa alamat.
14. Customer dapat menentukan alamat checkout.
15. Address snapshot tersimpan pada order.
16. Sistem dapat meminta shipping rate menggunakan data store/address/item.
17. Customer dapat memilih shipping option.
18. Customer dapat melihat saldo.
19. Customer dapat membuat top-up.
20. Top-up hanya membutuhkan requested amount dan proof image dari customer.
21. Tidak ada data bank/ATM customer disimpan.
22. Admin dapat approve top-up.
23. Approved top-up menambah wallet.
24. Approved top-up membuat immutable wallet transaction.
25. Top-up tidak dapat di-credit dua kali.
26. Admin dapat reject top-up tanpa mengubah wallet.
27. Admin dapat membuat fixed voucher.
28. Admin dapat membuat percentage voucher.
29. Voucher limit tervalidasi server-side.
30. Customer dapat menggunakan maksimum satu voucher pada sebuah order.
31. Checkout mendukung beberapa order items.
32. Backend menghitung ulang harga.
33. Backend menghitung subtotal.
34. Backend menghitung discount.
35. Backend menghitung shipping cost.
36. Backend menghitung total.
37. Wallet balance divalidasi.
38. Successful checkout mendebit wallet.
39. Successful checkout membuat `order_payment` ledger.
40. Successful checkout menyimpan item snapshot.
41. Successful checkout menyimpan address snapshot.
42. Successful ready-stock checkout mengurangi stock.
43. Perubahan stock menghasilkan stock movement.
44. Cart dikosongkan setelah checkout sukses.
45. Checkout gagal tidak boleh meninggalkan partial mutation.
46. Preorder order dapat masuk `waiting_preorder`.
47. Preorder estimated date tersnapshot.
48. Order dapat memiliki lebih dari satu shipment.
49. Shipment mempunyai shipment items.
50. Shipment menyimpan courier company/type/service.
51. Shipment menyimpan selected price dan duration.
52. Shipment dapat menyimpan Biteship order/tracking/waybill IDs.
53. Shipment mempunyai current normalized status.
54. Shipment mempunyai tracking history.
55. Customer hanya melihat shipment miliknya.
56. Customer hanya melihat order miliknya.
57. Admin dapat melihat semua order/shipment.
58. Eligible order dapat dicancel sebelum dikirim.
59. Cancelled paid order mengembalikan wallet amount.
60. Refund membuat `order_refund` wallet transaction.
61. Refund tidak dapat terjadi dua kali.
62. Ready stock yang pernah dikurangi dikembalikan ketika cancellation.
63. Stock restore tidak dapat terjadi dua kali.
64. Order berubah menjadi `cancelled`.
65. Payment berubah menjadi `refunded` pada full refund.
66. Setiap perubahan order status tercatat dalam history.
67. Admin/customer authorization dilakukan di backend.
68. Wallet mutation menggunakan transaction/locking.
69. Checkout menggunakan transaction/locking.
70. Cancellation/refund menggunakan transaction/locking.
71. Inventory update concurrency-safe.
72. Biteship API key tidak tersimpan di database.
73. Sistem tidak menyediakan COD.
74. Website tetap single-store tanpa tenant.
75. Seluruh primary key domain menggunakan bigint auto increment sesuai database design.

---

# 94. Definition of Done

Feature dianggap selesai jika:

- functional requirement terpenuhi
- backend authorization tersedia
- Form Request validation tersedia
- transaction digunakan untuk operasi finansial/inventory kritis
- database relationship benar
- TypeScript types tersedia
- responsive UI tersedia
- loading state tersedia
- empty state tersedia
- error state tersedia
- feature test untuk critical business flow tersedia
- tidak ada N+1 yang jelas
- tidak ada frontend price sebagai source of truth
- tidak ada sensitive credential disimpan di database
- data audit/history yang diperlukan tercatat

---

# 95. Final Product Summary

Buku Order merupakan single-store book e-commerce dengan dua role utama: admin dan customer.

Core transaction flow:

```text
Customer Register/Login
↓
Browse Catalog
↓
Add Multiple Books to Cart
↓
Manage/Select Address
↓
Retrieve Biteship Shipping Rate
↓
Select Courier
↓
Apply Voucher
↓
Check Wallet
↓
Checkout
↓
Wallet Debit
↓
Create Multi-Item Order
↓
Ready Stock / Preorder Fulfillment
↓
Create One or Multiple Shipments
↓
Biteship Tracking
↓
Completed
```

Wallet funding flow:

```text
Customer Top Up
↓
Enter Amount
↓
Upload Transfer Proof
↓
Pending
↓
Admin Review
↓
Approved
↓
Wallet Credit
↓
Wallet Transaction Ledger
```

Cancellation flow:

```text
Eligible Pre-Shipment Order
↓
Validate Shipment State
↓
Cancel Provider Shipment if Necessary
↓
Refund Wallet
↓
Restore Eligible Stock
↓
Create Wallet + Stock Audit Records
↓
Order Cancelled
↓
Payment Refunded
```

Arsitektur ini dirancang agar histori order, saldo, stock, voucher, address, preorder, dan shipment tetap dapat diaudit serta konsisten meskipun master data berubah di masa depan.
