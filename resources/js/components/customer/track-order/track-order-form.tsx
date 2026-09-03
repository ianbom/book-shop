import { FormEvent, useState } from 'react';
import { router } from '@inertiajs/react';
import { ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function TrackOrderForm() {
    const [orderCode, setOrderCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const code = orderCode.trim().toUpperCase();

        if (!code) {
            setError('Kode order wajib diisi.');
            return;
        }

        setError(null);
        setProcessing(true);
        router.visit('/track-order/' + encodeURIComponent(code), {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-3" noValidate>
            <Label htmlFor="order_code">Kode Order</Label>
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search
                        aria-hidden="true"
                        className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    />
                    <Input
                        id="order_code"
                        value={orderCode}
                        onChange={(event) => {
                            setOrderCode(event.target.value);
                            if (error) setError(null);
                        }}
                        placeholder="Contoh: BK-K7X29P4D"
                        className="h-11 pl-10 uppercase"
                        aria-describedby={
                            error ? 'order-code-error' : undefined
                        }
                        aria-invalid={Boolean(error)}
                        autoComplete="off"
                        required
                    />
                </div>
                <Button type="submit" className="h-11" disabled={processing}>
                    {processing ? 'Memeriksa...' : 'Cek Status Pesanan'}
                    {!processing && <ArrowRight aria-hidden="true" />}
                </Button>
            </div>
            {error && (
                <p id="order-code-error" className="text-destructive text-sm">
                    {error}
                </p>
            )}
        </form>
    );
}
