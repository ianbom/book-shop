// ======================================================
// BUKU ORDER - COMPLETE DATABASE DESIGN
// DBML for dbdiagram.io
// ======================================================
//
// Features:
// - Admin + Customer authentication
// - Customer dashboard
// - Wallet / saldo
// - Manual top-up with transfer proof + admin approval
// - Reusable customer addresses
// - Multi-book cart
// - Voucher
// - Ready stock + Preorder
// - Wallet checkout
// - Biteship Rates + Create Order integration
// - Multiple shipments per order
// - Shipment tracking history
// - Inventory audit trail
//
// Notes:
// - Biteship API key belongs in .env, NOT in database.
// - Shipping column names are intentionally aligned as closely
//   as possible with Biteship request/response JSON.
// ======================================================


// ======================================================
// ENUMS
// ======================================================

Enum user_role {
  admin
  customer
}

Enum book_sale_type {
  ready_stock
  preorder
}

Enum order_status {
  pending
  waiting_preorder
  processing
  packing
  shipping
  completed
  cancelled
}

Enum order_payment_status {
  unpaid
  paid
  partially_refunded
  refunded
}

Enum topup_status {
  pending
  approved
  rejected
}

Enum wallet_transaction_type {
  topup_credit
  order_payment
  order_refund
  admin_adjustment_credit
  admin_adjustment_debit
}

Enum wallet_transaction_direction {
  credit
  debit
}

Enum voucher_type {
  fixed
  percentage
}

Enum stock_movement_type {
  initial
  adjustment_in
  adjustment_out
  order
  cancellation
  preorder_fulfillment
}

Enum shipment_status {
  pending
  booked
  pickup
  in_transit
  delivered
  cancelled
  failed
}


Enum shipment_delivery_type {
  now
  scheduled
}


// ======================================================
// USERS
// ======================================================

Table users {
  id bigint [pk, increment]

  name varchar(150) [not null]

  email varchar(150) [not null, unique]

  phone varchar(30)

  password varchar(255) [not null]

  role user_role [not null, default: 'customer']

  email_verified_at timestamp

  remember_token varchar(100)

  created_at timestamp

  updated_at timestamp

  deleted_at timestamp

  indexes {
    email [unique]
    phone
    role
  }
}


// ======================================================
// STORE SETTINGS
// ======================================================
// Single-store settings.
//
// Shipping fields intentionally follow Biteship naming.
//
// Rates API:
// - couriers
// - origin_*
//
// Create Order:
// - shipper_*
// - origin_*
// - origin_collection_method
//
// Location validation is conditional:
// Use at least one supported origin location method:
// - origin_postal_code
// - origin_area_id
// - origin_latitude + origin_longitude
//
// Instant courier requires coordinates.

Table store_settings {
  id bigint [pk, increment]

  bank_accounts json // [{bank_name, account_holder, account_number}]

  store_name varchar(150) [not null]

  whatsapp_number varchar(30)

  email varchar(150)

  phone varchar(30)

  address text


  // --------------------------------------------------
  // BITESHIP RATES API
  // Example:
  // jne,sicepat,anteraja,jnt,tiki
  // --------------------------------------------------

  couriers text [not null]


  // --------------------------------------------------
  // BITESHIP SHIPPER
  // --------------------------------------------------

  shipper_contact_name varchar(150)

  shipper_contact_phone varchar(30)

  shipper_contact_email varchar(150)

  shipper_organization varchar(150)


  // --------------------------------------------------
  // BITESHIP ORIGIN
  // --------------------------------------------------

  origin_contact_name varchar(150) [not null]

  origin_contact_phone varchar(30) [not null]

  origin_contact_email varchar(150)

  origin_address text [not null]

  origin_note text

  origin_postal_code varchar(10)

  origin_area_id varchar(150)

  origin_location_id varchar(150)

  origin_latitude decimal(10,7)

  origin_longitude decimal(10,7)



  created_at timestamp

  updated_at timestamp
}




// ======================================================
// USER ADDRESSES
// ======================================================
// Reusable customer addresses.
//
// Destination fields intentionally follow Biteship naming.
//
// At least one supported destination location method
// must be available:
// - destination_postal_code
// - destination_area_id
// - destination_latitude + destination_longitude
//
// Instant courier requires coordinates.

