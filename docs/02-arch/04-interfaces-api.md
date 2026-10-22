# 04. 인터페이스 & API (AR-API)

- 근거: ADR-001~008, `03-db-schema.md`, PM US·AC
- 모든 이름(파일·함수·타입·경로)은 **확정**이다. 바꿔야 하면 Architect에 질문한다.
- 경로 별칭: `@/*` → 저장소 루트 (tsconfig 기존 설정)

## 1. 타입

### 1.1 `types/product.ts` (KANT-R3, C5)
```ts
export type Theme = 'nature' | 'food' | 'ecology' | 'local';

export interface Product {
  id: string;            // uuid
  name: string;
  price: number;         // 원
  imageUrl: string;
  description: string;   // 출판사 소개
  author: string;
  publisher: string;
  theme: Theme;
  bookkeeperNote: string;
  stockQuantity: number;
}

export const THEMES: readonly { value: Theme; label: string }[] = [
  { value: 'nature', label: '자연' },
  { value: 'food', label: '식문화' },
  { value: 'ecology', label: '생태' },
  { value: 'local', label: '로컬' },
];
```
- `data/products.ts`: `export const products: Product[]` (≥ 6개, 테마마다 ≥ 1개, `id`는 고정 uuid 문자열, `imageUrl`은 `https://images.unsplash.com/...`).
- DB 행 → `Product` 변환은 `lib/data/products.ts`의 `toProduct(row)` 한 곳에서만 한다.

### 1.2 `types/domain.ts`
```ts
export type OrderStatus = 'pending_payment' | 'paid' | 'shipped' | 'cancelled' | 'refunded';
export type SubscriptionStatus = 'active' | 'cancelled' | 'ended';
export type CycleStatus = 'awaiting_letter' | 'letter_arrived' | 'reading' | 'shipped' | 'unboxed';
export type BookshopWindowState = 'waiting' | 'letter_arrived' | 'lamp_on' | 'mailbox_lit';   // 그림 4종 (unboxed는 waiting과 같은 그림)

export interface CartLine { productId: string; quantity: number }               // localStorage 형태
export interface CartQuoteLine { productId: string; name: string; imageUrl: string; unitPrice: number;
  quantity: number; stockQuantity: number; soldOut: boolean; lineAmount: number }
export interface CartQuote { lines: CartQuoteLine[]; itemsAmount: number; shippingFee: number; totalAmount: number; freeShippingThreshold: number; amountToFreeShipping: number }
export type PaymentMethodChoice = 'card' | 'kakaopay' | 'naverpay'; // 단건 결제 수단 (D-040)
export type BillingMethodChoice = 'card' | 'naverpay'; // 구독 자동결제 수단 (토스 자동결제는 카카오페이 미지원)

export interface ShippingAddress { recipientName: string; phone: string; postalCode: string;
  address1: string; address2: string; consentedAt: string }

export interface MyOrder { id: string; createdAt: string; status: OrderStatus; totalAmount: number;
  items: { productName: string; quantity: number }[]; canCancel: boolean }

export interface BlindBook { cycleId: string; cycleNo: number; teaser: string; shippedAt: string }     // 책 정보 없음 (INV-01)
export interface OpenedBook { cycleId: string; cycleNo: number; product: Pick<Product, 'id' | 'name' | 'author' | 'imageUrl'>;
  replyLetter: string; postcardUrl: string | null; unboxedAt: string; memo: { body: string; updatedAt: string } | null }

export interface MySubscriptionOverview {
  subscription: { id: string; status: SubscriptionStatus; nextBillingDate: string | null; monthlyPrice: number } | null;
  window: BookshopWindowState | null;      // 구독 이력 없으면 null (AC-15-4)
  latestCycle: { id: string; cycleNo: number; status: CycleStatus } | null;
  canWriteLetter: boolean;
  storedLetter: { id: string; body: string } | null;
}
```

