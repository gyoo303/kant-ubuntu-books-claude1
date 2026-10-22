// API-10 다음 회차 편지 제출 (회원) — SEQ-06, D-014
import { requireUser } from '@/lib/api/auth';
import { fail, ok, parseJson } from '@/lib/api/http';
import { fromRpcError, logServerError } from '@/lib/api/errors';
import { LetterInput } from '@/lib/api/schemas';

export async function POST(request: Request) {
    const input = await parseJson(request, LetterInput);
    if (input instanceof Response) return input;
    const auth = await requireUser();
    if (auth instanceof Response) return auth;

    const { data, error } = await auth.supabase
        .rpc('submit_letter', { p_body: input.body })
        .single();
    if (error) {
        const code = fromRpcError(error);
        if (code === 'INTERNAL') logServerError('API-10', error);
        return fail(code);
    }
    return ok({
        letterId: data.letter_id,
        attachedCycleId: data.attached_cycle_id,
    });
}
