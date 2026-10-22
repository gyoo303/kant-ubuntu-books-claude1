// API-26 손님별 마지막 인사 편지 저장 (관리자) — 활성 구독이 있는 손님만 (AC-23-3, RLS)
import { requireAdmin } from '@/lib/api/auth';
import { fail, ok, parseJson, parseValue } from '@/lib/api/http';
import { fromRpcError, logServerError } from '@/lib/api/errors';
import { FarewellLetterInput, IdParam } from '@/lib/api/schemas';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ userId: string }> },
) {
    const userId = parseValue((await params).userId, IdParam);
    if (userId instanceof Response) return fail('NOT_FOUND');
    const input = await parseJson(request, FarewellLetterInput);
    if (input instanceof Response) return input;
    const auth = await requireAdmin();
    if (auth instanceof Response) return auth;

    const { error } = await auth.supabase
        .from('farewell_letters')
        .upsert(
            { user_id: userId, body: input.body },
            { onConflict: 'user_id' },
        );
    if (error) {
        const code = fromRpcError(error);
        if (code === 'INTERNAL') logServerError('API-26', error);
        // RLS 거부 = 활성 구독 없음
        return fail(code === 'FORBIDDEN' ? 'INVALID_STATE' : code);
    }
    return ok({ saved: true as const });
}
