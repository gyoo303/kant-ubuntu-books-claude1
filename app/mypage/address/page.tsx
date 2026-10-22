import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AddressForm } from './AddressForm';
import { getMyShippingAddress } from '@/lib/data/me';
import { getCurrentUser } from '@/lib/data/session';

async function AddressContent() {
    const user = await getCurrentUser();
    if (!user) redirect('/login?next=/mypage/address');
    const address = await getMyShippingAddress();
    return <AddressForm initial={address} />;
}

// SCR-07 배송지
export default function AddressPage() {
    return (
        <div className="mx-auto flex max-w-xl flex-col gap-6">
            <h1 className="text-2xl font-semibold">배송지</h1>
            <p className="text-muted-foreground text-sm break-keep">
                고친 배송지는 다음 주문부터 쓰여요. 이미 보낸 주문은 바뀌지
                않아요.
            </p>
            <Suspense
                fallback={
                    <p className="text-muted-foreground text-sm">
                        불러오는 중…
                    </p>
                }
            >
                <AddressContent />
            </Suspense>
        </div>
    );
}
