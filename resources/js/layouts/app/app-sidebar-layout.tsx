import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';
import type { User } from '@/types/auth';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    role,
}: AppLayoutProps & { role?: User['role'] }) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar role={role} />
            <AppContent variant="sidebar" className="admin-dashboard-shell min-w-0 overflow-x-clip">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="flex min-h-0 flex-1 flex-col">
                    {children}
                    <footer className="text-muted-foreground mt-auto flex flex-col gap-3 border-t bg-white/70 px-5 py-5 text-xs sm:flex-row sm:items-center sm:justify-between md:px-8">
                        <span>© 2026 Wonder Book. All rights reserved.</span>
                        <div className="flex gap-4">
                            <span>Syarat &amp; Ketentuan</span>
                            <span>FAQ</span>
                            <span>Hubungi Kami</span>
                        </div>
                    </footer>
                </div>
            </AppContent>
        </AppShell>
    );
}
