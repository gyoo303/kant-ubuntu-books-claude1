# ADR-004: 결제 — 토스페이먼츠 단건 결제와 매달 자동결제
- 상태: Accepted (user, 2026-10-21)
- 관련 계층: [인프라] [모듈 협력 구조]
- 근거: DRV-C-06, DRV-Q-02, RISK-01·02·03·08·13, INV-05~07·18·19, D-002, D-003, D-007, →ARCH-05

## 맥락
단건 주문은 결제창, 구독은 매달 자동결제다(D-002 테스트 모드). 사용자의 이전 작업은 SDK v2 결제창(`payment().requestPayment`) + 서버 승인(`POST /v1/payments/confirm`, 시크릿 키 Basic 인증)이다. 자동결제는 카드 등록(`requestBillingAuth`) → 빌링키 발급 → 빌링키 결제이며, **매달 결제를 거는 스케줄은 가맹점이 직접 만든다**. 자동결제 등록창은 카드와 일부 간편결제(토스페이·네이버페이)를 지원하고 카카오페이는 지원하지 않는다.

## 검토한 옵션
| 옵션 | 장점 | 단점 | AI 부채 영향 | KANT 영향 | 되돌리기 비용 |
|---|---|---|---|---|---|
| A 리다이렉트 + 서버 승인만 (웹훅 없음). 승인 후 DB 저장 실패 시 즉시 결제 취소(보상) | 이전 작업과 같은 흐름, 부품 최소 | 브라우저가 success URL로 안 돌아오면 인증만 남음(승인 전이라 돈은 안 나감) | 낮음 | 무관 | 낮음 |
| B A + 토스 웹훅으로 상태 재대조 | 누락 상태를 나중에 맞춤 | 웹훅 수신·검증·중복 처리 경로가 하나 더 | 중 | 무관 | 중 |

## 결정 / 추천
결정: **A** — 승인은 항상 서버가 하므로 "돈은 나갔는데 기록 없음"은 승인 직후 저장 실패뿐이고, 이를 보상 취소로 막는다.

### 흐름 요약 (상세는 `04-interfaces-api.md` SEQ)
- 단건: 주문 준비(서버 금액 계산, `orders.status = pending_payment`) → 결제창 → `/api/payments/success` → 금액 대조 → `confirm` → RPC `confirm_order_payment`(상태 조건부, 재고 차감) → 실패 시 `cancel`
- 구독 신청: 편지 임시 저장 → 자동결제 등록창(카드 또는 네이버페이, D-040)(`customerKey` = 회원 uuid) → `/api/billing/success` → `authorizations/issue`로 빌링키 → 첫 결제 `POST /v1/billing/{billingKey}` → RPC `start_subscription`
- 매달: Vercel Cron(하루 1회) → `/api/cron/billing` → 결제일이 오늘 이전인 활성 구독마다 결제 → 성공 RPC `open_cycle`, 실패 RPC `end_subscription_payment_failed`
- 환불: 회원 취소 → `cancel` → RPC `refund_order`(재고 복구)
- 멱등: `payments.payment_key unique`, `payments.toss_order_id unique`, 회차 `(subscription_id, cycle_no) unique`, RPC는 기대 상태일 때만 바꿈

### 보안
- 시크릿 키·빌링키는 서버만. 빌링키는 `billing_keys` 테이블(RLS 켜고 정책 0개 → service role만 접근)
- 금액은 항상 서버가 DB 가격으로 계산하고, success URL의 `amount`와 대조

## 결과
- 좋아지는 점: 이전 작업과 같은 단건 흐름 재사용, 부품 최소
- 감수할 점: **구독 결제는 카드·네이버페이만**(토스 자동결제가 카카오페이를 지원하지 않음, D-040). 단건 결제는 카드·카카오페이·네이버페이. 라이브 전환 시 자동결제 추가 계약 필요(테스트 모드 범위 밖)
- 후속: TKT-BE(결제), TKT-DB(payments·billing_keys·RPC), 패키지 추가 `@tosspayments/tosspayments-sdk`
