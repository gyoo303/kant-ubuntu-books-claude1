// 전 API 공통 에러 모델 (04-interfaces-api.md §1.3)
export type ApiErrorCode =
    | 'UNAUTHENTICATED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'VALIDATION_FAILED'
    | 'OUT_OF_STOCK'
    | 'INVALID_STATE'
    | 'AMOUNT_MISMATCH'
    | 'SHIPPING_ADDRESS_REQUIRED'
    | 'ALREADY_SUBSCRIBED'
    | 'NO_ACTIVE_SUBSCRIPTION'
    | 'MISSING_CONTENT'
    | 'CODE_MISMATCH'
    | 'CODE_LOCKED'
    | 'PAYMENT_FAILED'
    | 'REFUND_FAILED'
    | 'INTERNAL';

export interface ApiError {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, string | number | null>;
}

export type ApiResponse<T> =
    { ok: true; data: T } | { ok: false; error: ApiError };

export const API_ERRORS: Record<
    ApiErrorCode,
    { status: number; message: string }
> = {
    UNAUTHENTICATED: { status: 401, message: '로그인이 필요해요.' },
    FORBIDDEN: { status: 403, message: '이 화면은 볼 수 없어요.' },
    NOT_FOUND: { status: 404, message: '찾을 수 없어요.' },
    VALIDATION_FAILED: {
        status: 400,
        message: '입력한 내용을 다시 확인해 주세요.',
    },
    OUT_OF_STOCK: { status: 409, message: '남은 책이 부족해요.' },
    INVALID_STATE: { status: 409, message: '지금은 할 수 없는 작업이에요.' },
    AMOUNT_MISMATCH: {
        status: 400,
        message: '결제 금액이 맞지 않아 결제를 멈췄어요.',
    },
    SHIPPING_ADDRESS_REQUIRED: {
        status: 409,
        message: '배송지를 먼저 입력해 주세요.',
    },
    ALREADY_SUBSCRIBED: { status: 409, message: '이미 구독 중이에요.' },
    NO_ACTIVE_SUBSCRIPTION: { status: 409, message: '구독 중이 아니에요.' },
    MISSING_CONTENT: {
        status: 409,
        message: '책, 답장, 힌트를 모두 채워 주세요.',
    },
    CODE_MISMATCH: { status: 422, message: '코드가 맞지 않아요.' },
    CODE_LOCKED: { status: 429, message: '잠시 후 다시 입력해 주세요.' },
    PAYMENT_FAILED: { status: 402, message: '결제가 완료되지 않았어요.' },
    REFUND_FAILED: {
        status: 502,
        message: '취소하지 못했어요. 잠시 후 다시 시도해 주세요.',
    },
    INTERNAL: {
        status: 500,
        message: '문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    },
};

export function isApiErrorCode(value: string): value is ApiErrorCode {
    return value in API_ERRORS;
}
