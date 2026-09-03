import { BadgeCheck, Gift, Headphones, Truck } from 'lucide-react';
import { SectionContainer } from '@/components/customer/shared/section-container';

const benefits = [
    {
        title: 'Pengiriman Cepat',
        description: 'Ke seluruh Indonesia',
        icon: Truck,
    },
    {
        title: '100% Original',
        description: 'Buku asli, garansi resmi',
        icon: BadgeCheck,
    },
    {
        title: 'Layanan Pelanggan',
        description: 'Siap membantu 24/7',
        icon: Headphones,
    },
    {
        title: 'Promo Menarik',
        description: 'Diskon & penawaran spesial',
        icon: Gift,
    },
];

export function StoreBenefits() {
    return (
        <SectionContainer className="pb-10">
            <section className="grid overflow-hidden rounded-md bg-[#F3F7FF] sm:grid-cols-2 lg:grid-cols-4">
                {benefits.map(({ title, description, icon: Icon }, index) => (
                    <div
                        key={title}
                        className={`flex items-center gap-4 px-6 py-6 ${index > 0 ? 'lg:border-l lg:border-[#0B1F3A]/15' : ''}`}
                    >
                        <Icon
                            className="size-8 shrink-0 text-[#0B1F3A]"
                            strokeWidth={1.6}
                        />
                        <div>
                            <h2 className="text-sm font-semibold">{title}</h2>
                            <p className="mt-1 text-xs text-slate-600">
                                {description}
                            </p>
                        </div>
                    </div>
                ))}
            </section>
        </SectionContainer>
    );
}
