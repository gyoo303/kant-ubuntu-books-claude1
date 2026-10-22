// API-21 읽기 시작 → 손님 창가 촛불 켜짐 (관리자) — INV-09
import { requireAdmin } from '@/lib/api/auth';
import { fail, ok, parseValue } from '@/lib/api/http';
import { fromRpcError, logServerError } from '@/lib/api/errors';
import { IdParam } from '@/lib/api/schemas';

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ cycleId: string }> },
) {
    const cycleId = parseValue((await params).cycleId, IdParam);
    if (cycleId instanceof Response) return fail('NOT_FOUND');
    const auth = await requireAdmin();
    if (auth instanceof Response) return auth;

    const { error } = await auth.supabase.rpc('admin_start_reading', {
        p_cycle_id: cycleId,
    });
    if (error) {
        const code = fromRpcError(error);
        if (code === 'INTERNAL') logServerError('API-21', error);
        return fail(code);
    }
    return ok({ status: 'reading' as const });
}
