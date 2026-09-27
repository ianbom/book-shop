import { useForm } from '@inertiajs/react';
import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AddressMap } from './address-map';

export type CustomerAddress = {
    label: string | null;
    destination_contact_name: string;
    destination_contact_phone: string;
    destination_contact_email: string | null;
    destination_address: string;
    destination_note: string | null;
    destination_postal_code: string | null;
    destination_area_id: string | null;
    destination_latitude: string | null;
    destination_longitude: string | null;
    province_name: string | null;
    city_name: string | null;
    district_name: string | null;
    subdistrict_name: string | null;
};

type Area = { id: string; province: string; city: string; district: string };
type AddressData = {
    label: string;
    destination_contact_name: string;
    destination_contact_phone: string;
    destination_contact_email: string;
    destination_postal_code: string;
    destination_area_id: string;
    subdistrict_name: string;
    destination_address: string;
    destination_note: string;
    destination_latitude: string;
    destination_longitude: string;
};

function initialData(address: CustomerAddress | null): AddressData {
    return {
        label: address?.label ?? '',
        destination_contact_name: address?.destination_contact_name ?? '',
        destination_contact_phone: address?.destination_contact_phone ?? '',
        destination_contact_email: address?.destination_contact_email ?? '',
        destination_postal_code: address?.destination_postal_code ?? '',
        destination_area_id: address?.destination_area_id ?? '',
        subdistrict_name: address?.subdistrict_name ?? '',
        destination_address: address?.destination_address ?? '',
        destination_note: address?.destination_note ?? '',
        destination_latitude: address?.destination_latitude ?? '',
        destination_longitude: address?.destination_longitude ?? '',
    };
}

