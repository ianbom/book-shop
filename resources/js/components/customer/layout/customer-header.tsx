import { Link, usePage } from '@inertiajs/react';
import { Heart, Menu, Search, ShoppingBag, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { SectionContainer } from '@/components/customer/shared/section-container';

const navigation = [
    { label: 'Home', href: '/' },
    { label: 'Katalog', href: '/books' },
    { label: 'Koleksi', href: '#koleksi' },
    { label: 'Tentang', href: '#tentang' },
    { label: 'Lacak Order', href: '#kontak' },
];

function Brand() {
    return (
        <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Buku Order, beranda"
        >
            <svg
                aria-hidden="true"
                viewBox="0 0 44 34"
                className="h-8 w-10 fill-[#0B1F3A]"
            >
                <path d="M21 7C15 2 8 2 2 4v25c7-2 13 0 19 5V7Zm2 0c6-5 13-5 19-3v25c-7-2-13 0-19 5V7Z" />
                <path
                    d="M5 7c5-1 10 0 14 3v18c-4-2-9-3-14-2V7Zm34 0c-5-1-10 0-14 3v18c4-2 9-3 14-2V7Z"
                    fill="white"
                    opacity=".18"
                />
            </svg>
            <span className="font-serif text-2xl font-semibold tracking-tight text-[#0B1F3A]">
                Buku Order
            </span>
        </Link>
    );
}

export function CustomerHeader() {
    const currentPath = usePage().url.split('?')[0];

    return (
        <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
            <SectionContainer className="flex h-[72px] items-center justify-between">
                <Brand />
                <nav
                    className="hidden items-center gap-9 text-sm font-medium lg:flex"
                    aria-label="Navigasi utama"
                >
                    {navigation.map((item, index) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={
                                (item.href === '/' && currentPath === '/') ||
                                (item.href !== '/' && currentPath.startsWith(item.href))
                                    ? 'text-[#2563EB]'
                                    : 'transition-colors hover:text-[#2563EB]'
                            }
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="hidden items-center gap-1 md:flex">
                    <Button variant="ghost" size="icon" aria-label="Cari buku">
                        <Search />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Profil admin"
                    >
                        <UserRound />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative"
                        aria-label="Buku favorit"
                    >
                        <Heart />
                        <span className="absolute top-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-[#2563EB] text-[9px] text-white">
                            2
                        </span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative"
                        aria-label="Pesanan"
                    >
                        <ShoppingBag />
                        <span className="absolute top-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-[#2563EB] text-[9px] text-white">
                            0
                        </span>
                    </Button>
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            aria-label="Buka navigasi"
                        >
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[310px] px-6">
                        <SheetHeader className="border-b px-0 py-5 text-left">
                            <SheetTitle>
                                <Brand />
                            </SheetTitle>
                        </SheetHeader>
                        <nav
                            className="flex flex-col gap-1 py-6"
                            aria-label="Navigasi seluler"
                        >
                            {navigation.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="rounded-md px-3 py-3 font-medium hover:bg-[#EAF2FF]"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                        <div className="flex gap-2 border-t pt-5">
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="Cari buku"
                            >
                                <Search />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="Buku favorit"
                            >
                                <Heart />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="Pesanan"
                            >
                                <ShoppingBag />
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </SectionContainer>
        </header>
    );
}
