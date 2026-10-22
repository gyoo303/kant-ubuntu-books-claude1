# 05. 디렉토리 구조 & 코딩 컨벤션 (AR-CONV)

- 근거: ADR-006(루트 계층형), ADR-002, KANT 고정 경로, `01-drivers.md` 저장소 현황

## 1. 디렉토리 구조 (확정)
```
app/
  layout.tsx                    # <Header/> {children} <Footer/>  (KANT-C7)
  page.tsx                      # SCR-01 메인
  not-found.tsx                 # 전역 404
  about/page.tsx                # SCR-02
  products/page.tsx             # SCR-03 (KANT-R5)
  products/[id]/page.tsx        # SCR-04 (KANT-R6)
  products/[id]/not-found.tsx   # "상품을 찾을 수 없습니다" (KANT-C14)
  login/page.tsx                # SCR-05
  cart/page.tsx                 # SCR-08
  checkout/page.tsx             # SCR-09
  checkout/success/page.tsx     # SCR-10
  checkout/fail/page.tsx        # SCR-10
  subscribe/page.tsx            # SCR-11
  subscribe/letter/page.tsx     # SCR-12
  subscribe/letter/done/page.tsx
  mypage/page.tsx               # SCR-06
  mypage/address/page.tsx       # SCR-07
  mypage/shelf/page.tsx         # SCR-13
  mypage/farewell/page.tsx      # SCR-14
  admin/layout.tsx              # 관리자 확인 (getCurrentUser().isAdmin 아니면 redirect('/'))
  admin/page.tsx                # SCR-15
  admin/workbench/page.tsx      # SCR-16
  admin/orders/page.tsx         # SCR-17
  admin/farewell-letters/page.tsx  # SCR-18
  admin/farewell-inbox/page.tsx    # SCR-19
  admin/stock/page.tsx          # SCR-20
  api/**/route.ts               # 쓰기 API 전부 (04-interfaces-api.md §3)
components/
  Header.tsx  Footer.tsx  ProductCard.tsx     # KANT 고정
  ThemeSelector.tsx  BookshopWindow.tsx  LetterPaper.tsx  BlindBookCard.tsx
  ShippingAddressFields.tsx  EmptyState.tsx
  ui/                           # shadcn 부품 (기존, 수정하지 않고 사용)
types/
  product.ts                    # KANT 고정
  domain.ts  api.ts
  database.ts                   # supabase gen types 생성물 (직접 수정 금지)
data/
  products.ts                   # KANT Mock = seed 원천 + 테스트 픽스처 (ADR-001)
lib/
  domain/                       # 순수 함수. I/O 0
  data/                         # Supabase 읽기 (화면용). Supabase 클라이언트 사용은 lib/data, lib/api, app/api만
  api/                          # Route Handler 공용: http.ts, auth.ts, schemas.ts, errors.ts
  supabase/                     # server.ts, browser.ts (클라이언트 생성만)
  payments/                     # toss.ts (server-only), tossClient.ts ('use client')
  client/                       # 브라우저 전용: apiFetch.ts, cart.ts
  content/                      # 임시 문구 상수: defaultFarewellLetter.ts, policies.ts ("예시" 표시)
  utils.ts                      # cn() 하나만 (clsx + tailwind-merge)
  env.ts                        # 환경변수 읽기 (빠지면 이름을 알려 주고 실패, AC-26-4)
supabase/
  migrations/                   # 03-db-schema.md §3 파일명 그대로
  seed.sql                      # 생성물 (scripts/gen-seed.ts)
scripts/
  check-handoff.mjs  run-stage.sh   # 파이프라인 (기존)
  gen-seed.ts                   # data/products.ts → supabase/seed.sql
  check-forbidden.mjs           # GATE-06
  run-tests.mjs                 # GATE-03
  check-rls.mjs                 # GATE-07
proxy.ts                        # 세션 갱신
vercel.json                     # Cron: /api/cron/billing "10 0 * * *"
.env.example
```
- `src/`, `domains/`, `shared/`는 쓰지 않는다. 기존 스타터 파일은 TKT-ARCH-00에서 정리한다(ADR-006).
- 테스트 파일은 대상 옆에 `*.test.ts`로 둔다(`lib/domain/cart.test.ts`).

## 2. 의존 방향 (어기면 GATE-06 실패)
```
app/(page)   → components → lib/domain, types
app/(page)   → lib/data → lib/supabase
app/api      → lib/api, lib/data, lib/domain, lib/payments(toss.ts), lib/supabase
components   → lib/client, lib/payments(tossClient.ts), lib/domain, types
lib/domain   → types 만 (다른 lib, next, react, supabase import 금지)
lib/data     → lib/supabase, lib/domain, types
```
- `components/`는 `lib/data`, `lib/supabase/server`, `lib/payments/toss.ts`를 import하지 않는다(서버 데이터는 page가 props로 넘긴다).
- 순환 참조 금지.

