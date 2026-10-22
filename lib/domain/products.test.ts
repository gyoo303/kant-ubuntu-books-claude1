import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { products } from '@/data/products';
import { THEMES } from '@/types/product';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('NFR-15 Mock 상품 데이터', () => {
    it('NFR-15 상품이 6개 이상이다', () => {
        assert.ok(products.length >= 6);
    });

    it('NFR-15 필수 속성(id, name, price, imageUrl, description)이 모두 채워져 있다', () => {
        for (const product of products) {
            assert.match(product.id, UUID);
            assert.ok(product.name.length > 0);
            assert.ok(Number.isInteger(product.price) && product.price >= 0);
            assert.match(
                product.imageUrl,
                /^https:\/\/images\.unsplash\.com\//,
            );
            assert.ok(product.description.length > 0);
            assert.ok(product.bookkeeperNote.length > 0);
            assert.ok(
                Number.isInteger(product.stockQuantity) &&
                    product.stockQuantity >= 0,
            );
        }
    });

    it('NFR-15 id가 겹치지 않고 테마마다 1권 이상 있다', () => {
        assert.equal(
            new Set(products.map((product) => product.id)).size,
            products.length,
        );
        for (const theme of THEMES)
            assert.ok(
                products.some((product) => product.theme === theme.value),
            );
    });
});
