import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dayOfMonth, nextBillingDate, todayKst } from './billing';

describe('결제일 계산', () => {
    it('AC-13-1 1월 10일 신청이면 다음 결제일은 2월 10일', () => {
        assert.equal(nextBillingDate(10, '2026-01-10'), '2026-02-10');
    });

    it('AC-13-2 1월 31일 신청이면 2월에는 말일(28일)에 결제', () => {
        assert.equal(nextBillingDate(31, '2026-01-31'), '2026-02-28');
    });

    it('말일로 당겨진 다음 달에는 다시 원래 날짜(31일)로 돌아간다', () => {
        assert.equal(nextBillingDate(31, '2026-02-28'), '2026-03-31');
    });

    it('12월 다음은 다음 해 1월, 윤년 2월 29일', () => {
        assert.equal(nextBillingDate(15, '2026-12-15'), '2027-01-15');
        assert.equal(nextBillingDate(30, '2028-01-30'), '2028-02-29');
    });

    it('한국 시간 기준 오늘 날짜와 일', () => {
        assert.equal(todayKst(new Date('2026-10-20T15:30:00Z')), '2026-10-21');
        assert.equal(dayOfMonth('2026-10-21'), 21);
    });
});
