// API-15b 네이버 로그인 콜백 (ADR-003 B안, D-042)
import { cookies } from 'next/headers';
import { parseSearchParams, redirectTo } from '@/lib/api/http';
import { logServerError } from '@/lib/api/errors';
import { NaverCallbackQuery } from '@/lib/api/schemas';
import { NAVER_STATE_COOKIE, signInWithNaverCode } from '@/lib/api/naverLogin';
import { statesMatch } from '@/lib/domain/naverAuth';
import { safeNextPath } from '@/lib/domain/redirect';

function readSaved(raw: string | undefined): { state?: string; next?: string } {
    if (!raw) return {};
    try {
        const saved = JSON.parse(raw) as { state?: unknown; next?: unknown };
        return {
            state: typeof saved.state === 'string' ? saved.state : undefined,
            next: typeof saved.next === 'string' ? saved.next : undefined,
        };
    } catch (error) {
        logServerError('API-15b', `state cookie: ${String(error)}`);
        return {};
    }
}

export async function GET(request: Request) {
    const cookieStore = await cookies();
    const saved = readSaved(cookieStore.get(NAVER_STATE_COOKIE)?.value);
    cookieStore.delete({ name: NAVER_STATE_COOKIE, path: '/api/auth/naver' });

    const query = parseSearchParams(request, NaverCallbackQuery);
    if (query instanceof Response || query.error || !query.code) {
        if (!(query instanceof Response) && query.error)
            logServerError(
                'API-15b',
                `${query.error}: ${query.error_description ?? '-'}`,
            );
        return redirectTo(request, '/login?error=cancelled');
    }
    if (!statesMatch(saved.state, query.state)) {
        logServerError('API-15b', 'state mismatch');
        return redirectTo(request, '/login?error=cancelled');
    }

    try {
        const result = await signInWithNaverCode(query.code, query.state ?? '');
        if (!result.ok) {
            logServerError('API-15b', result.message);
            return redirectTo(request, '/login?error=cancelled');
        }
    } catch (error) {
        logServerError('API-15b', String(error));
        return redirectTo(request, '/login?error=cancelled');
    }
    return redirectTo(request, safeNextPath(saved.next));
}
