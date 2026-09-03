import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyState({ onReset }: { onReset: () => void }) {
    return (
        <div className="border-border grid min-h-72 place-items-center border border-dashed py-12 text-center">
            <div>
                <SearchX className="text-muted-foreground mx-auto size-9" />
                <h2 className="font-heading mt-4 text-2xl font-semibold">
                    Buku tidak ditemukan
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                    Coba ubah kata pencarian atau filter yang digunakan.
                </p>
                <Button variant="outline" onClick={onReset} className="mt-5">
                    Reset Filter
                </Button>
            </div>
        </div>
    );
}
