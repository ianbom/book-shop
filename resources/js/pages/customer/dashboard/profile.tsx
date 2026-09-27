import { Form, Head, usePage } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import { AddressDialog } from '@/components/customer/profile/address-dialog';
import type { CustomerAddress } from '@/components/customer/profile/address-dialog';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { Auth } from '@/types';

export default function Profile({
    address,
}: {
    address: CustomerAddress | null;
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [addressOpen, setAddressOpen] = useState(false);
    const user = auth.user;
    const addressSummary = address
        ? [
              address.label,
              address.destination_address,
              address.subdistrict_name,
              address.district_name,
              address.city_name,
              address.province_name,
              address.destination_postal_code,
          ]
              .filter(Boolean)
              .join(', ')
        : '—';
    const details = [
        ['Nama Lengkap', user.name],
        ['Member ID', '—'],
        ['No. WhatsApp', (user.phone as string | null) || '—'],
        ['Email', user.email],
        ['Alamat', addressSummary],
    ];

    return (
        <main className="flex w-full flex-1 flex-col px-4 py-5 md:px-7 md:py-7">
            <Head title="Profil Saya" />
            <h1 className="font-heading text-2xl font-bold text-slate-900">
                Profil Saya
            </h1>
            <p className="mt-1 text-sm text-slate-500">
                Kelola informasi akun kamu.
            </p>

            <section
                aria-label="Informasi profil"
                className="mt-5 grid gap-6 rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:grid-cols-[128px_minmax(0,1fr)] sm:p-7"
            >
                <div className="flex flex-col items-center gap-3 self-start">
                    <Avatar className="size-28 border-4 border-white bg-sky-100 shadow-sm">
                        <AvatarFallback className="bg-sky-100 text-4xl font-bold text-sky-700">
                            {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <Button
                        type="button"
                        disabled
                        title="Unggah foto belum tersedia"
                        className="w-28 bg-[#124979] text-white disabled:opacity-100"
                    >
                        Ubah Foto
                    </Button>
                </div>
                <dl className="min-w-0 space-y-1 text-sm sm:text-base">
                    {details.map(([label, value]) => (
                        <div
                            key={label}
                            className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-2"
                        >
                            <dt className="py-1 font-medium text-slate-600">
                                {label}
                            </dt>
                            <dd className="min-w-0 rounded bg-slate-50 px-3 py-1 font-semibold break-words text-[#26486b]">
                                {value}
                            </dd>
                        </div>
                    ))}
                    <div className="grid gap-1 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-2">
                        <dt className="py-1 font-medium text-slate-600">
                            Status Member
                        </dt>
                        <dd className="px-3 py-1">
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
                                <CheckCircle2 className="size-4" /> Member Aktif
                            </span>
                        </dd>
                    </div>
                </dl>
                <Button
                    type="button"
                    variant="outline"
                    className="w-fit sm:col-start-2"
                    onClick={() => setAddressOpen(true)}
                >
                    {address ? 'Ubah Alamat' : 'Tambah Alamat'}
                </Button>
            </section>

            <AddressDialog
                address={address}
                open={addressOpen}
                onOpenChange={setAddressOpen}
            />

            <section
                aria-labelledby="password-heading"
                className="mt-6 rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7"
            >
                <h2
                    id="password-heading"
                    className="font-heading text-xl font-bold text-slate-900"
                >
                    Ubah Password
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Gunakan password baru untuk menjaga keamanan akunmu.
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
                    className="mt-6 max-w-lg space-y-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="current_password">
                                    Password saat ini
                                </Label>
                                <PasswordInput
                                    id="current_password"
                                    name="current_password"
                                    autoComplete="current-password"
                                    required
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
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>
                            <Button disabled={processing}>
                                Simpan Password
                            </Button>
                        </>
                    )}
                </Form>
            </section>
        </main>
    );
}
