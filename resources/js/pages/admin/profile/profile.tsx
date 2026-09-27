import type { CustomerAddress } from '@/components/customer/profile/address-dialog';
import CustomerProfile from '@/pages/customer/dashboard/profile';

export default function AdminProfile({
    address,
    profilePhotoUrl,
}: {
    address: CustomerAddress | null;
    profilePhotoUrl: string | null;
}) {
    return (
        <CustomerProfile
            address={address}
            profilePhotoUrl={profilePhotoUrl}
            profileEndpoint="/admin/profile"
            addressEndpoint="/admin/profile/address"
        />
    );
}

AdminProfile.layout = {
    breadcrumbs: [{ title: 'Profil', href: '/admin/profile' }],
};
