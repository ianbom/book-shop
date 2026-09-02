// ======================================================
// ENUMS
// ======================================================

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

// ======================================================
// USERS / ADMIN
// ======================================================
// Hanya admin yang memiliki akun.
// Customer tidak login dan tidak memiliki akun.

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

// ======================================================
// STORE SETTINGS
// ======================================================
// Konfigurasi toko.
// Karena hanya satu toko, biasanya hanya memiliki satu record.

Table store_settings {
id bigint [pk, increment]

store_name varchar(150) [not null]

whatsapp_number varchar(30) [not null]

email varchar(150)

address text

created_at timestamp

updated_at timestamp
}

// ======================================================
// CATEGORIES
// ======================================================

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

// ======================================================
// BOOKS
// ======================================================

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

// ======================================================
// BOOK IMAGES
// ======================================================
// Satu buku dapat memiliki banyak gambar.

Table book_images {
id bigint [pk, increment]

book_id bigint [not null]

image_path varchar(500) [not null]

alt_text varchar(255)

sort_order integer [not null, default: 0]

is_primary boolean [not null, default: false]

created_at timestamp

updated_at timestamp

indexes {
book_id
(book_id, sort_order)
}
}

// ======================================================
// BOOK CATEGORIES
// ======================================================
// Many-to-many.
//
// Satu buku dapat memiliki banyak kategori.
// Satu kategori dapat memiliki banyak buku.

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

// ======================================================
// ORDERS
// ======================================================
// SATU ORDER HANYA BOLEH MEMILIKI SATU JENIS BUKU.
//
// Contoh:
//
// Buku A × 3 → BOLEH
//
// Buku A × 1
// Buku B × 2 → TIDAK BOLEH
//
// Karena itu tidak diperlukan tabel order_items.
//
// Data buku tertentu juga disimpan sebagai snapshot supaya
// histori transaksi tidak berubah ketika data buku berubah.

Table orders {
id bigint [pk, increment]

order_code varchar(50) [not null, unique]

// CUSTOMER SNAPSHOT

customer_name varchar(150) [not null]

customer_phone varchar(30) [not null]

customer_email varchar(150)

customer_address text [not null]

customer_note text

// BOOK

book_id bigint [not null]

book_title varchar(255) [not null]

book_isbn varchar(50)

book_author varchar(200)

// PRICE & QUANTITY

unit_price decimal(15,2) [not null]

quantity integer [not null]

subtotal decimal(15,2) [not null]

shipping_cost decimal(15,2) [not null, default: 0]

total decimal(15,2) [not null]

// CURRENT STATUS

status order_status [not null, default: 'pending']

payment_status payment_status [not null, default: 'unpaid']

// LARAVEL TIMESTAMPS

created_at timestamp

updated_at timestamp

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

// ======================================================
// PAYMENT PROOFS
// ======================================================
// Customer mengirim bukti transfer melalui WhatsApp.
//
// Admin download bukti tersebut lalu menguploadnya
// ke dashboard.

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

indexes {
order_id
uploaded_by
}
}

// ======================================================
// ORDER STATUS HISTORIES
// ======================================================
// Histori perubahan status order.
//
// Contoh:
//
// pending
// ↓
// packing
// ↓
// shipping
// ↓
// completed

Table order_status_histories {
id bigint [pk, increment]

order_id bigint [not null]

status order_status [not null]

changed_by bigint

note text

created_at timestamp [not null]

indexes {
order_id
status
created_at
}
}

// ======================================================
// BOOK STOCK MOVEMENTS
// ======================================================
// books.stock
// = jumlah stok terkini.
//
// book_stock_movements
// = histori perubahan stok.

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

indexes {
book_id
order_id
changed_by
type
created_at
}
}

// ======================================================
// RELATIONSHIPS
// ======================================================

// BOOKS → BOOK IMAGES
Ref: book_images.book_id > books.id

// BOOKS ↔ CATEGORIES
Ref: book_categories.book_id > books.id

Ref: book_categories.category_id > categories.id

// BOOKS → ORDERS
Ref: orders.book_id > books.id

// ORDERS → PAYMENT PROOFS
Ref: payment_proofs.order_id > orders.id

Ref: payment_proofs.uploaded_by > users.id

// ORDERS → STATUS HISTORIES
Ref: order_status_histories.order_id > orders.id

Ref: order_status_histories.changed_by > users.id

// BOOKS → STOCK MOVEMENTS
Ref: book_stock_movements.book_id > books.id

Ref: book_stock_movements.order_id > orders.id

Ref: book_stock_movements.changed_by > users.id
