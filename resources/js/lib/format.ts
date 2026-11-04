export const rupiah = (value: string | number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value));
export const exactRupiah = (value: string): string => {
    const [whole, fraction = '00'] = value.split('.');
    return `Rp${BigInt(whole).toLocaleString('id-ID')},${fraction.padEnd(2, '0')}`;
};
export const exactRupiahCents = (value: number): string => {
    const cents = BigInt(value);
    return exactRupiah(`${cents / 100n}.${(cents % 100n).toString().padStart(2, '0')}`);
};
export const formatDate = (value: string | null | undefined): string =>
    value
        ? new Intl.DateTimeFormat('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
          }).format(new Date(value))
        : '-';
export const formatMonthYear = (value: string | null): string =>
    value
        ? new Intl.DateTimeFormat('id-ID', {
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
          }).format(new Date(value))
        : '-';
