'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CartQuote } from '@/types/domain';
import { EmptyState } from '@/components/EmptyState';
import { SoldOutBadge } from '@/components/SoldOutBadge';
import { Button, buttonVariants } from '@/components/ui/button';
import { apiFetch, jsonBody } from '@/lib/client/apiFetch';
import { useCart } from '@/lib/client/cart';
import { formatPrice } from '@/lib/domain/format';

// SCR-08 장바구니. 목록은 브라우저, 가격·재고·합계는 서버 견적(API-01)이 정한다.
export function CartView() {
    const { lines, setQuantity, remove } = useCart();
    const [quote, setQuote] = useState<CartQuote | null>(null);
    const [error, setError] = useState<string | null>(null);
    const key = JSON.stringify(lines);

    useEffect(() => {
        if (lines.length === 0) return;
        const controller = new AbortController();
        apiFetch<CartQuote>('/api/cart/quote', {
            method: 'POST',
            body: jsonBody({ items: lines }),
            signal: controller.signal,
        })
            .then((result) => {
                if (result.ok) {
                    setQuote(result.data);
                    setError(null);
                } else setError(result.error.message);
            })
            .catch(() => undefined); // 취소된 이전 요청(늦게 온 응답)은 무시
        return () => controller.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    if (lines.length === 0) {
        return (
            <EmptyState
                title="장바구니가 비어 있어요"
                href="/products"
                linkLabel="서가 둘러보기"
            />
        );
    }
    if (error)
        return (
            <p role="alert" className="text-destructive text-sm">
                {error}
            </p>
        );
    if (!quote)
        return (
            <p className="text-muted-foreground text-sm">금액을 계산하는 중…</p>
        );

    const orderable = quote.lines.some((line) => !line.soldOut);

    return (
        <div className="flex flex-col gap-6">
            <ul className="flex flex-col divide-y rounded-xl border">
                {quote.lines.map((line) => (
                    <li
                        key={line.productId}
                        className="flex flex-wrap items-center gap-4 p-4"
                    >
                        <div className="bg-muted relative aspect-3/4 w-16 shrink-0 overflow-hidden rounded-md">
                            <Image
                                src={line.imageUrl}
                                alt=""
                                fill
                                sizes="64px"
                                className="object-cover"
                            />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <Link
                                href={`/products/${line.productId}`}
                                className="font-medium break-keep hover:underline"
                            >
                                {line.name}
                            </Link>
                            {line.soldOut ? (
                                <span className="flex items-center gap-2">
                                    <SoldOutBadge />
                                    <span className="text-post text-sm font-medium">
                                        합계와 주문에서 빠져요
                                    </span>
                                </span>
                            ) : (
                                <span className="text-muted-foreground text-sm">
                                    {formatPrice(line.unitPrice)}
                                </span>
                            )}
                            {!line.soldOut &&
                            lines.find(
                                (item) => item.productId === line.productId,
                            )?.quantity !== line.quantity ? (
                                <span className="text-muted-foreground text-sm">
                                    남은 수량은 {line.stockQuantity}권입니다
                                </span>
                            ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon-sm"
                                aria-label="한 권 빼기"
                                disabled={line.soldOut || line.quantity <= 1}
                                onClick={() =>
                                    setQuantity(
                                        line.productId,
                                        line.quantity - 1,
                                    )
                                }
                            >
                                −
                            </Button>
                            <span className="w-8 text-center" aria-label="수량">
                                {line.quantity}
                            </span>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                aria-label="한 권 더"
                                disabled={
                                    line.soldOut ||
                                    line.quantity >= line.stockQuantity
                                }
                                onClick={() =>
                                    setQuantity(
                                        line.productId,
                                        line.quantity + 1,
                                    )
                                }
                            >
                                +
                            </Button>
                        </div>
                        <span className="w-24 text-right font-medium">
                            {formatPrice(line.lineAmount)}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remove([line.productId])}
                        >
                            빼기
                        </Button>
                    </li>
                ))}
            </ul>
            <dl className="ml-auto grid w-full max-w-xs grid-cols-2 gap-2 text-sm">
                <dt className="text-muted-foreground">책 금액</dt>
                <dd className="text-right">{formatPrice(quote.itemsAmount)}</dd>
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
                <dt className="font-medium">합계</dt>
                <dd className="text-right text-lg font-semibold">
                    {formatPrice(quote.totalAmount)}
                </dd>
            </dl>
            <div className="flex justify-end">
                {orderable ? (
                    <Link
                        href="/checkout"
                        className={buttonVariants({ size: 'lg' })}
                    >
                        주문하기
                    </Link>
                ) : (
                    <Button size="lg" disabled>
                        주문할 수 있는 책이 없어요
                    </Button>
                )}
            </div>
        </div>
    );
}
