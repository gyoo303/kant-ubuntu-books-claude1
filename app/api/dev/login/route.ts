// API-17 개발 전용 테스트 로그인 (D-034). production이거나 DEV_TEST_LOGIN이 꺼져 있으면 404.
import { fail, ok, parseJson } from '@/lib/api/http';
import { logServerError } from '@/lib/api/errors';
import { DevLoginInput } from '@/lib/api/schemas';
import { devLogin } from '@/lib/api/devLogin';
import { serverEnv } from '@/lib/env';

export async function POST(request: Request) {
    if (!serverEnv.devTestLoginEnabled()) return fail('NOT_FOUND');
    const input = await parseJson(request, DevLoginInput);
    if (input instanceof Response) return input;
    const result = await devLogin(input.role);
    if (!result.ok) {
        logServerError('API-17', result.message);
        return fail('INTERNAL');
    }
    return ok({ ok: true as const });
}
