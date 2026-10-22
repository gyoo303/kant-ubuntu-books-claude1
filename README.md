# 우분투북스 — 느린 온라인 책방

## 1. 소개
대전 어은동 독립서점 **우분투북스**가 자연·식문화·생태·로컬 4개 테마의 책을 단건 판매하고, 손편지를 받아 책방지기가 골라 보내는 **월 1권 블라인드 정기구독**을 운영하는 온라인 책방입니다.

- 기획·설계 문서: `docs/01-pm/`(기획), `docs/02-arch/`(설계), 파이프라인 규칙 `docs/PIPELINE.md`
- 모든 책·문구·금액은 **예시**입니다. 결제는 **토스페이먼츠 테스트 모드**입니다.

## 2. 화면 캡처
> `docs/06-qa/screenshots/`에 QA 단계에서 저장합니다: 메인, 상품 목록, 상품 상세, 없는 상품 ID, 서점 창가(촛불), 언박싱.

## 3. 컴포넌트 구조
```
app/
├─ layout.tsx ─ Header(로그인 영역은 Suspense) · <main> · Footer
├─ page.tsx                     메인 ─ ProductCard × 4, 테마 입구, 구독 안내
├─ about/page.tsx               책방 소개
├─ products/page.tsx            상품 목록 ─ ThemeSelector, ProductCard(.map)
├─ products/[id]/page.tsx       상품 상세 ─ 책방지기 노트, AddToCartButton
├─ products/[id]/not-found.tsx  "상품을 찾을 수 없습니다"
├─ login/page.tsx               LoginButtons(카카오·네이버), DevLoginPanel(개발 전용)
├─ cart/  checkout/             CartView, CheckoutForm(ShippingAddressFields, 토스 결제창)
├─ subscribe/ , subscribe/letter/   LetterPaper, EnvelopePost(봉투 전환)
├─ mypage/                      BookshopWindow(서점 창가), 주문 내역, 배송지
├─ mypage/shelf/                BlindBookCard(코드 입력), OpenedBookCard(답장·엽서·한 줄 메모)
├─ mypage/farewell/             마지막 인사 편지 + 작별 글 + 해지
├─ admin/                       서재 작업(위→아래 한 줄), 주문, 재고, 인사 편지, 작별 편지함, 주소록 엑셀
└─ api/**/route.ts              모든 쓰기 API (docs/02-arch/04-interfaces-api.md §3)
components/  Header · Footer · ProductCard · ThemeSelector · BookshopWindow · LetterPaper · BlindBookCard · …
lib/         domain(순수 규칙) · data(Supabase 읽기) · api(검증·권한·응답) · payments(토스) · client(브라우저)
types/       product.ts(KANT 상품 규격) · domain.ts · api.ts · database.ts
data/        products.ts(Mock 8권 = seed 원천 + 테스트 픽스처)
supabase/    migrations/*.sql · seed.sql(생성물)
```

## 4. 기술 스택
Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui(base-ui) · Supabase(Postgres·Auth·Storage) · 토스페이먼츠 SDK v2 · zod · exceljs

## 5. 로컬 실행
```bash
npm install
cp .env.example .env.local   # 6·7번을 보고 값을 채운다
npm run dev                  # http://localhost:3000
```
- `npm run build`는 상품 목록을 빌드 때 미리 그리므로 **Supabase 환경변수가 있어야 성공**합니다.

## 6. 환경변수 (`.env.example`)
| 이름 | 공개 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 공개 | Supabase 프로젝트 주소 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 공개 | publishable(anon) 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 비밀 | 서버 전용 (결제 확정·Cron·테스트 로그인) |
| `SUPABASE_DB_URL` | 비밀 | 마이그레이션 적용용 DB 연결 문자열 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 공개 | 토스 API 개별 연동 **테스트** 클라이언트 키 |
| `TOSS_SECRET_KEY` | 비밀 | 토스 **테스트** 시크릿 키 |
| `CRON_SECRET` | 비밀 | 매달 자동결제 Cron 요청 확인 |
| `NEXT_PUBLIC_SITE_URL` | 공개 | 예: `http://localhost:3000` |
| `DEV_TEST_LOGIN` | — | `true`면 개발 환경에서 테스트 로그인 버튼 표시 (production에서는 항상 꺼짐) |
| `DEV_TEST_LOGIN_SECRET` | 비밀 | 테스트 계정 비밀번호를 만드는 임의 문자열 |
| `NAVER_CLIENT_ID` | 서버 | 네이버 로그인 Client ID (D-042) |
| `NAVER_CLIENT_SECRET` | 비밀 | 네이버 로그인 Client Secret |
- 값이 빠지면 화면·로그에 "환경변수 ○○가 비어 있습니다"가 나옵니다.

