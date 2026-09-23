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
import { NavMain } from '@/components/nav-main';
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
        <Sidebar collapsible="icon" variant="sidebar" className="border-sidebar-border">
            <SidebarHeader className="px-4 pt-3 pb-2 group-data-[collapsible=icon]:px-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="h-auto rounded-xl p-0 hover:bg-transparent group-data-[collapsible=icon]:size-10!" asChild>
                            <Link href={admin.dashboard()} prefetch>
                                <img
                                    src="/dashboard/header-sidebar.png"
                                    alt="Wonder Prince Library"
                                    className="h-28 w-full object-contain group-data-[collapsible=icon]:size-10"
                                />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="min-h-0 flex-1 overflow-y-auto px-3 pt-1 group-data-[collapsible=icon]:px-2">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="mx-3 mb-2 overflow-hidden p-0 group-data-[collapsible=icon]:hidden">
                <img
                    src="/dashboard/footer-sidebar.png"
                    alt="Good books, brighter days, happier kids"
                    className="h-28 w-full object-contain"
                />
            </SidebarFooter>
        </Sidebar>
    );
}
