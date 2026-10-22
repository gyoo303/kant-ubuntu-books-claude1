// API-08 카드 등록 성공 리다이렉트 → 빌링키 발급 → 첫 결제 → 구독 시작 (SEQ-04)
import { randomUUID } from 'node:crypto';
import { requireUser } from '@/lib/api/auth';
import { parseSearchParams, redirectTo } from '@/lib/api/http';
import { logServerError } from '@/lib/api/errors';
import { BillingSuccessQuery } from '@/lib/api/schemas';
import { dayOfMonth, nextBillingDate, todayKst } from '@/lib/domain/billing';
import { cycleTossId, subscriptionOrderName } from '@/lib/domain/payments';
import {
    cancelPayment,
    chargeBillingKey,
    issueBillingKey,
} from '@/lib/payments/toss';
import { getAppConstants } from '@/lib/data/settings';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const errorPath = (code: string) =>
    `/subscribe/letter?error=${encodeURIComponent(code)}`;

export async function GET(request: Request) {
    const query = parseSearchParams(request, BillingSuccessQuery);
    if (query instanceof Response)
        return redirectTo(request, errorPath('VALIDATION_FAILED'));
    const auth = await requireUser();
    if (auth instanceof Response)
        return redirectTo(request, errorPath('UNAUTHENTICATED'));
    // (a) 카드 등록은 본인 계정으로만
    if (query.customerKey !== auth.userId)
        return redirectTo(request, errorPath('FORBIDDEN'));

    // (b) 이미 구독 중이면 중단
    const { data: active } = await auth.supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('status', 'active')
        .maybeSingle();
    if (active) return redirectTo(request, errorPath('ALREADY_SUBSCRIBED'));

    // (c) 빌링키 발급
    const issued = await issueBillingKey({
        authKey: query.authKey,
        customerKey: auth.userId,
    });
    if (!issued.ok) {
        logServerError('API-08 빌링키', issued);
        return redirectTo(request, errorPath('PAYMENT_FAILED'));
    }

    // (d) 첫 결제 (구독 미생성 상태라 실패해도 편지 draft는 남는다, AC-12-7)
    const now = new Date();
    const today = todayKst(now);
    const billingDay = dayOfMonth(today);
    const subscriptionId = randomUUID();
    const tossOrderId = cycleTossId(subscriptionId, 1);
    const { subscriptionMonthlyPrice } = await getAppConstants();
    const charged = await chargeBillingKey({
        billingKey: issued.data.billingKey,
        customerKey: auth.userId,
        orderId: tossOrderId,
        orderName: subscriptionOrderName(1),
        amount: subscriptionMonthlyPrice,
    });
    if (!charged.ok) {
        logServerError('API-08 첫 결제', charged);
        return redirectTo(request, errorPath('PAYMENT_FAILED'));
    }

    // (e) 구독 생성. 실패하면 결제 취소로 보상
    const { error } = await createSupabaseServiceClient().rpc(
        'start_subscription',
        {
            p_subscription_id: subscriptionId,
            p_user_id: auth.userId,
            p_customer_key: auth.userId,
            p_billing_key: issued.data.billingKey,
            p_toss_order_id: tossOrderId,
            p_payment_key: charged.data.paymentKey,
            p_amount: charged.data.totalAmount,
            p_method: charged.data.method ?? '카드',
            p_approved_at: charged.data.approvedAt ?? now.toISOString(),
            p_billing_day: billingDay,
            p_next_billing_date: nextBillingDate(billingDay, today),
        },
    );
    if (error) {
        logServerError('API-08 구독 생성', error);
        const cancelled = await cancelPayment({
            paymentKey: charged.data.paymentKey,
            reason: '구독 생성 실패로 자동 취소',
        });
        if (!cancelled.ok) logServerError('API-08 보상 취소 실패', cancelled);
        return redirectTo(
            request,
            errorPath(
                error.message === 'ALREADY_SUBSCRIBED'
                    ? 'ALREADY_SUBSCRIBED'
                    : 'PAYMENT_FAILED',
            ),
        );
    }
    return redirectTo(request, '/subscribe/letter/done');
}