Table user_addresses {
  id bigint [pk, increment]

  user_id bigint [not null]

  label varchar(100)


  // --------------------------------------------------
  // BITESHIP DESTINATION
  // --------------------------------------------------

  destination_contact_name varchar(150) [not null]

  destination_contact_phone varchar(30) [not null]

  destination_contact_email varchar(150)

  destination_address text [not null]

  destination_note text

  destination_postal_code varchar(10)

  destination_area_id varchar(150)

  destination_location_id varchar(150)

  destination_latitude decimal(10,7)

  destination_longitude decimal(10,7)


  // --------------------------------------------------
  // HUMAN-READABLE ADDRESS DATA
  // --------------------------------------------------

  province_name varchar(150)

  city_name varchar(150)

  district_name varchar(150)

  subdistrict_name varchar(150)


  is_default boolean [not null, default: false]

  created_at timestamp

  updated_at timestamp

  deleted_at timestamp

  indexes {
    user_id
    destination_postal_code
    destination_area_id
    destination_location_id
    (user_id, is_default)
  }
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
// `weight` in grams.
// `height`, `length`, `width` in centimeters.
//
// Required Biteship item data:
// - name     <- title
// - value    <- price
// - quantity <- cart_items.quantity / order_items.quantity
// - weight   <- weight
//
// Shipping data is snapshotted into order_items at checkout.

Table books {
  id bigint [pk, increment]

  title varchar(255) [not null]

  slug varchar(255) [not null, unique]

  isbn varchar(50)

  sku varchar(100)

  author varchar(200) [not null]

  description text

  price decimal(15,2) [not null]


  // --------------------------------------------------
  // BITESHIP ITEM SOURCE
  // --------------------------------------------------

  shipping_category varchar(50) [not null, default: 'others']

  weight integer [not null]

  height decimal(8,2)

  length decimal(8,2)

  width decimal(8,2)


  // --------------------------------------------------
  // INVENTORY / SALES
  // --------------------------------------------------

  stock integer [not null, default: 0]

  sale_type book_sale_type [not null, default: 'ready_stock']

  preorder_estimated_date date

  preorder_note text

  is_active boolean [not null, default: true]


  created_at timestamp

  updated_at timestamp

  deleted_at timestamp

  indexes {
    slug [unique]
    isbn
    sku
    title
    author
    sale_type
    preorder_estimated_date
    is_active
  }
}


// ======================================================
// BOOK IMAGES
// ======================================================

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
// WALLETS
// ======================================================
// Current customer balance.
//
// Every change to balance MUST also create
// an immutable wallet_transactions record.

Table wallets {
  id bigint [pk, increment]

  user_id bigint [not null, unique]

  balance decimal(15,2) [not null, default: 0]

  created_at timestamp

  updated_at timestamp

  indexes {
    user_id [unique]
  }
}


// ======================================================
// WALLET TOPUPS
// ======================================================
// Customer only provides:
// - requested top-up amount
// - payment proof image
//
// No customer bank/account/ATM metadata is stored.
// The system only stores the requested amount and transfer proof.
// Manual top-up flow:
//
// Customer submits requested top-up amount and uploads payment proof only.
// Customer bank / sender account metadata is intentionally not stored.
// -> pending
// -> admin approves / rejects
//
// Approved top-up:
// - increases wallet.balance
// - creates wallet_transactions(type=topup_credit)

Table wallet_topups {
  id bigint [pk, increment]

  topup_code varchar(50) [not null, unique]

  user_id bigint [not null]

  requested_amount decimal(15,2) [not null]

  credited_amount decimal(15,2)

  proof_image_path varchar(500) [not null]

  status topup_status [not null, default: 'pending']

  reviewed_by bigint

  reviewed_at timestamp

  admin_note text

  created_at timestamp

  updated_at timestamp

  indexes {
    topup_code [unique]
    user_id
    status
    reviewed_by
    created_at
  }
}


// ======================================================
// WALLET TRANSACTIONS
// ======================================================
// Immutable wallet ledger.
//
// amount is always positive.
// direction decides credit / debit.

Table wallet_transactions {
  id bigint [pk, increment]

  wallet_id bigint [not null]

  topup_id bigint

  order_id bigint

  created_by bigint

  type wallet_transaction_type [not null]

  direction wallet_transaction_direction [not null]

  amount decimal(15,2) [not null]

  balance_before decimal(15,2) [not null]

  balance_after decimal(15,2) [not null]

  note text

  created_at timestamp [not null]

  indexes {
    wallet_id
    topup_id
    order_id
    created_by
    type
    direction
    created_at
  }
}


// ======================================================
// CARTS
// ======================================================
// One active cart per customer.

Table carts {
  id bigint [pk, increment]

  user_id bigint [not null, unique]

  created_at timestamp

  updated_at timestamp

  indexes {
    user_id [unique]
  }
}


// ======================================================
// CART ITEMS
// ======================================================
// A book can only appear once per cart.
// Re-adding the same book updates quantity.

Table cart_items {
  id bigint [pk, increment]

  cart_id bigint [not null]

  book_id bigint [not null]

  quantity integer [not null, default: 1]

  created_at timestamp

  updated_at timestamp

  indexes {
    (cart_id, book_id) [unique]
    cart_id
    book_id
  }
}


// ======================================================
// VOUCHERS
// ======================================================

Table vouchers {
  id bigint [pk, increment]

  code varchar(100) [not null, unique]

  name varchar(150) [not null]

  description text

  type voucher_type [not null]

  value decimal(15,2) [not null]

  max_discount decimal(15,2)

  min_order_amount decimal(15,2) [not null, default: 0]

  usage_limit integer

  per_user_limit integer [not null, default: 1]

  starts_at timestamp

  ends_at timestamp

  is_active boolean [not null, default: true]

  created_by bigint [not null]

  created_at timestamp

  updated_at timestamp

  deleted_at timestamp

  indexes {
    code [unique]
    type
    is_active
    starts_at
    ends_at
    created_by
  }
}


// ======================================================
// ORDERS
// ======================================================
// One checkout can contain many order_items.
//
// Wallet payment.
//
// One order can generate multiple shipments.
// This supports split shipment and PO + ready-stock scenarios.
//
// orders.shipping_cost = shipping fee charged to customer.
// Actual Biteship shipment cost can be stored separately
// per shipment through shipments.price / biteship_price.

Table orders {
  id bigint [pk, increment]

  order_code varchar(50) [not null, unique]

  user_id bigint [not null]

  address_id bigint

  voucher_id bigint

  subtotal decimal(15,2) [not null]

  voucher_discount decimal(15,2) [not null, default: 0]

  shipping_cost decimal(15,2) [not null, default: 0]

  total decimal(15,2) [not null]

  wallet_amount decimal(15,2) [not null]

  status order_status [not null, default: 'pending']

  payment_status order_payment_status [not null, default: 'unpaid']

  customer_note text

  created_at timestamp

  updated_at timestamp

  indexes {
    order_code [unique]
    user_id
    address_id
    voucher_id
    status
    payment_status
    created_at
  }
}


// ======================================================
// ORDER ITEMS
// ======================================================
// Immutable item snapshot.
//
// Shipping field naming follows Biteship items[]:
//
// items[].name        <- name
// items[].description <- description
// items[].category    <- category
// items[].sku         <- sku
// items[].value       <- value
// items[].weight      <- weight
// items[].height      <- height
// items[].length      <- length
// items[].width       <- width
//
// items[].quantity:
// - Rates before checkout: cart_items.quantity
// - Order/Create Shipment: shipment_items.quantity

Table order_items {
  id bigint [pk, increment]

  order_id bigint [not null]

  book_id bigint


  // --------------------------------------------------
  // BITESHIP ITEM SNAPSHOT
  // --------------------------------------------------

  name varchar(255) [not null]

  description text

  category varchar(50) [not null, default: 'others']

  sku varchar(100)

  value decimal(15,2) [not null]

  quantity integer [not null]

  weight integer [not null]

  height decimal(8,2)

  length decimal(8,2)

  width decimal(8,2)


  // --------------------------------------------------
  // BOOK / ORDER SNAPSHOT
  // --------------------------------------------------

  isbn varchar(50)

  author varchar(200)

  subtotal decimal(15,2) [not null]

  sale_type book_sale_type [not null]

  preorder_estimated_date date

  preorder_ready_at timestamp


  created_at timestamp

  updated_at timestamp

  indexes {
    order_id
    book_id
    sku
    sale_type
    preorder_estimated_date
  }
}


// ======================================================
// ORDER SHIPPING ADDRESSES
// ======================================================
// Immutable destination snapshot from selected user address.
//
// Field names intentionally match Biteship destination fields.
//
// Editing/deleting user_addresses later does NOT modify
// historical order destination.

Table order_shipping_addresses {
  id bigint [pk, increment]

  order_id bigint [not null, unique]

  source_address_id bigint


  destination_contact_name varchar(150) [not null]

  destination_contact_phone varchar(30) [not null]

  destination_contact_email varchar(150)

  destination_address text [not null]

  destination_note text

  destination_postal_code varchar(10)

  destination_area_id varchar(150)

  destination_location_id varchar(150)

  destination_latitude decimal(10,7)

  destination_longitude decimal(10,7)


  province_name varchar(150)

  city_name varchar(150)

  district_name varchar(150)

  subdistrict_name varchar(150)


  created_at timestamp [not null]

  indexes {
    order_id [unique]
    source_address_id
    destination_postal_code
    destination_area_id
    destination_location_id
  }
}


// ======================================================
// VOUCHER USAGES
// ======================================================
// Voucher audit and usage-limit tracking.

Table voucher_usages {
  id bigint [pk, increment]

  voucher_id bigint [not null]

  user_id bigint [not null]

  order_id bigint [not null, unique]

  discount_amount decimal(15,2) [not null]

  created_at timestamp [not null]

  indexes {
    order_id [unique]
    voucher_id
    user_id
    (voucher_id, user_id)
  }
}


// ======================================================
// ORDER STATUS HISTORIES
// ======================================================
// Immutable timeline of order states.

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
    changed_by
    created_at
  }
}


