# HANDOFF — 하위 에이전트 티켓 (AR-HAND)

- 모든 티켓 공통으로 먼저 읽을 것: 루트 `AGENTS.md`(디렉토리 지도), `docs/02-arch/05-structure-conventions.md`, `docs/02-arch/06-quality-gates.md`
- 공통 완료 조건: GATE-01·02·03·05·06 통과(BE·FE·QA는 GATE-04 포함, DB·QA는 GATE-07 포함), 브리핑 파일 작성(`docs/PIPELINE.md` §4 머리말)
- 공통 금지: 설계 문서에 없는 테이블·API·파일 추가, 스키마·API 이름 변경(필요하면 Architect에 질문), 승인 목록 밖 패키지 추가, 커밋(사용자가 요청할 때만)
- UX 산출물(`docs/uiux/design-principles.md`, `docs/uiux/context/for-frontend.md`, `for-qa.md`)은 아직 미배포. 없으면 브리핑 "확인하지 못한 것"에 `<ID> 미배포`로 적고 진행
- 실행 순서 제약(`scripts/check-handoff.mjs`): DB 브리핑 → BE → FE → QA. 마일스톤마다 DB → BE → FE → QA 순서로 돈다.

## 순서 한눈에 보기
| 마일스톤 | DB | BE | FE | QA |
|---|---|---|---|---|
| M1 쇼핑 기반 | TKT-ARCH-00, TKT-DB-01 | TKT-BE-01 | TKT-FE-01, TKT-FE-02 | TKT-QA-01 |
| M2 회원 | TKT-DB-02 | TKT-BE-00, TKT-BE-02 | TKT-FE-03 | TKT-QA-02 |
| M3 구매 | TKT-DB-03 | TKT-BE-03, TKT-BE-04 | TKT-FE-04, TKT-FE-05 | TKT-QA-03 |
| M4 구독 | TKT-DB-04, TKT-DB-05, TKT-DB-06 | TKT-BE-05, TKT-BE-06, TKT-BE-07 | TKT-FE-06, TKT-FE-07, TKT-FE-08, TKT-FE-09 | TKT-QA-04, TKT-QA-05 |
| M5 마감 | — | — | TKT-FE-10 | TKT-QA-06 |

---

## M1 쇼핑 기반 (KANT 증빙 경로 우선: R2 → R3 → R4 → R5·R6·R7 → R8 → R9)

### TKT-ARCH-00: 저장소 설정 정리 (스타터 정리 + 게이트 스크립트)
- 담당: DB 에이전트 | 선행: 없음 | KANT: R2, C4, C16
- 읽을 것: `adr/ADR-006-directory-structure.md`, `adr/ADR-009-test-tooling.md`, `05-structure-conventions.md` §1·§5, `06-quality-gates.md` §1
- 산출:
  - 삭제: `src/`, `domains/`, `shared/mocks/mockData.ts`, `shared/utils/cn.ts`(→ `lib/utils.ts`로 `cn` 이동), `shared/utils/formatPrice.ts`·`.test.ts`(→ `lib/domain/format.ts`·`format.test.ts`로 이동)
  - 수정: `lib/utils.ts`(clsx + tailwind-merge `cn`), `package.json`(scripts·deps, `cn` 제거, `zod`·`exceljs`·`@tosspayments/tosspayments-sdk`·`server-only` 추가), `components.json` 별칭, `.gitignore`, `next.config.ts` `images.remotePatterns`, `app/layout.tsx` `lang="ko"`·제목
  - 생성: `scripts/run-tests.mjs`, `scripts/check-forbidden.mjs`, `.env.example`(ADR-005 표의 이름·용도, 값 없음)
- 완료 조건: `npm test`가 `lib/domain/format.test.ts`를 1개 이상 실행하고 통과, `npm run lint`·`typecheck` 통과, `components/ui/*`가 새 별칭으로 import 됨
- 하지 말 것: 이 정리를 다른 티켓 변경과 한 커밋에 섞기, `components/ui/*` 내용 수정
- 브리핑: `docs/03-db/briefing.md` (tickets에 TKT-ARCH-00 포함)

