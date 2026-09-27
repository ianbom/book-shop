import { Head, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
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
import { AddressMap } from '@/components/customer/profile/address-map';
import admin from '@/routes/admin';
import type { BankAccount, StoreSetting } from '@/types/admin';

type SettingForm = Record<
    Exclude<keyof StoreSetting, 'id' | 'bank_accounts'>,
    string
> & {
    bank_accounts: BankAccount[];
};
type SettingField = {
    name: Exclude<keyof SettingForm, 'bank_accounts'>;
    label: string;
    type?: 'text' | 'email' | 'tel' | 'number' | 'textarea';
    required?: boolean;
    hint?: string;
};
type Area = { id: string; province: string; city: string; district: string };

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
            'Cari wilayah dari kode pos, lalu tentukan titik alamat pada peta.',
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
        bank_accounts: setting?.bank_accounts ?? [],
    });
    const bankErrors = form.errors as Record<string, string>;
    const [areas, setAreas] = useState<Area[]>([]);
    const [loadingAreas, setLoadingAreas] = useState(false);
    const [areaError, setAreaError] = useState('');
    const [mapError, setMapError] = useState('');
    const coordinatesRef = useRef([
        form.data.origin_latitude,
        form.data.origin_longitude,
    ]);
    coordinatesRef.current = [
        form.data.origin_latitude,
        form.data.origin_longitude,
    ];
    const [center, setCenter] = useState<[number, number] | null>(() =>
        form.data.origin_latitude && form.data.origin_longitude
            ? [
                  Number(form.data.origin_latitude),
                  Number(form.data.origin_longitude),
              ]
            : null,
    );
    const selectedArea = areas.find(
        (area) => area.id === form.data.origin_area_id,
    );

    useEffect(() => {
        const postalCode = form.data.origin_postal_code;
        if (!/^\d{5}$/.test(postalCode)) {
            setAreas([]);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoadingAreas(true);
            setAreaError('');
            try {
                const response = await fetch(
                    `/admin/settings/address/areas?postal_code=${postalCode}`,
                    {
                        signal: controller.signal,
                        headers: { Accept: 'application/json' },
                    },
                );
                const result = await response.json();
                if (!response.ok)
                    throw new Error(
                        result.message ?? 'Pencarian kode pos gagal.',
                    );

                setAreas(result.areas);
                if (
                    !result.areas.some(
                        (area: Area) => area.id === form.data.origin_area_id,
                    )
                )
                    form.setData(
                        'origin_area_id',
                        result.areas.length === 1 ? result.areas[0].id : '',
                    );
                if (!result.areas.length)
                    setAreaError('Kode pos tidak ditemukan.');
            } catch (error) {
                if (!controller.signal.aborted)
                    setAreaError(
                        error instanceof Error
                            ? error.message
                            : 'Pencarian kode pos gagal.',
                    );
            } finally {
                if (!controller.signal.aborted) setLoadingAreas(false);
            }
        }, 350);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [form.data.origin_postal_code]);

    useEffect(() => {
        const postalCode = form.data.origin_postal_code;
        const areaId = form.data.origin_area_id;
        if (!/^\d{5}$/.test(postalCode) || !areaId) return;

        const controller = new AbortController();
        setMapError('');
        void (async () => {
            try {
                const query = new URLSearchParams({
                    postal_code: postalCode,
                    area_id: areaId,
                });
                const response = await fetch(
                    `/admin/settings/address/map-center?${query}`,
                    {
                        signal: controller.signal,
                        headers: { Accept: 'application/json' },
                    },
                );
                const result = await response.json();
                if (!response.ok)
                    throw new Error(
                        result.message ?? 'Titik awal peta belum tersedia.',
                    );
                if (result.center && !coordinatesRef.current[0])
                    setCenter([
                        result.center.latitude,
                        result.center.longitude,
                    ]);
                else
                    setMapError(
                        'Titik awal belum tersedia. Pilih lokasi langsung pada peta.',
                    );
            } catch (error) {
                if (!controller.signal.aborted)
                    setMapError(
                        error instanceof Error
                            ? error.message
                            : 'Pencarian titik peta gagal.',
                    );
            }
        })();

        return () => controller.abort();
    }, [form.data.origin_postal_code, form.data.origin_area_id]);

    const setCoordinates = (latitude: number, longitude: number) => {
        form.setData((data) => ({
            ...data,
            origin_latitude: String(latitude),
            origin_longitude: String(longitude),
        }));
        setMapError('');
    };

    const updatePostalCode = (postalCode: string) => {
        form.setData((data) => ({
            ...data,
            origin_postal_code: postalCode.replace(/\D/g, '').slice(0, 5),
            origin_area_id: '',
            origin_latitude: '',
            origin_longitude: '',
        }));
        setCenter(null);
        setAreas([]);
    };

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
                                {section.title === 'Lokasi Asal' && (
                                    <div className="grid gap-5 md:col-span-2 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="origin_postal_code">
                                                Kode pos asal
                                            </Label>
                                            <Input
                                                id="origin_postal_code"
                                                inputMode="numeric"
                                                autoComplete="postal-code"
                                                maxLength={5}
                                                value={
                                                    form.data.origin_postal_code
                                                }
                                                onChange={(event) =>
                                                    updatePostalCode(
                                                        event.target.value,
                                                    )
                                                }
                                                aria-invalid={Boolean(
                                                    form.errors
                                                        .origin_postal_code,
                                                )}
                                                aria-describedby="origin_postal_code-error"
                                            />
                                            <p className="text-muted-foreground text-sm">
                                                {loadingAreas
                                                    ? 'Mencari wilayah…'
                                                    : areaError ||
                                                      'Masukkan 5 digit kode pos.'}
                                            </p>
                                            <InputError
                                                id="origin_postal_code-error"
                                                message={
                                                    form.errors
                                                        .origin_postal_code
                                                }
                                            />
                                        </div>
                                        {areas.length > 1 ? (
                                            <div className="grid gap-2">
                                                <Label htmlFor="origin_area_id">
                                                    Pilih wilayah
                                                </Label>
                                                <select
                                                    id="origin_area_id"
                                                    className="border-input bg-background h-9 rounded-md border px-3 text-sm shadow-xs"
                                                    value={
                                                        form.data.origin_area_id
                                                    }
                                                    onChange={(event) => {
                                                        form.setData(
                                                            (data) => ({
                                                                ...data,
                                                                origin_area_id:
                                                                    event.target
                                                                        .value,
                                                                origin_latitude:
                                                                    '',
                                                                origin_longitude:
                                                                    '',
                                                            }),
                                                        );
                                                        setCenter(null);
                                                    }}
                                                >
                                                    <option value="">
                                                        Pilih kecamatan
                                                    </option>
                                                    {areas.map((area) => (
                                                        <option
                                                            key={area.id}
                                                            value={area.id}
                                                        >
                                                            {area.district},{' '}
                                                            {area.city},{' '}
                                                            {area.province}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError
                                                    message={
                                                        form.errors
                                                            .origin_area_id
                                                    }
                                                />
                                            </div>
                                        ) : null}
                                        {(
                                            [
                                                [
                                                    'Provinsi',
                                                    selectedArea?.province,
                                                ],
                                                ['Kota', selectedArea?.city],
                                                [
                                                    'Kecamatan',
                                                    selectedArea?.district,
                                                ],
                                            ] as const
                                        ).map(([label, value]) => (
                                            <div
                                                key={label}
                                                className="grid gap-2"
                                            >
                                                <Label
                                                    htmlFor={`origin_${label}`}
                                                >
                                                    {label}
                                                </Label>
                                                <Input
                                                    id={`origin_${label}`}
                                                    value={value ?? ''}
                                                    readOnly
                                                    placeholder="Terisi dari kode pos"
                                                />
                                            </div>
                                        ))}
                                        {(selectedArea ||
                                            (form.data.origin_latitude &&
                                                form.data
                                                    .origin_longitude)) && (
                                            <div className="grid gap-2 md:col-span-2">
                                                <Label>Titik lokasi asal</Label>
                                                <AddressMap
                                                    center={center}
                                                    latitude={
                                                        form.data
                                                            .origin_latitude
                                                    }
                                                    longitude={
                                                        form.data
                                                            .origin_longitude
                                                    }
                                                    onChange={setCoordinates}
                                                />
                                                <p className="text-muted-foreground text-sm">
                                                    {form.data
                                                        .origin_latitude &&
                                                    form.data.origin_longitude
                                                        ? `Lintang ${form.data.origin_latitude}, bujur ${form.data.origin_longitude}`
                                                        : mapError ||
                                                          'Klik peta atau geser penanda untuk menentukan koordinat.'}
                                                </p>
                                                <InputError
                                                    message={
                                                        form.errors
                                                            .origin_latitude ||
                                                        form.errors
                                                            .origin_longitude
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                    <Card>
                        <CardHeader>
                            <CardTitle>Rekening Toko</CardTitle>
                            <CardDescription>
                                Rekening tujuan transfer pelanggan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {form.data.bank_accounts.map((account, index) => (
                                <div
                                    key={index}
                                    className="space-y-4 rounded-lg border p-4"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-medium">
                                            Rekening {index + 1}
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                form.setData(
                                                    'bank_accounts',
                                                    form.data.bank_accounts.filter(
                                                        (_, accountIndex) =>
                                                            accountIndex !==
                                                            index,
                                                    ),
                                                )
                                            }
                                        >
                                            Hapus
                                        </Button>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        {(
                                            [
                                                ['bank_name', 'Nama bank'],
                                                [
                                                    'account_holder',
                                                    'Nama pemilik rekening',
                                                ],
                                                [
                                                    'account_number',
                                                    'Nomor rekening',
                                                ],
                                            ] as const
                                        ).map(([field, label]) => (
                                            <div
                                                key={field}
                                                className="grid gap-2"
                                            >
                                                <Label
                                                    htmlFor={`bank_accounts_${index}_${field}`}
                                                >
                                                    {label}
                                                </Label>
                                                <Input
                                                    id={`bank_accounts_${index}_${field}`}
                                                    value={account[field]}
                                                    onChange={(event) =>
                                                        form.setData(
                                                            'bank_accounts',
                                                            form.data.bank_accounts.map(
                                                                (
                                                                    current,
                                                                    accountIndex,
                                                                ) =>
                                                                    accountIndex ===
                                                                    index
                                                                        ? {
                                                                              ...current,
                                                                              [field]:
                                                                                  event
                                                                                      .target
                                                                                      .value,
                                                                          }
                                                                        : current,
                                                            ),
                                                        )
                                                    }
                                                    inputMode={
                                                        field ===
                                                        'account_number'
                                                            ? 'numeric'
                                                            : undefined
                                                    }
                                                    required
                                                    aria-invalid={Boolean(
                                                        bankErrors[
                                                            `bank_accounts.${index}.${field}`
                                                        ],
                                                    )}
                                                />
                                                <InputError
                                                    message={
                                                        bankErrors[
                                                            `bank_accounts.${index}.${field}`
                                                        ]
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <InputError message={bankErrors.bank_accounts} />
                            <Button
                                type="button"
                                variant="outline"
                                disabled={form.data.bank_accounts.length >= 10}
                                onClick={() =>
                                    form.setData('bank_accounts', [
                                        ...form.data.bank_accounts,
                                        {
                                            bank_name: '',
                                            account_holder: '',
                                            account_number: '',
                                        },
                                    ])
                                }
                            >
                                Tambah Rekening
                            </Button>
                        </CardContent>
                    </Card>
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
