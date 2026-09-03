import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { CustomerFooter } from '@/components/customer/layout/customer-footer';
import { CustomerHeader } from '@/components/customer/layout/customer-header';
import type { CustomerStoreSettings } from '@/types';

interface CustomerLayoutProps {
    children: ReactNode;
    storeSettings?: CustomerStoreSettings;
}

export default function CustomerLayout({
    children,
    storeSettings,
}: CustomerLayoutProps) {
    const pageStoreSettings = usePage<{
        storeSettings?: CustomerStoreSettings;
    }>().props.storeSettings;

    return (
        <div className="min-h-screen bg-white text-[#0B1F3A]">
            <CustomerHeader />
            <main>{children}</main>
            <CustomerFooter
                storeSettings={storeSettings ?? pageStoreSettings}
            />
        </div>
    );
}
