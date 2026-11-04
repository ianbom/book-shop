import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function ChangePassword({ passwordRules }: { passwordRules: string }) {
    return (
        <>
            <Head title="Ganti password awal" />
            <Form action="/change-password" method="put" resetOnSuccess>
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <p>Ganti password awal sebelum mengakses akun. Gunakan password baru yang berbeda.</p>
                        <div className="grid gap-2">
                            <Label htmlFor="current_password">Password saat ini</Label>
                            <PasswordInput id="current_password" name="current_password" autoComplete="current-password" required autoFocus />
                            <InputError message={errors.current_password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password baru</Label>
                            <PasswordInput id="password" name="password" autoComplete="new-password" passwordrules={passwordRules} required />
                            <InputError message={errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Konfirmasi password baru</Label>
                            <PasswordInput id="password_confirmation" name="password_confirmation" autoComplete="new-password" required />
                            <InputError message={errors.password_confirmation} />
                        </div>
                        <Button disabled={processing}>Simpan password baru</Button>
                    </div>
                )}
            </Form>
            <Form action="/logout" method="post" className="mt-4">
                {({ processing }) => <Button variant="outline" disabled={processing} className="w-full">Keluar</Button>}
            </Form>
        </>
    );
}

ChangePassword.layout = {
    title: 'Ganti password awal',
    description: 'Amankan akun sebelum melanjutkan',
};
