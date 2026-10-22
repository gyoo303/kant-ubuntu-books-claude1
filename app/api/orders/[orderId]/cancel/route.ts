// API-06 발송 전 주문 취소·환불 (회원, 본인) — SEQ-03
import { revalidateTag } from 'next/cache';
import { requireUser } from '@/lib/api/auth';
import { fail, ok, parseValue } from '@/lib/api/http';
import { logServerError } from '@/lib/api/errors';
import { IdParam } from '@/lib/api/schemas';
import { cancelPayment } from '@/lib/payments/toss';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ orderId: string }> },
) {
    const orderId = parseValue((await params).orderId, IdParam);
    if (orderId instanceof Response) return fail('NOT_FOUND');
    const auth = await requireUser();
    if (auth instanceof Response) return auth;

    // 본인 주문만 (RLS 세션). 다른 회원 주문은 보이지 않는다 (AC-10-6)
    const { data: order } = await auth.supabase
        .from('orders')
        .select('id, status')
        .eq('id', orderId)
        .maybeSingle();
    if (!order) return fail('NOT_FOUND');
    if (order.status === 'refunded') return ok({ status: 'refunded' as const });
    if (order.status !== 'paid') return fail('INVALID_STATE');

    const { data: payment } = await auth.supabase
        .from('payments')
        .select('payment_key')
        .eq('order_id', orderId)
        .eq('status', 'confirmed')
        .maybeSingle();
    if (!payment?.payment_key) return fail('INVALID_STATE');

    const cancelled = await cancelPayment({
        paymentKey: payment.payment_key,
        reason: '회원 주문 취소',
    });
    if (!cancelled.ok) {
        logServerError('API-06', cancelled);
        return fail('REFUND_FAILED');
    }

    const { error } = await createSupabaseServiceClient().rpc('refund_order', {
        p_order_id: orderId,
        p_refunded_at: new Date().toISOString(),
    });
    if (error) {
        // 토스는 이미 환불됨. 재시도 시 refund_order는 멱등이다.
        logServerError('API-06 환불 반영 실패', error);
        return fail('INTERNAL');
    }
    revalidateTag('products', 'max');
    return ok({ status: 'refunded' as const });
}
