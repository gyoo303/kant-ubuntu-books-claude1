import 'server-only';
import { NextResponse } from 'next/server';
import type { z } from 'zod';
import { API_ERRORS, type ApiErrorCode, type ApiResponse } from '@/types/api';

export function ok<T>(data: T, init?: ResponseInit): Response {
    const body: ApiResponse<T> = { ok: true, data };
    return NextResponse.json(body, init);
}

export function fail(
    code: ApiErrorCode,
    details?: Record<string, string | number | null>,
): Response {
    const { status, message } = API_ERRORS[code];
    const body: ApiResponse<never> = {
        ok: false,
        error: { code, message, ...(details ? { details } : {}) },
    };
    return NextResponse.json(body, { status });
}

// JSON 본문을 읽고 zod로 검증한다. 실패하면 VALIDATION_FAILED 응답을 돌려준다 (CONV-09).
export async function parseJson<S extends z.ZodType>(
    request: Request,
    schema: S,
): Promise<z.infer<S> | Response> {
    let raw: unknown;
    try {
        raw = await request.json();
    } catch {
        return fail('VALIDATION_FAILED', { body: 'JSON이 아닙니다.' });
    }
    return parseValue(raw, schema);
}

export function parseValue<S extends z.ZodType>(
    raw: unknown,
    schema: S,
): z.infer<S> | Response {
    const result = schema.safeParse(raw);
    if (!result.success) {
        const details: Record<string, string> = {};
        for (const issue of result.error.issues)
            details[issue.path.join('.') || 'body'] = issue.message;
        return fail('VALIDATION_FAILED', details);
    }
    return result.data;
}

export function parseSearchParams<S extends z.ZodType>(
    request: Request,
    schema: S,
): z.infer<S> | Response {
    return parseValue(
        Object.fromEntries(new URL(request.url).searchParams),
        schema,
    );
}

// 브라우저 리다이렉트 (토스·OAuth 콜백용). 내부 경로만 받는다.
export function redirectTo(request: Request, path: string): Response {
    return NextResponse.redirect(new URL(path, request.url), { status: 302 });
}
