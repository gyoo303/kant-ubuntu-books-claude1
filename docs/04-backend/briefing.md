---
stage: BE
tickets: [TKT-BE-00, TKT-BE-01, TKT-BE-02, TKT-BE-03, TKT-BE-04, TKT-BE-05, TKT-BE-06, TKT-BE-07]
status: partial
inputs_read: [AR-MAP, AR-HAND, AR-API, AR-CONV, AR-GATE, AR-ADR, DB-BRIEF, DB-TYPES]
next_readers: [FE, QA]
---
# 백엔드 에이전트 브리핑

## 처리한 티켓
| TKT | 완료 조건 | 충족 여부 |
|---|---|---|
| TKT-BE-00 | 네이버 커스텀 OAuth2 확인 | **확인하지 못함** — 네이버 Client ID/Secret, Supabase 대시보드 권한 필요. 코드는 `provider: 'custom:naver'` 기준(FE 로그인 버튼) |
| TKT-BE-01 | AC-08-2·4·5 단위 테스트, API-01 응답 형식 | 단위 테스트 통과 / curl은 DB 미연결로 **확인하지 못함** |
| TKT-BE-02 | 콜백·로그아웃·배송지, `safeNextPath` 테스트 | 구현, `//evil.com` 거부 테스트 통과 |
| TKT-BE-03 | AC-09-2·4·5·6·7, 보상 취소 경로 | 구현(금액 대조·멱등·보상 취소) / 토스 키 없어 실결제 흐름 **확인하지 못함** |
| TKT-BE-04 | AC-10-2~6, AC-11-2·3 | 구현 / **확인하지 못함** (DB·토스) |
| TKT-BE-05 | AC-12-2·6·7, AC-13-1~5 | 구현, 결제일 테스트 통과(AC-13-1·2) / 자동결제는 **확인하지 못함** |
| TKT-BE-06 | AC-14, AC-19-3~9, AC-20, AC-21 | 구현 / **확인하지 못함** (DB) |
| TKT-BE-07 | AC-16~18, AC-22, AC-23, AC-25 | 구현 / **확인하지 못함** (DB) |

## 만든 것
| API | 메서드 | 경로 | 권한 | 주요 상태 코드 |
|---|---|---|---|---|
| API-01 | POST | `/api/cart/quote` | 공개 | 200, 400 |
| API-02 | PUT | `/api/me/shipping-address` | 회원 | 200, 400, 401 |
| API-03 | POST | `/api/orders` | 회원 | 200, 400, 401, 409 |
| API-04 | GET | `/api/payments/success` | 회원 | 302 |
| API-05 | GET | `/api/payments/fail` | 회원 | 302 |
| API-06 | POST | `/api/orders/[orderId]/cancel` | 회원(본인) | 200, 404, 409, 502 |
| API-07 | PUT | `/api/subscriptions/draft` | 회원 | 200, 409 |
| API-08 | GET | `/api/billing/success` | 회원 | 302 |
| API-09 | GET | `/api/billing/fail` | 회원 | 302 |
| API-10 | POST | `/api/letters` | 회원 | 200, 409 |
| API-11 | PATCH | `/api/letters/[letterId]` | 회원(본인) | 200, 404, 409 |
| API-12 | POST | `/api/cycles/[cycleId]/unbox` | 회원 | 200, 422, 429 |
| API-13 | PUT·DELETE | `/api/cycles/[cycleId]/memo` | 회원(본인) | 200, 409 |
| API-14 | POST | `/api/subscriptions/cancel` | 회원 | 200, 409 |
| API-15 | GET | `/api/auth/callback` | 공개 | 302 |
| API-16 | POST | `/api/auth/logout` | 회원 | 200 |
| API-17 | POST | `/api/dev/login` | 개발 전용 | 200, 404(production·꺼짐) |
| API-20 | POST | `/api/admin/orders/[orderId]/ship` | 관리자 | 200, 403, 409 |
| API-21 | POST | `/api/admin/cycles/[cycleId]/start-reading` | 관리자 | 200, 403, 409 |
| API-22 | PATCH | `/api/admin/cycles/[cycleId]/content` | 관리자 | 200, 403, 409 |
| API-23 | POST | `/api/admin/cycles/[cycleId]/postcard` | 관리자 | 200, 400, 409 |
| API-24 | POST | `/api/admin/cycles/[cycleId]/ship` | 관리자 | 200, 409 |
| API-25 | PATCH | `/api/admin/products/[productId]/stock` | 관리자 | 200, 404 |
| API-26 | PUT | `/api/admin/farewell-letters/[userId]` | 관리자 | 200, 409 |
| API-27 | GET | `/api/admin/address-book` | 관리자 | 200(xlsx), 403 |
| API-30 | GET | `/api/cron/billing` | 서버(CRON_SECRET) | 200, 403 |
- 공용: `types/api.ts`, `lib/api/{http,auth,errors,schemas,devLogin}.ts`, `lib/payments/toss.ts`, `proxy.ts`, `vercel.json`
- 도메인: `lib/domain/{cart,billing,payments,redirect,limits}.ts` (+ 테스트)

