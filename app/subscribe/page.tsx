import Link from 'next/link';
import { Suspense } from 'react';
import { ExampleBadge } from '@/components/ExampleBadge';
import { buttonVariants } from '@/components/ui/button';
import { SUBSCRIPTION_NOTE } from '@/lib/content/policies';
import { getMySubscriptionOverview } from '@/lib/data/me';
import { getAppConstants } from '@/lib/data/settings';
import { formatPrice } from '@/lib/domain/format';

const STEPS = [
    {
        title: '편지를 띄워요',
        body: '요즘 마음 날씨, 읽고 싶은 책의 결을 자유롭게 적어 보내요. 설문은 없어요.',
    },
    {
        title: '책방지기가 읽어요',
        body: '책방지기가 편지를 읽기 시작하면 마이페이지 서점 창가에 촛불이 켜져요.',
    },
    {
        title: '블라인드 북이 가요',
        body: '무슨 책인지는 비밀이에요. 짧은 힌트만 보여요.',
    },
    {
        title: '코드로 열어요',
        body: '상자 속 손글씨 카드의 6자리 코드를 입력하면 표지와 답장 편지가 열려요.',
    },
];

async function SubscribeAction() {
    const [overview, constants] = await Promise.all([
        getMySubscriptionOverview(),
        getAppConstants(),
    ]);
    const active = overview.subscription?.status === 'active';
    // 구독료·안내(왼쪽) + 버튼(오른쪽)을 한 카드에 (작은 화면에서는 위아래)
    return (
        <section className="bg-card flex flex-col gap-4 rounded-2xl border p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
                {active ? (
                    <p className="typo-h3">이미 구독 중입니다</p>
                ) : (
                    <p className="typo-h3">
                        매달 {formatPrice(constants.subscriptionMonthlyPrice)}{' '}
                        <ExampleBadge />
                    </p>
                )}
                <p className="text-ink-2 max-w-xl text-sm">
                    {SUBSCRIPTION_NOTE}
                </p>
            </div>
            <Link
                href={active ? '/mypage' : '/subscribe/letter'}
                className={
                    buttonVariants({
                        size: 'lg',
                        variant: active ? 'outline' : 'default',
                    }) + ' shrink-0'
                }
            >
                {active ? '마이페이지 창가 보기' : '손편지 띄우기'}
            </Link>
        </section>
    );
}

// SCR-11 구독 안내
export default function SubscribePage() {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold">손편지 구독</h1>
                <p className="text-muted-foreground max-w-xl break-keep">
                    매달 한 권, 편지를 읽은 책방지기가 고른 책이 상자에 담겨
                    갑니다.
                </p>
            </div>
            <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {STEPS.map((step, index) => (
                    <li
                        key={step.title}
                        className="bg-card flex flex-col gap-2 rounded-xl border p-5"
                    >
                        <span className="text-muted-foreground text-sm">
                            {index + 1}
                        </span>
                        <span className="font-medium">{step.title}</span>
                        <span className="text-muted-foreground text-sm break-keep">
                            {step.body}
                        </span>
                    </li>
                ))}
            </ol>
            <Suspense fallback={null}>
                <SubscribeAction />
            </Suspense>
        </div>
    );
}
