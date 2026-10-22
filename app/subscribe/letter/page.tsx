import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { LetterForm } from './LetterForm';
import { EmptyState } from '@/components/EmptyState';
import { getMyShippingAddress, getMySubscriptionOverview } from '@/lib/data/me';
import { getCurrentUser } from '@/lib/data/session';

async function LetterContent({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const user = await getCurrentUser();
    if (!user) redirect('/login?next=/subscribe/letter');
    const [overview, address, params] = await Promise.all([
        getMySubscriptionOverview(),
        getMyShippingAddress(),
        searchParams,
    ]);
    const errorCode = typeof params.error === 'string' ? params.error : null;
    const active = overview.subscription?.status === 'active';

    if (active && !overview.canWriteLetter) {
        return (
            <EmptyState
                title="이번 달 편지는 이미 책방에 도착했어요"
                description="책방지기가 읽기 시작하면 다음 회차 편지를 미리 보관해 둘 수 있어요."
                href="/mypage"
                linkLabel="마이페이지 창가 보기"
            />
        );
    }
    return (
        <LetterForm
            mode={active ? 'next' : 'signup'}
            storedLetter={overview.storedLetter}
            address={address}
            errorCode={errorCode}
        />
    );
}

// SCR-12 편지지 (신청·다음 회차)
export default function LetterPage(props: PageProps<'/subscribe/letter'>) {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold">손편지 띄우기</h1>
            <Suspense
                fallback={
                    <p className="text-muted-foreground text-sm">
                        편지지를 펴는 중…
                    </p>
                }
            >
                <LetterContent searchParams={props.searchParams} />
            </Suspense>
        </div>
    );
}
