---
stage: QA
tickets: [TKT-QA-M3]
status: partial
inputs_read: [AR-MAP, AR-HAND, AR-GATE, PM-AC, UX-CTX-QA, UX-PLAN-QA, UX-PERSONA, BE-BRIEF, FE-BRIEF, QA-BRIEF]
next_readers: [UX, 사람]
---

# QA 브리핑 – TKT-QA-M3 구매 (`claude/serene-mayer-ma4ulh` 5613bf3)

판정: ❌ 반려 (브랜치 공통 C1: `origin/main` 충돌). 충돌을 풀어도 M3는 **보류**다. 토스 테스트 키로 실제 결제 흐름을 확인하기 전에는 배포 가능으로 볼 수 없다(사용자 결정: 토스 테스트는 나중에)

## 요약
- 키 없이 확인할 수 있는 것은 모두 통과했다: 금액 변조 거부(NFR-19), 잘못된 결제 콜백, 빈 배송지, 배송지 미리 채움, DB 쪽 중복 확정·환불·결제 대기 주문 재사용(pgTAP 54개).
- 확인하지 못한 것: 실제 승인 → "주문 접수" → 발송, 결제 창 닫기, 환불 성공·실패, 같은 확정 2회의 화면 흐름.
- 공통 점검은 `docs/06-qa/briefing-TKT-QA-01.md`.

## 수용기준 검증
| 수용기준 | 테스트 | 결과 |
|---|---|---|
| AC-07-* (장바구니) | S1-4 담기 → 장바구니 → 주문서, UX-14 빈 장바구니 | 통과(부분) |
| AC-08-1 | — (토스 승인 필요) | 미검증 |
| AC-08-2 | `e2e/m3-payment.spec.ts` "AC-08-2" | 통과 |
| AC-08-3 | — | 미검증 |
| AC-08-4 | — (결제 창) | 미검증 |
| AC-08-5 | `supabase/tests/payments.test.sql` (재고 부족 확정 거부) | 통과(DB) / 보상 취소는 미검증 |
| AC-08-6, NFR-07 | `payments.test.sql` `confirm_payment` 2회 | 통과(DB) |
| AC-08-7 | "AC-08-7" (빈칸 → `aria-invalid`, 주문 0건) | 통과 |
| AC-08-8, NFR-19 | "AC-08-8·NFR-19" (45,000원 주문에 `amount=1000` 콜백 → 303 실패 화면, 결제 `failed`, 주문 결제 대기, 재고 그대로, 토스 호출 없음) | 통과 |
| AC-08-9·10 | `supabase/tests/pending_orders.test.sql` (ok 19) | 통과(DB) |
| AC-09-* (주문 현황) | UX-14 빈 주문 현황, `privacy.spec.ts` 다른 회원 주문 0 | 통과(부분) |
| AC-10-* (발송·환불) | `payments.test.sql` `begin_refund` 2회 등 | 통과(DB) / 화면·토스 환불 미검증 |
| 결제 콜백 입력 검증 | "결제 콜백 쿼리가 잘못되면…" 4가지 | 통과 |

## 실행 결과
| 항목 | 결과 | 분류 |
|---|---|---|
| 공통 게이트·DB·충돌 | `briefing-TKT-QA-01.md` | — |
| pgTAP payments | ok 35 / not ok 0 | 스텁 DB |
| pgTAP pending_orders | ok 19 / not ok 0 | 스텁 DB |
| e2e `m3-payment` | 통과 4 / 실행 4 | — |
| 토스 결제 흐름 | 실행하지 않음 | 환경 문제(키 없음, 사용자 결정으로 나중에) |

## 발견 이슈
이번 범위에서 새로 찾은 결함은 없다. 공통 이슈 C1~C6은 QA-01 브리핑을 본다.

코드 확인 메모(이슈 아님):
- `app/api/payments/toss/success/route.ts`는 저장 금액과 콜백 금액이 다르면 **토스 승인 호출 전에** 실패 처리한다. 승인 후 DB 확정이 실패하면 결제 취소(보상)를 하고, 그것도 실패하면 `COMPENSATION_FAILED`를 남기고 결과 화면에 연락 안내를 띄운다. 설계(SEQ-03)와 같다.
- 결제 성공·실패 콜백은 세션 없이 동작한다(ADR-004). `pg_order_id`는 DB가 만든 무작위 값(`'ub' || uuid`)이라 추측해서 남의 결제를 실패로 바꾸기는 어렵다.

## 사용자 관점 검증 [AI 시뮬레이션]
- 시안 대조 SCR-09 장바구니·SCR-10 주문서: 1280 [목록 | 합계], 360 목록 → 합계, 버튼 종류가 시안과 같다. SCR-11 결과 화면·SCR-12 주문 현황(주문 있음)은 결제를 못 해 비교하지 못했다.
- 공통 문제: M4 이슈 #3(외곽선 버튼 테두리가 투명)이 [다시 결제하기]·주문 취소 버튼(`RetryPaymentButton`, `MemberOrderActions`, `app/checkout/result/page.tsx`)에도 해당한다.

| ID | 결과 | 단계 수 | 막힌 지점 | 관련 UX-n / AC | 스크린샷 |
|---|---|---|---|---|---|
| S1-4 | 어려움(결제 전까지 성공) | 5 | 결제 승인 이후는 확인하지 못함 | AC-03-3, AC-05-1 | `docs/06-qa/screens/S1-4-checkout-360.jpg` |
| S2-2 | 확인하지 못함 | — | 토스 결제 창 필요 | AC-11-6 | — |

## AI 부채 체크
- 사람이 이해하기 어려운 코드/과설계: 결제 확정 판단이 순수 함수(`domains/payments/payment.ts` `decideConfirm`)로 빠져 있고 단위 테스트가 있다. 흐름 주석에 SEQ-03 단계 번호가 붙어 따라가기 쉽다.
- 미래 위험과 최소화 방법: 보상 취소 실패(`COMPENSATION_FAILED`)는 운영자가 토스 관리자 화면에서 직접 처리해야 한다. 시연 전에 이 경우의 운영 절차를 README에 한 줄 두면 좋다.

## 추가한 테스트
- `e2e/m3-payment.spec.ts` 4개. 결제 행·주문 행을 service role로 직접 만들어 토스 없이 콜백 경로를 시험한다.

## 사람이 결정할 것
1. **토스 테스트 키를 받은 뒤 다시 검증할 목록**: AC-08-1·3·4·5(보상 취소), AC-10-1~5 화면 흐름, AC-11-6(결제 창 닫기, 우체통 연출 없음), 같은 콜백 2회의 화면(AC-08-6). 이때 `e2e/`에 결제 시나리오를 더할지도 정한다.
2. 위 확인 전까지 M3 판정은 보류로 둔다.
