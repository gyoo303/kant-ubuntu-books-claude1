// API-22 매칭·답장·힌트 부분 저장 (관리자)
import { requireAdmin } from '@/lib/api/auth';
import { fail, ok, parseJson, parseValue } from '@/lib/api/http';
import {
    fromRpcError,
    logServerError,
    rpcErrorDetails,
} from '@/lib/api/errors';
import { CycleContentInput, IdParam } from '@/lib/api/schemas';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ cycleId: string }> },
) {
    const cycleId = parseValue((await params).cycleId, IdParam);
    if (cycleId instanceof Response) return fail('NOT_FOUND');
    const input = await parseJson(request, CycleContentInput);
    if (input instanceof Response) return input;
    const auth = await requireAdmin();
    if (auth instanceof Response) return auth;

    const { error } = await auth.supabase.rpc('admin_save_cycle_content', {
        p_cycle_id: cycleId,
        ...(input.productId ? { p_product_id: input.productId } : {}),
        ...(input.replyLetter ? { p_reply_letter: input.replyLetter } : {}),
        ...(input.teaser ? { p_teaser: input.teaser } : {}),
    });
    if (error) {
        const code = fromRpcError(error);
        if (code === 'INTERNAL') logServerError('API-22', error);
        return fail(code, rpcErrorDetails(error, code));
    }
    return ok({ saved: true as const });
}
