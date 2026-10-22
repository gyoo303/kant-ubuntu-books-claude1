// API-13 한 줄 메모 쓰기·지우기 (회원, 본인, 언박싱한 책) — Q-009
import { requireUser } from '@/lib/api/auth';
import { fail, ok, parseJson, parseValue } from '@/lib/api/http';
import { fromRpcError, logServerError } from '@/lib/api/errors';
import { IdParam, MemoInput } from '@/lib/api/schemas';

type Params = { params: Promise<{ cycleId: string }> };

export async function PUT(request: Request, { params }: Params) {
    const cycleId = parseValue((await params).cycleId, IdParam);
    if (cycleId instanceof Response) return fail('NOT_FOUND');
    const input = await parseJson(request, MemoInput);
    if (input instanceof Response) return input;
    const auth = await requireUser();
    if (auth instanceof Response) return auth;

    const { data, error } = await auth.supabase
        .from('shelf_memos')
        .upsert(
            { cycle_id: cycleId, user_id: auth.userId, body: input.body },
            { onConflict: 'cycle_id' },
        )
        .select('body, updated_at')
        .single();
    if (error) {
        // RLS 거부 = 언박싱 전이거나 본인 회차가 아님 (AC-20-5)
        const code = fromRpcError(error);
        if (code === 'INTERNAL') logServerError('API-13', error);
        return fail(code === 'FORBIDDEN' ? 'INVALID_STATE' : code);
    }
    return ok({ body: data.body, updatedAt: data.updated_at });
}

export async function DELETE(_request: Request, { params }: Params) {
    const cycleId = parseValue((await params).cycleId, IdParam);
    if (cycleId instanceof Response) return fail('NOT_FOUND');
    const auth = await requireUser();
    if (auth instanceof Response) return auth;

    const { error } = await auth.supabase
        .from('shelf_memos')
        .delete()
        .eq('cycle_id', cycleId)
        .eq('user_id', auth.userId);
    if (error) {
        logServerError('API-13', error);
        return fail(fromRpcError(error));
    }
    return ok({ deleted: true as const });
}
