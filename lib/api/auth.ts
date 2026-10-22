import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env';
import { fail } from '@/lib/api/http';

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
export interface AuthedContext {
    supabase: ServerClient;
    userId: string;
}

// 세션 확인 (JWT 검증은 getClaims). 비로그인 401.
export async function requireUser(): Promise<AuthedContext | Response> {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;
    if (!userId) return fail('UNAUTHENTICATED');
    return { supabase, userId };
}

// 관리자 확인. 판단은 DB 함수 is_admin() 하나 (ADR-003). 권한 없음 403.
export async function requireAdmin(): Promise<AuthedContext | Response> {
    const auth = await requireUser();
    if (auth instanceof Response) return auth;
    const { data: isAdmin, error } = await auth.supabase.rpc('is_admin');
    if (error || !isAdmin) return fail('FORBIDDEN');
    return auth;
}

// Vercel Cron 요청 확인 (Authorization: Bearer CRON_SECRET)
// 요청 헤더를 먼저 읽어야 빌드 시 정적 prerender 대상에서 빠진다 (Cache Components).
export function requireCron(request: Request): Response | null {
    const actual = Buffer.from(request.headers.get('authorization') ?? '');
    const expected = Buffer.from(`Bearer ${serverEnv.cronSecret()}`);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
        return fail('FORBIDDEN');
    return null;
}
