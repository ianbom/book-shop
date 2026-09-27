import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Boxes,
    CreditCard,
    History,
    LayoutDashboard,
    PackageCheck,
    Settings2,
    ShoppingBag,
    ShoppingCart,
    Tags,
    TicketPercent,
    Users,
    UserRound,
    Wallet,
} from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import type { NavMainItem } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import admin from '@/routes/admin';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: admin.dashboard(),
        icon: LayoutDashboard,
    },
    {
        title: 'Katalog',
        href: admin.books.index(),
        children: [
            { title: 'Buku', href: admin.books.index(), icon: BookOpen },
            { title: 'Kategori', href: admin.categories.index(), icon: Tags },
        ],
    },
    {
        title: 'Order',
        href: admin.orders.index(),
        children: [
            { title: 'Pesanan', href: admin.orders.index(), icon: ShoppingBag },
        ],
    },
    {
        title: 'Pengiriman',
        href: admin.shipments.index(),
        children: [
            { title: 'Shipment', href: admin.shipments.index(), icon: PackageCheck },
        ],
    },
    {
        title: 'Pengguna',
        href: admin.customers.index(),
        children: [
            { title: 'Customer', href: admin.customers.index(), icon: Users },
        ],
    },

    {
        title: 'Wallet',
        href: admin.topUps.index(),
        children: [
            { title: 'Permintaan Top-up', href: admin.topUps.index(), icon: CreditCard },
            { title: 'Transaksi Wallet', href: admin.walletTransactions.index(), icon: Wallet },
        ],
    },
    {
        title: 'Promosi',
        href: admin.vouchers.index(),
        children: [
            { title: 'Voucher', href: admin.vouchers.index(), icon: TicketPercent },
        ],
    },
    {
        title: 'Inventaris',
        href: admin.inventory.index(),
        children: [
            {
                title: 'Manajemen Stok',
                href: admin.inventory.index(),
                icon: Boxes,
            },
            {
                title: 'Riwayat Stok',
                href: admin.inventory.history(),
                icon: History,
            },
        ],
    },
    {
        title: 'Pengaturan',
        href: admin.settings.edit(),
        icon: Settings2,
    },
];

const customerNavItems: NavMainItem[] = [
    { title: 'Profil', href: '/customer/dashboard/profile', icon: UserRound },
    { title: 'Keranjang', href: '/customer/dashboard/carts', icon: ShoppingCart },
    { title: 'Pesanan', href: '/customer/dashboard/orders', icon: ShoppingBag },
    { title: 'Saldo', href: '/customer/dashboard/wallets', icon: Wallet },
    { title: 'Voucher', href: '/customer/dashboard/vouchers', icon: TicketPercent },
];

export function AppSidebar({ role }: { role?: 'admin' | 'customer' }) {
    const isAdmin = role === 'admin';
    const items = isAdmin ? mainNavItems : role === 'customer' ? customerNavItems : [];

    return (
        <Sidebar collapsible="icon" variant="sidebar" className="border-sidebar-border">
            <SidebarHeader className="px-4 pt-3 pb-2 group-data-[collapsible=icon]:px-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="h-auto rounded-xl p-0 hover:bg-transparent group-data-[collapsible=icon]:size-10!" asChild>
                            <Link href={isAdmin ? admin.dashboard() : '/'} prefetch>
                                <img
                                    src="/dashboard-image/header-sidebar.png"
                                    alt="Wonder Prince Library"
                                    className="h-28 w-full object-contain group-data-[collapsible=icon]:size-10"
                                />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="min-h-0 flex-1 overflow-y-auto px-3 pt-1 group-data-[collapsible=icon]:px-2">
                <NavMain items={items} />
            </SidebarContent>

            <SidebarFooter className="mx-3 mb-2 overflow-hidden p-0 group-data-[collapsible=icon]:hidden">
                <img
                    src="/dashboard-image/footer-sidebar.png"
                    alt="Good books, brighter days, happier kids"
                    className="h-28 w-full object-contain"
                />
            </SidebarFooter>
        </Sidebar>
    );
}