### TKT-DB-01: 상품 테이블·Mock·seed·상품 읽기
- 담당: DB | 선행: TKT-ARCH-00 | KANT: R3, C5, C6
- 읽을 것: `03-db-schema.md` §3.1·§3.3·§4(products 행)·§5(`audit_rls`)·§7, `04-interfaces-api.md` §1.1·§2(products, settings), `adr/ADR-001-product-data-and-mock.md`
- 산출: `supabase/migrations/20261021000001_enums.sql`, `20261021000002_products.sql`(+ `app_constants()`, `audit_rls()`), `types/product.ts`, `data/products.ts`(≥ 6개, 테마마다 ≥ 1개, Unsplash URL), `scripts/gen-seed.ts`, `supabase/seed.sql`, `types/database.ts`, `lib/supabase/server.ts`·`browser.ts`, `lib/data/products.ts`(`getProducts`, `getFeaturedProducts`, `getProductById`, `toProduct`), `lib/data/settings.ts`, `scripts/check-rls.mjs`, `lib/domain/products.test.ts`(NFR-15: 개수·필수 속성)
- 완료 조건: NFR-15, GATE-07(products RLS on, 정책 수 일치), `getProductById('not-a-uuid')`가 DB 조회 없이 `null`
- 하지 말 것: 화면 코드에서 `data/products.ts` import

### TKT-BE-01: API 공용 계층·세션 갱신
- 담당: BE | 선행: TKT-DB-01 | KANT: —
- 읽을 것: `04-interfaces-api.md` §1.3·§1.4·§4, `adr/ADR-002-server-logic-placement.md`, `adr/ADR-007-runtime-validation.md`, `docs/03-db/briefing.md`
- 산출: `types/api.ts`, `lib/api/http.ts`, `lib/api/auth.ts`, `lib/api/errors.ts`, `lib/api/schemas.ts`(이번 티켓은 `CartQuoteInput`까지), `proxy.ts`, `lib/domain/cart.ts`(+ `cart.test.ts`), API-01 `app/api/cart/quote/route.ts`
- 완료 조건: AC-08-2·4·5 단위 테스트, `curl -X POST /api/cart/quote`로 `ApiResponse` 형식 확인
- 브리핑: `docs/04-backend/briefing.md`

### TKT-FE-01: 공통 레이아웃·메인·책방 소개
- 담당: FE | 선행: TKT-BE-01 | KANT: R4, R7, C7, C8, C13
- 읽을 것: `docs/01-pm/07-screens.md` SCR-01·SCR-02·§2·§3, `04-interfaces-api.md` §2·§2.1, `docs/04-backend/briefing.md`, `docs/uiux/design-principles.md`(미배포 시 기록)
- 산출: `app/layout.tsx`, `components/Header.tsx`(로그인 영역은 이번엔 [로그인] 링크만, `<Suspense>` 자리 확보), `components/Footer.tsx`, `components/ProductCard.tsx`, `components/ThemeSelector.tsx`, `components/EmptyState.tsx`, `app/page.tsx`, `app/about/page.tsx`, `app/not-found.tsx`, `lib/content/policies.ts`(예시 문구), `docs/05-frontend/briefing-TKT-FE-01.md`
- 완료 조건: AC-01-1~3, AC-02-1·2, NFR-16
- 하지 말 것: 색·폰트 임의 확정(UX 미배포면 Tailwind 기본 중립색 + "디자인 미적용" 기록)

### TKT-FE-02: 상품 목록·상세·없는 ID
- 담당: FE | 선행: TKT-FE-01 | KANT: R5, R6, R8, R9, C9~C14
- 읽을 것: `07-screens.md` SCR-03·SCR-04, `04-interfaces-api.md` §2.1, `05-structure-conventions.md` CONV-04~08
- 산출: `app/products/page.tsx`, `app/products/[id]/page.tsx`, `app/products/[id]/not-found.tsx`, `components/AddToCartButton.tsx`(이번엔 `lib/client/cart.ts`의 `add`만), `lib/client/cart.ts`, `docs/05-frontend/briefing-TKT-FE-02.md`
- 완료 조건: AC-03-1~5, AC-04-1~4, AC-08-1, NFR-02·04, GATE-04

