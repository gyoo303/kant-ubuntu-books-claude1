'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/client/cart';

export function CartLink() {
    const { count } = useCart();
    return (
        <Link
            href="/cart"
            className="hover:bg-muted flex items-center gap-1 rounded-md px-2 py-1"
            aria-label={`장바구니 ${count}권`}
        >
            <ShoppingBag aria-hidden />
            <span className="text-sm">장바구니</span>
            {count > 0 ? (
                <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-xs">
                    {count}
                </span>
            ) : null}
        </Link>
    );
}
