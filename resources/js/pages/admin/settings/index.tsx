import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import admin from '@/routes/admin';
import type { StoreSetting } from '@/types/admin';

type SettingForm = Record<Exclude<keyof StoreSetting, 'id'>, string>;
type SettingField = {
    name: keyof SettingForm;
    label: string;
    type?: 'text' | 'email' | 'tel' | 'number' | 'textarea';
    required?: boolean;
    hint?: string;
};

const sections: {
    title: string;
    description: string;
    fields: SettingField[];
}[] = [
    {
        title: 'Identitas Toko',
        description: 'Informasi toko untuk pelanggan dan komunikasi.',
        fields: [
            { name: 'store_name', label: 'Nama toko', required: true },
            { name: 'whatsapp_number', label: 'Nomor WhatsApp', type: 'tel' },
            { name: 'email', label: 'Email toko', type: 'email' },
            { name: 'phone', label: 'Telepon toko', type: 'tel' },
            { name: 'address', label: 'Alamat toko', type: 'textarea' },
        ],
    },
    {
        title: 'Kurir',
        description: 'Kurir yang tersedia untuk perhitungan ongkos kirim.',
        fields: [
            {
                name: 'couriers',
                label: 'Kode kurir',
                required: true,
                hint: 'Pisahkan kode dengan koma, contoh: jne,sicepat,anteraja.',
            },
        ],
    },
    {
        title: 'Pengirim',
        description: 'Kontak pengirim yang digunakan saat membuat pengiriman.',
        fields: [
            { name: 'shipper_contact_name', label: 'Nama kontak pengirim' },
            {
                name: 'shipper_contact_phone',
                label: 'Telepon pengirim',
                type: 'tel',
            },
            {
                name: 'shipper_contact_email',
                label: 'Email pengirim',
                type: 'email',
            },
            { name: 'shipper_organization', label: 'Organisasi pengirim' },
        ],
    },
    {
        title: 'Lokasi Asal',
        description:
            'Isi kode pos, ID area, atau pasangan koordinat lintang dan bujur.',
        fields: [
            {
                name: 'origin_contact_name',
                label: 'Nama kontak asal',
                required: true,
            },
            {
                name: 'origin_contact_phone',
                label: 'Telepon asal',
                type: 'tel',
                required: true,
            },
            {
                name: 'origin_contact_email',
                label: 'Email asal',
                type: 'email',
            },
            {
                name: 'origin_address',
                label: 'Alamat asal',
                type: 'textarea',
                required: true,
            },
            {
                name: 'origin_note',
                label: 'Catatan alamat asal',
                type: 'textarea',
            },
            { name: 'origin_postal_code', label: 'Kode pos asal' },
            { name: 'origin_area_id', label: 'ID area asal' },
            { name: 'origin_location_id', label: 'ID lokasi asal' },
            { name: 'origin_latitude', label: 'Lintang asal', type: 'number' },
            { name: 'origin_longitude', label: 'Bujur asal', type: 'number' },
        ],
    },
];

export default function StoreSettings({
    setting,
}: {
    setting: StoreSetting | null;
}) {
    const form = useForm<SettingForm>({
        store_name: setting?.store_name ?? '',
        whatsapp_number: setting?.whatsapp_number ?? '',
        email: setting?.email ?? '',
        phone: setting?.phone ?? '',
        address: setting?.address ?? '',
        couriers: setting?.couriers ?? '',
        shipper_contact_name: setting?.shipper_contact_name ?? '',
        shipper_contact_phone: setting?.shipper_contact_phone ?? '',
        shipper_contact_email: setting?.shipper_contact_email ?? '',
        shipper_organization: setting?.shipper_organization ?? '',
        origin_contact_name: setting?.origin_contact_name ?? '',
        origin_contact_phone: setting?.origin_contact_phone ?? '',
        origin_contact_email: setting?.origin_contact_email ?? '',
        origin_address: setting?.origin_address ?? '',
        origin_note: setting?.origin_note ?? '',
        origin_postal_code: setting?.origin_postal_code ?? '',
        origin_area_id: setting?.origin_area_id ?? '',
        origin_location_id: setting?.origin_location_id ?? '',
        origin_latitude: setting?.origin_latitude ?? '',
        origin_longitude: setting?.origin_longitude ?? '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.patch(admin.settings.update.url(), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Pengaturan Toko" />
            <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title="Pengaturan Toko"
                    description="Kelola identitas toko, kurir, pengirim, dan lokasi asal."
                />
                <form onSubmit={submit} className="max-w-5xl space-y-6">
                    {sections.map((section) => (
                        <Card key={section.title}>
                            <CardHeader>
                                <CardTitle>{section.title}</CardTitle>
                                <CardDescription>
                                    {section.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-5 md:grid-cols-2">
                                {section.fields.map((field) => {
                                    const error = form.errors[field.name];
                                    const describedBy =
                                        [
                                            field.hint && `${field.name}-hint`,
                                            error && `${field.name}-error`,
                                        ]
                                            .filter(Boolean)
                                            .join(' ') || undefined;

                                    return (
                                        <div
                                            key={field.name}
                                            className={`grid gap-2 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}
                                        >
                                            <Label htmlFor={field.name}>
                                                {field.label}
                                                {field.required && (
                                                    <span
                                                        className="text-destructive"
                                                        aria-hidden="true"
                                                    >
                                                        {' '}
                                                        *
                                                    </span>
                                                )}
                                            </Label>
                                            {field.type === 'textarea' ? (
                                                <Textarea
                                                    id={field.name}
                                                    name={field.name}
                                                    rows={3}
                                                    value={
                                                        form.data[field.name]
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            field.name,
                                                            event.target.value,
                                                        )
                                                    }
                                                    required={field.required}
                                                    aria-invalid={Boolean(
                                                        error,
                                                    )}
                                                    aria-describedby={
                                                        describedBy
                                                    }
                                                />
                                            ) : (
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    type={field.type ?? 'text'}
                                                    value={
                                                        form.data[field.name]
                                                    }
                                                    onChange={(event) =>
                                                        form.setData(
                                                            field.name,
                                                            event.target.value,
                                                        )
                                                    }
                                                    required={field.required}
                                                    step={
                                                        field.type === 'number'
                                                            ? '0.0000001'
                                                            : undefined
                                                    }
                                                    min={
                                                        field.name ===
                                                        'origin_latitude'
                                                            ? -90
                                                            : field.name ===
                                                                'origin_longitude'
                                                              ? -180
                                                              : undefined
                                                    }
                                                    max={
                                                        field.name ===
                                                        'origin_latitude'
                                                            ? 90
                                                            : field.name ===
                                                                'origin_longitude'
                                                              ? 180
                                                              : undefined
                                                    }
                                                    aria-invalid={Boolean(
                                                        error,
                                                    )}
                                                    aria-describedby={
                                                        describedBy
                                                    }
                                                />
                                            )}
                                            {field.hint && (
                                                <p
                                                    id={`${field.name}-hint`}
                                                    className="text-muted-foreground text-sm"
                                                >
                                                    {field.hint}
                                                </p>
                                            )}
                                            <InputError
                                                id={`${field.name}-error`}
                                                message={error}
                                            />
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    ))}
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </Button>
                </form>
            </main>
        </>
    );
}

StoreSettings.layout = {
    breadcrumbs: [{ title: 'Pengaturan Toko', href: admin.settings.edit() }],
};
