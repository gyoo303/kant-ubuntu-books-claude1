// 토스 orderId 규칙 (03-db-schema.md §3.4). 단건 주문 id는 DB 함수 create_pending_order가 만든다.
// 회차 결제 id가 결정적이라 같은 달 두 번 결제가 토스·DB 양쪽에서 막힌다 (AC-13-5).
export function cycleTossId(subscriptionId: string, cycleNo: number): string {
    return `sub_${subscriptionId.replaceAll('-', '')}_${cycleNo}`;
}

export function subscriptionOrderName(cycleNo: number): string {
    return `우분투북스 손편지 구독 ${cycleNo}회차`;
}