### 1.3 `types/api.ts` — 에러 모델 (전 API 공통)
```ts
export type ApiErrorCode =
  | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_FAILED'
  | 'OUT_OF_STOCK' | 'INVALID_STATE' | 'AMOUNT_MISMATCH' | 'SHIPPING_ADDRESS_REQUIRED'
  | 'ALREADY_SUBSCRIBED' | 'NO_ACTIVE_SUBSCRIPTION' | 'MISSING_CONTENT'
  | 'CODE_MISMATCH' | 'CODE_LOCKED' | 'PAYMENT_FAILED' | 'REFUND_FAILED' | 'INTERNAL';

export interface ApiError { code: ApiErrorCode; message: string; details?: Record<string, string | number | null> }
export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: ApiError };
```
| code | HTTP | 회원 화면 문구 (`message`) |
|---|---|---|
| UNAUTHENTICATED | 401 | 로그인이 필요해요. |
| FORBIDDEN | 403 | 이 화면은 볼 수 없어요. |
| NOT_FOUND | 404 | 찾을 수 없어요. |
| VALIDATION_FAILED | 400 | 입력한 내용을 다시 확인해 주세요. (`details`에 칸별 사유) |
| OUT_OF_STOCK | 409 | 남은 책이 부족해요. (`details.productId`) |
| INVALID_STATE | 409 | 지금은 할 수 없는 작업이에요. |
| AMOUNT_MISMATCH | 400 | 결제 금액이 맞지 않아 결제를 멈췄어요. |
| SHIPPING_ADDRESS_REQUIRED | 409 | 배송지를 먼저 입력해 주세요. |
| ALREADY_SUBSCRIBED | 409 | 이미 구독 중이에요. |
| NO_ACTIVE_SUBSCRIPTION | 409 | 구독 중이 아니에요. |
| MISSING_CONTENT | 409 | 책, 답장, 힌트를 모두 채워 주세요. (`details.missing`) |
| CODE_MISMATCH | 422 | 코드가 맞지 않아요. (`details.remainingAttempts`) |
| CODE_LOCKED | 429 | 잠시 후 다시 입력해 주세요. (`details.lockedUntil`) |
| PAYMENT_FAILED | 402 | 결제가 완료되지 않았어요. |
| REFUND_FAILED | 502 | 취소하지 못했어요. 잠시 후 다시 시도해 주세요. |
| INTERNAL | 500 | 문제가 생겼어요. 잠시 후 다시 시도해 주세요. |
- 로그용 정보(토스 응답 원문, SQL 에러)는 응답에 넣지 않고 서버 `console.error('[<API-ID>]', ...)`로만 남긴다.
- RPC 예외 `message`(§`03-db-schema.md` §5)는 `lib/api/errors.ts`의 `fromRpcError(error)`가 위 코드로 바꾼다. 매핑 없는 예외는 `INTERNAL`.

### 1.4 공용 함수 (시그니처 확정)
| 파일 | 함수 | 하는 일 |
|---|---|---|
| `lib/api/http.ts` | `ok<T>(data: T, init?: ResponseInit): Response`, `fail(code: ApiErrorCode, details?): Response` | 응답 생성 (HTTP 상태는 §1.3 표) |
| `lib/api/http.ts` | `parseJson<S extends z.ZodType>(request: Request, schema: S): Promise<z.infer<S> \| Response>` | JSON 파싱 + zod 검증, 실패 시 `VALIDATION_FAILED` 응답 |
| `lib/api/auth.ts` | `requireUser(): Promise<{ supabase, user } \| Response>`, `requireAdmin(): Promise<{ supabase, user } \| Response>` | 세션 확인, 관리자는 `is_admin()` RPC로 확인 |
| `lib/api/schemas.ts` | 모든 입력 zod 스키마 (§2 표의 입력 타입 이름 그대로) | — |
| `lib/api/errors.ts` | `fromRpcError(error: PostgrestError): ApiErrorCode` | RPC 예외 매핑 |
| `lib/client/apiFetch.ts` | `apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>>` | 클라이언트 쓰기 요청의 유일한 진입점 |
| `lib/client/cart.ts` | `useCart()` → `{ lines, add, setQuantity, remove, clear, count }` | localStorage `ubb-cart-v1`, 다른 탭 `storage` 이벤트 반영 |

