import 'server-only';
import type { PostgrestError } from '@supabase/supabase-js';
import { isApiErrorCode, type ApiErrorCode } from '@/types/api';

// RPC 예외(message = 에러 코드)와 Postgres 오류 코드를 ApiErrorCode로 바꾼다.
export function fromRpcError(error: PostgrestError): ApiErrorCode {
    if (isApiErrorCode(error.message)) return error.message;
    switch (error.code) {
        case '42501': // RLS·권한 거부
            return 'FORBIDDEN';
        case '22P02': // 형식 오류 (uuid 등)
        case '23514': // check 제약
            return 'VALIDATION_FAILED';
        case 'PGRST116': // single() 결과 없음
            return 'NOT_FOUND';
        default:
            return 'INTERNAL';
    }
}

// RPC 예외의 detail(상품 id, 빠진 항목)을 응답 details로 넘긴다.
export function rpcErrorDetails(
    error: PostgrestError,
    code: ApiErrorCode,
): Record<string, string> | undefined {
    if (!error.details) return undefined;
    if (code === 'OUT_OF_STOCK') return { productId: error.details };
    if (code === 'MISSING_CONTENT') return { missing: error.details };
    return undefined;
}

export function logServerError(apiId: string, error: unknown): void {
    console.error(`[${apiId}]`, error);
}
