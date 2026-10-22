// API-03 주문 준비 (회원). 금액·재고·배송지는 DB 함수가 다시 계산한다 (RISK-01).
import { requireUser } from '@/lib/api/auth';
import { fail, ok, parseJson } from '@/lib/api/http';
import {
    fromRpcError,
    logServerError,
    rpcErrorDetails,
} from '@/lib/api/errors';
import { CreateOrderInput } from '@/lib/api/schemas';

export async function POST(request: Request) {
    const input = await parseJson(request, CreateOrderInput);
    if (input instanceof Response) return input;
    const auth = await requireUser();
    if (auth instanceof Response) return auth;

    const { data, error } = await auth.supabase
        .rpc('create_pending_order', { p_items: input.items })
        .single();
    if (error) {
        const code = fromRpcError(error);
        if (code === 'INTERNAL') logServerError('API-03', error);
        return fail(code, rpcErrorDetails(error, code));
    }
    return ok({
        orderId: data.order_id,
        tossOrderId: data.toss_order_id,
        amount: data.amount,
        orderName: data.order_name,
        customerKey: auth.userId,
    });
}
