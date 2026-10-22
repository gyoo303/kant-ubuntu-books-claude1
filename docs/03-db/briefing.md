---
stage: DB
tickets: [TKT-ARCH-00, TKT-DB-01, TKT-DB-02, TKT-DB-03, TKT-DB-04, TKT-DB-05, TKT-DB-06]
status: partial
inputs_read: [AR-MAP, AR-HAND, AR-DB, AR-CONV, AR-GATE, AR-ADR]
next_readers: [BE, QA]
---
# DB 에이전트 브리핑

## 처리한 티켓
| TKT | 완료 조건 | 충족 여부 |
|---|---|---|
| TKT-ARCH-00 | `npm test` ≥ 1개 실행·통과, lint·typecheck 통과, `components/ui/*` 새 별칭 | 충족 (테스트 3개 → 이후 누적 실행) |
| TKT-DB-01 | NFR-15, GATE-07, 잘못된 id는 DB 조회 없이 null | NFR-15 단위 테스트 충족, `getProductById` uuid 검사 구현 / GATE-07 **확인하지 못함** (DB 미연결) |
| TKT-DB-02 | GATE-07, 가입 시 profiles 생성, 남의 배송지 0건 | 마이그레이션 작성 / DB 시나리오 **확인하지 못함** |
| TKT-DB-03 | INV-05~08·18, NFR-08·09 시나리오 | RPC 작성 / 시나리오 **확인하지 못함** |
| TKT-DB-04 | INV-01·04·11·17 시나리오, GATE-07 | 테이블·RLS·Storage 작성 / **확인하지 못함** |
| TKT-DB-05 | INV-05·10·12·17·19, D-014·027 | RPC 작성 / **확인하지 못함** |
| TKT-DB-06 | INV-02·03·09·15, AC-15-1 단위 테스트 | RPC 작성, `toWindowState` 테스트 통과 / DB 시나리오 **확인하지 못함** |

## 만든 것
- 마이그레이션 (`supabase/migrations/`, 티켓 순서대로 번호)
  | 파일 | 내용 |
  |---|---|
  | `20261021000001_enums.sql` | pgcrypto, enum 6종, `set_updated_at()` |
  | `20261021000002_products.sql` | products + RLS, 재고 컬럼 권한, `app_constants()`, `audit_rls()` |
  | `20261021000003_profiles.sql` | profiles, 가입 트리거 `handle_new_user`, `is_admin()`, shipping_addresses, 관리자 재고 update 정책 |
  | `20261021000004_orders_payments.sql` | orders, order_items, payments + RPC `create_pending_order`, `confirm_order_payment`, `fail_order_payment`, `refund_order`, `admin_ship_order` |
  | `20261021000005_subscriptions.sql` | 구독 테이블 11개 + RLS |
  | `20261021000006_storage_postcards.sql` | `postcards` 비공개 버킷(5MB, jpeg/png/webp) + 정책 |
  | `20261021000007_rpc_subscriptions.sql` | `start_subscription`, `open_cycle`, `end_subscription_payment_failed`, `submit_letter`, `update_letter`, `cancel_subscription` |
  | `20261021000008_rpc_cycles.sql` | `admin_start_reading`, `admin_save_cycle_content`, `admin_ship_cycle`(코드 발급), `redeem_unboxing_code`(5회/10분 잠금) |
- RLS: `03-db-schema.md` §4 표 그대로. 테이블 17개 모두 활성, 정책 수는 `scripts/check-rls.mjs`의 `EXPECTED`와 같음 (billing_keys·unboxing_attempts는 정책 0 = service role/RPC만)
- 데이터 접근 계층 (`lib/data/`)
  | 파일 | 함수 |
  |---|---|
  | `products.ts` | `toProduct`, `getProducts`, `getFeaturedProducts`, `getProductById` (`'use cache'` + `cacheTag('products')`), `getProductsByIds`(캐시 없음, 견적용) |
  | `settings.ts` | `getAppConstants` |
  | `session.ts` | `getCurrentUser` (`<Suspense>` 안에서만) |
  | `me.ts` | `getMyShippingAddress`, `getMyOrders`, `getMySubscriptionOverview`, `getMyShelf`, `loadOpenedBooks`, `getMyFarewellLetter` |
  | `admin.ts` | `getDashboardCounts`, `getWorkbenchQueue`, `getWorkbenchCycle`, `searchProductsForMatch`, `getOrdersToShip`, `getStockList`, `getActiveSubscribersWithLetters`, `getFarewellInbox` |
  | `addressBook.ts` | `getAddressBookRows` |
  - 트랜잭션이 필요한 쓰기는 모두 RPC(위 마이그레이션). `lib/data`에는 쓰기 함수가 없다(BE의 Route Handler가 RPC·단일 테이블 쓰기를 호출).
