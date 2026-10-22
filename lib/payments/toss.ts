import 'server-only';
import { serverEnv } from '@/lib/env';

// 토스페이먼츠 API 어댑터 (ADR-004). 예외를 던지지 않고 결과 객체를 돌려준다.
const TOSS_API = 'https://api.tosspayments.com/v1';

export type TossResult<T> =
    { ok: true; data: T } | { ok: false; code: string; message: string };

export interface TossPayment {
    paymentKey: string;
    orderId: string;
    status: string;
    method: string | null;
    totalAmount: number;
    approvedAt: string | null;
}

export interface TossBillingKey {
    billingKey: string;
    customerKey: string;
}

function authHeader(): string {
    return `Basic ${Buffer.from(`${serverEnv.tossSecretKey()}:`).toString('base64')}`;
}

async function post<T>(
    path: string,
    body: Record<string, unknown>,
    idempotencyKey?: string,
): Promise<TossResult<T>> {
    try {
        const response = await fetch(`${TOSS_API}${path}`, {
            method: 'POST',
            headers: {
                Authorization: authHeader(),
                'Content-Type': 'application/json',
                ...(idempotencyKey
                    ? { 'Idempotency-Key': idempotencyKey }
                    : {}),
            },
            body: JSON.stringify(body),
            cache: 'no-store',
        });
        const json: unknown = await response.json();
        if (!response.ok) {
            const error = json as { code?: string; message?: string };
            return {
                ok: false,
                code: error.code ?? `HTTP_${response.status}`,
                message: error.message ?? '토스 요청 실패',
            };
        }
        return { ok: true, data: json as T };
    } catch (error) {
        return {
            ok: false,
            code: 'NETWORK_ERROR',
            message: error instanceof Error ? error.message : String(error),
        };
    }
}

export function confirmPayment(input: {
    paymentKey: string;
    orderId: string;
    amount: number;
}) {
    return post<TossPayment>(
        '/payments/confirm',
        input,
        `confirm-${input.orderId}`,
    );
}

export function cancelPayment(input: { paymentKey: string; reason: string }) {
    return post<TossPayment>(
        `/payments/${encodeURIComponent(input.paymentKey)}/cancel`,
        { cancelReason: input.reason },
        `cancel-${input.paymentKey}`,
    );
}

export function issueBillingKey(input: {
    authKey: string;
    customerKey: string;
}) {
    return post<TossBillingKey>('/billing/authorizations/issue', input);
}

export function chargeBillingKey(input: {
    billingKey: string;
    customerKey: string;
    orderId: string;
    orderName: string;
    amount: number;
}) {
    const { billingKey, ...body } = input;
    return post<TossPayment>(
        `/billing/${encodeURIComponent(billingKey)}`,
        body,
        `charge-${input.orderId}`,
    );
}
