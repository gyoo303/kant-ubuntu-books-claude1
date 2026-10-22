// API-15 OAuth 콜백 (카카오·네이버) — SEQ-01
import { parseSearchParams, redirectTo } from '@/lib/api/http';
import { logServerError } from '@/lib/api/errors';
import { AuthCallbackQuery } from '@/lib/api/schemas';
import { safeNextPath } from '@/lib/domain/redirect';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const query = parseSearchParams(request, AuthCallbackQuery);
    if (query instanceof Response || !query.code || query.error) {
        // 제공자·Supabase가 돌려준 실패 이유를 서버 로그에 남긴다 (화면에는 "취소됨"만)
        if (!(query instanceof Response) && query.error)
            logServerError(
                'API-15',
                `${query.error} code=${query.error_code ?? '-'}: ${query.error_description ?? '-'}`,
            );
        return redirectTo(request, '/login?error=cancelled');
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(query.code);
    if (error) {
        // 객체로 넘기면 개발 로그 파일에 {}로만 남아서, 이름·메시지를 문자열로 남긴다
        logServerError(
            'API-15',
            `${error.name} code=${error.code ?? '-'} status=${error.status ?? '-'}: ${error.message}`,
        );
        return redirectTo(request, '/login?error=cancelled');
    }
    return redirectTo(request, safeNextPath(query.next));
}
