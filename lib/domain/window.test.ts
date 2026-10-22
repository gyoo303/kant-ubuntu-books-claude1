import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canWriteLetter, toWindowState } from './window';

describe('서점 창가 상태', () => {
    it('AC-15-1 회차 상태마다 정해진 창가 그림이 된다', () => {
        assert.equal(toWindowState('awaiting_letter'), 'waiting');
        assert.equal(toWindowState('letter_arrived'), 'letter_arrived');
        assert.equal(toWindowState('reading'), 'lamp_on');
        assert.equal(toWindowState('shipped'), 'mailbox_lit');
        assert.equal(toWindowState('unboxed'), 'waiting');
    });

    it('AC-15-4 구독 이력이 없으면 창가 대신 null', () => {
        assert.equal(toWindowState(null), null);
    });

    it('AC-14-1·14-4 편지 쓰기 버튼은 활성 구독에서, 편지 도착 상태가 아닐 때만', () => {
        assert.equal(canWriteLetter(true, 'awaiting_letter'), true);
        assert.equal(canWriteLetter(true, 'reading'), true);
        assert.equal(canWriteLetter(true, 'letter_arrived'), false);
        assert.equal(canWriteLetter(false, 'awaiting_letter'), false);
    });
});
