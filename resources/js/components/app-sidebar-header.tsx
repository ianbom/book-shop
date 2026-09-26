import { usePage } from '@inertiajs/react';
import { Bell, ChevronDown, Search } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage().props;
    const user = auth.user;

    return (
        <header className="admin-topbar flex shrink-0 items-center gap-3 px-4 md:px-7">
            <SidebarTrigger className="text-foreground md:hidden" />
            <form className="relative hidden w-full max-w-xl md:block" action="/admin/orders" method="get">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2" />
                <input
                    name="search"
                    type="search"
                    aria-label="Cari pesanan"
                    placeholder="Cari judul buku, pelanggan, atau nomor order..."
                    className="border-input bg-muted/80 focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border pr-4 pl-11 text-sm outline-none transition focus:ring-4"
                />
            </form>
            <div className="ml-auto flex items-center gap-3 sm:gap-5">
                {user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 text-left outline-none" type="button">
                                <Avatar className="size-10 border-2 border-secondary bg-accent">
                                    <AvatarFallback className="bg-accent text-primary font-bold">
                                        {user.name.slice(0, 1).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden sm:grid">
                                    <span className="text-foreground text-sm font-bold">Halo, {user.name.split(' ')[0]}</span>
                                    <span className="text-muted-foreground text-xs">Administrator</span>
                                </span>
                                <ChevronDown className="text-primary hidden size-4 sm:block" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-56">
                            <UserMenuContent user={user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}
