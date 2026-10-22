import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    CancelSubscriptionInput,
    CartQuoteInput,
    LetterInput,
    MemoInput,
    ShippingAddressInput,
    StockInput,
    UnboxInput,
} from './schemas';

const ok = (
    schema: { safeParse: (v: unknown) => { success: boolean } },
    value: unknown,
) => schema.safeParse(value).success;

describe('입력 검증 경계값', () => {
    it('AC-12-5 편지는 1~2000자 (빈 편지·2001자 거부)', () => {
        assert.equal(ok(LetterInput, { body: '' }), false);
        assert.equal(ok(LetterInput, { body: '   ' }), false);
        assert.equal(ok(LetterInput, { body: '가'.repeat(2000) }), true);
        assert.equal(ok(LetterInput, { body: '가'.repeat(2001) }), false);
    });

    it('AC-20-4 한 줄 메모는 100자까지', () => {
        assert.equal(ok(MemoInput, { body: '가'.repeat(100) }), true);
        assert.equal(ok(MemoInput, { body: '가'.repeat(101) }), false);
    });

    it('AC-19-7 언박싱 코드는 숫자 6자리만', () => {
        assert.equal(ok(UnboxInput, { code: '012345' }), true);
        assert.equal(ok(UnboxInput, { code: '12345' }), false);
        assert.equal(ok(UnboxInput, { code: '12a456' }), false);
    });

    it('AC-06-3 배송지 필수 항목·동의가 없으면 거부', () => {
        const valid = {
            recipientName: '김책방',
            phone: '010-1234-5678',
            postalCode: '34141',
            address1: '대전 유성구 어은로',
            address2: '1층',
            consent: true,
        };
        assert.equal(ok(ShippingAddressInput, valid), true);
        assert.equal(
            ok(ShippingAddressInput, { ...valid, consent: false }),
            false,
        );
        assert.equal(
            ok(ShippingAddressInput, { ...valid, postalCode: '3414' }),
            false,
        );
        assert.equal(
            ok(ShippingAddressInput, { ...valid, recipientName: '' }),
            false,
        );
    });

    it('AC-25-3 재고는 0 이상 정수', () => {
        assert.equal(ok(StockInput, { stockQuantity: 0 }), true);
        assert.equal(ok(StockInput, { stockQuantity: -1 }), false);
        assert.equal(ok(StockInput, { stockQuantity: 1.5 }), false);
    });

    it('장바구니 줄은 uuid와 1~99권', () => {
        const id = '0b1f3c4e-1a2b-4c3d-8e9f-000000000001';
        assert.equal(
            ok(CartQuoteInput, { items: [{ productId: id, quantity: 1 }] }),
            true,
        );
        assert.equal(
            ok(CartQuoteInput, { items: [{ productId: id, quantity: 0 }] }),
            false,
        );
        assert.equal(ok(CartQuoteInput, { items: [] }), false);
    });

    it('AC-21-2 작별 글은 비워도 된다', () => {
        assert.equal(ok(CancelSubscriptionInput, {}), true);
        assert.equal(ok(CancelSubscriptionInput, { note: '' }), true);
    });
});
