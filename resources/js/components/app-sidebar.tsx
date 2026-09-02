import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Boxes,
    History,
    LayoutDashboard,
    Settings2,
    ShoppingBag,
    Tags,
    Warehouse,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
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
        icon: BookOpen,
        children: [
            { title: 'Buku', href: admin.books.index(), icon: BookOpen },
            { title: 'Kategori', href: admin.categories.index(), icon: Tags },
        ],
    },
    {
        title: 'Pesanan',
        href: admin.orders.index(),
        icon: ShoppingBag,
    },
    {
        title: 'Inventaris',
        href: admin.inventory.index(),
        icon: Warehouse,
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

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={admin.dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
