import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-11 items-center justify-center rounded-xl shadow-sm">
                <AppLogoIcon className="text-primary-foreground size-7 fill-current" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                <span className="truncate font-heading text-xl leading-none font-bold tracking-wide text-sidebar-foreground">
                    WONDER BOOK
                </span>
                <span className="text-muted-foreground mt-1 text-[10px] font-semibold tracking-[0.16em] uppercase">
                    Admin Library
                </span>
            </div>
        </>
    );
}
