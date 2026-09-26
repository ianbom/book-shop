import { Link } from '@inertiajs/react';
import { Facebook, Instagram, Music2, Youtube } from 'lucide-react';
import { SectionContainer } from '@/components/customer/shared/section-container';
import type { CustomerStoreSettings } from '@/types';

const footerGroups = [
    { title: 'Tentang Kami', links: ['Profil Kami', 'Karir', 'Blog'] },
    { title: 'Bantuan', links: ['Pusat Bantuan', 'Cara Belanja', 'Pengembalian Buku'] },
    { title: 'Informasi', links: ['Syarat & Ketentuan', 'Kebijakan Privasi', 'Kontak'] },
];

export function CustomerFooter({ storeSettings }: { storeSettings?: CustomerStoreSettings }) {
    const store = storeSettings ?? {
        whatsapp_number: '+62 812-3456-7890',
        email: 'halo@bukuorder.id',
        address: null,
    };
    const whatsapp = store.whatsapp_number.replace(/\D/g, '').replace(/^0/, '62');

    return (
        <footer id="kontak" className="border-border bg-background border-t text-foreground">
            <SectionContainer className="grid gap-8 py-8 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1.2fr_1.2fr] lg:gap-6">
                <div>
                    <Link href="/" className="flex items-center gap-2.5">
                        <span className="bg-secondary text-primary grid size-11 place-items-center rounded-xl"><img src="/dashboard-image/header-sidebar.png" alt="" className="size-full rounded-xl object-cover object-top" /></span>
                        <span><span className="font-heading block text-xl font-bold">WonderBookLibrary</span><span className="text-muted-foreground block text-[10px]">Little Books, Big Dreams</span></span>
                    </Link>
                    <p className="text-muted-foreground mt-3 max-w-[14rem] text-xs leading-5">Menemani setiap cerita dan petualangan kecil lewat buku pilihan.</p>
                </div>
                {footerGroups.map((group) => (
                    <div key={group.title}>
                        <h2 className="mb-3 text-xs font-bold">{group.title}</h2>
                        <ul className="text-muted-foreground space-y-2 text-[11px]">
                            {group.links.map((label) => (
                                <li key={label}>
                                    {label === 'Kontak' ? <a href="#kontak" className="hover:text-primary">{label}</a> : <span>{label}</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                <div>
                    <h2 className="mb-3 text-xs font-bold">Ikuti Kami</h2>
                    <div className="text-primary flex gap-2.5">
                        {[Instagram, Facebook, Youtube, Music2].map((Icon, index) => (
                            <span key={index} aria-hidden="true" className="border-border grid size-8 place-items-center rounded-md border"><Icon className="size-4" /></span>
                        ))}
                    </div>
                </div>
            </SectionContainer>
            <div className="border-border border-t">
                <SectionContainer className="text-muted-foreground flex flex-col gap-2 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between">
                    <span>© 2026 WonderBookLibrary. Semua hak dilindungi.</span>
                    {store.address && <span className="line-clamp-1">{store.address}</span>}
                </SectionContainer>
            </div>
        </footer>
    );
}