## 레이어 계층 확인 포인트
- 모든 Route Handler: 입력 검증(`parseJson`/`parseValue`) → 권한(`requireUser`/`requireAdmin`/`requireCron`) → RPC·데이터 함수 → `ok`/`fail`.
- 읽기는 `lib/data` 함수를 쓴다. 쓰기는 설계(ADR-002, CONV-09)대로 Route Handler가 RPC 또는 단일 테이블 쓰기를 세션 클라이언트로 직접 호출한다(RLS 적용). 스킬 문서의 "lib/data 경유" 규칙과 다르지만 `lib/data`는 읽기 전용으로 설계되어 있다.

## 애플리케이션 계층 확인 포인트
- 권한: 서버에서 세션·관리자(`is_admin()` RPC)·본인 여부를 다시 확인. 본인 데이터는 세션 클라이언트(RLS)로 먼저 조회한 뒤 service role을 쓴다.
- service role 사용 위치: 결제 확정·실패 기록·환불 반영(API-04·05·06), 구독 시작(API-08), Cron(API-30), 테스트 로그인(API-17). GATE-06이 다른 위치를 막는다.
- 결제: 금액 대조(쿼리 amount ↔ DB) → 토스 승인 → RPC 확정. RPC 실패 시 토스 취소(보상). 토스 호출에 `Idempotency-Key`. 구독 orderId는 `sub_<id>_<회차>`로 결정적.
- 민감 정보: 빌링키·결제키·코드는 응답에 넣지 않는다(코드는 관리자 API-24 응답만, INV-04).
- 필요한 환경변수: `.env.example` 전부. 테스트 로그인은 `DEV_TEST_LOGIN=true`, `DEV_TEST_LOGIN_SECRET`.

## 프론트엔드 에이전트에게 전달할 것
- 요청·응답 타입: `types/api.ts`(`ApiResponse`, `ApiErrorCode`), `types/domain.ts`, 입력은 `lib/api/schemas.ts` 이름 그대로.
- 결제(단건): API-03 응답 `{ tossOrderId, amount, orderName, customerKey }`로 토스 결제창 `requestPayment` → `successUrl = ${SITE_URL}/api/payments/success`, `failUrl = ${SITE_URL}/api/payments/fail`. 결과 화면은 `/checkout/success?orderId=`, `/checkout/fail?code=`.
- 구독: API-07 → 응답 `customerKey`로 `requestBillingAuth({ method: 'CARD', successUrl: ${SITE_URL}/api/billing/success, failUrl: ${SITE_URL}/api/billing/fail })` → 성공 시 `/subscribe/letter/done`, 실패 시 `/subscribe/letter?error=<CODE>`.
- 언박싱 실패: 422 `details.remainingAttempts`, 429 `details.lockedUntil`.
- 테스트 로그인: `POST /api/dev/login { role: 'member' | 'member2' | 'admin' }` (개발 환경에서만 버튼 노출).

## 설계와 다르게 한 것 / 질문 / DB 에이전트에게 요청
- 티켓 순서: 사용자 요청으로 BE 티켓 8개를 한 번에 작성.
- `buildOrderName`, `orderTossId`는 만들지 않음: 주문명·주문 id는 DB 함수 `create_pending_order`가 만든다(같은 일을 두 곳에서 하지 않기 위해).
- `lib/api/schemas.ts`에는 `server-only`를 붙이지 않음: 단위 테스트가 import하고 비밀값이 없다.
- `requireCron`은 요청 헤더를 먼저 읽는다: Cache Components에서 GET Route Handler가 빌드 시 prerender되는 것을 막기 위해(빌드에서 발견).
- API-17(테스트 로그인) 추가: 사용자 요청, D-034, 설계 문서 반영함.

## 검증 결과
| GATE | 결과 |
|---|---|
| GATE-01 `npm run typecheck` | 통과 |
| GATE-02 `npm run lint` | 통과 |
| GATE-03 `npm test` | 통과 — 31개 실행, 실패 0 |
| GATE-04 `npm run build` | 통과 (API 26개 모두 동적) |
| GATE-05·06 `npm run check:forbidden` | 통과 (70개 파일, 위반 0) |
- AC 단위 테스트: AC-05-2, AC-06-3, AC-08-2·4·5, AC-12-5, AC-13-1·2·5, AC-14-1·4, AC-15-1·4, AC-19-7, AC-20-4, AC-21-2, AC-25-3, NFR-15 통과.
- DB·토스·OAuth가 필요한 AC는 **확인하지 못함** (키 미설정).
