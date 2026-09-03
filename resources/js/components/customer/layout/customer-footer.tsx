import {
    Facebook,
    Instagram,
    Mail,
    Phone,
    Twitter,
    Youtube,
} from 'lucide-react';
import { SectionContainer } from '@/components/customer/shared/section-container';
import type { CustomerStoreSettings } from '@/types';

const information = [
    'Tentang Kami',
    'Informasi Pengiriman',
    'Kebijakan Privasi',
    'Syarat & Ketentuan',
];
const help = ['Cara Belanja', 'Lacak Order', 'Pengembalian Barang', 'FAQ'];

export function CustomerFooter({
    storeSettings,
}: {
    storeSettings?: CustomerStoreSettings;
}) {
    const store = storeSettings ?? {
        store_name: 'Buku Order',
        whatsapp_number: '+62 812-3456-7890',
        email: 'halo@bukuorder.id',
        address: null,
    };

    return (
        <footer id="kontak" className="border-t-2 border-[#0B1F3A] bg-white">
            <SectionContainer className="grid gap-10 py-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.25fr]">
                <div>
                    <div className="mb-4 flex items-center gap-2 font-serif text-2xl font-semibold">
                        <span aria-hidden="true">◖◗</span>
                        {store.store_name}
                    </div>
                    <p className="max-w-xs text-sm leading-6 text-slate-600">
                        Temukan buku terbaik untuk versi dirimu yang lebih baik
                        setiap hari.
                    </p>
                    <div className="mt-5 flex gap-4">
                        <Instagram size={18} />
                        <Facebook size={18} />
                        <Twitter size={18} />
                        <Youtube size={18} />
                    </div>
                </div>
                <FooterLinks title="Informasi" links={information} />
                <FooterLinks title="Bantuan" links={help} />
                <div>
                    <h2 className="mb-4 font-semibold">Kontak</h2>
                    <div className="space-y-3 text-sm text-slate-600">
                        <p className="flex gap-2">
                            <Phone size={16} className="shrink-0" />
                            {store.whatsapp_number}
                        </p>
                        <p className="flex gap-2">
                            <Mail size={16} className="shrink-0" />
                            {store.email}
                        </p>
                        <p className="leading-6">
                            Senin - Jumat, 08.00 - 17.00 WIB
                        </p>
                    </div>
                </div>
            </SectionContainer>
            <div className="border-t border-[#0B1F3A]/25">
                <SectionContainer className="flex flex-col gap-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <p>© 2026 Buku Order. Semua hak dilindungi.</p>
                    <div className="flex flex-wrap items-center gap-4">
                        <span>Metode Pembayaran</span>
                        {['BCA', 'mandiri', 'BRI', 'BNI', 'VISA', '●●'].map(
                            (method) => (
                                <strong key={method} className="text-[#0B1F3A]">
                                    {method}
                                </strong>
                            ),
                        )}
                    </div>
                </SectionContainer>
            </div>
        </footer>
    );
}

function FooterLinks({ title, links }: { title: string; links: string[] }) {
    return (
        <div>
            <h2 className="mb-4 font-semibold">{title}</h2>
            <ul className="space-y-3 text-sm text-slate-600">
                {links.map((link) => (
                    <li key={link}>
                        <a href="#" className="hover:text-[#2563EB]">
                            {link}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
