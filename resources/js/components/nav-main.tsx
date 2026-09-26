import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
            <SidebarGroup className="px-0 py-0">
                <SidebarGroupLabel className="text-sidebar-foreground/55 px-3 font-semibold tracking-[0.14em] uppercase text-[10px]">Menu Utama</SidebarGroupLabel>
                <SidebarMenu className="gap-1">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        {item.children ? (
                            <div className="space-y-1 py-1">
                                <SidebarGroupLabel className="text-sidebar-foreground/55 px-3 font-semibold tracking-[0.14em] uppercase text-[10px]">
                                    {item.title}
                                </SidebarGroupLabel>
                                {item.children.map((child) => (
                                    <SidebarMenuButton
                                        key={child.title}
                                        asChild
                                        isActive={isCurrentUrl(child.href)}
                                        tooltip={{ children: child.title }}
                                        className="h-10 rounded-xl px-3 text-[13px]"
                                    >
                                        <Link href={child.href} prefetch>
                                            {child.icon && <child.icon />}
                                            <span>{child.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                ))}
                            </div>
                        ) : (
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(item.href)}
                                tooltip={{ children: item.title }}
                                className="h-11 rounded-xl px-3 text-[13px] font-semibold group-data-[collapsible=icon]:justify-center"
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