// ======================================================
// SHIPMENTS
// ======================================================
// Intentionally kept compact.
//
// Biteship Create Order required values are sourced from:
// - origin_*              -> store_settings
// - destination_*         -> order_shipping_addresses
// - courier_company       -> shipments
// - courier_type          -> shipments
// - delivery_type         -> shipments
// - items[]               -> shipment_items + order_items
//
// No COD fields because Buku Order payments use wallet.
// Optional Biteship fields that are not used by the website
// are intentionally not persisted here.
//
// `shipment_code` can be sent as Biteship `reference_id`.
//
// One order may have multiple shipments to support
// split fulfillment / ready-stock + preorder.

Table shipments {
  id bigint [pk, increment]

  order_id bigint [not null]

  shipment_code varchar(50) [not null, unique]


  // --------------------------------------------------
  // REQUIRED CREATE ORDER COURIER DATA
  // --------------------------------------------------

  courier_company varchar(100) [not null]

  courier_type varchar(100) [not null]

  delivery_type shipment_delivery_type [not null, default: 'now']


  // --------------------------------------------------
  // SELECTED RATE - DATA ACTUALLY USED BY UI
  // --------------------------------------------------

  courier_service_name varchar(150)

  price decimal(15,2) [not null]

  duration varchar(100)

  // Full selected Rates API pricing object.
  // Keeps provider-specific details without creating
  // dozens of nullable columns.
  rate_response json


  // --------------------------------------------------
  // BITESHIP CREATE ORDER RESPONSE / TRACKING
  // --------------------------------------------------

  biteship_order_id varchar(150)

  tracking_id varchar(150)

  waybill_id varchar(150)

  courier_link varchar(500)

  biteship_status varchar(100)

  // Raw Create Order response for audit/debugging.
  response_payload json


  // --------------------------------------------------
  // INTERNAL NORMALIZED STATUS
  // --------------------------------------------------

  status shipment_status [not null, default: 'pending']


  created_at timestamp

  updated_at timestamp

  indexes {
    order_id
    shipment_code [unique]
    biteship_order_id
    tracking_id
    waybill_id
    courier_company
    courier_type
    status
  }
}


