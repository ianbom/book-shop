import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="bg-muted grid min-h-svh lg:grid-cols-2">
            <div className="bg-foreground relative hidden min-h-svh overflow-hidden lg:block">
                <img
                    src="/images/customer/home/hero.jpg"
                    alt=""
                    className="absolute inset-0 size-full object-cover opacity-70"
                />
                <div className="from-foreground via-foreground/65 absolute inset-0 bg-gradient-to-t to-transparent" />
                <Link
                    href={home()}
                    className="text-primary-foreground relative z-10 flex items-center gap-3 p-10 text-lg font-medium"
                >
                    <AppLogoIcon className="size-8 fill-current" />
                    <span className="font-heading text-2xl tracking-tight">
                        Buku Order
                    </span>
                </Link>
                <div className="text-primary-foreground absolute right-10 bottom-10 left-10 z-10 max-w-lg">
                    <p className="mb-4 text-xs font-semibold tracking-[0.24em] uppercase opacity-75">
                        Ruang kerja admin
                    </p>
                    <p className="font-heading text-4xl leading-tight font-semibold">
                        Kelola setiap cerita yang sampai ke pembaca.
                    </p>
                </div>
            </div>
            <div className="flex min-h-svh flex-col p-6 md:p-10">
                <Link
                    href={home()}
                    className="text-foreground flex items-center gap-3 lg:hidden"
                >
                    <AppLogoIcon className="size-8 fill-current" />
                    <span className="font-heading text-xl font-semibold">
                        Buku Order
                    </span>
                </Link>
                <div className="flex flex-1 items-center justify-center py-10">
                    <div className="w-full max-w-sm space-y-7">
                        <div className="space-y-2">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {title}
                            </h1>
                            <p className="text-muted-foreground text-sm text-balance">
                                {description}
                            </p>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
