import { createHash, timingSafeEqual } from 'node:crypto';

// 네이버 로그인 (ADR-003 B안, D-042). Supabase 커스텀 provider가 네이버 응답의 response.id를 못 읽어
// ("missing provider id") 서버가 네이버 OAuth를 직접 처리한다. 여기는 I/O 없는 규칙만 둔다.

export const NAVER_AUTHORIZE_URL = 'https://nid.naver.com/oauth2.0/authorize';
export const NAVER_TOKEN_URL = 'https://nid.naver.com/oauth2.0/token';
export const NAVER_PROFILE_URL = 'https://openapi.naver.com/v1/nid/me';

export function naverAuthorizeUrl(params: {
    clientId: string;
    redirectUri: string;
    state: string;
}): string {
    const url = new URL(NAVER_AUTHORIZE_URL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', params.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('state', params.state);
    return url.toString();
}

// Supabase 회원은 이메일이 있어야 해서, 네이버 id로 메일이 가지 않는 내부용 주소를 만든다.
// 이메일은 소문자로 저장되므로 대소문자가 섞인 네이버 id를 그대로 쓰지 않고 해시한다 (id 노출도 막음).
export function naverShadowEmail(naverId: string): string {
    const hash = createHash('sha256').update(naverId).digest('hex');
    return `naver-${hash.slice(0, 40)}@users.ubuntubooks.test`;
}

export interface NaverProfile {
    id: string;
    nickname: string;
}

// /v1/nid/me 응답: { resultcode: '00', message: 'success', response: { id, nickname?, ... } }
export function parseNaverProfile(body: unknown): NaverProfile | null {
    if (typeof body !== 'object' || body === null) return null;
    const { resultcode, response } = body as {
        resultcode?: unknown;
        response?: unknown;
    };
    if (resultcode !== '00' || typeof response !== 'object' || !response)
        return null;
    const { id, nickname } = response as { id?: unknown; nickname?: unknown };
    if (typeof id !== 'string' || id.length === 0) return null;
    return {
        id,
        nickname: typeof nickname === 'string' ? nickname.slice(0, 50) : '',
    };
}

// 위조 방지값 비교 (길이가 다르면 바로 false, 같으면 시간 차이 없이 비교)
export function statesMatch(
    expected: string | undefined,
    actual: string | undefined,
): boolean {
    if (!expected || !actual) return false;
    const a = Buffer.from(expected);
    const b = Buffer.from(actual);
    return a.length === b.length && timingSafeEqual(a, b);
}
