import type { BookshopWindowState, CycleStatus } from '@/types/domain';

// 회차 상태 → 창가 그림 (REQ-021~024, D-010). 구독 이력이 없으면 null (AC-15-4).
export function toWindowState(
    cycle: CycleStatus | null,
): BookshopWindowState | null {
    switch (cycle) {
        case null:
            return null;
        case 'awaiting_letter':
        case 'unboxed':
            return 'waiting';
        case 'letter_arrived':
            return 'letter_arrived';
        case 'reading':
            return 'lamp_on';
        case 'shipped':
            return 'mailbox_lit';
    }
}

// 다음 회차 편지 쓰기 버튼: 활성 구독이고, 이번 회차에 편지가 이미 도착한 상태가 아닐 때 (US-14, D-014)
export function canWriteLetter(
    subscriptionActive: boolean,
    latestCycle: CycleStatus | null,
): boolean {
    return subscriptionActive && latestCycle !== 'letter_arrived';
}