## 2. 화면 데이터 계약 (읽기, Server Components → `lib/data`)
| 함수 (`lib/data/*.ts`) | 반환 | 캐시 | 쓰는 화면 |
|---|---|---|---|
| `products.getProducts(theme?: Theme)` | `Product[]` (이름순) | `'use cache'` + `cacheTag('products')` + `cacheLife('minutes')`, anon 클라이언트(쿠키 없음) | SCR-01, SCR-03 |
| `products.getFeaturedProducts(limit = 4)` | `Product[]` (최신순) | 위와 같음 | SCR-01 |
| `products.getProductById(id: string)` | `Product \| null` — `id`가 uuid 형식이 아니면 DB 조회 없이 `null` | 위와 같음, 태그 `products`, `product-<id>` | SCR-04 |
| `settings.getAppConstants()` | `{ shippingFee: number; subscriptionMonthlyPrice: number; freeShippingThreshold: number }` | `'use cache'` + `cacheLife('hours')` | SCR-08, 09, 11, 12 |
| `session.getCurrentUser()` | `{ id: string; displayName: string; isAdmin: boolean } \| null` | 없음 (쿠키 읽음 → 반드시 `<Suspense>` 안, RISK-12) | Header, 보호 화면 |
| `me.getMyShippingAddress()` | `ShippingAddress \| null` | 없음 | SCR-07, 09, 12 |
| `me.getMyOrders()` | `MyOrder[]` | 없음 | SCR-06 |
| `me.getMySubscriptionOverview()` | `MySubscriptionOverview` | 없음 | SCR-06, 11, 12, 14 |
| `me.getMyShelf()` | `{ blind: BlindBook[]; opened: OpenedBook[] }` (회차 최신순). `opened`는 `cycle_contents`(RLS가 unboxed만 허용) 조인 + 서명 URL 1시간 | 없음 | SCR-13 |
| `me.getMyFarewellLetter()` | `{ body: string; isDefault: boolean }` (없으면 `lib/content/defaultFarewellLetter.ts`) | 없음 | SCR-14 |
| `admin.getDashboardCounts()` | `{ cyclesToProcess: number; ordersToShip: number }` | 없음 | SCR-15 |
| `admin.getWorkbenchQueue()` | `{ cycleId; cycleNo; memberName; status; letterArrivedAt }[]` (`letter_arrived`·`awaiting_letter`·`reading`, 오래된 순) | 없음 | SCR-16 ① |
| `admin.getWorkbenchCycle(cycleId)` | `{ cycle; letter: { body; isFromCurrentCycle: boolean } ; content: { product; replyLetter; postcardUrl; teaser } ; code: string \| null } \| null` | 없음 | SCR-16 |
| `admin.searchProductsForMatch(q: string)` | `Pick<Product,'id'\|'name'\|'author'\|'stockQuantity'>[]` (제목·저자 `ilike`, 최대 20) | 없음 | SCR-16 ② |
| `admin.getOrdersToShip()` | `{ id; createdAt; recipientName; phone; postalCode; address1; address2; items }[]` | 없음 | SCR-17 |
| `admin.getStockList()` | `Pick<Product,'id'\|'name'\|'author'\|'stockQuantity'>[]` | 없음 | SCR-20 |
| `admin.getActiveSubscribersWithLetters()` | `{ userId; name; farewellLetter: string \| null }[]` | 없음 | SCR-18 |
| `admin.getFarewellInbox()` | `{ createdAt; name; body }[]` (최신순) | 없음 | SCR-19 |
| `addressBook.getAddressBookRows()` | `{ recipientName; phone; postalCode; address1; address2 }[]` (`active` 구독자) | 없음 | API-27 |

### 2.1 KANT 3페이지 확정 사항
- `app/page.tsx`: `getFeaturedProducts()` → `ProductCard` `.map()`. 세션 의존 부분 없음(Header의 로그인 영역만 `<Suspense>`).
- `app/products/page.tsx` (KANT-R5, C11): `searchParams: Promise<{ theme?: string }>`를 받는 비동기 자식 컴포넌트를 `<Suspense>` 안에 두고, `theme`이 `Theme`가 아니면 전체 목록 + 안내(AC-03-5). `getProducts(theme).map((product) => <ProductCard key={product.id} product={product} />)`.
- `app/products/[id]/page.tsx` (KANT-R6, C12): `params: Promise<{ id: string }>` → `await params` → `getProductById(id)` → `null`이면 `notFound()`. 같은 폴더 `not-found.tsx`가 "상품을 찾을 수 없습니다" + `<Link href="/products">`를 보여준다(KANT-C14). 타입은 `PageProps<'/products/[id]'>`.
- `ProductCard` Props (KANT-C8): `{ product: Product }` 하나. `next/image` + `fill` + `object-cover`, 부모 `aspect-[3/4]`.
- 빌드 시 `'use cache'` 함수가 실행되므로 `npm run build`에는 Supabase 환경변수가 필요하다(README 명시).
- 재고가 바뀌는 API(API-04·06·24·25)는 끝에 `revalidateTag('products', 'max')`를 호출한다. 화면 재고는 잠시 늦을 수 있고, 최종 판정은 RPC가 한다.

