// API-04 토스 단건 결제 성공 리다이렉트 → 서버 승인 (SEQ-02)
import { revalidateTag } from 'next/cache';
import { requireUser } from '@/lib/api/auth';
import { parseSearchParams, redirectTo } from '@/lib/api/http';
import { fromRpcError, logServerError } from '@/lib/api/errors';
import { PaymentSuccessQuery } from '@/lib/api/schemas';
import { cancelPayment, confirmPayment } from '@/lib/payments/toss';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

const failPath = (code: string) =>
    `/checkout/fail?code=${encodeURIComponent(code)}`;

export async function GET(request: Request) {
    const query = parseSearchParams(request, PaymentSuccessQuery);
    if (query instanceof Response)
        return redirectTo(request, failPath('VALIDATION_FAILED'));
    const auth = await requireUser();
    if (auth instanceof Response)
        return redirectTo(request, failPath('UNAUTHENTICATED'));

    // (a) 본인 주문인지 RLS 세션으로 확인
    const { data: payment, error } = await auth.supabase
        .from('payments')
        .select('id, order_id, amount, status, payment_key')
        .eq('toss_order_id', query.orderId)
        .eq('purpose', 'order')
        .maybeSingle();
    if (error || !payment || !payment.order_id)
        return redirectTo(request, failPath('NOT_FOUND'));
    const successPath = `/checkout/success?orderId=${payment.order_id}`;

    const service = createSupabaseServiceClient();
    const markFailed = (code: string, message: string) =>
        service.rpc('fail_order_payment', {
            p_toss_order_id: query.orderId,
            p_code: code,
            p_message: message,
        });

    // (c) 이미 확정된 결제면 그대로 성공 (멱등, AC-09-7)
    if (
        payment.status === 'confirmed' &&
        payment.payment_key === query.paymentKey
    )
        return redirectTo(request, successPath);
    if (payment.status !== 'ready')
        return redirectTo(request, failPath('INVALID_STATE'));

    // (b) 금액 대조 (AC-09-5)
    if (payment.amount !== query.amount) {
        await markFailed(
            'AMOUNT_MISMATCH',
            `query ${query.amount} != order ${payment.amount}`,
        );
        return redirectTo(request, failPath('AMOUNT_MISMATCH'));
    }

    // (d) 토스 승인
    const confirmed = await confirmPayment({
        paymentKey: query.paymentKey,
        orderId: query.orderId,
        amount: payment.amount,
    });
    if (!confirmed.ok) {
        logServerError('API-04', confirmed);
        await markFailed(confirmed.code, confirmed.message);
        return redirectTo(request, failPath('PAYMENT_FAILED'));
    }

    // (e) DB 확정. 실패하면 (f) 결제 취소로 보상 (RISK-02)
    const { error: rpcError } = await service.rpc('confirm_order_payment', {
        p_toss_order_id: query.orderId,
        p_payment_key: confirmed.data.paymentKey,
        p_amount: confirmed.data.totalAmount,
        p_method: confirmed.data.method ?? '',
        p_approved_at: confirmed.data.approvedAt ?? new Date().toISOString(),
    });
    if (rpcError) {
        logServerError('API-04', rpcError);
        const cancelled = await cancelPayment({
            paymentKey: confirmed.data.paymentKey,
            reason: '주문 저장 실패로 자동 취소',
        });
        if (!cancelled.ok) logServerError('API-04 보상 취소 실패', cancelled);
        await markFailed(rpcError.message, '주문 확정 실패, 결제 취소');
        return redirectTo(request, failPath(fromRpcError(rpcError)));
    }

    revalidateTag('products', 'max');
    return redirectTo(request, successPath);
}
