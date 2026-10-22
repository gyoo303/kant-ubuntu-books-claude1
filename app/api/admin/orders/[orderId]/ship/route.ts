// API-20 단건 주문 발송 처리 (관리자)
import { requireAdmin } from '@/lib/api/auth';
import { fail, ok, parseValue } from '@/lib/api/http';
import { fromRpcError, logServerError } from '@/lib/api/errors';
import { IdParam } from '@/lib/api/schemas';

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ orderId: string }> },
) {
    const orderId = parseValue((await params).orderId, IdParam);
    if (orderId instanceof Response) return fail('NOT_FOUND');
    const auth = await requireAdmin();
    if (auth instanceof Response) return auth;

    const { error } = await auth.supabase.rpc('admin_ship_order', {
        p_order_id: orderId,
    });
    if (error) {
        const code = fromRpcError(error);
        if (code === 'INTERNAL') logServerError('API-20', error);
        return fail(code);
    }
    return ok({ status: 'shipped' as const });
}
