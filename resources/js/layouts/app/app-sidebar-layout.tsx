import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from '@inertiajs/react';
import { Home, ShoppingBag, TicketPercent, Wallet } from 'lucide-react';
import type { AppLayoutProps } from '@/types';
import type { User } from '@/types/auth';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    role,
}: AppLayoutProps & { role?: User['role'] }) {
    const isMobile = useIsMobile();

    return (
        <AppShell variant="sidebar">
            {!(role === 'customer' && isMobile) && <AppSidebar role={role} />}
            <AppContent
                variant="sidebar"
                className={`admin-dashboard-shell min-w-0 overflow-x-clip ${role === 'customer' ? 'pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0' : ''}`}
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} role={role} />
                <div className="flex min-h-0 flex-1 flex-col">
                    {children}
                    <footer className="text-muted-foreground mt-auto flex flex-col gap-3 border-t bg-white/70 px-5 py-5 text-xs sm:flex-row sm:items-center sm:justify-between md:px-8">
                        <span>© 2026 Wonder Book. All rights reserved.</span>
                        <div className="flex gap-4">
                            <span>Syarat &amp; Ketentuan</span>
                            <span>FAQ</span>
                            <span>Hubungi Kami</span>
                        </div>
                    </footer>
                </div>
            </AppContent>
            {role === 'customer' && isMobile && <CustomerBottomNav />}
        </AppShell>
    );
}

function CustomerBottomNav() {
    const { currentUrl } = useCurrentUrl();
    const items = [
        { label: 'Home', href: '/', icon: Home },
        {
            label: 'Pesanan',
            href: '/customer/dashboard/orders',
            icon: ShoppingBag,
        },
        { label: 'Saldo', href: '/customer/dashboard/wallets', icon: Wallet },
        {
            label: 'Voucher',
            href: '/customer/dashboard/vouchers',
            icon: TicketPercent,
        },
    ];

    return (
        <nav
            aria-label="Navigasi customer"
            className="bg-background fixed inset-x-0 bottom-0 z-40 border-t px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
        >
            <ul className="mx-auto flex h-16 max-w-lg items-center justify-around">
                {items.map(({ label, href, icon: Icon }) => {
                    const active =
                        href === '/'
                            ? currentUrl === href
                            : currentUrl === href ||
                              currentUrl.startsWith(`${href}/`);

                    return (
                        <li key={href}>
                            <Link
                                href={href}
                                aria-current={active ? 'page' : undefined}
                                className={`focus-visible:ring-ring flex min-h-11 min-w-16 flex-col items-center justify-center gap-1 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none ${active ? 'bg-accent text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Icon className="size-5" aria-hidden="true" />
                                <span>{label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
