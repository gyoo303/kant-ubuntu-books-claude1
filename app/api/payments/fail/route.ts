// API-05 토스 단건 결제 실패·취소 리다이렉트
import { requireUser } from '@/lib/api/auth';
import { parseSearchParams, redirectTo } from '@/lib/api/http';
import { PaymentFailQuery } from '@/lib/api/schemas';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const query = parseSearchParams(request, PaymentFailQuery);
    const failPath = '/checkout/fail?code=PAYMENT_FAILED';
    if (query instanceof Response || !query.orderId)
        return redirectTo(request, failPath);
    const auth = await requireUser();
    if (auth instanceof Response) return redirectTo(request, failPath);

    // 본인 결제 건만 실패 처리
    const { data: payment } = await auth.supabase
        .from('payments')
        .select('id')
        .eq('toss_order_id', query.orderId)
        .maybeSingle();
    if (payment) {
        await createSupabaseServiceClient().rpc('fail_order_payment', {
            p_toss_order_id: query.orderId,
            p_code: query.code ?? 'USER_CANCEL',
            p_message: query.message ?? '',
        });
    }
    return redirectTo(request, failPath);
}
