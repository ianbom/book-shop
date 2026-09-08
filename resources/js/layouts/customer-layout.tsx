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
        <div className="bg-background text-foreground flex min-h-screen flex-col">
            <CustomerHeader logoSrc="/wonderbok.webp" />
            <main className="flex-1">{children}</main>
            <CustomerFooter
                storeSettings={storeSettings ?? pageStoreSettings}
            />
        </div>
    );
}