## 3. 쓰기 API (Route Handlers, ADR-002)
- 모두 `app/api/**/route.ts`. 요청·응답 JSON(`ApiResponse<T>`), 리다이렉트형(토스·OAuth)만 302.
- 권한: `공개` / `회원`(`requireUser`) / `관리자`(`requireAdmin`) / `서버`(헤더 `Authorization: Bearer ${CRON_SECRET}`).
- 입력 스키마 이름은 `lib/api/schemas.ts`의 export 이름이다.

| API | 메서드 · 경로 | 권한 | 입력 | 출력 `data` | 에러 | 멱등성 | US/AC |
|---|---|---|---|---|---|---|---|
| API-01 | POST `/api/cart/quote` | 공개 | `CartQuoteInput { items: CartLine[] (1~50) }` | `CartQuote` (없는 상품 줄은 제외) | VALIDATION_FAILED | 읽기 | US-08 / AC-08-2·4·5 |
| API-02 | PUT `/api/me/shipping-address` | 회원 | `ShippingAddressInput { recipientName, phone, postalCode, address1, address2, consent: true }` | `ShippingAddress` | VALIDATION_FAILED | upsert | US-06 / AC-06-1~3 |
| API-03 | POST `/api/orders` | 회원 | `CreateOrderInput { items: CartLine[] }` | `{ orderId, tossOrderId, amount, orderName, customerKey }` | SHIPPING_ADDRESS_REQUIRED, OUT_OF_STOCK, VALIDATION_FAILED | 매번 새 주문 (pending) | US-09 / AC-09-3·6·8 |
| API-04 | GET `/api/payments/success?paymentKey&orderId&amount` | 회원 (세션) | 토스 쿼리 `PaymentSuccessQuery` | 302 → `/checkout/success?orderId=` 또는 `/checkout/fail?code=` | AMOUNT_MISMATCH, OUT_OF_STOCK, PAYMENT_FAILED | `confirm_order_payment` 멱등 (SEQ-02) | US-09 / AC-09-2·5·7 |
| API-05 | GET `/api/payments/fail?code&message&orderId` | 회원 | `PaymentFailQuery` | 302 → `/checkout/fail?code=` | — | 상태 조건부 | US-09 / AC-09-4 |
| API-06 | POST `/api/orders/[orderId]/cancel` | 회원 (본인) | — | `{ status: 'refunded' }` | NOT_FOUND, INVALID_STATE, REFUND_FAILED | 이미 refunded면 성공 반환 | US-10 / AC-10-2~6 |
| API-07 | PUT `/api/subscriptions/draft` | 회원 | `SubscriptionDraftInput { letterBody (1~2000) }` | `{ customerKey }` (= user id) | ALREADY_SUBSCRIBED, SHIPPING_ADDRESS_REQUIRED, VALIDATION_FAILED | upsert | US-12 / AC-12-5·6 |
| API-08 | GET `/api/billing/success?customerKey&authKey` | 회원 (세션, `customerKey = user.id` 확인) | `BillingSuccessQuery` | 302 → `/subscribe/letter/done` 또는 `/subscribe/letter?error=` | PAYMENT_FAILED, ALREADY_SUBSCRIBED, FORBIDDEN | 결정적 `toss_order_id` (SEQ-04) | US-12 / AC-12-2·7 |
| API-09 | GET `/api/billing/fail?code&message` | 회원 | `BillingFailQuery` | 302 → `/subscribe/letter?error=PAYMENT_FAILED` | — | — | US-12 / AC-12-7 |
| API-10 | POST `/api/letters` | 회원 | `LetterInput { body (1~2000) }` | `{ letterId, attachedCycleId: string \| null }` | NO_ACTIVE_SUBSCRIPTION, VALIDATION_FAILED | 보관 편지는 1통으로 수렴 | US-14 / AC-14-1~4 |
| API-11 | PATCH `/api/letters/[letterId]` | 회원 (본인) | `LetterInput` | `{ letterId }` | INVALID_STATE, NOT_FOUND | 덮어쓰기 | US-14 / AC-14-3 |
| API-12 | POST `/api/cycles/[cycleId]/unbox` | 회원 | `UnboxInput { code: /^[0-9]{6}$/ }` | `{ opened: OpenedBook }` | CODE_MISMATCH, CODE_LOCKED, INVALID_STATE, VALIDATION_FAILED | 이미 unboxed면 성공 반환 | US-19 / AC-19-3~9 |
| API-13 | PUT / DELETE `/api/cycles/[cycleId]/memo` | 회원 (본인, unboxed) | PUT `MemoInput { body (1~100) }` | `{ body, updatedAt }` / `{ deleted: true }` | INVALID_STATE, VALIDATION_FAILED | upsert / 없는 메모 삭제도 성공 | US-20 / AC-20-1~5 |
| API-14 | POST `/api/subscriptions/cancel` | 회원 | `CancelSubscriptionInput { note: string (0~2000) }` | `{ status: 'cancelled' }` | NO_ACTIVE_SUBSCRIPTION | 이미 cancelled면 성공 | US-21 / AC-21-2·5·6 |
| API-15 | GET `/api/auth/callback?code&next` | 공개 | `AuthCallbackQuery` (`next`는 `/`로 시작하는 내부 경로만, 아니면 `/`) | 302 → `next` 또는 `/login?error=cancelled` | — | — | US-05 / AC-05-2·4 |
| API-16 | POST `/api/auth/logout` | 회원 | — | `{ ok: true }` | — | 멱등 | US-05 / AC-05-3 |
| API-17 | POST `/api/dev/login` | 공개 (개발 전용: `NODE_ENV !== 'production'` 이고 `DEV_TEST_LOGIN=true`일 때만, 아니면 404) | `DevLoginInput { role: 'member' \| 'member2' \| 'admin' }` | `{ ok: true }` (세션 쿠키 설정) | NOT_FOUND | 같은 테스트 계정 재사용 | 테스트용 (D-034) |
| API-20 | POST `/api/admin/orders/[orderId]/ship` | 관리자 | — | `{ status: 'shipped' }` | INVALID_STATE | 이미 shipped면 INVALID_STATE 대신 성공 | US-11 / AC-11-2·3 |
| API-21 | POST `/api/admin/cycles/[cycleId]/start-reading` | 관리자 | — | `{ status: 'reading' }` | INVALID_STATE | 이미 reading이면 성공 | US-16 / AC-16-3~5 |
| API-22 | PATCH `/api/admin/cycles/[cycleId]/content` | 관리자 | `CycleContentInput { productId?, replyLetter? (1~2000), teaser? (1~100) }` | `{ saved: true }` | OUT_OF_STOCK, INVALID_STATE, VALIDATION_FAILED | 덮어쓰기 | US-17·18 / AC-17-2·3·6 |
| API-23 | POST `/api/admin/cycles/[cycleId]/postcard` | 관리자 | `multipart/form-data` `file` (jpeg·png·webp, ≤ 5MB) | `{ postcardPath }` | VALIDATION_FAILED, INVALID_STATE | 같은 경로 덮어쓰기(`upsert: true`) | US-17 / AC-17-2·4 |
| API-24 | POST `/api/admin/cycles/[cycleId]/ship` | 관리자 | — | `{ code: string }` | MISSING_CONTENT, OUT_OF_STOCK, INVALID_STATE | 이미 shipped면 같은 코드 반환 | US-18 / AC-18-1~6 |
| API-25 | PATCH `/api/admin/products/[productId]/stock` | 관리자 | `StockInput { stockQuantity: int 0~9999 }` | `{ stockQuantity }` | VALIDATION_FAILED, NOT_FOUND | 덮어쓰기 | US-25 / AC-25-1~3 |
| API-26 | PUT `/api/admin/farewell-letters/[userId]` | 관리자 | `FarewellLetterInput { body (1~2000) }` | `{ saved: true }` | INVALID_STATE (활성 구독 없음) | upsert | US-23 / AC-23-1~3 |
| API-27 | GET `/api/admin/address-book` | 관리자 | — | `.xlsx` 파일 (`Content-Disposition: attachment`) | FORBIDDEN | 읽기 | US-22 / AC-22-1~3 |
| API-30 | GET `/api/cron/billing` | 서버 | — | `{ processed: number; succeeded: number; ended: number }` | FORBIDDEN | 결정적 `toss_order_id` (SEQ-05) | US-13 / AC-13-1~5 |

