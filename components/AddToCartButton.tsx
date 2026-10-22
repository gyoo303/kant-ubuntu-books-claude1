'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/client/cart';

// 상세 화면 [장바구니 담기] (AC-08-1). 품절이면 비활성 (AC-04-4)
export function AddToCartButton({
    productId,
    stockQuantity,
}: {
    productId: string;
    stockQuantity: number;
}) {
    const { add } = useCart();
    const [added, setAdded] = useState(false);
    const soldOut = stockQuantity <= 0;
    return (
        <div className="flex flex-col gap-2">
            <Button
                size="lg"
                disabled={soldOut}
                onClick={() => {
                    add(productId, 1);
                    setAdded(true);
                }}
            >
                {soldOut ? '품절' : '장바구니 담기'}
            </Button>
            <p role="status" className="text-muted-foreground text-sm">
                {added ? '장바구니에 담았습니다' : ''}
            </p>
        </div>
    );
}
