import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { CheckoutForm } from './CheckoutForm';
import { getMyShippingAddress } from '@/lib/data/me';
import { getCurrentUser } from '@/lib/data/session';

// 비회원이면 로그인 후 주문서로 돌아온다 (AC-09-1)
async function CheckoutContent() {
    const user = await getCurrentUser();
    if (!user) redirect('/login?next=/checkout');
    const address = await getMyShippingAddress();
    return <CheckoutForm initialAddress={address} />;
}

// SCR-09 주문서
export default function CheckoutPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold">주문서</h1>
            <Suspense
                fallback={
                    <p className="text-muted-foreground text-sm">
                        불러오는 중…
                    </p>
                }
            >
                <CheckoutContent />
            </Suspense>
        </div>
    );
}