### TKT-QA-01: M1 검증
- 담당: QA | 선행: TKT-FE-02
- 읽을 것: `docs/01-pm/06-acceptance-criteria.md` AC-01~04·AC-08-1, NFR-02·03·04·14·15·16, `06-quality-gates.md`, `docs/05-frontend/briefing-TKT-FE-01.md`·`-FE-02.md`, `docs/uiux/context/for-qa.md`(미배포 시 기록)
- 산출: `docs/06-qa/briefing-TKT-QA-01.md` (KANT R1~R9 체크 표 포함, 이미지 URL HTTP 200 확인)

## M2 회원

### TKT-DB-02: 회원·배송지·관리자 판별
- 담당: DB | 선행: TKT-QA-01 | 근거: ADR-003
- 읽을 것: `03-db-schema.md` §3.2·§4(profiles, shipping_addresses)·§8, `04-interfaces-api.md` §2(session, me.getMyShippingAddress)
- 산출: `supabase/migrations/20261021000003_profiles.sql`, `lib/data/session.ts`, `lib/data/me.ts`(`getMyShippingAddress`), `types/database.ts` 재생성
- 완료 조건: GATE-07, 새 사용자 insert 시 profiles 생성(SQL 시나리오), 회원이 남의 배송지 조회 0건(SQL 시나리오)

### TKT-BE-00: 네이버 커스텀 OAuth2 확인 (ADR-003 확인 티켓)
- 담당: BE | 선행: TKT-DB-02
- 읽을 것: `adr/ADR-003-auth-and-admin.md`
- 산출: 브리핑에 확인 결과: Supabase 대시보드 `custom:naver` 설정값(authorization `https://nid.naver.com/oauth2.0/authorize`, token `https://nid.naver.com/oauth2.0/token`, userinfo `https://openapi.naver.com/v1/nid/me`, `email_optional: true`), 테스트 로그인 후 `auth.identities`의 `provider_id`·`identity_data`
- 완료 조건: 네이버 id로 사용자 1명이 생성됨 → ADR-003 A 유지 / 실패 → `status: blocked`로 브리핑하고 Architect에 ADR-003 B 전환 요청 (직접 B 구현 금지)
- 키·앱 등록이 없으면: "확인하지 못함" + 필요한 항목(네이버 Client ID/Secret, Supabase 대시보드 권한)

### TKT-BE-02: 로그인 콜백·로그아웃·배송지 API
- 담당: BE | 선행: TKT-BE-00
- 읽을 것: `04-interfaces-api.md` API-02·15·16, SEQ-01, `lib/domain/redirect.ts` 명세
- 산출: `app/api/auth/callback/route.ts`, `app/api/auth/logout/route.ts`, `app/api/me/shipping-address/route.ts`, `lib/domain/redirect.ts`(+ test), `lib/api/schemas.ts`(`ShippingAddressInput`, `AuthCallbackQuery`)
- 완료 조건: AC-05-2~4(콜백 부분), AC-06-1~3(API 부분), `safeNextPath` 테스트(`//evil.com` 거부)

### TKT-FE-03: 로그인·마이페이지 골격·배송지·관리자 골격
- 담당: FE | 선행: TKT-BE-02
- 읽을 것: `07-screens.md` SCR-05·06·07·15, `04-interfaces-api.md` §1.4(`apiFetch`)·§2
- 산출: `app/login/page.tsx`, Header 로그인 영역(`<Suspense>` + `getCurrentUser`), `app/mypage/page.tsx`(골격), `app/mypage/address/page.tsx`, `components/ShippingAddressFields.tsx`, `lib/client/apiFetch.ts`, `app/admin/layout.tsx`, `app/admin/page.tsx`(메뉴만), `docs/05-frontend/briefing-TKT-FE-03.md`
- 완료 조건: AC-05-1~4, AC-06-1~4, AC-07-1·2, GATE-04

