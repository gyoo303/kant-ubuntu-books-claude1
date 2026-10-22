import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { products } from '@/data/products';
import { buildProductSeedSql } from './seedSql';

describe('seed SQL 생성', () => {
    it('모든 Mock 상품이 한 번씩 들어가고 작은따옴표가 이스케이프된다', () => {
        const sql = buildProductSeedSql([
            { ...products[0], name: "책방지기's 노트" },
            ...products.slice(1),
        ]);
        for (const product of products) assert.ok(sql.includes(product.id));
        assert.ok(sql.includes("책방지기''s 노트"));
        assert.ok(sql.includes('on conflict (id) do update'));
    });

    it('재고는 충돌 시 덮어쓰지 않는다 (D-004)', () => {
        const sql = buildProductSeedSql(products);
        assert.ok(!sql.includes('stock_quantity = excluded.stock_quantity'));
    });
});
