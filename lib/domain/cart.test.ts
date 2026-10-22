import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { products } from '@/data/products';
import { computeCartQuote, orderableLines } from './cart';

const inStock = products.find((product) => product.stockQuantity >= 3)!;
const soldOut = products.find((product) => product.stockQuantity === 0)!;
const FEE = 3000;
const RULE = { shippingFee: FEE, freeShippingThreshold: 30000 };

describe('장바구니 견적', () => {
    it('AC-08-2 수량에 따라 합계가 책 금액 + 배송비로 계산된다 (무료배송 기준 미만)', () => {
        const quote = computeCartQuote(
            [{ productId: inStock.id, quantity: 1 }],
            products,
            RULE,
        );
        assert.equal(quote.itemsAmount, inStock.price);
        assert.equal(quote.shippingFee, FEE);
        assert.equal(quote.totalAmount, inStock.price + FEE);
    });

    it('AC-08-4 재고보다 많은 수량은 재고까지만', () => {
        const quote = computeCartQuote(
            [{ productId: inStock.id, quantity: inStock.stockQuantity + 5 }],
            products,
            RULE,
        );
        assert.equal(quote.lines[0].quantity, inStock.stockQuantity);
    });

    it('AC-08-5 품절된 책은 품절로 표시되고 합계·주문에서 빠진다', () => {
        const quote = computeCartQuote(
            [
                { productId: inStock.id, quantity: 1 },
                { productId: soldOut.id, quantity: 1 },
            ],
            products,
            RULE,
        );
        const line = quote.lines.find((item) => item.productId === soldOut.id)!;
        assert.equal(line.soldOut, true);
        assert.equal(line.lineAmount, 0);
        assert.equal(quote.itemsAmount, inStock.price);
        assert.deepEqual(orderableLines(quote), [
            { productId: inStock.id, quantity: 1 },
        ]);
    });

    it('없는 상품은 빼고, 담긴 책이 없으면 배송비도 0', () => {
        const quote = computeCartQuote(
            [{ productId: 'missing', quantity: 1 }],
            products,
            RULE,
        );
        assert.equal(quote.lines.length, 0);
        assert.equal(quote.totalAmount, 0);
    });

    it('같은 상품이 여러 줄이면 합친다', () => {
        const quote = computeCartQuote(
            [
                { productId: inStock.id, quantity: 1 },
                { productId: inStock.id, quantity: 1 },
            ],
            products,
            RULE,
        );
        assert.equal(quote.lines.length, 1);
        assert.equal(quote.lines[0].quantity, 2);
    });

    it('D-039 책 금액이 무료배송 기준 미만이면 배송비와 남은 금액을 알려준다', () => {
        const book = { ...inStock, id: 'b1', price: 29999, stockQuantity: 5 };
        const quote = computeCartQuote(
            [{ productId: 'b1', quantity: 1 }],
            [book],
            RULE,
        );
        assert.equal(quote.shippingFee, FEE);
        assert.equal(quote.amountToFreeShipping, 1);
        assert.equal(quote.totalAmount, 29999 + FEE);
    });

    it('D-039 책 금액이 기준과 같거나 넘으면 배송비 무료', () => {
        const book = { ...inStock, id: 'b1', price: 15000, stockQuantity: 5 };
        const quote = computeCartQuote(
            [{ productId: 'b1', quantity: 2 }],
            [book],
            RULE,
        );
        assert.equal(quote.itemsAmount, 30000);
        assert.equal(quote.shippingFee, 0);
        assert.equal(quote.amountToFreeShipping, 0);
        assert.equal(quote.totalAmount, 30000);
    });

    it('D-039 품절 줄은 무료배송 기준 금액에 넣지 않는다', () => {
        const book = { ...inStock, id: 'b1', price: 20000, stockQuantity: 5 };
        const gone = { ...soldOut, id: 'b2', price: 20000 };
        const quote = computeCartQuote(
            [
                { productId: 'b1', quantity: 1 },
                { productId: 'b2', quantity: 1 },
            ],
            [book, gone],
            RULE,
        );
        assert.equal(quote.itemsAmount, 20000);
        assert.equal(quote.shippingFee, FEE);
        assert.equal(quote.amountToFreeShipping, 10000);
    });
});
