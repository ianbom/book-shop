import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyState({ onReset }: { onReset: () => void }) {
    return (
        <div className="border-primary/25 bg-secondary/15 grid min-h-72 place-items-center rounded-xl border border-dashed px-4 py-12 text-center">
            <div>
                <span className="bg-secondary/70 mx-auto grid size-16 place-items-center rounded-full">
                    <SearchX
                        className="text-primary size-8"
                        aria-hidden="true"
                    />
                </span>
                <h2 className="font-heading mt-4 text-2xl font-semibold">
                    Buku tidak ditemukan
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                    Coba ubah kata pencarian atau filter yang digunakan.
                </p>
                <Button
                    variant="outline"
                    onClick={onReset}
                    className="border-primary/30 mt-5 rounded-md"
                >
                    Reset Filter
                </Button>
            </div>
        </div>
    );
}