- 로그인 시작은 API가 아니다: 클라이언트에서 `supabase.auth.signInWithOAuth({ provider: 'custom:kakao', options: { redirectTo: `${SITE_URL}/api/auth/callback?next=<경로>` } })`.
- 관리자 화면 상품 검색은 API가 아니라 SCR-16의 URL 쿼리(`?cycle=<id>&q=<검색어>`)로 서버에서 읽는다.

## 4. 외부 I/O 어댑터
| 파일 | 함수 | 외부 호출 |
|---|---|---|
| `lib/payments/toss.ts` (`server-only`) | `confirmPayment({ paymentKey, orderId, amount })`, `cancelPayment({ paymentKey, reason })`, `issueBillingKey({ authKey, customerKey })`, `chargeBillingKey({ billingKey, customerKey, orderId, orderName, amount })` | `https://api.tosspayments.com/v1/...`, `Authorization: Basic base64(TOSS_SECRET_KEY + ':')`. 모두 `Promise<{ ok: true; ... } \| { ok: false; code; message }>` 반환, 예외를 던지지 않음 |
| `lib/payments/tossClient.ts` (`'use client'`) | `openPaymentWindow(order, method: PaymentMethodChoice)`, `openBillingAuth(customerKey, method: BillingMethodChoice)` — 카드는 통합결제창, 카카오페이·네이버페이는 `flowMode: 'DIRECT'` + `easyPay` | 토스 SDK v2 `loadTossPayments(NEXT_PUBLIC_TOSS_CLIENT_KEY)` |
| `lib/supabase/server.ts` (`server-only`) | `createSupabaseServerClient()` (쿠키 세션), `createSupabaseAnonClient()` (쿠키 없음, 캐시용), `createSupabaseServiceClient()` (service role) | Supabase |
| `lib/supabase/browser.ts` | `createSupabaseBrowserClient()` | Supabase (로그인 시작만) |
| `proxy.ts` (루트) | `proxy(request)` | `@supabase/ssr` 세션 갱신 (`getClaims()`), 권한 판단 안 함 |
- 시각: Route Handler가 `new Date()`를 한 번 만들어 도메인 함수에 인자로 넘긴다. 도메인 함수는 시각을 만들지 않는다.
- 난수: 언박싱 코드는 DB 함수(`admin_ship_cycle`)에서만 만든다. 앱 코드에서 코드용 난수를 만들지 않는다.

