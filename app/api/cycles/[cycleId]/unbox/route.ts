// API-12 언박싱 코드 입력 (회원) — SEQ-09, INV-02·03
import { requireUser } from '@/lib/api/auth';
import { fail, ok, parseJson, parseValue } from '@/lib/api/http';
import { fromRpcError, logServerError } from '@/lib/api/errors';
import { IdParam, UnboxInput } from '@/lib/api/schemas';
import { loadOpenedBooks } from '@/lib/data/me';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ cycleId: string }> },
) {
    const cycleId = parseValue((await params).cycleId, IdParam);
    if (cycleId instanceof Response) return fail('NOT_FOUND');
    const input = await parseJson(request, UnboxInput);
    if (input instanceof Response) return input;
    const auth = await requireUser();
    if (auth instanceof Response) return auth;

    const { data, error } = await auth.supabase
        .rpc('redeem_unboxing_code', {
            p_cycle_id: cycleId,
            p_code: input.code,
        })
        .single();
    if (error) {
        logServerError('API-12', error);
        return fail(fromRpcError(error));
    }
    if (data.locked_until && !data.ok && data.remaining_attempts === 0) {
        return fail('CODE_LOCKED', { lockedUntil: data.locked_until });
    }
    if (!data.ok)
        return fail('CODE_MISMATCH', {
            remainingAttempts: data.remaining_attempts,
        });

    const [opened] = await loadOpenedBooks([cycleId]);
    if (!opened) return fail('INTERNAL');
    return ok({ opened });
}
