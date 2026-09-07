import { Link, router, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import { Menu, Search } from 'lucide-react';
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
    { label: 'Buku', href: '/books' },
    { label: 'Lacak Order', href: '/track-order' },
];

function Brand() {
    return (
        <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5"
            aria-label="Wonder Book, beranda"
        >
            <svg
                aria-hidden="true"
                viewBox="0 0 48 48"
                className="text-foreground size-10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.35"
            >
                <rect x="3" y="3" width="42" height="42" />
                <path d="m5 5 38 38M43 5 5 43" />
            </svg>
            <span className="leading-none">
                <span className="font-heading block text-[1.7rem] font-semibold tracking-tight">
                    Wonderbook
                </span>
                <span className="text-muted-foreground mt-1 block text-[10px] font-semibold tracking-wide">
                    More Books, A better You
                </span>
            </span>
        </Link>
    );
}

export function CustomerHeader() {
    const page = usePage();
    const currentPath = page.url.split('?')[0];
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (page.url.startsWith('/books')) {
            const params = new URLSearchParams(page.url.split('?')[1] ?? '');
            setSearch(params.get('search') ?? '');
        } else {
            setSearch('');
        }
    }, [page.url]);

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = search.trim();
        router.get('/books', trimmed ? { search: trimmed } : {});
        setOpen(false);
    };

    return (
        <header className="bg-card text-foreground relative z-40 border-b">
            <SectionContainer className="flex min-h-[74px] items-center gap-4 py-3 lg:min-h-[86px]">
                <Brand />
                <form
                    onSubmit={submitSearch}
                    className="hidden min-w-0 flex-1 items-stretch gap-3 md:flex"
                >
                    <label className="border-border focus-within:border-primary flex h-10 min-w-0 flex-1 items-center border">
                        <span className="sr-only">Cari buku</span>
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari judul buku, penulis, atau ISBN..."
                            className="h-full min-w-0 flex-1 bg-transparent px-3 text-xs outline-none"
                        />
                        <button
                            type="submit"
                            className="text-foreground hover:bg-secondary border-l px-3 transition"
                            aria-label="Cari buku"
                        >
                            <Search className="size-5" />
                        </button>
                    </label>
                </form>

                <nav
                    className="ml-auto hidden items-center gap-6 text-sm font-medium md:flex"
                    aria-label="Navigasi utama"
                >
                    {navigation.map((item) => {
                        const isActive =
                            item.href === '/'
                                ? currentPath === '/'
                                : currentPath.startsWith(item.href);

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={
                                    isActive
                                        ? 'text-primary font-semibold'
                                        : 'text-muted-foreground hover:text-foreground transition-colors'
                                }
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto md:hidden"
                            aria-label="Buka navigasi"
                        >
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[320px] px-6">
                        <SheetHeader className="border-b px-0 py-5 text-left">
                            <SheetTitle>
                                <Brand />
                            </SheetTitle>
                        </SheetHeader>
                        <form
                            onSubmit={submitSearch}
                            className="mt-6 flex border"
                        >
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Cari buku..."
                                className="h-10 min-w-0 flex-1 px-3 text-sm outline-none"
                            />
                            <button type="submit" className="border-l px-3" aria-label="Cari buku">
                                <Search className="size-4" />
                            </button>
                        </form>
                        <nav
                            className="flex flex-col gap-1 py-6"
                            aria-label="Navigasi seluler"
                        >
                            {navigation.map((item) => {
                                const isActive =
                                    item.href === '/'
                                        ? currentPath === '/'
                                        : currentPath.startsWith(item.href);

                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className={`rounded-sm px-3 py-3 text-sm font-semibold transition-colors ${
                                            isActive
                                                ? 'bg-secondary text-primary'
                                                : 'hover:bg-secondary text-foreground'
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </SheetContent>
                </Sheet>
            </SectionContainer>
        </header>
    );
}
