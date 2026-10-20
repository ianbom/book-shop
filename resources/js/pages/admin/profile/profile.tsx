import { Form, Head, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Bookmark,
    Camera,
    LockKeyhole,
    MapPin,
    Sparkle,
} from 'lucide-react';
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

export default function AdminProfile({
    address,
    profilePhotoUrl,
}: {
    address: CustomerAddress | null;
    profilePhotoUrl: string | null;
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth.user;
    const [addressOpen, setAddressOpen] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const photoInput = useRef<HTMLInputElement>(null);
    const photoUrl = photoPreview ?? profilePhotoUrl ?? undefined;
    const initial = user.name.trim().charAt(0).toUpperCase() || '?';
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
        <main className="min-w-0 flex-1 bg-[#fdfbf7] px-4 pt-[18px] pb-[15px] text-[#123565] md:pr-[15px] md:pl-[27px]">
            <Head title="Profil Saya" />
            <header className="mb-[17px]">
                <p className="text-[10px] leading-[14px] font-bold tracking-[0.08em] text-[#244f80] uppercase">
                    Akun Saya
                </p>
                <div className="flex w-fit items-start gap-3">
                    <h1 className="font-heading text-[40px] leading-[58px] font-bold tracking-[-0.055em] sm:text-[48px]">
                        Profil Saya.
                    </h1>
                    <Sparkle
                        className="mt-0.5 h-11 w-9 fill-[#ffbc32] text-[#ffbc32]"
                        strokeWidth={1}
                        aria-hidden="true"
                    />
                </div>
                <p className="text-[15px] leading-[22px] text-[#6b7890]">
                    Kelola informasi dan preferensi akunmu.
                </p>
            </header>

            <div className="grid items-start gap-7 min-[880px]:grid-cols-[249px_minmax(0,1fr)]">
                <section
                    aria-label="Identitas akun"
                    className="flex min-h-[498px] min-w-0 flex-col overflow-hidden rounded-xl bg-[linear-gradient(115deg,#22486d,#24517b)] text-center text-white"
                >
                    <div className="pt-[30px]">
                        <Avatar className="mx-auto size-[120px] border-2 border-white/90 bg-[#dae8ee]">
                            <AvatarImage
                                src={photoUrl}
                                alt={`Foto profil ${user.name}`}
                                className="object-cover"
                            />
                            <AvatarFallback className="bg-[#dae8ee] text-4xl font-bold text-[#244f80]">
                                {initial}
                            </AvatarFallback>
                        </Avatar>
                        <h2 className="font-heading mt-2 px-4 text-[30px] leading-9 font-bold break-words text-white">
                            {user.name}
                        </h2>
                        <p className="mt-1 flex items-center justify-center gap-1.5 text-[13px] leading-5">
                            <Bookmark
                                className="h-4 w-3 fill-[#ffd34b] text-[#ffd34b]"
                                strokeWidth={1}
                                aria-hidden="true"
                            />
                            Administrator
                        </p>
                        <p className="mt-1 px-4 text-[13px] leading-[18px] break-all text-white/85">
                            {user.email}
                        </p>
                        <div className="mx-6 mt-3 border-t border-white/20 pt-3 text-[13px] leading-[18px]">
                            <p className="text-[#c5dbec]">ID Pengguna</p>
                            <p className="mt-0.5 font-semibold tabular-nums">
                                {String(user.id).padStart(3, '0')}
                            </p>
                        </div>
                    </div>
                    <img
                        src="/images/admin/profile-books.png"
                        alt=""
                        aria-hidden="true"
                        className="mt-auto block w-full"
                    />
                </section>

                <div className="min-w-0 pt-[5px]">
                    <section
                        aria-labelledby="profile-update-heading"
                        className="border-b border-[#e8e4dd] pb-[17px]"
                    >
                        <h2
                            id="profile-update-heading"
                            className="font-heading text-2xl leading-8 font-bold"
                        >
                            Informasi Pribadi
                        </h2>
                        <p className="text-xs leading-[18px] text-[#6b7890]">
                            Perbarui detail akunmu.
                        </p>
                        <Form
                            action="/admin/profile"
                            method="post"
                            options={{ preserveScroll: true }}
                            onSuccess={() => {
                                setPhotoPreview(null);
                                if (photoInput.current)
                                    photoInput.current.value = '';
                            }}
                            className="mt-[10px]"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <input
                                        type="hidden"
                                        name="_method"
                                        value="PATCH"
                                    />
                                    <div className="grid gap-3 sm:grid-cols-[minmax(0,.99fr)_minmax(0,1fr)] sm:gap-[15px]">
                                        <div className="space-y-1">
                                            <Label
                                                htmlFor="profile_name"
                                                className="block text-[11px] leading-4"
                                            >
                                                Nama Lengkap
                                            </Label>
                                            <Input
                                                id="profile_name"
                                                name="name"
                                                autoComplete="name"
                                                required
                                                maxLength={255}
                                                defaultValue={user.name}
                                                className="h-11 rounded-lg border-[#d9d9d7] bg-white/80 text-base text-[#444] shadow-none sm:h-[38px] sm:text-[13px]"
                                            />
                                            <InputError message={errors.name} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label
                                                htmlFor="profile_phone"
                                                className="block text-[11px] leading-4"
                                            >
                                                Nomor WhatsApp
                                            </Label>
                                            <Input
                                                id="profile_phone"
                                                name="phone"
                                                type="tel"
                                                autoComplete="tel"
                                                maxLength={30}
                                                defaultValue={user.phone ?? ''}
                                                placeholder="08xxxxxxxxxx"
                                                className="h-11 rounded-lg border-[#d9d9d7] bg-white/80 text-base text-[#444] shadow-none sm:h-[38px] sm:text-[13px]"
                                            />
                                            <InputError
                                                message={errors.phone}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <Label
                                            htmlFor="profile_photo"
                                            className="block text-[11px] leading-4"
                                        >
                                            Foto Profil
                                        </Label>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-x-[18px] gap-y-3">
                                            <Avatar className="size-14 shrink-0 bg-[#dae8ee]">
                                                <AvatarImage
                                                    src={photoUrl}
                                                    alt="Pratinjau foto profil"
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="bg-[#dae8ee] font-bold text-[#244f80]">
                                                    {initial}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        photoInput.current?.click()
                                                    }
                                                    className="h-11 gap-2 rounded-lg border-[#dbe2e8] bg-[#f3f7fb] px-3 text-xs shadow-none sm:h-[30px] sm:text-[10px]"
                                                >
                                                    <Camera
                                                        className="size-3.5"
                                                        aria-hidden="true"
                                                    />{' '}
                                                    Ubah Foto
                                                </Button>
                                                <p
                                                    aria-live="polite"
                                                    className="mt-1 text-[9px] leading-4 text-[#6b7890]"
                                                >
                                                    {photoPreview
                                                        ? 'Pratinjau foto. Simpan perubahan untuk menerapkan.'
                                                        : 'JPG, PNG, atau WebP - Maks. 5 MB'}
                                                </p>
                                            </div>
                                            <input
                                                id="profile_photo"
                                                name="profile_photo"
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                ref={photoInput}
                                                className="sr-only"
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
                                            />
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="mt-2 ml-auto h-11 rounded-lg bg-[#244f80] px-[22px] text-xs font-semibold text-white shadow-none hover:bg-[#1c416c] sm:h-9 sm:text-[11px]"
                                            >
                                                {processing
                                                    ? 'Menyimpan...'
                                                    : 'Simpan Perubahan'}
                                            </Button>
                                        </div>
                                        <InputError
                                            message={errors.profile_photo}
                                        />
                                    </div>
                                </>
                            )}
                        </Form>
                    </section>

                    <section
                        aria-labelledby="address-heading"
                        className="border-b border-[#e8e4dd] pt-[17px] pb-5"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2
                                id="address-heading"
                                className="font-heading flex items-center gap-2.5 text-[21px] leading-7 font-bold"
                            >
                                <MapPin
                                    className="size-6 shrink-0 text-[#244f80]"
                                    strokeWidth={1.7}
                                    aria-hidden="true"
                                />{' '}
                                Alamat Pengiriman
                            </h2>
                            <button
                                type="button"
                                onClick={() => setAddressOpen(true)}
                                className="focus-visible:ring-ring inline-flex min-h-11 items-center gap-2 rounded text-xs font-medium focus-visible:ring-2 focus-visible:outline-none sm:min-h-7 sm:text-[10px]"
                            >
                                {address ? 'Ubah Alamat' : 'Tambah Alamat'}{' '}
                                <ArrowRight
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                            </button>
                        </div>
                        <div className="mt-2.5 min-h-[106px] rounded-[10px] border border-[#deecdf] bg-[#eef6ed] px-[14px] py-[9px] text-[11px] leading-[18px]">
                            {address ? (
                                <>
                                    {address.label && (
                                        <span className="inline-block max-w-full rounded-full bg-[#b2dfc3] px-3 text-[10px] leading-5 font-semibold break-words">
                                            {address.label}
                                        </span>
                                    )}
                                    <p className="mt-1.5 text-xs font-bold break-words">
                                        {address.destination_contact_name}
                                    </p>
                                    <p className="text-[#6b7890]">
                                        {address.destination_contact_phone}
                                    </p>
                                    <p className="break-words text-[#6b7890]">
                                        {address.destination_address}
                                        {locality ? `, ${locality}` : ''}
                                    </p>
                                    {address.destination_contact_email && (
                                        <p className="break-all text-[#6b7890]">
                                            {address.destination_contact_email}
                                        </p>
                                    )}
                                    {address.destination_note && (
                                        <p className="break-words text-[#6b7890]">
                                            Catatan: {address.destination_note}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-[#6b7890]">
                                    Belum ada alamat tersimpan.
                                </p>
                            )}
                        </div>
                    </section>

                    <section
                        aria-labelledby="password-heading"
                        className="pt-[15px]"
                    >
                        <h2
                            id="password-heading"
                            className="font-heading flex items-center gap-2.5 text-[21px] leading-7 font-bold"
                        >
                            <LockKeyhole
                                className="size-6 shrink-0 text-[#244f80]"
                                strokeWidth={1.7}
                                aria-hidden="true"
                            />{' '}
                            Keamanan Akun
                        </h2>
                        <p className="pl-[34px] text-xs leading-[18px] text-[#6b7890]">
                            Perbarui password untuk menjaga keamanan akun.
                        </p>
                        <Form
                            {...SecurityController.update.form()}
                            options={{ preserveScroll: true }}
                            resetOnSuccess
                            resetOnError={[
                                'current_password',
                                'password',
                                'password_confirmation',
                            ]}
                            className="mt-1"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="grid gap-3 sm:grid-cols-[minmax(0,.96fr)_minmax(0,1fr)_minmax(0,1.05fr)] sm:gap-[18px]">
                                        <div className="space-y-0.5">
                                            <Label
                                                htmlFor="current_password"
                                                className="block text-[10px] leading-[14px]"
                                            >
                                                Password Saat Ini
                                            </Label>
                                            <PasswordInput
                                                id="current_password"
                                                name="current_password"
                                                autoComplete="current-password"
                                                required
                                                className="h-11 rounded-lg border-[#d9d9d7] bg-white/80 text-base text-[#444] shadow-none sm:h-8 sm:text-xs"
                                            />
                                            <InputError
                                                message={
                                                    errors.current_password
                                                }
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <Label
                                                htmlFor="password"
                                                className="block text-[10px] leading-[14px]"
                                            >
                                                Password Baru
                                            </Label>
                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                autoComplete="new-password"
                                                required
                                                className="h-11 rounded-lg border-[#d9d9d7] bg-white/80 text-base text-[#444] shadow-none sm:h-8 sm:text-xs"
                                            />
                                            <InputError
                                                message={errors.password}
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <Label
                                                htmlFor="password_confirmation"
                                                className="block text-[10px] leading-[14px]"
                                            >
                                                Konfirmasi Password
                                            </Label>
                                            <PasswordInput
                                                id="password_confirmation"
                                                name="password_confirmation"
                                                autoComplete="new-password"
                                                required
                                                className="h-11 rounded-lg border-[#d9d9d7] bg-white/80 text-base text-[#444] shadow-none sm:h-8 sm:text-xs"
                                            />
                                            <InputError
                                                message={
                                                    errors.password_confirmation
                                                }
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="mt-3 h-11 w-full rounded-lg bg-[#244f80] text-xs font-semibold text-white shadow-none hover:bg-[#1c416c] sm:h-[34px] sm:w-[180px] sm:text-[11px]"
                                    >
                                        {processing
                                            ? 'Menyimpan...'
                                            : 'Simpan Password'}
                                    </Button>
                                </>
                            )}
                        </Form>
                    </section>
                </div>
            </div>
            <AddressDialog
                address={address}
                open={addressOpen}
                onOpenChange={setAddressOpen}
                endpoint="/admin/profile/address"
            />
        </main>
    );
}

AdminProfile.layout = {
    breadcrumbs: [{ title: 'Profil', href: '/admin/profile' }],
};
