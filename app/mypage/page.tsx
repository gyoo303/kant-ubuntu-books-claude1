import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { CancelOrderButton } from './CancelOrderButton';
import { BookshopWindow } from '@/components/BookshopWindow';
import { EmptyState } from '@/components/EmptyState';
import { buttonVariants } from '@/components/ui/button';
import {
    getMyOrders,
    getMyShippingAddress,
    getMySubscriptionOverview,
} from '@/lib/data/me';
import { getCurrentUser } from '@/lib/data/session';
import { formatPrice } from '@/lib/domain/format';
import type { OrderStatus } from '@/types/domain';

const ORDER_LABEL: Partial<Record<OrderStatus, string>> = {
    paid: '주문 확인',
    shipped: '발송됨',
    refunded: '주문 취소됨',
};

const dateFormat = new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeZone: 'Asia/Seoul',
});

async function MyPageContent() {
    const user = await getCurrentUser();
    if (!user) redirect('/login?next=/mypage');
    const [overview, orders, address] = await Promise.all([
        getMySubscriptionOverview(),
        getMyOrders(),
        getMyShippingAddress(),
    ]);
    const subscription = overview.subscription;

    return (
        <div className="flex flex-col gap-10">
            <h1 className="text-2xl font-semibold">
                {user.displayName || '손님'}의 마이페이지
            </h1>

            {/* ① 서점 창가 (SCR-06, US-15) */}
            <section aria-labelledby="window" className="flex flex-col gap-4">
                <h2 id="window" className="typo-h3">
                    서점 창가
                </h2>
                {!subscription || !overview.window ? (
                    <EmptyState
                        title="아직 손편지 구독을 시작하지 않으셨어요"
                        description="편지를 보내면 책방지기가 한 권을 골라 보내드려요."
                        href="/subscribe"
                        linkLabel="손편지 구독 알아보기"
                    />
                ) : (
                    <>
                        <BookshopWindow state={overview.window} />
                        {subscription.status === 'ended' ? (
                            <p className="rounded-lg border p-3 text-sm">
                                결제가 되지 않아 구독이 마무리되었습니다.{' '}
                                <Link href="/subscribe" className="underline">
                                    다시 신청하기
                                </Link>
                            </p>
                        ) : null}
                        {subscription.status === 'cancelled' ? (
                            <p className="rounded-lg border p-3 text-sm">
                                구독을 마무리했어요. 이미 보낸 책은 나의
                                서가에서 열어 볼 수 있어요.
                            </p>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                            {overview.canWriteLetter ? (
                                <Link
                                    href="/subscribe/letter"
                                    className={buttonVariants()}
                                >
                                    {overview.storedLetter
                                        ? '보관한 편지 고치기'
                                        : '편지 쓰기'}
                                </Link>
                            ) : null}
                            <Link
                                href="/mypage/shelf"
                                className={buttonVariants({
                                    variant: 'outline',
                                })}
                            >
                                나의 서가
                            </Link>
                        </div>
                        {subscription.status === 'active' &&
                        subscription.nextBillingDate ? (
                            <p className="text-muted-foreground text-sm">
                                다음 결제일 {subscription.nextBillingDate} · 월{' '}
                                {formatPrice(subscription.monthlyPrice)} (예시)
                            </p>
                        ) : null}
                    </>
                )}
            </section>

            {/* ③ 주문 내역(2/3) + ④ 배송지 카드(1/3), 작은 화면에서는 위아래 */}
            <div className="grid gap-8 lg:grid-cols-3">
                {/* ③ 주문 내역: 창가 그림 없이 상태 글자만 (Q-004, AC-10-1) */}
                <section
                    aria-labelledby="orders"
                    className="flex flex-col gap-4 lg:col-span-2"
                >
                    <h2 id="orders" className="typo-h3">
                        주문 내역
                    </h2>
                    {orders.length === 0 ? (
                        <EmptyState
                            title="주문한 책이 아직 없어요"
                            href="/products"
                            linkLabel="서가 둘러보기"
                        />
                    ) : (
                        <ul className="flex flex-col divide-y rounded-xl border">
                            {orders.map((order) => (
                                <li
                                    key={order.id}
                                    className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"
                                >
                                    <div className="flex flex-col gap-1">
                                        <span className="text-muted-foreground">
                                            {dateFormat.format(
                                                new Date(order.createdAt),
                                            )}
                                        </span>
                                        <span className="break-keep">
                                            {order.items
                                                .map(
                                                    (item) =>
                                                        `${item.productName} × ${item.quantity}`,
                                                )
                                                .join(', ')}
                                        </span>
                                        <span>
                                            {formatPrice(order.totalAmount)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-full border px-3 py-1">
                                            {ORDER_LABEL[order.status]}
                                        </span>
                                        {order.canCancel ? (
                                            <CancelOrderButton
                                                orderId={order.id}
                                            />
                                        ) : null}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* ④ 배송지 */}
                <section
                    aria-labelledby="address"
                    className="bg-card flex flex-col gap-3 self-start rounded-xl border p-5"
                >
                    <h2 id="address" className="typo-h3">
                        배송지
                    </h2>
                    <p className="text-ink-2 text-sm">
                        {address
                            ? `${address.recipientName} · (${address.postalCode}) ${address.address1} ${address.address2}`
                            : '아직 배송지가 없어요.'}
                    </p>
                    <Link
                        href="/mypage/address"
                        className="text-sm underline-offset-4 hover:underline"
                    >
                        배송지 {address ? '고치기' : '입력하기'}
                    </Link>
                </section>
            </div>

            {/* ⑤ 구독 마무리 — 작게, 맨 아래 (SCR-06) */}
            {subscription?.status === 'active' ? (
                <Link
                    href="/mypage/farewell"
                    className="text-muted-foreground self-start text-xs underline-offset-4 hover:underline"
                >
                    구독 마무리하기
                </Link>
            ) : null}
        </div>
    );
}

// SCR-06 마이페이지 (상태는 페이지를 열 때 조회, Q-020)
export default function MyPage() {
    return (
        <Suspense
            fallback={
                <p className="text-muted-foreground text-sm">불러오는 중…</p>
            }
        >
            <MyPageContent />
        </Suspense>
    );
}