// ======================================================
// SHIPMENT ITEMS
// ======================================================
// Specifies exactly which purchased items are included
// in a shipment.
//
// Supports:
// - split shipment
// - ready-stock + preorder in one checkout
// - one order -> multiple Biteship orders
//
// Biteship items[] mapping:
// name/description/category/sku/value/weight/dimensions
// -> order_items
//
// quantity
// -> shipment_items.quantity

Table shipment_items {
  id bigint [pk, increment]

  shipment_id bigint [not null]

  order_item_id bigint [not null]

  quantity integer [not null]

  created_at timestamp

  indexes {
    (shipment_id, order_item_id) [unique]
    shipment_id
    order_item_id
  }
}


// ======================================================
// SHIPMENT STATUS HISTORIES
// ======================================================
// Immutable shipment tracking / webhook history.

Table shipment_status_histories {
  id bigint [pk, increment]

  shipment_id bigint [not null]

  status shipment_status [not null]

  provider_status varchar(100)

  description text

  occurred_at timestamp

  raw_payload json

  created_at timestamp [not null]

  indexes {
    shipment_id
    status
    provider_status
    occurred_at
    created_at
  }
}


// ======================================================
// BOOK STOCK MOVEMENTS
// ======================================================
// books.stock = current physical ready stock.
//
// This table is immutable inventory audit.
//
// Examples:
// initial             +20
// adjustment_in       +5
// adjustment_out      -2
// order               -3
// cancellation        +3
// preorder_fulfillment  depending on fulfillment policy

