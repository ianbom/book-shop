import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { ChevronDown, Search, ShoppingCart } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { rupiah } from '@/lib/format';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs: _breadcrumbs = [],
    role,
}: {
    breadcrumbs?: BreadcrumbItemType[];
    role?: 'admin' | 'customer';
}) {
    const { auth, cartCount, walletBalance } = usePage().props;
    const user = auth.user;
    const itemCount = typeof cartCount === 'number' ? cartCount : 0;

    return (
        <header className="admin-topbar flex shrink-0 items-center gap-3 px-4 md:px-7">
            {role !== 'customer' && (
                <SidebarTrigger className="text-foreground md:hidden" />
            )}
            {role === 'customer' && (
                <Link
                    href="/customer/dashboard/carts"
                    aria-label={`Keranjang, ${itemCount} barang`}
                    className="text-foreground focus-visible:ring-ring hover:bg-accent relative grid size-11 shrink-0 place-items-center rounded-lg transition focus-visible:ring-2 focus-visible:outline-none md:hidden"
                >
                    <ShoppingCart className="size-5" aria-hidden="true" />
                    {itemCount > 0 && (
                        <span className="bg-primary text-primary-foreground absolute top-0.5 right-0.5 grid min-h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold">
                            {itemCount}
                        </span>
                    )}
                </Link>
            )}
            {role !== 'customer' && (
                <form
                    className="relative hidden w-full max-w-xl md:block"
                    action="/admin/orders"
                    method="get"
                >
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2" />
                    <input
                        name="search"
                        type="search"
                        aria-label="Cari pesanan"
                        placeholder="Cari judul buku, pelanggan, atau nomor order..."
                        className="border-input bg-muted/80 focus:border-ring focus:ring-ring/20 h-10 w-full rounded-lg border pr-4 pl-11 text-sm transition outline-none focus:ring-4"
                    />
                </form>
            )}
            <div className="ml-auto flex min-w-0 items-center gap-3 sm:gap-5 md:min-w-auto">
                {role === 'customer' && (
                    <Link
                        href="/customer/dashboard/wallets"
                        className="text-primary focus-visible:ring-ring flex min-h-11 flex-col justify-center rounded-lg px-1 focus-visible:ring-2 focus-visible:outline-none md:hidden"
                    >
                        <span className="text-muted-foreground text-[10px]">
                            Saldo
                        </span>
                        <span className="text-xs font-semibold whitespace-nowrap tabular-nums">
                            {rupiah(walletBalance ?? '0.00')}
                        </span>
                    </Link>
                )}
                {user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                aria-label={`Menu profil ${user.name}`}
                                className="focus-visible:ring-ring flex min-h-11 min-w-0 items-center gap-2 rounded-lg text-left outline-none focus-visible:ring-2 md:min-w-auto"
                                type="button"
                            >
                                {user.role === 'customer' && (
                                    <span className="text-primary hidden text-[11px] font-semibold whitespace-nowrap tabular-nums sm:text-sm md:inline">
                                        {rupiah(walletBalance ?? '0.00')}
                                    </span>
                                )}
                                <Avatar className="border-secondary bg-accent size-10 border-2">
                                    <AvatarFallback className="bg-accent text-primary font-bold">
                                        {user.name.slice(0, 1).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span
                                    className={
                                        user.role === 'customer'
                                            ? 'grid max-w-24 min-w-0 sm:max-w-none md:min-w-auto'
                                            : 'hidden sm:grid'
                                    }
                                >
                                    <span className="text-foreground text-sm font-bold max-md:truncate">
                                        Halo, {user.name.split(' ')[0]}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                        {user.role === 'admin'
                                            ? 'Administrator'
                                            : 'Customer'}
                                    </span>
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