- 그 밖: `lib/supabase/server.ts`(server·anon·service 클라이언트), `lib/supabase/browser.ts`, `lib/env.ts`, `types/product.ts`, `types/domain.ts`, `data/products.ts`(8권, 테마별 2권, 예시 데이터), `scripts/gen-seed.ts` + `scripts/seedSql.ts` → `supabase/seed.sql`, `scripts/run-tests.mjs`, `scripts/check-forbidden.mjs`, `scripts/check-rls.mjs`, `.env.example`, `lib/domain/window.ts`, `lib/content/defaultFarewellLetter.ts`

## 인프라 계층 확인 포인트
- 환경변수: `.env.example` 참고. DB 적용에는 `SUPABASE_DB_URL`이 추가로 필요하다.
- 마이그레이션 적용 (사람 확인 후): `npx supabase db push --db-url "$SUPABASE_DB_URL" --include-seed`
- 타입 재생성: `npx supabase gen types typescript --db-url "$SUPABASE_DB_URL" --schema public > types/database.ts`
- 관리자 지정: 테스트 로그인(API-17)의 `admin` 역할이 자동 지정. 실제 책방지기는 `update public.profiles set is_admin = true where id = '<uuid>';`

## 레이어 계층 확인 포인트
- BE는 쓰기에서 RPC 이름과 인자를 `types/database.ts`의 `Functions` 그대로 쓴다. 예외 메시지(`message`)는 `ApiErrorCode`와 같은 문자열이다(`OUT_OF_STOCK`, `INVALID_STATE` …). `detail`에 상품 id나 빠진 항목이 들어간다.
- service role이 필요한 RPC: `confirm_order_payment`, `fail_order_payment`, `refund_order`, `start_subscription`, `open_cycle`, `end_subscription_payment_failed`, `audit_rls`.
- 엽서 서명 URL은 사용자 세션 클라이언트로 만든다(Storage 정책이 본인·unboxed만 허용).

## 설계와 다르게 한 것 / 질문
- **티켓 순서**: 사용자 요청("코드까지 다 만들어봐")에 따라 DB 티켓 6개를 마일스톤 순서가 아니라 DB 단계 한 번에 작성했다. DB 미연결 상태라 적용·시나리오 검증은 연결 후 한 번에 한다.
- `components/ui/*` 6개 파일: 지운 `cn` 패키지를 import하고 있어서 import 한 줄만 `@/lib/utils`로 바꿨다(나머지 내용 그대로).
- `types/database.ts`: DB가 없어 `supabase gen types`를 못 돌렸다. 마이그레이션과 같은 모양의 **임시 생성물**을 만들었고 파일 첫 줄에 표시했다. DB 연결 후 재생성으로 덮어쓴다.
- `open_cycle`, `end_subscription_payment_failed`에 `p_cycle_no` 추가(D-035, 설계 문서 반영함).
- `lib/env.ts` 추가(설계 문서 반영함).
- `create_pending_order`가 같은 상품의 여러 줄을 합치려고 임시 테이블 `pg_temp._lines`를 쓴다.

## 검증 결과
| GATE | 명령 | 결과 |
|---|---|---|
| GATE-01 | `npm run typecheck` | 통과 (에러 0) |
| GATE-02 | `npm run lint` | 통과 (에러 0) |
| GATE-03 | `npm test` | 통과 — 11개 실행, 실패 0 |
| GATE-05 | `git ls-files` .env 점검 | 통과 (`.env*` 추적 0, `.env.example`은 추적 대상) |
| GATE-06 | `npm run check:forbidden` | 통과 (위반 0) |
| GATE-07 | `npm run check:rls` | **확인하지 못함** — DB 미연결 |
- SQL 문법·실행은 DB에 적용하지 못해 **확인하지 못함**. 적용 시 오류가 나면 이 브리핑을 갱신한다.