## 5. 도메인 함수 (`lib/domain`, 순수 함수, GATE-03 1순위)
| 파일 | 함수 | 규칙 근거 |
|---|---|---|
| `lib/domain/cart.ts` | `computeCartQuote(lines: CartLine[], products: Product[], rule: { shippingFee; freeShippingThreshold }): CartQuote` — 없는 상품 제외, 수량을 재고로 제한, 품절 줄은 금액 0, 담긴 책이 0권이거나 책 금액이 기준 이상이면 배송비 0 (D-039) | AC-08-2·4·5 |
| `lib/domain/cart.ts` | `buildOrderName(names: string[]): string` — "첫 책 외 n건" | 토스 orderName |
| `lib/domain/billing.ts` | `nextBillingDate(billingDay: number, fromDateKst: string /* YYYY-MM-DD */): string` — 다음 달의 `billingDay`, 없으면 말일 | D-003, D-021, AC-13-2 |
| `lib/domain/billing.ts` | `todayKst(now: Date): string` | 시간대 기준 |
| `lib/domain/payments.ts` | `orderTossId(orderId: string): string`, `cycleTossId(subscriptionId: string, cycleNo: number): string` | `03-db-schema.md` §3.4 |
| `lib/domain/window.ts` | `toWindowState(cycle: CycleStatus \| null): BookshopWindowState \| null` — `awaiting_letter`·`unboxed`→`waiting`, `letter_arrived`→`letter_arrived`, `reading`→`lamp_on`, `shipped`→`mailbox_lit` | REQ-021~024, D-010 |
| `lib/domain/redirect.ts` | `safeNextPath(next: string \| null): string` — `/`로 시작하고 `//`·`\`로 시작하지 않을 때만 통과 | API-15 오픈 리다이렉트 방지 |
| `lib/domain/limits.ts` | `LETTER_MAX = 2000`, `MEMO_MAX = 100`, `TEASER_MAX = 100`, `UNBOX_MAX_FAILURES = 5`, `UNBOX_LOCK_MINUTES = 10` | D-017·023·024, NFR-07 (zod 스키마와 DB check가 같은 값) |

## 6. 실행 흐름 (TRD Layer 3)

### SEQ-01 로그인
1. 회원: SCR-05 버튼 → 브라우저 `signInWithOAuth` → 제공자 동의 → Supabase → `/api/auth/callback?code&next`
2. API-15: `exchangeCodeForSession(code)` → 성공 302 `safeNextPath(next)` / 실패·`error` 쿼리 302 `/login?error=cancelled`
3. 첫 로그인이면 트리거 `handle_new_user`가 `profiles` 생성

### SEQ-02 단건 주문·결제 확정
1. SCR-09 [결제하기] → API-03 → RPC `create_pending_order` → `{ orderId, tossOrderId, amount, orderName }`
2. 브라우저 `openPaymentWindow(order, method)` (`successUrl = /api/payments/success`, `failUrl = /api/payments/fail`)
3. API-04: (a) `payments`를 `toss_order_id`로 조회, 본인 주문인지 확인 (b) 쿼리 `amount` ≠ `payments.amount` → `fail_order_payment` + 302 fail `AMOUNT_MISMATCH` (c) 이미 `confirmed`면 302 success (멱등) (d) `toss.confirmPayment` 실패 → `fail_order_payment` + 302 fail `PAYMENT_FAILED` (e) 성공 → service client로 RPC `confirm_order_payment` (f) RPC 실패(`OUT_OF_STOCK` 등) → **`toss.cancelPayment` (보상, RISK-02)** + `fail_order_payment` + 302 fail (g) 성공 → `revalidateTag('products','max')` → 302 success
4. SCR-10 success 화면이 브라우저 장바구니에서 주문한 책을 지운다(`useCart().remove`)

### SEQ-03 주문 취소·환불
1. API-06: 본인 주문 + `paid` 확인(아니면 `INVALID_STATE`, `refunded`면 성공 반환) → `toss.cancelPayment` 실패 → `REFUND_FAILED`(상태 그대로) → 성공 → RPC `refund_order` → `revalidateTag('products','max')`

### SEQ-04 구독 신청 (첫 결제)
1. SCR-12 [우체통에 편지 넣기] → API-07(draft 저장, 활성 구독·배송지 확인) → `openBillingAuth(customerKey, method)` (`successUrl = /api/billing/success`, `failUrl = /api/billing/fail`)
2. API-08: (a) `customerKey === user.id` 확인 (b) 활성 구독 있으면 302 `?error=ALREADY_SUBSCRIBED` (c) `toss.issueBillingKey` 실패 → 302 error (d) `subscriptionId = gen uuid` (서버), `toss.chargeBillingKey`(`cycleTossId(subscriptionId, 1)`, 금액 = `app_constants` 구독료) 실패 → 302 error (구독 미생성, draft 유지 → AC-12-7) (e) RPC `start_subscription`(같은 `subscriptionId`) 실패 → `toss.cancelPayment` (보상) + 302 error (f) 성공 → 302 `/subscribe/letter/done` (여기서 봉투 전환 재생, AC-12-3)
- `start_subscription`은 서버가 만든 `p_subscription_id`를 받는다(토스 orderId와 DB id를 맞추기 위해). `billing_day` = 오늘(KST)의 일, `next_billing_date = nextBillingDate(day, today)`.

### SEQ-05 매달 자동결제 (Cron)
1. Vercel Cron 매일 00:10 UTC(= 09:10 KST) → API-30, `CRON_SECRET` 확인
2. service client로 `status='active' and next_billing_date <= todayKst` 구독 목록 (밀린 날짜 포함, RISK-13)
3. 구독마다 순서대로: 다음 `cycle_no` 계산 → `toss.chargeBillingKey(cycleTossId(id, n))` → 성공: RPC `open_cycle`(→ `next_billing_date = nextBillingDate(billing_day, 이번 결제일)`) / RPC 실패: `toss.cancelPayment` + 오류 로그 / 결제 실패: RPC `end_subscription_payment_failed`
4. 같은 날 두 번 실행돼도 `toss_order_id`가 같아 토스가 중복 거절, DB unique가 두 번째 회차를 막는다(AC-13-5)

### SEQ-06 편지 제출 (다음 회차)
- API-10 → RPC `submit_letter` (D-014 규칙). 응답 후 화면이 봉투 전환 재생(결제 없음)

### SEQ-07 편지 열람·읽기 시작
- SCR-16에서 회차 선택 = 페이지 이동(`?cycle=`)이며 상태를 바꾸지 않는다(AC-16-2). [읽기 시작] → API-21 → RPC `admin_start_reading`

### SEQ-08 매칭·발송·코드 발급
1. 책 선택·답장·힌트 → API-22(부분 저장), 엽서 → API-23(Storage 업로드 → `admin_save_cycle_content(p_postcard_path)`)
2. [발송] → API-24 → RPC `admin_ship_cycle` (검사 → 재고 차감 → 코드 생성 → `shipped`, 한 트랜잭션) → 응답 코드 크게 표시 → `revalidateTag('products','max')`

### SEQ-09 언박싱 코드 입력
- API-12 → RPC `redeem_unboxing_code` → `ok`면 `getMyShelf`와 같은 변환으로 `OpenedBook` 반환 / 실패 `CODE_MISMATCH`(`remainingAttempts`) / 잠금 `CODE_LOCKED`(`lockedUntil`)

### SEQ-10 구독 해지
- SCR-14 [구독을 마무리합니다] → API-14 → RPC `cancel_subscription(note)` → 마무리 화면. 확인 팝업 없음(INV-12)

## 7. 상태 머신 (표에 없는 전이는 거부)
| 대상 | 현재 | 이벤트 | 다음 | 실행 주체 | 함수 | 부수 효과 |
|---|---|---|---|---|---|---|
| 주문 | — | 주문 준비 | pending_payment | 회원 | `create_pending_order` | payments ready |
| 주문 | pending_payment | 승인 성공 | paid | 서버 | `confirm_order_payment` | 재고 차감, payments confirmed |
| 주문 | pending_payment | 인증 실패·금액 불일치·재고 부족 | cancelled | 서버 | `fail_order_payment` | payments failed |
| 주문 | paid | 회원 취소 + 환불 성공 | refunded | 회원→서버 | `refund_order` | 재고 복구, payments refunded |
| 주문 | paid | 발송 처리 | shipped | 관리자 | `admin_ship_order` | — |
| 구독 | — | 첫 결제 성공 | active | 서버 | `start_subscription` | 회차 1, 빌링키 저장 |
| 구독 | active | 해지 | cancelled | 회원 | `cancel_subscription` | farewell_notes, 다음 결제 없음 |
| 구독 | active | 자동결제 실패 | ended | 서버 | `end_subscription_payment_failed` | — |
| 회차 | — | 매달 결제 성공 (보관 편지 있음/없음) | letter_arrived / awaiting_letter | 서버 | `open_cycle` | 다음 결제일 갱신 |
| 회차 | awaiting_letter | 편지 제출 | letter_arrived | 회원 | `submit_letter` | — |
| 회차 | letter_arrived, awaiting_letter | 읽기 시작 | reading | 관리자 | `admin_start_reading` | cycle_contents 생성 |
| 회차 | reading | 발송 | shipped | 관리자 | `admin_ship_cycle` | 재고 차감, 코드 발급 |
| 회차 | shipped | 맞는 코드 | unboxed | 회원 | `redeem_unboxing_code` | 코드 redeemed |
| 결제 | ready | 승인 | confirmed | 서버 | 위 함수들 | — |
| 결제 | ready | 실패 | failed | 서버 | `fail_order_payment`, `end_subscription_payment_failed` | — |
| 결제 | confirmed | 환불 | refunded | 서버 | `refund_order` | — |

## 네이버 로그인 (D-042, ADR-003 B안)
| API | 메서드·경로 | 권한 | 동작 |
|---|---|---|---|
| API-15a | `GET /api/auth/naver/start?next=<경로>` | 누구나 | state 생성 → httpOnly 쿠키 `naver_oauth`(`{state,next}`, path `/api/auth/naver`, 10분) → 네이버 인가 화면으로 302 |
| API-15b | `GET /api/auth/naver/callback?code&state` | 누구나 | 쿠키 state 비교(불일치·오류 → `/login?error=cancelled`) → 토큰·프로필 → 내부 이메일 회원 magiclink → `verifyOtp`로 세션 쿠키 → `safeNextPath(next)`로 302 |
- 순수 규칙: `lib/domain/naverAuth.ts` (`naverAuthorizeUrl`, `naverShadowEmail`, `parseNaverProfile`, `statesMatch`). 서버 처리: `lib/api/naverLogin.ts`.
- 환경변수: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`(비밀). 네이버 Callback URL = `${NEXT_PUBLIC_SITE_URL}/api/auth/naver/callback`.