## 7. Supabase 설정
1. Supabase에서 프로젝트를 만들고 URL·키를 `.env.local`에 넣습니다.
2. 마이그레이션과 상품 seed 적용:
   ```bash
   npm run db:seed:gen
   npx supabase db push --db-url "$SUPABASE_DB_URL" --include-seed
   ```
3. 타입 재생성: `npx supabase gen types typescript --db-url "$SUPABASE_DB_URL" --schema public > types/database.ts`
4. 관리자(책방지기) 지정: 로그인한 뒤 SQL 편집기에서 `update public.profiles set is_admin = true where id = '<사용자 uuid>';` (개발 환경 테스트 로그인의 "테스트 책방지기"는 자동 지정)
5. 로그인 제공자 (Authentication → Providers)
   - 카카오: 내장 provider는 쓰지 않음(이메일을 항상 요청해 비즈 앱이 아니면 KOE205). Custom OAuth provider `custom:kakao`(Manual configuration, Issuer `https://kauth.kakao.com`, authorization `https://kauth.kakao.com/oauth/authorize`, token `https://kauth.kakao.com/oauth/token`, userinfo `https://kapi.kakao.com/v2/user/me`, JWKS 비움, Scopes `profile_nickname,profile_image`). 카카오 개발자 앱의 Redirect URI에 Supabase 콜백 주소(`https://<프로젝트>.supabase.co/auth/v1/callback`) 등록, 클라이언트 시크릿은 [앱] → [플랫폼 키] → [REST API 키]에서 발급, "Allow users without an email" 켜기
   - 네이버: Supabase provider를 쓰지 않고 서버가 직접 처리한다(D-042). 네이버 개발자 센터의 Callback URL에 `http://localhost:3000/api/auth/naver/callback`(배포 시 그 주소도) 등록, `.env.local`에 `NAVER_CLIENT_ID`·`NAVER_CLIENT_SECRET`. Supabase Email provider와 회원가입 허용이 켜져 있어야 한다(내부용 이메일 회원 + magiclink 토큰으로 세션 발급, 메일은 보내지 않음). 앱이 "개발 중"이면 멤버 관리에 등록한 아이디만 로그인 가능
   - URL Configuration: Site URL `http://localhost:3000`, Redirect URLs에 `http://localhost:3000/**` 추가 (콜백 주소에 `?next=` 값이 붙으므로 경로 하나만 넣으면 로그인 후 엉뚱한 곳으로 갈 수 있음)

## 8. 결제 테스트 방법
- 토스페이먼츠 개발자센터의 **API 개별 연동 키(테스트)**를 넣습니다(결제위젯 키가 아님).
- 단건: 장바구니 → 주문서 → 결제 수단(카드·카카오페이·네이버페이) 선택 → 테스트 결제 → `/checkout/success` (책 금액 30,000원 이상 무료배송)
- 구독: 손편지 띄우기 → 자동결제 수단(카드·네이버페이) 등록창(테스트) → 첫 달 결제 → 봉투 전환
- 매달 자동결제 수동 실행: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/billing`

## 9. 품질 게이트
```bash
npm run typecheck      # GATE-01
npm run lint           # GATE-02
npm test               # GATE-03 (0개 실행이면 실패)
npm run build          # GATE-04
npm run check:forbidden  # GATE-05·06
npm run check:rls      # GATE-07 (Supabase 필요)
```

## 10. 시연 흐름
`docs/01-pm/07-screens.md` §5: 메인 → 목록·테마 → 상세 → 없는 ID → 로그인 → 장바구니·결제 → 손편지 → (책방지기) 읽기 시작·촛불 → 발송·코드 → 언박싱·한 줄 메모 → 구독 마무리
