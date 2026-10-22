'use client';

import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import type { BillingMethodChoice, PaymentMethodChoice } from '@/types/domain';

// 토스 SDK v2 결제창·자동결제 등록창 (브라우저 전용). 결과는 서버 Route Handler가 받는다 (ADR-004).
function clientKey(): string {
    const key = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!key)
        throw new Error(
            'NEXT_PUBLIC_TOSS_CLIENT_KEY가 비어 있습니다. .env.local을 확인해 주세요.',
        );
    return key;
}

function siteUrl(): string {
    return process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
}

// 카드·간편결제는 토스에서 모두 method: 'CARD'로 연다 (이전 작업 requestTossPayment와 같은 방식)
// - 카드: flowMode 'DEFAULT' → 카드·간편결제 통합결제창
// - 카카오페이·네이버페이: flowMode 'DIRECT' + easyPay → 해당 간편결제 창을 바로 연다
const EASY_PAY = { kakaopay: 'KAKAOPAY', naverpay: 'NAVERPAY' } as const;

export async function openPaymentWindow(
    order: {
        customerKey: string;
        tossOrderId: string;
        orderName: string;
        amount: number;
    },
    method: PaymentMethodChoice,
) {
    const toss = await loadTossPayments(clientKey());
    const payment = toss.payment({ customerKey: order.customerKey });
    await payment.requestPayment({
        method: 'CARD',
        card:
            method === 'card'
                ? { flowMode: 'DEFAULT' }
                : { flowMode: 'DIRECT', easyPay: EASY_PAY[method] },
        amount: { currency: 'KRW', value: order.amount },
        orderId: order.tossOrderId,
        orderName: order.orderName,
        successUrl: `${siteUrl()}/api/payments/success`,
        failUrl: `${siteUrl()}/api/payments/fail`,
    });
}

// 자동결제 등록: 카드 빌링창, 또는 네이버페이 자체창 (토스 빌링 지원 간편결제: 토스페이·네이버페이)
export async function openBillingAuth(
    customerKey: string,
    method: BillingMethodChoice,
) {
    const toss = await loadTossPayments(clientKey());
    const payment = toss.payment({ customerKey });
    await payment.requestBillingAuth({
        method: 'CARD',
        ...(method === 'naverpay'
            ? { flowMode: 'DIRECT' as const, easyPay: 'NAVERPAY' as const }
            : {}),
        successUrl: `${siteUrl()}/api/billing/success`,
        failUrl: `${siteUrl()}/api/billing/fail`,
    });
}
