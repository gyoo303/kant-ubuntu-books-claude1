'use client';

import { useEffect } from 'react';
import { takePendingOrder, useCart } from '@/lib/client/cart';

// 결제 성공 후 주문한 책을 장바구니에서 지운다 (SEQ-02 ④)
export function ClearOrderedItems() {
    const { remove } = useCart();
    useEffect(() => {
        const ids = takePendingOrder();
        if (ids.length > 0) remove(ids);
    }, [remove]);
    return null;
}
