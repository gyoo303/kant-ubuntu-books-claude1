'use client';

import { useEffect, useState } from 'react';
import type {
    CartQuote,
    PaymentMethodChoice,
    ShippingAddress,
} from '@/types/domain';
import { EmptyState } from '@/components/EmptyState';
import { PaymentMethodPicker } from '@/components/PaymentMethodPicker';
import { ShippingAddressFields } from '@/components/ShippingAddressFields';
import { Button } from '@/components/ui/button';
import { apiFetch, jsonBody } from '@/lib/client/apiFetch';
import { rememberPendingOrder, useCart } from '@/lib/client/cart';
import { REFUND_POLICY } from '@/lib/content/policies';
import { orderableLines } from '@/lib/domain/cart';
import { formatPrice } from '@/lib/domain/format';
import { openPaymentWindow } from '@/lib/payments/tossClient';

const PAYMENT_OPTIONS = [
    { value: 'card', label: '신용·체크카드', hint: '카드·간편결제 통합결제창' },
    {
        value: 'kakaopay',
        label: '카카오페이',
        hint: '카카오페이 창이 바로 열려요',
    },
    {
        value: 'naverpay',
        label: '네이버페이',
        hint: '네이버페이 창이 바로 열려요',
    },
] as const;

interface PreparedOrder {
    orderId: string;
    tossOrderId: string;
    amount: number;
    orderName: string;
    customerKey: string;
}

// SCR-09 주문서. 금액은 서버 견적·주문 준비가 정한다 (AC-09-3)
export function CheckoutForm({
    initialAddress,
}: {
    initialAddress: ShippingAddress | null;
}) {
    const { lines } = useCart();
    const [address, setAddress] = useState(initialAddress);
    const [quote, setQuote] = useState<CartQuote | null>(null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [method, setMethod] = useState<PaymentMethodChoice>('card');
    const key = JSON.stringify(lines);

    useEffect(() => {
        if (lines.length === 0) return;
        const controller = new AbortController();
        apiFetch<CartQuote>('/api/cart/quote', {
            method: 'POST',
            body: jsonBody({ items: lines }),
            signal: controller.signal,
        })
            .then((result) =>
                result.ok
                    ? setQuote(result.data)
                    : setError(result.error.message),
            )
            .catch(() => undefined);
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    if (lines.length === 0)
        return (
            <EmptyState
                title="주문할 책이 없어요"
                href="/products"
                linkLabel="서가 둘러보기"
            />
        );
    if (!quote)
        return (
            <p className="text-muted-foreground text-sm">금액을 계산하는 중…</p>
        );

    const items = orderableLines(quote);

    async function pay() {
        setPending(true);
        setError(null);
        const prepared = await apiFetch<PreparedOrder>('/api/orders', {
            method: 'POST',
            body: jsonBody({ items }),
        });
        if (!prepared.ok) {
            setError(prepared.error.message);
            setPending(false);
            return;
        }
        rememberPendingOrder(items.map((item) => item.productId));
        try {
            await openPaymentWindow(prepared.data, method);
        } catch (paymentError) {
            setError(
                paymentError instanceof Error
                    ? paymentError.message
                    : '결제창을 열지 못했어요.',
            );
            setPending(false);
        }
    }

    return (
        <div className="grid gap-8 md:grid-cols-2">
            <section className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">주문할 책</h2>
                <ul className="flex flex-col divide-y rounded-xl border">
                    {quote.lines
                        .filter((line) => !line.soldOut)
                        .map((line) => (
                            <li
                                key={line.productId}
                                className="flex justify-between gap-2 p-3 text-sm"
                            >
                                <span className="break-keep">
                                    {line.name} × {line.quantity}
                                </span>
                                <span>{formatPrice(line.lineAmount)}</span>
                            </li>
                        ))}
                </ul>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted-foreground">배송비 (예시)</dt>
                    <dd className="text-right">
                        {quote.shippingFee === 0 && quote.itemsAmount > 0
                            ? `무료 (${formatPrice(quote.freeShippingThreshold)} 이상)`
                            : formatPrice(quote.shippingFee)}
                    </dd>
                    {quote.amountToFreeShipping > 0 ? (
                        <dd className="text-olive col-span-2 text-right text-xs">
                            {formatPrice(quote.amountToFreeShipping)} 더 담으면
                            무료배송
                        </dd>
                    ) : null}
                    <dt className="font-medium">결제 금액</dt>
                    <dd className="text-right text-lg font-semibold">
                        {formatPrice(quote.totalAmount)}
                    </dd>
                </dl>
                <p className="text-muted-foreground text-xs break-keep">
                    환불 안내: {REFUND_POLICY}
                </p>
            </section>
            <section className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">배송지</h2>
                {address ? (
                    <div className="flex flex-col gap-1 rounded-xl border p-4 text-sm">
                        <span className="font-medium">
                            {address.recipientName}
                        </span>
                        <span>{address.phone}</span>
                        <span>
                            ({address.postalCode}) {address.address1}{' '}
                            {address.address2}
                        </span>
                        <Button
                            variant="link"
                            className="self-start px-0"
                            onClick={() => setAddress(null)}
                        >
                            배송지 바꾸기
                        </Button>
                    </div>
                ) : (
                    <ShippingAddressFields
                        initial={initialAddress}
                        onSaved={setAddress}
                        submitLabel="이 주소로 받기"
                    />
                )}
                <PaymentMethodPicker
                    legend="결제 수단"
                    options={PAYMENT_OPTIONS}
                    value={method}
                    onChange={setMethod}
                    disabled={pending}
                />
                {/* 배송지가 없으면 결제 불가 (AC-09-8) */}
                <Button
                    size="lg"
                    disabled={!address || pending || items.length === 0}
                    onClick={pay}
                >
                    {pending
                        ? '결제창을 여는 중…'
                        : `${formatPrice(quote.totalAmount)} 결제하기`}
                </Button>
                <p className="text-muted-foreground text-xs">
                    테스트 결제입니다. 실제 돈은 나가지 않아요.
                </p>
                {error ? (
                    <p role="alert" className="text-destructive text-sm">
                        {error}
                    </p>
                ) : null}
            </section>
        </div>
    );
}
