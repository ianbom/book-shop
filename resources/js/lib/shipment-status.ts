import type { ShipmentStatus } from '@/types/admin';

export const biteshipStatusLabels = {
    confirmed: 'Dikonfirmasi',
    scheduled: 'Terjadwal',
    allocated: 'Kurir ditugaskan',
    picking_up: 'Kurir menuju penjemputan',
    picked: 'Paket telah dijemput',
    on_hold: 'Pengiriman tertahan',
    in_transit: 'Dalam perjalanan',
    dropping_off: 'Kurir menuju penerima',
    delivered: 'Terkirim',
    rejected: 'Pengiriman ditolak',
    return_in_transit: 'Dalam perjalanan retur',
    returned: 'Dikembalikan ke pengirim',
    disposed: 'Paket dimusnahkan',
    courier_not_found: 'Kurir tidak ditemukan',
    cancelled: 'Pengiriman dibatalkan',
} satisfies Partial<Record<ShipmentStatus, string>>;

export const shipmentStatusLabels: Record<ShipmentStatus, string> = {
    pending: 'Menunggu pengiriman',
    booked: 'Pengiriman dibuat',
    pickup: 'Penjemputan paket',
    failed: 'Pengiriman gagal',
    ...biteshipStatusLabels,
};

export function shipmentStatusLabel(status: string): string {
    return Object.hasOwn(shipmentStatusLabels, status)
        ? shipmentStatusLabels[status as ShipmentStatus]
        : status || 'Tidak diketahui';
}

const notices: Record<string, string> = {
    on_hold:
        'Pengiriman tertahan. Periksa catatan kurir dan pantau kelanjutannya.',
    rejected:
        'Pengiriman ditolak. Periksa alasan penolakan dan proses retur berikutnya.',
    return_in_transit: 'Paket sedang dikembalikan. Retur belum diterima toko.',
    returned:
        'Paket telah kembali ke pengirim. Periksa kondisi barang sebelum memutuskan restock atau refund.',
    disposed:
        'Paket dimusnahkan. Hubungi Biteship atau kurir untuk penanganan klaim.',
    courier_not_found:
        'Kurir belum ditemukan. Periksa kembali ketersediaan kurir melalui Biteship.',
    cancelled:
        'Pengiriman dibatalkan. Pembatalan shipment tidak otomatis membatalkan order.',
    failed: 'Pengiriman gagal. Sinkronkan Biteship untuk memeriksa kondisi terbaru.',
};

export function shipmentStatusNotice(status: string): string | null {
    if (Object.hasOwn(notices, status)) return notices[status];
    return Object.hasOwn(shipmentStatusLabels, status)
        ? null
        : 'Status Biteship belum dikenal. Tinjau kode provider; status internal terakhir tetap dipertahankan.';
}
