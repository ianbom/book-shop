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
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        {item.children ? (
                            <div className="space-y-1 py-1">
                                <div className="text-muted-foreground flex items-center gap-2 px-2 py-1 text-xs font-medium group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                                    {item.icon && (
                                        <item.icon className="size-4" />
                                    )}
                                    <span className="group-data-[collapsible=icon]:hidden">
                                        {item.title}
                                    </span>
                                </div>
                                {item.children.map((child) => (
                                    <SidebarMenuButton
                                        key={child.title}
                                        asChild
                                        isActive={isCurrentUrl(child.href)}
                                        tooltip={{ children: child.title }}
                                        className="ml-2 group-data-[collapsible=icon]:ml-0"
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