### TKT-QA-02: M2 검증
- 담당: QA | 선행: TKT-FE-03 | 산출: `docs/06-qa/briefing-TKT-QA-02.md` (AC-05~07, NFR-05 관리자 경로 비관리자 접근)

## M3 구매

### TKT-DB-03: 주문·결제 테이블과 RPC
- 담당: DB | 선행: TKT-QA-02
- 읽을 것: `03-db-schema.md` §3.4·§4(orders, order_items, payments)·§5(`create_pending_order`, `confirm_order_payment`, `fail_order_payment`, `refund_order`, `admin_ship_order`)·§8, `04-interfaces-api.md` §7(주문·결제 행)
- 산출: `supabase/migrations/20261021000004_orders_payments.sql`, `supabase/tests/orders.md`(SQL 시나리오: 금액 불일치, 재고 부족, 중복 확정, 이중 환불), `lib/data/me.ts`(`getMyOrders`), `lib/data/admin.ts`(`getOrdersToShip`, `getDashboardCounts`의 주문 부분)
- 완료 조건: INV-05~08·18 시나리오 통과, NFR-08·09 시나리오, GATE-07

### TKT-BE-03: 토스 단건 결제
- 담당: BE | 선행: TKT-DB-03 | 근거: ADR-004
- 읽을 것: `04-interfaces-api.md` API-03·04·05, SEQ-02, §4(`toss.ts`), §5(`payments.ts`)
- 산출: `lib/payments/toss.ts`(`confirmPayment`, `cancelPayment`), `lib/domain/payments.ts`(+ test), `app/api/orders/route.ts`, `app/api/payments/success/route.ts`, `app/api/payments/fail/route.ts`, 스키마 추가
- 완료 조건: AC-09-2·4·5·6·7 (테스트 키로 확인, 키 없으면 "확인하지 못함"), 보상 취소 경로가 코드에 있음(RISK-02)

### TKT-BE-04: 주문 취소·관리자 발송
- 담당: BE | 선행: TKT-BE-03
- 읽을 것: API-06·20, SEQ-03
- 산출: `app/api/orders/[orderId]/cancel/route.ts`, `app/api/admin/orders/[orderId]/ship/route.ts`
- 완료 조건: AC-10-2~6, AC-11-2·3

### TKT-FE-04: 장바구니·주문서·결제 결과
- 담당: FE | 선행: TKT-BE-04
- 읽을 것: `07-screens.md` SCR-08·09·10, API-01·03, SEQ-02, `04-interfaces-api.md` §4(`tossClient.ts`)
- 산출: `app/cart/page.tsx`, `app/checkout/page.tsx`, `app/checkout/success/page.tsx`, `app/checkout/fail/page.tsx`, `lib/payments/tossClient.ts`, Header 장바구니 개수, `docs/05-frontend/briefing-TKT-FE-04.md`
- 완료 조건: AC-08-1~5, AC-09-1~8

### TKT-FE-05: 마이페이지 주문 내역·관리자 주문 목록
- 담당: FE | 선행: TKT-FE-04
- 산출: `app/mypage/page.tsx` 주문 영역, `app/admin/orders/page.tsx`, `docs/05-frontend/briefing-TKT-FE-05.md`
- 완료 조건: AC-10-1~6, AC-11-1~3

### TKT-QA-03: M3 검증
- 담당: QA | 선행: TKT-FE-05 | 산출: `docs/06-qa/briefing-TKT-QA-03.md` (AC-08~11, NFR-08·09·18, 결제 테스트 모드 확인)

## M4 구독

### TKT-DB-04: 구독 테이블·RLS·Storage
- 담당: DB | 선행: TKT-QA-03
- 읽을 것: `03-db-schema.md` §3.5·§4(구독 관련 전 행)·§6·§8
- 산출: `supabase/migrations/20261021000005_subscriptions.sql`, `20261021000006_storage_postcards.sql`, `supabase/tests/rls-subscriptions.md`(회원 A가 회원 B 회차·편지·메모 0건, 미언박싱 `cycle_contents` 0건, `unboxing_codes` 회원 0건, 관리자 `shelf_memos` 0건)
- 완료 조건: INV-01·04·11·17 시나리오, GATE-07

