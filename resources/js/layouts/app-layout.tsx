import { usePage } from '@inertiajs/react';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const role = usePage().props.auth.user?.role;

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} role={role}>
            {children}
        </AppLayoutTemplate>
    );
}
