'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { CartLine } from '@/types/domain';

// 장바구니는 브라우저 localStorage에만 둔다 (D-031). 가격·재고는 서버 견적(API-01)이 정한다.
const KEY = 'ubb-cart-v1';
const PENDING_KEY = 'ubb-pending-order-v1';
const EVENT = 'ubb-cart-change';
const EMPTY: CartLine[] = [];

let cachedRaw: string | null = null;
let cachedLines: CartLine[] = EMPTY;

function read(): CartLine[] {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cachedRaw) return cachedLines;
    cachedRaw = raw;
    try {
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        cachedLines = Array.isArray(parsed)
            ? parsed.filter(
                  (line): line is CartLine =>
                      typeof line?.productId === 'string' &&
                      Number.isInteger(line?.quantity) &&
                      line.quantity > 0,
              )
            : EMPTY;
    } catch {
        cachedLines = EMPTY;
    }
    return cachedLines;
}

function write(lines: CartLine[]) {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
    window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
    window.addEventListener('storage', onChange);
    window.addEventListener(EVENT, onChange);
    return () => {
        window.removeEventListener('storage', onChange);
        window.removeEventListener(EVENT, onChange);
    };
}

export function useCart() {
    const lines = useSyncExternalStore(subscribe, read, () => EMPTY);

    const add = useCallback((productId: string, quantity = 1) => {
        const current = read();
        const existing = current.find((line) => line.productId === productId);
        write(
            existing
                ? current.map((line) =>
                      line.productId === productId
                          ? { ...line, quantity: line.quantity + quantity }
                          : line,
                  )
                : [...current, { productId, quantity }],
        );
    }, []);

    const setQuantity = useCallback((productId: string, quantity: number) => {
        write(
            read().map((line) =>
                line.productId === productId
                    ? { ...line, quantity: Math.max(1, quantity) }
                    : line,
            ),
        );
    }, []);

    const remove = useCallback((productIds: string[]) => {
        write(read().filter((line) => !productIds.includes(line.productId)));
    }, []);

    const clear = useCallback(() => write([]), []);

    return {
        lines,
        add,
        setQuantity,
        remove,
        clear,
        count: lines.reduce((sum, line) => sum + line.quantity, 0),
    };
}

// 결제창으로 떠나기 전 주문한 책을 기억해 두었다가, 결제 성공 화면에서 장바구니에서 지운다.
export function rememberPendingOrder(productIds: string[]) {
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(productIds));
}

export function takePendingOrder(): string[] {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    window.sessionStorage.removeItem(PENDING_KEY);
    try {
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed)
            ? parsed.filter((id): id is string => typeof id === 'string')
            : [];
    } catch {
        return [];
    }
}
