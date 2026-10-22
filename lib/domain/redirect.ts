// 로그인 후 돌아갈 경로. 사이트 안 경로만 허용한다 (오픈 리다이렉트 방지, API-15).
// 문자열 모양으로 거르면 탭·줄바꿈·역슬래시로 우회되므로, URL로 해석한 뒤 origin을 비교한다.
const PLACEHOLDER_ORIGIN = 'https://ubuntubooks.invalid';

export function safeNextPath(next: string | null | undefined): string {
    if (!next) return '/';
    let url: URL;
    try {
        url = new URL(next, PLACEHOLDER_ORIGIN);
    } catch {
        return '/';
    }
    if (url.origin !== PLACEHOLDER_ORIGIN) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
}