### TKT-DB-05: 구독 RPC (결제·편지·해지)
- 담당: DB | 선행: TKT-DB-04
- 읽을 것: `03-db-schema.md` §5(`start_subscription`, `open_cycle`, `end_subscription_payment_failed`, `submit_letter`, `update_letter`, `cancel_subscription`), `04-interfaces-api.md` §7
- 산출: `supabase/migrations/20261021000007_rpc_subscriptions.sql`, `supabase/tests/subscriptions.md`
- 완료 조건: INV-05·10·12·17·19, D-014·027 시나리오

### TKT-DB-06: 회차 RPC (읽기·발송·언박싱)·구독 읽기 함수
- 담당: DB | 선행: TKT-DB-05
- 읽을 것: `03-db-schema.md` §5(`admin_start_reading`, `admin_save_cycle_content`, `admin_ship_cycle`, `redeem_unboxing_code`), `04-interfaces-api.md` §2(me·admin·addressBook 나머지)
- 산출: `supabase/migrations/20261021000008_rpc_cycles.sql`, `supabase/tests/cycles.md`, `lib/data/me.ts`(`getMySubscriptionOverview`, `getMyShelf`, `getMyFarewellLetter`), `lib/data/admin.ts`(나머지), `lib/data/addressBook.ts`, `lib/domain/window.ts`(+ test), `lib/content/defaultFarewellLetter.ts`
- 완료 조건: INV-02·03·09·15, AC-18-5·6, AC-19-6·8 시나리오, AC-15-1 단위 테스트

### TKT-BE-05: 구독 신청·매달 자동결제
- 담당: BE | 선행: TKT-DB-06 | 근거: ADR-004·005
- 읽을 것: API-07·08·09·30, SEQ-04·05, §5(`billing.ts`)
- 산출: `lib/payments/toss.ts`(`issueBillingKey`, `chargeBillingKey`), `lib/domain/billing.ts`(+ test: 1/31 → 2월 말일), `app/api/subscriptions/draft/route.ts`, `app/api/billing/success/route.ts`, `app/api/billing/fail/route.ts`, `app/api/cron/billing/route.ts`, `vercel.json`
- 완료 조건: AC-12-2·6·7, AC-13-1~5

### TKT-BE-06: 회원 구독 API (편지·언박싱·메모·해지)
- 담당: BE | 선행: TKT-BE-05
- 읽을 것: API-10~14, SEQ-06·09·10
- 산출: `app/api/letters/route.ts`, `app/api/letters/[letterId]/route.ts`, `app/api/cycles/[cycleId]/unbox/route.ts`, `app/api/cycles/[cycleId]/memo/route.ts`, `app/api/subscriptions/cancel/route.ts`
- 완료 조건: AC-14-1~4, AC-19-3~9, AC-20-1~5, AC-21-2·5·6

### TKT-BE-07: 관리자 구독 API·주소록
- 담당: BE | 선행: TKT-BE-06 | 근거: ADR-008
- 읽을 것: API-21~27, SEQ-07·08
- 산출: `app/api/admin/cycles/[cycleId]/start-reading/route.ts`, `.../content/route.ts`, `.../postcard/route.ts`, `.../ship/route.ts`, `app/api/admin/products/[productId]/stock/route.ts`, `app/api/admin/farewell-letters/[userId]/route.ts`, `app/api/admin/address-book/route.ts`
- 완료 조건: AC-16-3~5, AC-17-2~6, AC-18-1~6, AC-22-1~3, AC-23-1~3, AC-25-1~3

### TKT-FE-06: 구독 안내·편지지·봉투 전환
- 담당: FE | 선행: TKT-BE-07
- 읽을 것: SCR-11·12, US-12·14 관찰 가능한 행동, CONV-11
- 산출: `app/subscribe/page.tsx`, `app/subscribe/letter/page.tsx`, `app/subscribe/letter/done/page.tsx`, `components/LetterPaper.tsx`, `docs/05-frontend/briefing-TKT-FE-06.md`
- 완료 조건: AC-12-1~7, AC-14-1~4, NFR-10(움직임 줄이기)

