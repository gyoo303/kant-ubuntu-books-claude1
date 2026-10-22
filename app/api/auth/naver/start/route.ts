// API-15a 네이버 로그인 시작 (ADR-003 B안, D-042)
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { parseSearchParams } from '@/lib/api/http';
import { NaverStartQuery } from '@/lib/api/schemas';
import {
    NAVER_STATE_COOKIE,
    naverRedirectUri,
    newNaverState,
} from '@/lib/api/naverLogin';
import { naverAuthorizeUrl } from '@/lib/domain/naverAuth';
import { safeNextPath } from '@/lib/domain/redirect';
import { serverEnv } from '@/lib/env';

export async function GET(request: Request) {
    const query = parseSearchParams(request, NaverStartQuery);
    const next = safeNextPath(query instanceof Response ? null : query.next);
    const state = newNaverState();

    // 위조 방지값과 돌아갈 경로는 서버만 읽는 쿠키에 10분 동안 둔다
    const cookieStore = await cookies();
    cookieStore.set(NAVER_STATE_COOKIE, JSON.stringify({ state, next }), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/api/auth/naver',
        maxAge: 600,
    });
    return NextResponse.redirect(
        naverAuthorizeUrl({
            clientId: serverEnv.naverClientId(),
            redirectUri: naverRedirectUri(),
            state,
        }),
        { status: 302 },
    );
}
