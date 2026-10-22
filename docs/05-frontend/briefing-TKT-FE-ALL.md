---
stage: FE
tickets: [TKT-FE-01, TKT-FE-02, TKT-FE-03, TKT-FE-04, TKT-FE-05, TKT-FE-06, TKT-FE-07, TKT-FE-08, TKT-FE-09, TKT-FE-10]
status: partial
inputs_read: [AR-MAP, AR-HAND, PM-SCR, PM-AC, AR-API, AR-CONV, AR-GATE, BE-BRIEF]
next_readers: [QA, UX]
---
## [기능] 우분투북스 전체 화면 (SCR-01 ~ SCR-20) + README
결론: 화면 20개 + 공통 컴포넌트 구현 · **실제 API 연결**(mock 없음) · DB·토스 키가 없어 화면 동작은 **확인하지 못함**

### 사람이 결정할 것
- **창가·촛불 색**: 디자인 토큰이 무채색(shadcn 기본)뿐이라 촛불·우체통 불빛을 밝기·아이콘·문구로만 구분했다. "따뜻한 불빛"을 색으로 보이려면 토큰 추가가 필요하다(예: `--lamp`, `--lamp-foreground`). UX 결정 후 `app/globals.css`에 토큰 PR을 따로 낸다.
- 폰트·색 등 시각 디자인 전반: UX 산출물 미배포(UX-DESIGN, UX-DEC, UX-CTX-FE). 현재는 shadcn 중립 테마.

### 이해 가이드
- 데이터 흐름: 화면(Server Component)이 `lib/data/*`로 읽는다 → 세션을 읽는 부분은 모두 `<Suspense>` 안 → 쓰기는 말단 클라이언트 컴포넌트가 `lib/client/apiFetch`로 `app/api/**`를 호출 → 성공하면 `router.refresh()`로 서버 화면을 다시 그린다 → 에러는 `ApiResponse.error.message`를 그 자리에 표시.
- 장바구니: `lib/client/cart.ts`(localStorage) → 가격·재고는 `/api/cart/quote`가 계산.
- 먼저 읽을 파일 3곳:
  - `app/layout.tsx` — Header·Footer 배치, 로그인 영역 Suspense
  - `app/admin/workbench/page.tsx` — 서재 작업 화면 한 줄 흐름 (①편지 ②매칭·답장 ③힌트·발송)
  - `components/BlindBookCard.tsx` — 블라인드 북·코드 입력 (책 정보를 받지 않는 구조)

### 수용 기준
| 번호 | 충족 | 근거 |
|---|---|---|
| AC-01-1~3, AC-02-1·2 | 구현 | `app/page.tsx`, `app/about/page.tsx` (추천 영역만 실패 안내) — 화면 확인 못함 |
| AC-03-1~5, AC-04-1~4 | 구현 | `app/products/page.tsx`(`.map`, 0권·잘못된 테마 안내), `app/products/[id]/page.tsx`(노트 최상단·접힌 소개·품절 비활성), `not-found.tsx` |
| AC-05-1~4 | 구현 | `app/login/page.tsx`(두 버튼만, 취소 안내) |
| AC-06-1~4 | 구현 | `ShippingAddressFields`(동의·칸별 오류) |
| AC-07-1·2 | 구현 | `app/admin/layout.tsx` 가드 |
| AC-08-1~5 | 구현 | `AddToCartButton`, `app/cart/CartView.tsx` (+ BE 단위 테스트 AC-08-2·4·5) |
| AC-09-1~8 | 구현 | `app/checkout/*`, 배송지 없으면 결제 비활성 |
| AC-10-1~6, AC-11-1~3 | 구현 | `app/mypage/page.tsx`(상태 글자, 창가 그림 없음), `CancelOrderButton`, `app/admin/orders/*` |
| AC-12-1~7, AC-14-1~4 | 구현 | `app/subscribe/letter/*`, `EnvelopePost`(0.1초 시작·2.4초 완료·움직임 줄이기 즉시) |
| AC-15-1~5 | 구현 | `BookshopWindow` + `toWindowState` 단위 테스트 |
| AC-16~18 | 구현 | `app/admin/workbench/*` (열람은 상태 안 바꿈, [읽기 시작], 품절 선택 불가, 발송 후 코드 크게) |
| AC-19-1~9 | 구현 | `BlindBookCard`(힌트·실루엣만), `OpenedBookCard`(공개 전환) |
| AC-20-1~6 | 구현 | `OpenedBookCard` 메모(100자, 고치기·지우기, 별점·공유 없음) |
| AC-21-1~6 | 구현 | `app/mypage/farewell/*` (인사 편지 먼저, 빈 글 허용, 버튼 1번) |
| AC-22~25 | 구현 | `app/admin/page.tsx`(주소록), `farewell-letters`, `farewell-inbox`, `stock` |
| AC-26-1·2·4 | 구현 | `README.md` 목차 확정본 |
- 모든 AC의 실제 화면 확인은 **확인하지 못함** (Supabase·토스 키 없음).

