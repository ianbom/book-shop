import { Link, usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
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
    { label: 'Lacak Order', href: '/track-order' },
];

function Brand() {
    return (
        <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Wonder Book, beranda"
        >
            <svg
                aria-hidden="true"
                viewBox="0 0 44 34"
                className="fill-foreground h-8 w-10"
            >
                <path d="M21 7C15 2 8 2 2 4v25c7-2 13 0 19 5V7Zm2 0c6-5 13-5 19-3v25c-7-2-13 0-19 5V7Z" />
                <path
                    d="M5 7c5-1 10 0 14 3v18c-4-2-9-3-14-2V7Zm34 0c-5-1-10 0-14 3v18c4-2 9-3 14-2V7Z"
                    fill="white"
                    opacity=".18"
                />
            </svg>
            <span className="font-heading text-foreground text-2xl font-semibold tracking-tight">
                Wonder Book
            </span>
        </Link>
    );
}

export function CustomerHeader() {
    const currentPath = usePage().url.split('?')[0];
    const isTrackingPage = currentPath.startsWith('/track-order');

    return (
        <header className="border-border bg-card/95 sticky top-0 z-50 border-b backdrop-blur-sm">
            <SectionContainer className="flex h-[72px] items-center justify-between">
                <Brand />
                <nav
                    className="hidden items-center gap-9 text-sm font-medium lg:flex"
                    aria-label="Navigasi utama"
                >
                    {navigation.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={
                                (item.href === '/' && currentPath === '/') ||
                                    (item.href !== '/' &&
                                        currentPath.startsWith(item.href))
                                    ? isTrackingPage
                                        ? 'text-foreground'
                                        : 'text-primary'
                                    : 'hover:text-foreground transition-colors'
                            }
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="hidden items-center gap-1 md:flex"></div>
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
                                    className="hover:bg-secondary rounded-md px-3 py-3 font-medium"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </SheetContent>
                </Sheet>
            </SectionContainer>
        </header>
    );
}
