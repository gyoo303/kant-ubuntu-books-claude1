// 환경변수 읽기. 빠진 값은 이름을 알려 주고 실패한다 (AC-26-4).
// NEXT_PUBLIC_ 값은 번들러가 정적으로 치환할 수 있게 process.env.NAME을 그대로 쓴다.
function required(name: string, value: string | undefined): string {
    if (!value) {
        throw new Error(
            `환경변수 ${name}가 비어 있습니다. .env.example을 보고 .env.local에 채워 주세요.`,
        );
    }
    return value;
}

export const publicEnv = {
    supabaseUrl: () =>
        required(
            'NEXT_PUBLIC_SUPABASE_URL',
            process.env.NEXT_PUBLIC_SUPABASE_URL,
        ),
    supabasePublishableKey: () =>
        required(
            'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        ),
    tossClientKey: () =>
        required(
            'NEXT_PUBLIC_TOSS_CLIENT_KEY',
            process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
        ),
    siteUrl: () =>
        required('NEXT_PUBLIC_SITE_URL', process.env.NEXT_PUBLIC_SITE_URL),
};

// 서버 전용 값. 이 객체는 server-only 모듈에서만 import한다.
export const serverEnv = {
    supabaseServiceRoleKey: () =>
        required(
            'SUPABASE_SERVICE_ROLE_KEY',
            process.env.SUPABASE_SERVICE_ROLE_KEY,
        ),
    tossSecretKey: () =>
        required('TOSS_SECRET_KEY', process.env.TOSS_SECRET_KEY),
    cronSecret: () => required('CRON_SECRET', process.env.CRON_SECRET),
    devTestLoginEnabled: () =>
        process.env.NODE_ENV !== 'production' &&
        process.env.DEV_TEST_LOGIN === 'true',
    devTestLoginSecret: () =>
        required('DEV_TEST_LOGIN_SECRET', process.env.DEV_TEST_LOGIN_SECRET),
    naverClientId: () =>
        required('NAVER_CLIENT_ID', process.env.NAVER_CLIENT_ID),
    naverClientSecret: () =>
        required('NAVER_CLIENT_SECRET', process.env.NAVER_CLIENT_SECRET),
};
