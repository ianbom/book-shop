import { Facebook, Instagram, Music2, Youtube } from 'lucide-react';
import { SectionContainer } from '@/components/customer/shared/section-container';
import type { CustomerStoreSettings } from '@/types';

const columns = [
    {
        title: 'Belanja',
        links: [
            'Semua Buku',
            'Kategori',
            'Buku Terbaru',
            'Buku Terlaris',
            'Pre Order',
        ],
    },
    {
        title: 'Informasi',
        links: [
            'Tentang Kami',
            'Cara Belanja',
            'Pembayaran',
            'Pengiriman',
            'Pengembalian',
        ],
    },
    {
        title: 'Bantuan',
        links: [
            'FAQ',
            'Hubungi Kami',
            'Lacak Order',
            'Syarat & Ketentuan',
            'Kebijakan Privasi',
        ],
    },
];

export function CustomerFooter({
    storeSettings,
}: {
    storeSettings?: CustomerStoreSettings;
}) {
    const store = storeSettings ?? {
        whatsapp_number: '+62 812-3456-7890',
        email: 'halo@bukuorder.id',
        address: null,
    };

    return (
        <footer
            id="kontak"
            className="border-primary-foreground/20 bg-foreground text-primary-foreground border-t-2"
        >
            <SectionContainer className="grid gap-9 py-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.1fr]">
                <div>
                    <div className="font-heading mb-3 text-2xl font-semibold">
                        Wonderbook
                    </div>
                    <p className="text-primary-foreground/75 max-w-[13rem] text-xs leading-5">
                        Lebih dari sekadar toko buku. Kami menemani perjalanan
                        belajarmu setiap hari.
                    </p>
                </div>
                {columns.map((column) => (
                    <FooterLinks key={column.title} {...column} />
                ))}
                <div>
                    <h2 className="mb-4 text-xs font-bold">Ikuti Kami</h2>
                    <div className="flex gap-2.5">
                        {[Instagram, Facebook, Youtube, Music2].map((Icon) => (
                            <span
                                key={Icon.displayName}
                                className="border-primary-foreground/45 grid size-8 place-items-center rounded-full border"
                            >
                                <Icon className="size-3.5" />
                            </span>
                        ))}
                    </div>
                </div>
            </SectionContainer>
            <div className="border-primary-foreground/20 border-t">
                <SectionContainer className="text-primary-foreground/70 py-4 text-center text-[11px]">
                    © 2026 Wonderbook. All rights reserved.
                </SectionContainer>
            </div>
        </footer>
    );
}

function FooterLinks({ title, links }: { title: string; links: string[] }) {
    return (
        <div>
            <h2 className="mb-4 text-xs font-bold">{title}</h2>
            <ul className="text-primary-foreground/75 space-y-2 text-[11px]">
                {links.map((link) => (
                    <li key={link}>
                        <a
                            href={link === 'Lacak Order' ? '/track-order' : '#'}
                            className="hover:text-primary-foreground transition-colors"
                        >
                            {link}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
