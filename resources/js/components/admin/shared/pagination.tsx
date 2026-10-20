import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import type { PaginationLink } from '@/types/admin';

export function Pagination({
    links,
    preserveState = false,
}: {
    links: PaginationLink[];
    preserveState?: boolean;
}) {
    return (
        <nav
            className="flex flex-wrap justify-end gap-1"
            aria-label="Pagination"
        >
            {links.map((link, index) => (
                <Button
                    key={`${link.label}-${index}`}
                    asChild={Boolean(link.url)}
                    variant={link.active ? 'default' : 'outline'}
                    size="sm"
                    disabled={!link.url}
                >
                    <Link
                        href={link.url ?? '#'}
                        preserveScroll
                        preserveState={preserveState}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                </Button>
            ))}
        </nav>
    );
}
