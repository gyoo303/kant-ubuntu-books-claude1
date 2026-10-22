import type { BrowserContext } from '@playwright/test';

// e2e 데이터 준비: service role로 Supabase REST·Auth Admin API를 직접 부른다 (RLS 우회, 테스트 준비 전용)
// 화면이 아니라 준비 단계이므로 lib/data를 거치지 않는다. 키는 .env.local에서 읽는다 (playwright.config.ts)

function env(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`E2E_CONFIG_MISSING: ${name}`);
    return value;
}

// 테스트는 회원·책·회차를 만들고 지우지 않는다. 손님이 보는 원격 DB를 더럽히지 않도록
// 로컬 주소가 아니면 E2E_ALLOW_REMOTE_WRITES=1을 직접 줄 때만 실행한다
function url(): string {
    const value = env('NEXT_PUBLIC_SUPABASE_URL');
    const host = new URL(value).hostname;
    const local = host === 'localhost' || host === '127.0.0.1';
    if (!local && process.env.E2E_ALLOW_REMOTE_WRITES !== '1') {
        throw new Error(
            `E2E_REMOTE_DB: ${host}에 테스트 데이터를 쓰려면 E2E_ALLOW_REMOTE_WRITES=1 (테스트 전용 프로젝트에서만)`,
        );
    }
    return value;
}
const serviceKey = () => env('SUPABASE_SERVICE_ROLE_KEY');
const publishableKey = () => env('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

async function call<T>(
    path: string,
    init: RequestInit & { key?: string } = {},
): Promise<T> {
    const key = init.key ?? serviceKey();
    const res = await fetch(`${url()}${path}`, {
        ...init,
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
            ...init.headers,
        },
    });
    const text = await res.text();
    if (!res.ok)
        throw new Error(
            `E2E_SETUP ${init.method ?? 'GET'} ${path} → ${res.status} ${text}`,
        );
    return (text ? JSON.parse(text) : undefined) as T;
}

export function insert<T = Record<string, unknown>>(
    table: string,
    row: Record<string, unknown>,
): Promise<T> {
    return call<T[]>(`/rest/v1/${table}`, {
        method: 'POST',
        body: JSON.stringify(row),
    }).then((rows) => rows[0]);
}

export function update(
    table: string,
    filter: string,
    patch: Record<string, unknown>,
): Promise<unknown> {
    return call(`/rest/v1/${table}?${filter}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
    });
}

export function select<T>(table: string, query: string): Promise<T[]> {
    return call<T[]>(`/rest/v1/${table}?${query}`);
}

export interface TestUser {
    id: string;
    email: string;
    password: string;
}

const PASSWORD = 'e2e-password-1234';

// 회원 1명 (가입 트리거가 profiles 행을 만든다). keeper면 책방지기 권한
export async function createUser(
    label: string,
    options: { keeper?: boolean } = {},
): Promise<TestUser> {
    const email = `e2e-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@test.local`;
    const user = await call<{ id: string }>('/auth/v1/admin/users', {
        method: 'POST',
        body: JSON.stringify({
            email,
            password: PASSWORD,
            email_confirm: true,
            user_metadata: { name: `e2e ${label}` },
        }),
    });
    if (options.keeper)
        await update('profiles', `id=eq.${user.id}`, { role: 'keeper' });
    return { id: user.id, email, password: PASSWORD };
}

// @supabase/ssr 쿠키 이름: sb-<프로젝트 주소 첫 마디>-auth-token, 값: "base64-" + base64url(세션 JSON)
function cookieName(): string {
    return `sb-${new URL(url()).hostname.split('.')[0]}-auth-token`;
}

const CHUNK = 3180; // @supabase/ssr MAX_CHUNK_SIZE

export async function login(
    context: BrowserContext,
    user: TestUser,
    baseURL: string,
): Promise<void> {
    const session = await call<Record<string, unknown>>(
        '/auth/v1/token?grant_type=password',
        {
            method: 'POST',
            key: publishableKey(),
            body: JSON.stringify({
                email: user.email,
                password: user.password,
            }),
        },
    );
    const value = `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`;
    const chunks =
        value.length <= CHUNK
            ? [value]
            : (value.match(new RegExp(`.{1,${CHUNK}}`, 'g')) ?? []);
    const name = cookieName();
    await context.addCookies(
        chunks.map((chunk, i) => ({
            name: chunks.length === 1 ? name : `${name}.${i}`,
            value: chunk,
            url: baseURL,
            sameSite: 'Lax' as const,
        })),
    );
}
