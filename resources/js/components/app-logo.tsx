import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-11 items-center justify-center rounded-xl shadow-sm">
                <AppLogoIcon className="text-primary-foreground size-7 fill-current" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                <span className="font-heading text-sidebar-foreground text-sm leading-tight font-bold tracking-wide">
                    Wonder Prince Library
                </span>
                <span className="text-muted-foreground mt-1 text-[10px] font-semibold tracking-[0.16em] uppercase">
                    Admin Library
                </span>
            </div>
        </>
    );
}