### 선택과 이유
- 세션 읽기 위치: Cache Components 규칙상 `cookies()`는 `<Suspense>` 안에서만 → 페이지는 동기 껍데기 + 비동기 자식 구조 (CONV-03).
- 검색어·선택 회차·테마는 URL(`?theme=`, `?cycle=&q=`)에 둔다.
- 상태: 쓰는 곳 가까이(useState). 전역 상태는 장바구니(localStorage + useSyncExternalStore)만.
- 늦게 온 견적 응답은 `AbortController`로 이전 요청을 취소한다.

### 알려진 위험
| 위험 | 대응 | 남은 것 |
|---|---|---|
| 블라인드 책 정보 노출 (INV-01) | 회원 화면은 `BlindBook` 타입(힌트만)만 받음, 책 정보는 언박싱 API 응답에서만 | 실제 HTML 소스 검사(NFR-06)는 QA |
| `npm run build`가 Supabase 없이 실패 | README에 명시 | 키 설정 후 재실행 |
| 엽서 이미지 서명 URL | `unoptimized`로 표시(서명 URL은 최적화 캐시에 넣지 않음) | — |

### 검증 결과
- `npm run typecheck`: 통과 / `npm run lint`: 통과(경고 0) / `npm test`: 31개 통과 / `npm run check:forbidden`: 129개 파일 위반 0
- `npm run build`: 컴파일·타입 통과, **prerender 단계에서 실패** — `NEXT_PUBLIC_SUPABASE_URL` 없음 (예상된 동작)
- 스크린샷: **확인하지 못함** (DB 없이는 화면이 데이터 단계에서 실패)
- audit: 새 의존성 없음 (FE 단계)

### 명세와 다르게 한 것
- 결제 수단은 화면에서 고른다(`components/PaymentMethodPicker.tsx`, D-040): 주문서는 카드·카카오페이·네이버페이, 구독 신청은 카드·네이버페이. 토스 호출은 모두 `method: 'CARD'`이고 간편결제는 `flowMode: 'DIRECT'` + `easyPay`.
- 배송비: 책 금액 30,000원 이상이면 "무료 (30,000원 이상)", 미만이면 "○○원 더 담으면 무료배송"을 장바구니·주문서 금액 표에 보여준다(D-039, 금액은 API-04 견적 값).
- 구독 신청 실패 후 편지 복원은 sessionStorage 초안으로 한다(AC-12-7).
- 주소록 다운로드는 `<a download>`(파일 받기는 페이지 이동이 아니라 CONV-05 예외로 처리).
- 명세에 없던 안내 문구: 로딩 문구("…하는 중"), 다음 결제일 표시, 마이페이지 해지 후 안내.

### 기록 필요
- 사용자가 개발 전용 테스트 로그인을 요청함(D-034) → `DevLoginPanel`.

### 변경 범위
- 새 화면: `app/**/page.tsx` 20개 화면 + 하위 클라이언트 컴포넌트
- 공통: `components/*`(Header, Footer, ProductCard, ThemeSelector, BookshopWindow, LetterPaper, EnvelopePost, BlindBookCard, OpenedBookCard, ShippingAddressFields, EmptyState, ExampleBadge, CartLink, HeaderUser, LogoutButton, LoginButtons, DevLoginPanel, AddToCartButton)
- `lib/client/{apiFetch,cart}.ts`, `lib/payments/tossClient.ts`, `lib/content/policies.ts`, `README.md`
- 공통 파일 수정: `app/layout.tsx`(Header·Footer 배치), `package.json`의 `typecheck`에 `next typegen` 추가(라우트 타입 생성)

### 확인하지 못한 것
- 모든 화면의 실제 렌더·동작, 375/768/1280px 확인, 스크린샷, Lighthouse — Supabase·토스 키 필요
- UX-DESIGN, UX-DEC, UX-CTX-FE 미배포
