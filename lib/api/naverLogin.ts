import 'server-only';
import { randomBytes } from 'node:crypto';
import {
    NAVER_PROFILE_URL,
    NAVER_TOKEN_URL,
    naverShadowEmail,
    parseNaverProfile,
} from '@/lib/domain/naverAuth';
import {
    createSupabaseServerClient,
    createSupabaseServiceClient,
} from '@/lib/supabase/server';
import { publicEnv, serverEnv } from '@/lib/env';

// 네이버 로그인 서버 처리 (ADR-003 B안, D-042)
export const NAVER_STATE_COOKIE = 'naver_oauth';

export function newNaverState(): string {
    return randomBytes(32).toString('base64url');
}

export function naverRedirectUri(): string {
    return `${publicEnv.siteUrl()}/api/auth/naver/callback`;
}

type Result = { ok: true } | { ok: false; message: string };

// 인가 코드 → 네이버 토큰 → 프로필 → Supabase 회원(없으면 생성) → 세션 쿠키
export async function signInWithNaverCode(
    code: string,
    state: string,
): Promise<Result> {
    const tokenUrl = new URL(NAVER_TOKEN_URL);
    tokenUrl.searchParams.set('grant_type', 'authorization_code');
    tokenUrl.searchParams.set('client_id', serverEnv.naverClientId());
    tokenUrl.searchParams.set('client_secret', serverEnv.naverClientSecret());
    tokenUrl.searchParams.set('code', code);
    tokenUrl.searchParams.set('state', state);
    const tokenRes = await fetch(tokenUrl, { method: 'POST' });
    const token = (await tokenRes.json()) as {
        access_token?: string;
        error?: string;
        error_description?: string;
    };
    if (!tokenRes.ok || !token.access_token)
        return {
            ok: false,
            message: `token ${tokenRes.status} ${token.error ?? '-'}: ${token.error_description ?? '-'}`,
        };

    const profileRes = await fetch(NAVER_PROFILE_URL, {
        headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const profile = parseNaverProfile(await profileRes.json());
    if (!profile) return { ok: false, message: `profile ${profileRes.status}` };

    // magiclink 링크 생성은 회원이 없으면 만든다 (data → user_metadata, handle_new_user가 name을 표시 이름으로)
    const service = createSupabaseServiceClient();
    const link = await service.auth.admin.generateLink({
        type: 'magiclink',
        email: naverShadowEmail(profile.id),
        options: { data: { name: profile.nickname, provider: 'naver' } },
    });
    if (link.error) return { ok: false, message: `link ${link.error.message}` };

    // 메일은 보내지 않고, 만든 토큰으로 바로 로그인해 세션 쿠키를 심는다
    const supabase = await createSupabaseServerClient();
    const verified = await supabase.auth.verifyOtp({
        type: 'email',
        token_hash: link.data.properties.hashed_token,
    });
    if (verified.error)
        return { ok: false, message: `verify ${verified.error.message}` };
    return { ok: true };
}
