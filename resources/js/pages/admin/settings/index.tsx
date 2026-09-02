import { FormEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import admin from '@/routes/admin';
import type { StoreSetting } from '@/types/admin';

export default function StoreSettings({
    setting,
}: {
    setting: StoreSetting | null;
}) {
    const form = useForm({
        store_name: setting?.store_name ?? 'Buku Order',
        whatsapp_number: setting?.whatsapp_number ?? '',
        email: setting?.email ?? '',
        address: setting?.address ?? '',
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.patch(admin.settings.update.url(), { preserveScroll: true });
    };
    return (
        <>
            <Head title="Pengaturan Toko" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Pengaturan Toko"
                    description="Informasi utama toko untuk komunikasi pelanggan."
                />
                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle>Identitas Toko</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-5">
                            <div className="grid gap-2">
                                <Label htmlFor="store_name">Nama Toko</Label>
                                <Input
                                    id="store_name"
                                    value={form.data.store_name}
                                    onChange={(event) =>
                                        form.setData(
                                            'store_name',
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                                <p className="text-destructive text-sm">
                                    {form.errors.store_name}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="whatsapp_number">
                                    Nomor WhatsApp
                                </Label>
                                <Input
                                    id="whatsapp_number"
                                    value={form.data.whatsapp_number}
                                    onChange={(event) =>
                                        form.setData(
                                            'whatsapp_number',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="628123456789"
                                    required
                                />
                                <p className="text-destructive text-sm">
                                    {form.errors.whatsapp_number}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(event) =>
                                        form.setData(
                                            'email',
                                            event.target.value,
                                        )
                                    }
                                />
                                <p className="text-destructive text-sm">
                                    {form.errors.email}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Alamat</Label>
                                <Textarea
                                    id="address"
                                    rows={5}
                                    value={form.data.address}
                                    onChange={(event) =>
                                        form.setData(
                                            'address',
                                            event.target.value,
                                        )
                                    }
                                />
                                <p className="text-destructive text-sm">
                                    {form.errors.address}
                                </p>
                            </div>
                            <Button disabled={form.processing}>
                                Simpan Pengaturan
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </>
    );
}

StoreSettings.layout = {
    breadcrumbs: [{ title: 'Pengaturan Toko', href: admin.settings.edit() }],
};
