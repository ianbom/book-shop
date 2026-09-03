import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyState({ onReset }: { onReset: () => void }) {
    return (
        <div className="grid min-h-72 place-items-center border border-dashed border-slate-200 py-12 text-center">
            <div>
                <SearchX className="mx-auto size-9 text-slate-400" />
                <h2 className="mt-4 font-serif text-2xl font-semibold">
                    Buku tidak ditemukan
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                    Coba ubah kata pencarian atau filter yang digunakan.
                </p>
                <Button variant="outline" onClick={onReset} className="mt-5">
                    Reset Filter
                </Button>
            </div>
        </div>
    );
}
