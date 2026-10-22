import type { CartLine, CartQuote, CartQuoteLine } from '@/types/domain';
import type { Product } from '@/types/product';

export interface ShippingRule {
    shippingFee: number;
    freeShippingThreshold: number;
}

// 장바구니 견적 (AC-08-2·4·5). 없는 상품은 빼고, 수량은 재고까지, 품절 줄은 금액 0.
// 배송비: 담긴 책이 0원이거나 책 금액이 무료배송 기준 이상이면 0 (D-039, DB create_pending_order와 같은 규칙)
export function computeCartQuote(
    lines: CartLine[],
    products: Product[],
    rule: ShippingRule,
): CartQuote {
    const byId = new Map(products.map((product) => [product.id, product]));
    const merged = new Map<string, number>();
    for (const line of lines)
        merged.set(
            line.productId,
            (merged.get(line.productId) ?? 0) + line.quantity,
        );

    const quoteLines: CartQuoteLine[] = [];
    for (const [productId, requested] of merged) {
        const product = byId.get(productId);
        if (!product) continue;
        const soldOut = product.stockQuantity <= 0;
        const quantity = soldOut
            ? requested
            : Math.min(requested, product.stockQuantity);
        quoteLines.push({
            productId,
            name: product.name,
            imageUrl: product.imageUrl,
            unitPrice: product.price,
            quantity,
            stockQuantity: product.stockQuantity,
            soldOut,
            lineAmount: soldOut ? 0 : product.price * quantity,
        });
    }

    const itemsAmount = quoteLines.reduce(
        (sum, line) => sum + line.lineAmount,
        0,
    );
    const free = itemsAmount === 0 || itemsAmount >= rule.freeShippingThreshold;
    const fee = free ? 0 : rule.shippingFee;
    return {
        lines: quoteLines,
        itemsAmount,
        shippingFee: fee,
        totalAmount: itemsAmount + fee,
        freeShippingThreshold: rule.freeShippingThreshold,
        amountToFreeShipping: free
            ? 0
            : rule.freeShippingThreshold - itemsAmount,
    };
}

// 주문에 넣을 줄: 품절 제외, 견적에서 조정된 수량 사용
export function orderableLines(quote: CartQuote): CartLine[] {
    return quote.lines
        .filter((line) => !line.soldOut && line.quantity > 0)
        .map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
        }));
}