### TKT-FE-07: 서점 창가·나의 서가·작별
- 담당: FE | 선행: TKT-FE-06
- 읽을 것: SCR-06·13·14, US-15·19·20·21
- 산출: `components/BookshopWindow.tsx`, `components/BlindBookCard.tsx`, `app/mypage/page.tsx` 창가 영역, `app/mypage/shelf/page.tsx`, `app/mypage/farewell/page.tsx`, `docs/05-frontend/briefing-TKT-FE-07.md`
- 완료 조건: AC-15-1~5, AC-19-1~9, AC-20-1~6, AC-21-1~6, NFR-06(페이지 소스에 책 정보 0건)

### TKT-FE-08: 서재 작업 화면
- 담당: FE | 선행: TKT-FE-07
- 읽을 것: SCR-16, US-16·17·18, NFR-12
- 산출: `app/admin/workbench/page.tsx`(+ 말단 클라이언트 컴포넌트), `docs/05-frontend/briefing-TKT-FE-08.md`
- 완료 조건: AC-16-1~5, AC-17-1~6, AC-18-1~6, NFR-12(페이지 이동 0회로 1회차 처리)

### TKT-FE-09: 관리자 보조 화면 (Should 포함)
- 담당: FE | 선행: TKT-FE-08
- 읽을 것: SCR-15·18·19·20, US-22~25
- 산출: `app/admin/page.tsx`(주소록 버튼·건수), `app/admin/farewell-letters/page.tsx`, `app/admin/farewell-inbox/page.tsx`, `app/admin/stock/page.tsx`, `docs/05-frontend/briefing-TKT-FE-09.md`
- 완료 조건: AC-22-1~3, AC-23-1~3, AC-24-1·2, AC-25-1~3

### TKT-QA-04: M4 Must 검증
- 담당: QA | 선행: TKT-FE-08 | 산출: `docs/06-qa/briefing-TKT-QA-04.md` (AC-12~22, NFR-05·06·07·10·12, 회원 2명 + 관리자 1명 시나리오)

### TKT-QA-05: M4 Should 검증 + 회귀
- 담당: QA | 선행: TKT-FE-09 | 산출: `docs/06-qa/briefing-TKT-QA-05.md` (AC-23~25, M1~M3 회귀)

## M5 마감

### TKT-FE-10: README
- 담당: FE | 선행: TKT-QA-05 | KANT: R10, C17
- 산출: `README.md`, `docs/05-frontend/briefing-TKT-FE-10.md`
- README 목차 (확정): 1. 소개(우분투북스, Use Case 한 문장) 2. 화면 캡처(메인·목록·상세·없는 ID·창가·언박싱) 3. 컴포넌트 구조(텍스트 트리) 4. 기술 스택 5. 로컬 실행(`npm install` → `.env.local` → `npm run dev`) 6. 환경변수(`.env.example` 표, 값 제외) 7. Supabase 설정(프로젝트 생성, `supabase db push`, `npm run db:seed:gen` 후 seed 적용, 관리자 지정 SQL, 카카오·네이버 provider) 8. 결제 테스트 방법(토스 테스트 키, 테스트 카드) 9. 품질 게이트 명령 10. 시연 흐름(`docs/01-pm/07-screens.md` §5)
- 완료 조건: AC-26-1·2·4

### TKT-QA-06: 최종 검증·시연 리허설
- 담당: QA | 선행: TKT-FE-10 | 산출: `docs/06-qa/briefing-TKT-QA-06.md` (GATE-01~07 전체, KANT R1~R10·C1~C18 체크, AC-26-3 시연 5분 이내, 확인하지 못한 항목 목록)

---

## KANT 추적 갱신 결과
- `docs/01-pm/08-kant-traceability.md`의 `Architect로 이관` 행에 설계 ID·확정 경로·티켓을 채웠다(§ "설계 증빙" 열).
