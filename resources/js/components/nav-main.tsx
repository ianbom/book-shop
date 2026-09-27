import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

export type NavMainItem =
    | NavItem
    | {
          title: string;
          icon?: NavItem['icon'];
          disabled: true;
      };

export function NavMain({ items }: { items: NavMainItem[] }) {
    const { currentUrl } = useCurrentUrl();
    const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';
    const pathFor = (href: NavItem['href']) =>
        normalizePath(
            new URL(
                toUrl(href),
                typeof window !== 'undefined'
                    ? window.location.origin
                    : 'http://localhost',
            ).pathname,
        );
    const currentPath = normalizePath(currentUrl);
    const activePath = items
        .flatMap((item) =>
            'disabled' in item
                ? []
                : item.children
                  ? item.children.map((child) => pathFor(child.href))
                  : [pathFor(item.href)],
        )
        .filter(
            (path) =>
                currentPath === path || currentPath.startsWith(`${path}/`),
        )
        .sort((first, second) => second.length - first.length)[0];
    const isActive = (href: NavItem['href']) => pathFor(href) === activePath;

    return (
        <SidebarGroup className="px-0 py-0">
            <SidebarGroupLabel className="text-sidebar-foreground/55 px-3 text-[10px] font-semibold tracking-[0.14em] uppercase">
                Menu Utama
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        {'disabled' in item ? (
                            <SidebarMenuButton
                                disabled
                                title={`${item.title}: segera hadir`}
                                aria-label={`${item.title}, segera hadir`}
                                className="h-11 rounded-xl px-3 text-[13px] font-semibold disabled:opacity-100"
                            >
                                {item.icon && <item.icon />}
                                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                    <span>{item.title}</span>
                                    <span className="text-sidebar-foreground text-[10px] font-normal">
                                        Segera hadir
                                    </span>
                                </span>
                            </SidebarMenuButton>
                        ) : item.children ? (
                            <div className="space-y-1 py-1">
                                <SidebarGroupLabel className="text-sidebar-foreground/55 px-3 text-[10px] font-semibold tracking-[0.14em] uppercase">
                                    {item.title}
                                </SidebarGroupLabel>
                                {item.children.map((child) => (
                                    <SidebarMenuButton
                                        key={child.title}
                                        asChild
                                        isActive={isActive(child.href)}
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
                                isActive={isActive(item.href)}
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
