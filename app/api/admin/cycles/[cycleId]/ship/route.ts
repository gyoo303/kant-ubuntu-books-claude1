// API-24 회차 발송 → 6자리 코드 발급 (관리자) — SEQ-08, INV-15
import { revalidateTag } from 'next/cache';
import { requireAdmin } from '@/lib/api/auth';
import { fail, ok, parseValue } from '@/lib/api/http';
import {
    fromRpcError,
    logServerError,
    rpcErrorDetails,
} from '@/lib/api/errors';
import { IdParam } from '@/lib/api/schemas';

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ cycleId: string }> },
) {
    const cycleId = parseValue((await params).cycleId, IdParam);
    if (cycleId instanceof Response) return fail('NOT_FOUND');
    const auth = await requireAdmin();
    if (auth instanceof Response) return auth;

    const { data: code, error } = await auth.supabase.rpc('admin_ship_cycle', {
        p_cycle_id: cycleId,
    });
    if (error) {
        const errorCode = fromRpcError(error);
        if (errorCode === 'INTERNAL') logServerError('API-24', error);
        return fail(errorCode, rpcErrorDetails(error, errorCode));
    }
    revalidateTag('products', 'max');
    // 코드는 관리자 응답에만 (INV-04)
    return ok({ code });
}
