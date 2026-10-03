import { Form, Head, usePage } from '@inertiajs/react';
import { CheckCircle2, MapPin, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import { AddressDialog } from '@/components/customer/profile/address-dialog';
import type { CustomerAddress } from '@/components/customer/profile/address-dialog';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Auth } from '@/types';

export default function Profile({
    address,
    profilePhotoUrl,
    profileEndpoint = '/customer/dashboard/profile',
    addressEndpoint = '/customer/dashboard/address',
}: {
    address: CustomerAddress | null;
    profilePhotoUrl: string | null;
    profileEndpoint?: string;
    addressEndpoint?: string;
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [addressOpen, setAddressOpen] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const photoInput = useRef<HTMLInputElement>(null);
    const user = auth.user;
    const isCustomer = user.role === 'customer';
    const locality = address
        ? [
              address.subdistrict_name,
              address.district_name,
              address.city_name,
              address.province_name,
              address.destination_postal_code,
          ]
              .filter(Boolean)
              .join(', ')
        : '';

    useEffect(
        () => () => {
            if (photoPreview) URL.revokeObjectURL(photoPreview);
        },
        [photoPreview],
    );

    return (
        <main className="flex w-full flex-1 flex-col px-4 py-6 md:px-7 md:py-8">
            <Head title="Profil Saya" />
            <header className="mb-7">
                <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
                    WonderBookLibrary · Akun
                </p>
                <h1 className="font-heading text-foreground mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                    Profil Saya
                </h1>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                    Informasi akun, alamat pengiriman, dan keamanan.
                </p>
            </header>

            <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
                <section
                    aria-label="Identitas akun"
                    className="bg-primary text-primary-foreground flex min-w-0 flex-col gap-5 rounded-2xl p-5"
                >
                    <div className="flex items-start justify-between gap-4">
                        <Avatar className="size-20 shrink-0 border-2 border-white/25 bg-white/15 sm:size-24">
                            <AvatarImage
                                src={
                                    photoPreview ?? profilePhotoUrl ?? undefined
                                }
                                alt={`Foto profil ${user.name}`}
                            />
                            <AvatarFallback className="bg-white/15 text-3xl font-bold text-white">
                                {user.name.trim().charAt(0).toUpperCase() ||
                                    '?'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="shrink-0 text-right">
                            <p className="text-xs font-semibold text-white/80">
                                {isCustomer ? 'ID Anggota' : 'ID Pengguna'}
                            </p>
                            <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
                                {user.id}
                            </p>
                        </div>
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-heading text-2xl font-bold break-words text-white sm:text-3xl">
                            {user.name}
                        </h2>
                        <p className="mt-1 text-sm break-all text-white/80">
                            {user.email}
                        </p>
                        {user.email_verified_at && (
                            <p className="mt-3 flex items-center gap-2 text-xs font-medium">
                                <CheckCircle2
                                    className="size-4 shrink-0 text-emerald-300"
                                    aria-hidden="true"
                                />
                                Email terverifikasi
                            </p>
                        )}
                    </div>
                </section>

                <div className="bg-card divide-border min-w-0 divide-y rounded-2xl border">
                    <section
                        aria-labelledby="profile-update-heading"
                        className="p-5 sm:p-7"
                    >
                        <p className="text-primary text-xs font-bold tracking-[0.12em] uppercase">
                            Pengaturan akun
                        </p>
                        <h2
                            id="profile-update-heading"
                            className="font-heading text-foreground mt-1 text-xl font-bold"
                        >
                            Informasi Akun
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Perbarui nama, nomor WhatsApp, dan foto profil.
                        </p>
                        <Form
                            action={profileEndpoint}
                            method="post"
                            options={{ preserveScroll: true }}
                            onSuccess={() => {
                                setPhotoPreview(null);
                                if (photoInput.current)
                                    photoInput.current.value = '';
                            }}
                            className="mt-5 space-y-5"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <input
                                        type="hidden"
                                        name="_method"
                                        value="PATCH"
                                    />
                                    <div className="grid gap-5 xl:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="profile_name">
                                                Nama
                                            </Label>
                                            <Input
                                                id="profile_name"
                                                name="name"
                                                autoComplete="name"
                                                required
                                                maxLength={255}
                                                defaultValue={user.name}
                                                className="h-11"
                                            />
                                            <InputError message={errors.name} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="profile_phone">
                                                No. WhatsApp
                                            </Label>
                                            <Input
                                                id="profile_phone"
                                                name="phone"
                                                type="tel"
                                                autoComplete="tel"
                                                maxLength={30}
                                                defaultValue={user.phone ?? ''}
                                                placeholder="08xxxxxxxxxx"
                                                className="h-11"
                                            />
                                            <InputError
                                                message={errors.phone}
                                            />
                                        </div>
                                        <div className="space-y-2 xl:col-span-2">
                                            <Label htmlFor="profile_photo">
                                                Foto profil
                                            </Label>
                                            <Input
                                                id="profile_photo"
                                                name="profile_photo"
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                ref={photoInput}
                                                onChange={(event) => {
                                                    const file =
                                                        event.currentTarget
                                                            .files?.[0];
                                                    setPhotoPreview(
                                                        file
                                                            ? URL.createObjectURL(
                                                                  file,
                                                              )
                                                            : null,
                                                    );
                                                }}
                                                className="file:bg-secondary file:text-secondary-foreground h-11 min-w-0 file:mr-2 file:rounded-md file:border-0 file:px-2 file:py-1 file:text-xs file:font-semibold"
                                            />
                                            <p
                                                aria-live="polite"
                                                className="text-muted-foreground text-xs"
                                            >
                                                {photoPreview
                                                    ? 'Pratinjau foto; tekan Simpan Profil untuk menyimpannya.'
                                                    : 'JPG, PNG, atau WebP; maksimal 5 MB.'}
                                            </p>
                                            <InputError
                                                message={errors.profile_photo}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end border-t pt-4">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="min-h-11 min-w-36"
                                        >
                                            {processing
                                                ? 'Menyimpan...'
                                                : 'Simpan Profil'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </section>

                    <section
                        aria-labelledby="address-heading"
                        className="p-5 sm:p-7"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex min-w-0 gap-3">
                                <span className="bg-secondary text-primary grid size-10 shrink-0 place-items-center rounded-lg">
                                    <MapPin
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                </span>
                                <div className="min-w-0">
                                    <h2
                                        id="address-heading"
                                        className="font-heading text-foreground text-xl font-bold"
                                    >
                                        Alamat Pengiriman
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        {address
                                            ? 'Pastikan kurir mudah menemukan alamatmu.'
                                            : 'Tambahkan alamat untuk mempercepat pesanan berikutnya.'}
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant={address ? 'outline' : 'default'}
                                className="min-h-11 shrink-0"
                                onClick={() => setAddressOpen(true)}
                            >
                                {address ? 'Ubah Alamat' : 'Tambah Alamat'}
                            </Button>
                        </div>
                        {address ? (
                            <div className="border-primary/25 mt-5 border-l-2 pl-4">
                                {address.label && (
                                    <span className="bg-secondary text-primary inline-block max-w-full rounded-md px-2 py-1 text-xs font-semibold break-words">
                                        {address.label}
                                    </span>
                                )}
                                <p className="text-foreground mt-2 font-semibold break-words">
                                    {address.destination_contact_name}
                                    <span className="text-muted-foreground font-normal">
                                        {' · '}
                                        {address.destination_contact_phone}
                                    </span>
                                </p>
                                <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6 break-words">
                                    {address.destination_address}
                                    {locality ? `, ${locality}` : ''}
                                </p>
                                {address.destination_contact_email && (
                                    <p className="text-muted-foreground mt-1 text-xs break-all">
                                        {address.destination_contact_email}
                                    </p>
                                )}
                                {address.destination_note && (
                                    <p className="text-muted-foreground mt-2 text-xs break-words">
                                        Catatan: {address.destination_note}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground mt-5 border-t pt-4 text-sm">
                                Belum ada alamat tersimpan.
                            </p>
                        )}
                    </section>
                </div>
            </div>

            <AddressDialog
                address={address}
                open={addressOpen}
                onOpenChange={setAddressOpen}
                endpoint={addressEndpoint}
            />

            <section
                aria-labelledby="password-heading"
                className="mt-8 grid gap-5 border-t pt-7 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]"
            >
                <div className="self-start">
                    <span className="bg-secondary text-primary mb-3 grid size-10 place-items-center rounded-lg">
                        <ShieldCheck className="size-5" aria-hidden="true" />
                    </span>
                    <p className="text-primary text-xs font-bold tracking-[0.12em] uppercase">
                        Privasi &amp; akses
                    </p>
                    <h2
                        id="password-heading"
                        className="font-heading text-foreground mt-1 text-xl font-bold"
                    >
                        Ubah Password
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-6">
                        Gunakan password baru untuk menjaga keamanan akunmu.
                    </p>
                </div>
                <Form
                    {...SecurityController.update.form()}
                    options={{ preserveScroll: true }}
                    resetOnSuccess
                    resetOnError={[
                        'current_password',
                        'password',
                        'password_confirmation',
                    ]}
                    className="bg-card grid gap-5 rounded-2xl border p-5 sm:p-7 xl:grid-cols-2"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="space-y-2 xl:col-span-2">
                                <Label htmlFor="current_password">
                                    Password saat ini
                                </Label>
                                <PasswordInput
                                    id="current_password"
                                    name="current_password"
                                    autoComplete="current-password"
                                    required
                                    className="h-11"
                                />
                                <InputError message={errors.current_password} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password baru</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="new-password"
                                    required
                                    className="h-11"
                                />
                                <InputError message={errors.password} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">
                                    Konfirmasi password baru
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    required
                                    className="h-11"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>
                            <div className="flex justify-end xl:col-span-2">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="min-h-11 min-w-36"
                                >
                                    {processing
                                        ? 'Menyimpan...'
                                        : 'Simpan Password'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </section>
        </main>
    );
}
