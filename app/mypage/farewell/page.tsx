import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { FarewellForm } from './FarewellForm';
import { ExampleBadge } from '@/components/ExampleBadge';
import { getMyFarewellLetter, getMySubscriptionOverview } from '@/lib/data/me';
import { getCurrentUser } from '@/lib/data/session';

async function FarewellContent() {
    const user = await getCurrentUser();
    if (!user) redirect('/login?next=/mypage/farewell');
    const overview = await getMySubscriptionOverview();
    // 활성 구독이 없으면 마이페이지로 (AC-21-5)
    if (overview.subscription?.status !== 'active') redirect('/mypage');
    const letter = await getMyFarewellLetter();
    return (
        <div className="flex flex-col gap-8">
            {/* ① 책방지기의 마지막 인사 편지가 먼저 (REQ-034) */}
            <section className="bg-muted flex flex-col gap-3 rounded-xl border p-6">
                <h2 className="text-muted-foreground text-sm">
                    책방지기의 편지 {letter.isDefault ? <ExampleBadge /> : null}
                </h2>
                <p className="max-w-xl leading-relaxed break-keep whitespace-pre-line">
                    {letter.body}
                </p>
            </section>
            <FarewellForm />
        </div>
    );
}

// SCR-14 작별
export default function FarewellPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold">구독 마무리</h1>
            <Suspense
                fallback={
                    <p className="text-muted-foreground text-sm">
                        불러오는 중…
                    </p>
                }
            >
                <FarewellContent />
            </Suspense>
        </div>
    );
}
