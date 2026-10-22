'use client';

import { useRouter } from 'next/navigation';
import type { ShippingAddress } from '@/types/domain';
import { ShippingAddressFields } from '@/components/ShippingAddressFields';

export function AddressForm({ initial }: { initial: ShippingAddress | null }) {
    const router = useRouter();
    return (
        <ShippingAddressFields
            initial={initial}
            onSaved={() => router.refresh()}
        />
    );
}
