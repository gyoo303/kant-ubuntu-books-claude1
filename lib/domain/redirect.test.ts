import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { safeNextPath } from './redirect';
import { cycleTossId } from './payments';

const SITE = 'http://localhost:3000';
const staysOnSite = (next: string) =>
    new URL(safeNextPath(next), `${SITE}/api/auth/callback`).origin === SITE;

describe('로그인 후 이동 경로', () => {
    it('AC-05-2 사이트 안 경로는 그대로 돌아간다', () => {
        assert.equal(safeNextPath('/checkout'), '/checkout');
        assert.equal(safeNextPath('/products/abc?x=1'), '/products/abc?x=1');
    });

    it('외부 주소·우회 경로는 모두 사이트 안에 머문다 (오픈 리다이렉트 방지)', () => {
        const attacks = [
            '//evil.com',
            '/\\evil.com',
            '/\t/evil.com',
            '/\n/evil.com',
            '/\r/evil.com',
            'https://evil.com',
            'javascript:alert(1)',
            'http://localhost:4000/x',
            ' //evil.com',
            '\\\\evil.com',
        ];
        for (const attack of attacks)
            assert.ok(
                staysOnSite(attack),
                `빠져나감: ${JSON.stringify(attack)}`,
            );
        assert.equal(safeNextPath(null), '/');
        assert.equal(safeNextPath('https://evil.com'), '/');
    });
});

describe('토스 orderId', () => {
    it('AC-13-5 회차 결제 id는 구독·회차마다 하나로 정해지고 토스 규칙에 맞다', () => {
        const id = cycleTossId('0b1f3c4e-1a2b-4c3d-8e9f-000000000001', 3);
        assert.equal(id, 'sub_0b1f3c4e1a2b4c3d8e9f000000000001_3');
        assert.match(id, /^[A-Za-z0-9_-]{6,64}$/);
    });
});
