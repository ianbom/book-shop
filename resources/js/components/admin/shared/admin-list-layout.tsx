import type { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronRight, House, type LucideIcon } from 'lucide-react';
import admin from '@/routes/admin';

type Props = {
    title: string;
    description: string;
    icon: LucideIcon;
    children: ReactNode;
    dashboardHref?: string;
    eyebrow?: string;
};

export function AdminListLayout({
    title,
    description,
    icon: Icon,
    children,
    dashboardHref = admin.dashboard().url,
    eyebrow = 'Manajemen Toko',
}: Props) {
    return (
        <main className="mx-auto flex w-full max-w-[1560px] flex-1 flex-col gap-5 px-4 py-5 md:px-7 md:py-7">
            <nav
                className="text-muted-foreground flex items-center gap-2 text-xs"
                aria-label="Breadcrumb"
            >
                <Link
                    href={dashboardHref}
                    className="hover:text-primary inline-flex items-center gap-1.5"
                >
                    <House className="size-3.5" />
                    Dashboard
                </Link>
                <ChevronRight className="size-3.5" />
                <span className="text-foreground font-semibold">{title}</span>
            </nav>

            <section className="bg-muted/60 relative overflow-hidden rounded-2xl border border-white/80 px-5 py-6 sm:px-7 sm:py-7">
                <div className="relative z-10 max-w-2xl">
                    <div className="flex items-center gap-3">
                        <span className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-xl shadow-sm">
                            <Icon className="size-6" />
                        </span>
                        <div>
                            <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
                                {eyebrow}
                            </p>
                            <h1 className="font-heading text-foreground text-4xl leading-none font-bold sm:text-5xl">
                                {title}
                            </h1>
                        </div>
                    </div>
                    <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-6">
                        {description}
                    </p>
                </div>
                <img
                    src="/dashboard-image/pesanan.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute right-0 bottom-0 hidden h-full max-w-[56%] object-contain object-right lg:block"
                />
            </section>

            {children}
        </main>
    );
}
