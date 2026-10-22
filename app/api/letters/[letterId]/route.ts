// API-11 편지 수정 (회원, 본인) — D-027
import { requireUser } from '@/lib/api/auth';
import { fail, ok, parseJson, parseValue } from '@/lib/api/http';
import { fromRpcError, logServerError } from '@/lib/api/errors';
import { IdParam, LetterInput } from '@/lib/api/schemas';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ letterId: string }> },
) {
    const letterId = parseValue((await params).letterId, IdParam);
    if (letterId instanceof Response) return fail('NOT_FOUND');
    const input = await parseJson(request, LetterInput);
    if (input instanceof Response) return input;
    const auth = await requireUser();
    if (auth instanceof Response) return auth;

    const { error } = await auth.supabase.rpc('update_letter', {
        p_letter_id: letterId,
        p_body: input.body,
    });
    if (error) {
        const code = fromRpcError(error);
        if (code === 'INTERNAL') logServerError('API-11', error);
        return fail(code);
    }
    return ok({ letterId });
}
