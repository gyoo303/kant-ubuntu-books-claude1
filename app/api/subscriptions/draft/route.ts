// API-07 구독 신청 편지 임시 저장 (회원). 카드 등록창을 열기 전에 호출한다 (SEQ-04 ①)
import { requireUser } from '@/lib/api/auth';
import { fail, ok, parseJson } from '@/lib/api/http';
import { fromRpcError, logServerError } from '@/lib/api/errors';
import { SubscriptionDraftInput } from '@/lib/api/schemas';

export async function PUT(request: Request) {
    const input = await parseJson(request, SubscriptionDraftInput);
    if (input instanceof Response) return input;
    const auth = await requireUser();
    if (auth instanceof Response) return auth;

    const [{ data: active }, { data: address }] = await Promise.all([
        auth.supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', auth.userId)
            .eq('status', 'active')
            .maybeSingle(),
        auth.supabase
            .from('shipping_addresses')
            .select('user_id')
            .eq('user_id', auth.userId)
            .maybeSingle(),
    ]);
    if (active) return fail('ALREADY_SUBSCRIBED');
    if (!address) return fail('SHIPPING_ADDRESS_REQUIRED');

    const { error } = await auth.supabase
        .from('subscription_drafts')
        .upsert(
            { user_id: auth.userId, letter_body: input.letterBody },
            { onConflict: 'user_id' },
        );
    if (error) {
        logServerError('API-07', error);
        return fail(fromRpcError(error));
    }
    return ok({ customerKey: auth.userId });
}
