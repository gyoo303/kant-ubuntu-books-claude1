// API-14 구독 해지 (회원) — SEQ-10, INV-12: 확인 단계 없이 한 번에
import { requireUser } from '@/lib/api/auth';
import { fail, ok, parseJson } from '@/lib/api/http';
import { fromRpcError, logServerError } from '@/lib/api/errors';
import { CancelSubscriptionInput } from '@/lib/api/schemas';

export async function POST(request: Request) {
    const input = await parseJson(request, CancelSubscriptionInput);
    if (input instanceof Response) return input;
    const auth = await requireUser();
    if (auth instanceof Response) return auth;

    const { error } = await auth.supabase.rpc('cancel_subscription', {
        p_note: input.note,
    });
    if (error) {
        const code = fromRpcError(error);
        if (code === 'INTERNAL') logServerError('API-14', error);
        return fail(code);
    }
    return ok({ status: 'cancelled' as const });
}
