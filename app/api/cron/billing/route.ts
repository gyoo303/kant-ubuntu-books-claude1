// API-30 매달 자동결제 (Vercel Cron, 하루 1회) — SEQ-05
import { requireCron } from '@/lib/api/auth';
import { ok } from '@/lib/api/http';
import { logServerError } from '@/lib/api/errors';
import { nextBillingDate, todayKst } from '@/lib/domain/billing';
import { cycleTossId, subscriptionOrderName } from '@/lib/domain/payments';
import { cancelPayment, chargeBillingKey } from '@/lib/payments/toss';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const denied = requireCron(request);
    if (denied) return denied;

    const service = createSupabaseServiceClient();
    const today = todayKst(new Date());
    // 밀린 결제일 포함 (RISK-13)
    const { data: due, error } = await service
        .from('subscriptions')
        .select('id, user_id, billing_day, next_billing_date, monthly_price')
        .eq('status', 'active')
        .lte('next_billing_date', today)
        .order('next_billing_date');
    if (error) {
        logServerError('API-30 대상 조회', error);
        return ok({ processed: 0, succeeded: 0, ended: 0 }, { status: 500 });
    }

    let succeeded = 0;
    let ended = 0;
    for (const subscription of due) {
        const billingDate = subscription.next_billing_date ?? today;
        const [{ data: key }, { data: last }] = await Promise.all([
            service
                .from('billing_keys')
                .select('billing_key, customer_key')
                .eq('subscription_id', subscription.id)
                .maybeSingle(),
            service
                .from('subscription_cycles')
                .select('cycle_no')
                .eq('subscription_id', subscription.id)
                .order('cycle_no', { ascending: false })
                .limit(1)
                .maybeSingle(),
        ]);
        const cycleNo = (last?.cycle_no ?? 0) + 1;
        const tossOrderId = cycleTossId(subscription.id, cycleNo);

        if (!key) {
            logServerError('API-30 빌링키 없음', subscription.id);
            await service.rpc('end_subscription_payment_failed', {
                p_subscription_id: subscription.id,
                p_cycle_no: cycleNo,
                p_toss_order_id: tossOrderId,
                p_amount: subscription.monthly_price,
                p_code: 'NO_BILLING_KEY',
                p_message: '빌링키 없음',
            });
            ended += 1;
            continue;
        }

        const charged = await chargeBillingKey({
            billingKey: key.billing_key,
            customerKey: key.customer_key,
            orderId: tossOrderId,
            orderName: subscriptionOrderName(cycleNo),
            amount: subscription.monthly_price,
        });
        if (!charged.ok) {
            await service.rpc('end_subscription_payment_failed', {
                p_subscription_id: subscription.id,
                p_cycle_no: cycleNo,
                p_toss_order_id: tossOrderId,
                p_amount: subscription.monthly_price,
                p_code: charged.code,
                p_message: charged.message,
            });
            ended += 1;
            continue;
        }

        const { error: openError } = await service.rpc('open_cycle', {
            p_subscription_id: subscription.id,
            p_cycle_no: cycleNo,
            p_toss_order_id: tossOrderId,
            p_payment_key: charged.data.paymentKey,
            p_amount: charged.data.totalAmount,
            p_approved_at: charged.data.approvedAt ?? new Date().toISOString(),
            p_method: charged.data.method ?? '카드',
            p_next_billing_date: nextBillingDate(
                subscription.billing_day,
                billingDate,
            ),
        });
        if (openError) {
            logServerError('API-30 회차 열기 실패', openError);
            const cancelled = await cancelPayment({
                paymentKey: charged.data.paymentKey,
                reason: '회차 생성 실패로 자동 취소',
            });
            if (!cancelled.ok)
                logServerError('API-30 보상 취소 실패', cancelled);
            continue;
        }
        succeeded += 1;
    }

    return ok({ processed: due.length, succeeded, ended });
}