function Field({
    id,
    label,
    error,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

export function AddressDialog({
    address,
    open,
    onOpenChange,
    endpoint = '/customer/dashboard/address',
}: {
    address: CustomerAddress | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    endpoint?: string;
}) {
    const form = useForm<AddressData>(initialData(address));
    const [areas, setAreas] = useState<Area[]>([]);
    const [loadingAreas, setLoadingAreas] = useState(false);
    const [areaError, setAreaError] = useState('');
    const [mapError, setMapError] = useState('');
    const [center, setCenter] = useState<[number, number] | null>(null);
    const selectedArea = areas.find(
        (area) => area.id === form.data.destination_area_id,
    );
    const setPin = (latitude: number, longitude: number) => {
        form.setData((data) => ({
            ...data,
            destination_latitude: String(latitude),
            destination_longitude: String(longitude),
        }));
        setMapError('');
    };

    useEffect(() => {
        if (!open) return;
        form.setData(initialData(address));
        form.clearErrors();
        setAreas(
            address?.destination_area_id
                ? [
                      {
                          id: address.destination_area_id,
                          province: address.province_name ?? '',
                          city: address.city_name ?? '',
                          district: address.district_name ?? '',
                      },
                  ]
                : [],
        );
        setCenter(
            address?.destination_latitude && address.destination_longitude
                ? [
                      Number(address.destination_latitude),
                      Number(address.destination_longitude),
                  ]
                : null,
        );
        setAreaError('');
        setMapError('');
    }, [open, address]);

    useEffect(() => {
        const postalCode = form.data.destination_postal_code;
        if (
            !open ||
            !/^\d{5}$/.test(postalCode) ||
            (address?.destination_postal_code === postalCode &&
                form.data.destination_area_id)
        )
            return;

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoadingAreas(true);
            setAreaError('');
            try {
                const response = await fetch(
                    `${endpoint}/areas?postal_code=${postalCode}`,
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
                if (result.areas.length === 1)
                    form.setData('destination_area_id', result.areas[0].id);
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
    }, [open, form.data.destination_postal_code, address, endpoint]);

    useEffect(() => {
        const postalCode = form.data.destination_postal_code;
        const areaId = form.data.destination_area_id;
        if (
            !open ||
            !areaId ||
            (address?.destination_postal_code === postalCode &&
                address.destination_area_id === areaId &&
                form.data.destination_latitude)
        )
            return;

        const controller = new AbortController();
        setMapError('');
        void (async () => {
            try {
                const query = new URLSearchParams({
                    postal_code: postalCode,
                    area_id: areaId,
                });
                const response = await fetch(
                    `${endpoint}/map-center?${query}`,
                    {
                        signal: controller.signal,
                        headers: { Accept: 'application/json' },
                    },
                );
                if (!response.ok)
                    throw new Error(
                        'Titik awal peta belum tersedia. Pilih titik manual atau gunakan Lokasi Saya.',
                    );
                const result = await response.json();
                if (result.center)
                    setCenter([
                        result.center.latitude,
                        result.center.longitude,
                    ]);
                else
                    setMapError(
                        'Titik kode pos tidak ditemukan. Pilih titik manual atau gunakan Lokasi Saya.',
                    );
            } catch {
                if (!controller.signal.aborted)
                    setMapError(
                        'Titik awal peta belum tersedia. Pilih titik manual atau gunakan Lokasi Saya.',
                    );
            }
        })();

        return () => controller.abort();
    }, [
        open,
        form.data.destination_postal_code,
        form.data.destination_area_id,
        address,
    ]);

    const useMyLocation = () => {
        if (!navigator.geolocation) {
            setMapError(
                'GPS tidak tersedia di browser ini. Pilih titik pada peta.',
            );
            return;
        }
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setPin(coords.latitude, coords.longitude);
                setCenter([coords.latitude, coords.longitude]);
            },
            () =>
                setMapError(
                    'Izin lokasi ditolak atau GPS gagal. Pilih titik pada peta.',
                ),
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {address ? 'Ubah Alamat' : 'Tambah Alamat'}
                    </DialogTitle>
                    <DialogDescription>
                        Isi alamat pengiriman dan tentukan titik yang tepat pada
                        peta.
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="space-y-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.put(endpoint, {
                            preserveScroll: true,
                            onSuccess: () => onOpenChange(false),
                        });
                    }}
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            id="address-label"
                            label="Label alamat"
                            error={form.errors.label}
                        >
                            <Input
                                id="address-label"
                                value={form.data.label}
                                onChange={(event) =>
                                    form.setData('label', event.target.value)
                                }
                                placeholder="Rumah / Kantor"
                                required
                                maxLength={100}
                            />
                        </Field>
                        <Field
                            id="contact-name"
                            label="Nama penerima"
                            error={form.errors.destination_contact_name}
                        >
                            <Input
                                id="contact-name"
                                value={form.data.destination_contact_name}
                                onChange={(event) =>
                                    form.setData(
                                        'destination_contact_name',
                                        event.target.value,
                                    )
                                }
                                required
                                maxLength={150}
                            />
                        </Field>
                        <Field
                            id="contact-phone"
                            label="Nomor telepon penerima"
                            error={form.errors.destination_contact_phone}
                        >
                            <Input
                                id="contact-phone"
                                type="tel"
                                value={form.data.destination_contact_phone}
                                onChange={(event) =>
                                    form.setData(
                                        'destination_contact_phone',
                                        event.target.value,
                                    )
                                }
                                required
                                maxLength={30}
                            />
                        </Field>
                        <Field
                            id="contact-email"
                            label="Email penerima"
                            error={form.errors.destination_contact_email}
                        >
                            <Input
                                id="contact-email"
                                type="email"
                                value={form.data.destination_contact_email}
                                onChange={(event) =>
                                    form.setData(
                                        'destination_contact_email',
                                        event.target.value,
                                    )
                                }
                                required
                                maxLength={150}
                            />
                        </Field>
                        <Field
                            id="postal-code"
                            label="Kode pos"
                            error={form.errors.destination_postal_code}
                        >
                            <Input
                                id="postal-code"
                                inputMode="numeric"
                                pattern="[0-9]{5}"
                                maxLength={5}
                                value={form.data.destination_postal_code}
                                onChange={(event) => {
                                    const postalCode = event.target.value
                                        .replace(/\D/g, '')
                                        .slice(0, 5);
                                    form.setData({
                                        ...form.data,
                                        destination_postal_code: postalCode,
                                        destination_area_id: '',
                                        destination_latitude: '',
                                        destination_longitude: '',
                                    });
                                    setAreas([]);
                                    setCenter(null);
                                    setAreaError('');
                                    setMapError('');
                                }}
                                required
                            />
                            <p
                                aria-live="polite"
                                className="text-muted-foreground text-xs"
                            >
                                {loadingAreas
                                    ? 'Mencari wilayah...'
                                    : areaError}
                            </p>
                        </Field>
                        {areas.length > 1 && (
                            <Field
                                id="area-id"
                                label="Pilih wilayah sesuai kode pos"
                                error={form.errors.destination_area_id}
                            >
                                <select
                                    id="area-id"
                                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                    value={form.data.destination_area_id}
                                    onChange={(event) =>
                                        form.setData(
                                            'destination_area_id',
                                            event.target.value,
                                        )
                                    }
                                    required
                                >
                                    <option value="">Pilih wilayah</option>
                                    {areas.map((area) => (
                                        <option key={area.id} value={area.id}>
                                            {area.district}, {area.city},{' '}
                                            {area.province}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        )}
                        {areas.length <= 1 && (
                            <InputError
                                message={form.errors.destination_area_id}
                            />
                        )}
                        <Field id="province" label="Provinsi">
                            <Input
                                id="province"
                                value={selectedArea?.province ?? ''}
                                readOnly
                            />
                        </Field>
                        <Field id="city" label="Kota / Kabupaten">
                            <Input
                                id="city"
                                value={selectedArea?.city ?? ''}
                                readOnly
                            />
                        </Field>
                        <Field id="district" label="Kecamatan">
                            <Input
                                id="district"
                                value={selectedArea?.district ?? ''}
                                readOnly
                            />
                        </Field>
                        <Field
                            id="subdistrict"
                            label="Kelurahan / Subdistrict"
                            error={form.errors.subdistrict_name}
                        >
                            <Input
                                id="subdistrict"
                                value={form.data.subdistrict_name}
                                onChange={(event) =>
                                    form.setData(
                                        'subdistrict_name',
                                        event.target.value,
                                    )
                                }
                                required
                                maxLength={150}
                            />
                        </Field>
                    </div>
                    <Field
                        id="street-address"
                        label="Alamat lengkap (jalan)"
                        error={form.errors.destination_address}
                    >
                        <Textarea
                            id="street-address"
                            value={form.data.destination_address}
                            onChange={(event) =>
                                form.setData(
                                    'destination_address',
                                    event.target.value,
                                )
                            }
                            required
                            maxLength={2000}
                        />
                    </Field>
                    <Field
                        id="address-note"
                        label="Catatan alamat (opsional)"
                        error={form.errors.destination_note}
                    >
                        <Textarea
                            id="address-note"
                            value={form.data.destination_note}
                            onChange={(event) =>
                                form.setData(
                                    'destination_note',
                                    event.target.value,
                                )
                            }
                            maxLength={1000}
                        />
                    </Field>
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <Label>Titik pengiriman</Label>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={useMyLocation}
                                disabled={!selectedArea}
                            >
                                <MapPin className="size-4" /> Lokasi Saya
                            </Button>
                        </div>
                        {selectedArea ? (
                            <AddressMap
                                center={center}
                                latitude={form.data.destination_latitude}
                                longitude={form.data.destination_longitude}
                                onChange={setPin}
                            />
                        ) : (
                            <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
                                Isi kode pos dan pilih wilayah untuk membuka
                                peta.
                            </p>
                        )}
                        <p
                            aria-live="polite"
                            className="text-muted-foreground text-sm"
                        >
                            {mapError ||
                                (form.data.destination_latitude &&
                                form.data.destination_longitude
                                    ? `Titik dipilih: ${Number(form.data.destination_latitude).toFixed(5)}, ${Number(form.data.destination_longitude).toFixed(5)}`
                                    : 'Klik peta, geser pin, atau gunakan Lokasi Saya untuk memilih titik.')}
                        </p>
                        <InputError
                            message={
                                form.errors.destination_latitude ??
                                form.errors.destination_longitude
                            }
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                form.processing ||
                                !selectedArea ||
                                !form.data.destination_latitude ||
                                !form.data.destination_longitude
                            }
                        >
                            {form.processing ? 'Menyimpan...' : 'Simpan Alamat'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
