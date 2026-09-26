import { Link, router, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';
import {
    Menu,
    Search,
    ShoppingCart,
    Sparkles,
    UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { SectionContainer } from '@/components/customer/shared/section-container';
import admin from '@/routes/admin';
import { login } from '@/routes';

const navigation = [
    { label: 'Beranda', href: '/' },
    { label: 'Katalog Buku', href: '/books' },
    { label: 'Lacak Pesanan', href: '/track-order' },
];

function Brand({ logoSrc }: { logoSrc: string }) {
    return (
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="WonderBookLibrary, beranda">
            <span className="relative grid size-10 shrink-0 place-items-center">
                <img src={logoSrc} alt="" className="absolute size-full rounded-full object-cover object-top" />
                <span className="bg-background/75 absolute right-0 bottom-0 grid size-4 place-items-center rounded-full text-warning">
                    <Sparkles className="size-3" />
                </span>
            </span>
            <span className="leading-none">
                <span className="font-heading text-foreground block text-lg font-bold tracking-tight sm:text-xl">WonderBookLibrary</span>
                <span className="text-muted-foreground mt-1 block text-[9px] font-semibold tracking-wide">Little Books, Big Dreams</span>
            </span>
        </Link>
    );
}

export function CustomerHeader({ logoSrc }: { logoSrc: string }) {
    const page = usePage();
    const currentPath = page.url.split('?')[0];
    const user = page.props.auth.user;
    const accountHref = user?.role === 'admin' ? admin.dashboard() : user ? '/' : login();
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
        <header className="border-border bg-background/95 sticky top-0 z-40 border-b shadow-[0_2px_12px_rgba(36,79,128,0.06)] backdrop-blur">
            <SectionContainer className="flex min-h-[66px] items-center gap-3 py-2 lg:min-h-[70px] lg:gap-5">
                <Brand logoSrc={logoSrc} />
                <nav className="ml-auto hidden items-center gap-4 text-[11px] font-semibold text-foreground lg:flex xl:gap-6" aria-label="Navigasi utama">
                    {navigation.map((item) => {
                        const isActive = item.href === '/' ? currentPath === '/' : currentPath === item.href;

                        return (
                            <Link key={item.label} href={item.href} className={`relative inline-flex h-[66px] items-center gap-1 whitespace-nowrap transition-colors ${isActive ? 'text-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:bg-primary' : 'hover:text-primary'}`}>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <form onSubmit={submitSearch} className="relative hidden min-w-0 max-w-64 flex-1 md:block xl:max-w-72">
                    <Search className="text-primary absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari judul buku, penulis, atau kategori..." aria-label="Cari buku" className="border-border bg-muted/60 focus:border-primary h-9 w-full rounded-full border pr-3 pl-9 text-[10px] outline-none transition focus:ring-2 focus:ring-primary/15" />
                </form>
                <div className="hidden items-center gap-1 sm:flex">
                    <span aria-hidden="true" className="text-primary relative grid size-9 place-items-center"><ShoppingCart className="size-[18px]" /><span className="bg-destructive absolute top-1 right-0 grid size-3 place-items-center rounded-full text-[8px] text-white">0</span></span>
                </div>
                {user ? (
                    <Link href={accountHref} aria-label={user.role === 'admin' ? 'Dashboard admin' : 'Akun saya'} className="text-primary hover:bg-secondary focus-visible:ring-ring hidden size-9 items-center justify-center rounded-full transition focus-visible:ring-2 focus-visible:ring-offset-2 sm:inline-flex"><UserRound className="size-[18px]" /></Link>
                ) : (
                    <Link href={accountHref} className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring hidden h-9 items-center justify-center rounded-full px-5 text-[11px] font-bold shadow-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 sm:inline-flex">Login</Link>
                )}
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="ml-auto size-9 lg:hidden" aria-label="Buka navigasi"><Menu className="size-4" /></Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[320px] px-6">
                        <SheetHeader className="border-b px-0 py-5 text-left"><SheetTitle><Brand logoSrc={logoSrc} /></SheetTitle></SheetHeader>
                        <form onSubmit={submitSearch} className="border-input mt-6 flex h-10 rounded-full border">
                            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari buku..." aria-label="Cari buku" className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none" />
                            <button type="submit" className="text-primary px-3" aria-label="Cari buku"><Search className="size-4" /></button>
                        </form>
                        <nav className="flex flex-col gap-1 py-6" aria-label="Navigasi seluler">
                            {navigation.map((item) => {
                                const isActive = item.href === '/' ? currentPath === '/' : currentPath === item.href;
                                return <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className={`rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${isActive ? 'bg-secondary text-primary' : 'text-foreground hover:bg-secondary'}`}>{item.label}</Link>;
                            })}
                        </nav>
                        <Link href={accountHref} onClick={() => setOpen(false)} className="bg-primary text-primary-foreground flex h-10 items-center justify-center rounded-full text-sm font-semibold">{user ? user.role === 'admin' ? 'Dashboard admin' : 'Akun saya' : 'Login'}</Link>
                    </SheetContent>
                </Sheet>
            </SectionContainer>
        </header>
    );
}