## 3. 코딩 컨벤션 (CONV)
| ID | 규칙 |
|---|---|
| CONV-01 | 파일명: 컴포넌트 `PascalCase.tsx`, 그 밖 `camelCase.ts`, 라우트 파일은 Next 규칙(`page.tsx`, `route.ts`). DB 이름은 snake_case, TS는 camelCase — 변환은 `lib/data`에서만 |
| CONV-02 | Server Component가 기본. `'use client'`는 상호작용이 필요한 말단 컴포넌트(폼, 장바구니 버튼, 코드 입력, 애니메이션)에만 |
| CONV-03 | 세션(`cookies()`)을 읽는 컴포넌트는 반드시 `<Suspense>` 안. 레이아웃 최상단에서 `await getCurrentUser()` 금지(RISK-12). Header의 로그인 영역은 `<Suspense fallback>`으로 감싼 별도 서버 컴포넌트 |
| CONV-04 | 공개 상품 읽기는 `'use cache'` + `cacheTag('products')` + anon 클라이언트. 쿠키를 읽는 함수에 `'use cache'` 금지 |
| CONV-05 | 페이지 이동은 `next/link`의 `<Link>`만. 내부 경로 `<a href>` 금지, 프로그램 이동은 `useRouter().push` (KANT-C13) |
| CONV-06 | 이미지는 `next/image`, 부모에 고정 비율(`aspect-[3/4]` 등) + `fill` + `object-cover` (KANT-C10). 원격 도메인은 `next.config.ts` `images.remotePatterns`에 `images.unsplash.com`, Supabase Storage 호스트만 |
| CONV-07 | 목록은 `grid` + 균일 `gap`: 360px `grid-cols-2`, `md:grid-cols-3`, `lg:grid-cols-4` (KANT-C9, NFR-02) |
| CONV-08 | 목록 `.map()`의 `key`는 엔티티 `id`. 인덱스 금지 |
| CONV-09 | 모든 쓰기 API는 `parseJson` → `requireUser`/`requireAdmin` → 데이터 함수·RPC → `ok`/`fail` 순서. 응답은 `ApiResponse<T>`만 |
| CONV-10 | 서버 전용 모듈(`lib/supabase/server.ts`, `lib/payments/toss.ts`, `lib/data/**`, `lib/api/**`) 첫 줄 `import 'server-only'` |
| CONV-11 | 애니메이션은 CSS(Tailwind `transition`/`@keyframes`)로 하고 `motion-reduce:` 변형으로 끈다(NFR-10). 애니메이션 라이브러리 추가 금지 |
| CONV-12 | 화면 문구는 한국어 일상어. 임시 문구는 `lib/content/*`에 두고 화면에 "예시" 배지(NFR-17) |
| CONV-13 | 숫자 금액 표시는 `lib/domain/format.ts`의 `formatPrice(won)` 하나 (기존 `shared/utils/formatPrice.ts`를 옮김) |
| CONV-14 | 커밋 하나에 기능 변경과 구조 리팩토링을 섞지 않는다 |

## 4. 금지 패턴 (구현 에이전트에 그대로 전달, GATE-06이 검사)
1. `any`, `as unknown as`, `@ts-ignore`, `@ts-expect-error` (생성 파일 `types/database.ts` 제외)
2. 빈 `catch {}`, 에러를 삼키는 `catch (e) { return null }` (로그 + `fail()`로 바꿀 것)
3. 사용자 확인 없는 패키지 추가·코어 버전 변경 (승인된 추가: `zod`, `exceljs`, `@tosspayments/tosspayments-sdk`, `server-only`. 제거: `cn`)
4. `SUPABASE_SERVICE_ROLE_KEY`, `TOSS_SECRET_KEY`, `CRON_SECRET`을 `NEXT_PUBLIC_`로 만들거나 `'use client'` 파일·`components/`에서 참조
5. 클라이언트가 보낸 금액·결제 결과를 서버 대조 없이 사용
6. 주석 처리된 옛 코드, 쓰이지 않는 파일
7. 기능 변경과 구조 리팩토링을 한 커밋에
8. `lib/domain/**`에서 `new Date()`, `Date.now()`, `Math.random()`, `fetch(`, `supabase` import
9. `createSupabaseServiceClient()`를 `lib/api/auth.ts`·`lib/api/devLogin.ts`·`lib/api/naverLogin.ts`(D-042)·`app/api/cron/**`·`app/api/payments/**`·`app/api/billing/**`·`app/api/orders/[orderId]/cancel/**` 밖에서 호출
10. Server Actions(`'use server'`) — ADR-002

## 5. 설정 파일 변경 (TKT-ARCH-00·TKT-BE-00에서 반영)
| 파일 | 변경 |
|---|---|
| `package.json` scripts | `lint: "eslint ."`, `test: "node scripts/run-tests.mjs"`(GATE-03, 0개면 실패), `typecheck: "tsc --noEmit"`, `db:seed:gen: "tsx scripts/gen-seed.ts"`, `check:forbidden: "node scripts/check-forbidden.mjs"`, `check:rls: "node --env-file=.env.local scripts/check-rls.mjs"`, `prebuild`는 제거하고 GATE 명령으로 대체 |
| `package.json` deps | 추가 `zod`, `exceljs`, `@tosspayments/tosspayments-sdk`, `server-only`(ADR-009) / 제거 `cn` |
| `components.json` aliases | `components: "@/components"`, `utils: "@/lib/utils"`, `ui: "@/components/ui"`, `lib: "@/lib"`, `hooks: "@/lib/client"` |
| `next.config.ts` | `images.remotePatterns` 추가 (CONV-06). 기존 `cacheComponents`, `partialPrefetching`, turbopack 규칙 유지 |
| `.gitignore` | 기존 `.env*` 아래에 `!.env.example` 추가, `supabase/.temp/`, `supabase/.branches/` 추가 (KANT-C16) |
| `app/layout.tsx` | `lang="ko"`, metadata 제목 "우분투북스" |