Table book_stock_movements {
  id bigint [pk, increment]

  book_id bigint [not null]

  order_id bigint

  order_item_id bigint

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
    order_item_id
    changed_by
    type
    created_at
  }
}


// ======================================================
// RELATIONSHIPS
// ======================================================


// ------------------------------------------------------
// USERS
// ------------------------------------------------------

Ref: user_addresses.user_id > users.id

Ref: wallets.user_id > users.id

Ref: wallet_topups.user_id > users.id

Ref: wallet_topups.reviewed_by > users.id

Ref: carts.user_id > users.id

Ref: vouchers.created_by > users.id

Ref: orders.user_id > users.id

Ref: voucher_usages.user_id > users.id

Ref: order_status_histories.changed_by > users.id

Ref: book_stock_movements.changed_by > users.id

Ref: wallet_transactions.created_by > users.id


// ------------------------------------------------------
// TOPUP
// ------------------------------------------------------

Ref: wallet_transactions.topup_id > wallet_topups.id


// ------------------------------------------------------
// BOOKS / CATEGORIES
// ------------------------------------------------------

Ref: book_images.book_id > books.id

Ref: book_categories.book_id > books.id

Ref: book_categories.category_id > categories.id


// ------------------------------------------------------
// CART
// ------------------------------------------------------

Ref: cart_items.cart_id > carts.id

Ref: cart_items.book_id > books.id


// ------------------------------------------------------
// WALLET
// ------------------------------------------------------

Ref: wallet_transactions.wallet_id > wallets.id


// ------------------------------------------------------
// ORDERS
// ------------------------------------------------------

Ref: orders.address_id > user_addresses.id

Ref: orders.voucher_id > vouchers.id

Ref: order_items.order_id > orders.id

Ref: order_items.book_id > books.id

Ref: order_shipping_addresses.order_id > orders.id

Ref: order_shipping_addresses.source_address_id > user_addresses.id

Ref: wallet_transactions.order_id > orders.id

Ref: order_status_histories.order_id > orders.id


// ------------------------------------------------------
// VOUCHERS
// ------------------------------------------------------

Ref: voucher_usages.voucher_id > vouchers.id

Ref: voucher_usages.order_id > orders.id


// ------------------------------------------------------
// SHIPPING
// ------------------------------------------------------

Ref: shipments.order_id > orders.id

Ref: shipment_items.shipment_id > shipments.id

Ref: shipment_items.order_item_id > order_items.id

Ref: shipment_status_histories.shipment_id > shipments.id


// ------------------------------------------------------
// STOCK
// ------------------------------------------------------

Ref: book_stock_movements.book_id > books.id

Ref: book_stock_movements.order_id > orders.id

Ref: book_stock_movements.order_item_id > order_items.id
