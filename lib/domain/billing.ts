// 결제일 계산 (D-003, D-021). 날짜 문자열은 모두 한국 시간 기준 YYYY-MM-DD.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function todayKst(now: Date): string {
    return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export function dayOfMonth(dateKst: string): number {
    return Number(dateKst.slice(8, 10));
}

function lastDayOfMonth(year: number, month1to12: number): number {
    return new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
}

// fromDateKst가 속한 달의 다음 달 billingDay. 그 날짜가 없으면 그달 말일.
export function nextBillingDate(
    billingDay: number,
    fromDateKst: string,
): string {
    const year = Number(fromDateKst.slice(0, 4));
    const month = Number(fromDateKst.slice(5, 7));
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const day = Math.min(billingDay, lastDayOfMonth(nextYear, nextMonth));
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
