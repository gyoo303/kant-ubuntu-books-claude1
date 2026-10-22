---
stage: QA
tickets: [TKT-QA-01]
status: done
inputs_read: [AR-MAP, AR-HAND, AR-GATE, PM-AC, UX-CTX-QA, UX-PLAN-QA, UX-PERSONA, UX-PLAN-FE, UX-DESIGN, UX-DEC, FE-BRIEF]
next_readers: [UX, 사람]
---

# QA 브리핑 – TKT-QA-01 M1 쇼핑 기반 (`claude/serene-mayer-ma4ulh` = `uiux-agent-full-pipe7` 5613bf3)

판정: ❌ 반려 (브랜치 공통: `origin/main`과 충돌 1건, C1). 충돌을 풀면 M1 범위는 ⚠️ 조건부(C3 타입 검사 명령, NFR-01 재측정)

## 요약
- M1 수용기준(AC-01~04, NFR-02·03·05·14)은 자동 테스트로 모두 통과했다. KANT R2~R9 증빙도 저장소에 있다.
- 머지를 막는 것은 `requirements/ubuntubooks-user-requirements-raw.md`의 add/add 충돌 1건이다. 내용 차이는 서식뿐이다.
- 이 브리핑은 TKT-QA-M2~M5가 함께 쓰는 **공통 점검**(게이트·DB 테스트·충돌·의존성·e2e 환경)을 담는다.

## 검증 환경 (공통)
| 항목 | 내용 |
|---|---|
| 대상 | `HEAD` 5613bf3, 비교 기준 `origin/main` (5c46b81), 2026-10-22 fetch |
| DB | Supabase 이미지는 레지스트리 제한(Docker Hub 429, ghcr·ECR 다운로드 403)으로 받을 수 없음 → **환경 문제**. 대신 PostgreSQL 16 + 최소 Supabase 스텁(`auth.users`·`auth.uid()`·`storage` 테이블, 역할 anon/authenticated/service_role) + pgTAP으로 `supabase/migrations/*` 6개와 `seed.sql` 적용 |
| API | PostgREST 12.2.3(공식 바이너리) + QA 작업 폴더의 가짜 Auth·Storage 게이트웨이(비밀번호 로그인·JWT 발급만). 저장소에는 넣지 않았다 |
| 앱 | `npm run build` → `next start` (`.env.local`에 로컬 키, 토스 키는 자리표시자) |
| 한계 | 실제 GoTrue·카카오/네이버 OAuth·Storage·토스 결제는 확인하지 못함. 외부 표지 이미지(picsum.photos)는 이 환경에서 열리지 않아 모든 표지가 대체 표지로 보임 |

## 수용기준 검증 (M1)
| 수용기준 | 테스트 | 결과 |
|---|---|---|
| AC-01-1 | `e2e/m1-shop.spec.ts` "AC-01-1" | 통과 |
| AC-01-2, NFR-14 | 같은 파일 "AC-01-2·NFR-14" (문서 요청 0건) | 통과 |
| AC-01-3 | 같은 파일 "AC-01-3" | 통과 |
| AC-01-4 | — (조회 실패를 만들 수 없음) | 미검증 |
| AC-02-1 | "AC-02-1" | 통과 |
| AC-02-2 | `e2e/scenarios/p1-visitor.spec.ts` S1-2 | 통과 |
| AC-02-3 | "AC-02-3·AC-03-5" | 통과 |
| AC-02-4 | — (seed에 빈 테마 없음) | 미검증 |
| AC-02-5 | "AC-02-5" | 통과 |
| AC-03-1 | S1-3 | 통과 |
| AC-03-2 | "AC-03-2" | 통과 |
| AC-03-3 | S1-4 (로그인은 세션 쿠키로 대신) | 통과(부분) |
| AC-03-4, NFR-05 | S1-5, "NFR-05" (`abc`, `1` 포함) | 통과 |
| AC-03-5 | "AC-02-3·AC-03-5" | 통과 |
| AC-04-1, NFR-02 | "NFR-02·03" 360 2열 / 768 3열 / 1280 4열, 가로 스크롤 0 | 통과 |
| NFR-03, AC-04-2 | 같은 테스트(3:4 비율), 이 환경에서 모든 표지가 대체 표지로 그려짐 | 통과 |
| NFR-01 | Lighthouse 12.2.1 모바일 3회 중앙값 (아래) | 미달(참고용) |
| NFR-04 | `npm run build` (환경 변수 있음) | 통과 |
| NFR-15 | GATE-05 | 통과 |
| NFR-16 | seed 8권, 4개 테마 각 2권 | 통과 / 이미지 열림은 환경 문제로 미검증 |

NFR-01 참고값 (로컬 `next start`, 표지 로드 실패, 테스트로 목록에 책 30권 이상):

| 화면 | LCP 중앙값 | CLS 중앙값 | 기준 |
|---|---|---|---|
| `/` | 2.36s | 0.011 | 통과 |
| `/products` | 4.11s | 0.166 | 미달 |
| `/products/[id]` | 3.80s | 0.103 | 미달 |

### KANT R2~R9
| 항목 | 증빙 | 결과 |
|---|---|---|
| R2 | `package.json` Next 16.4.2·TS·Tailwind 4, `npm run build` 성공 | 통과 |
| R3 | `types/product.ts`, `data/products.ts` 8권(테마 4종 × 2) | 통과 |
| R4 | `components/Header.tsx`·`Footer.tsx`·`ProductCard.tsx`(`ProductCardProps`) | 통과 |
| R5 | `components/ProductGrid.tsx:8` `products.map` | 통과 |
| R6 | `app/products/[id]/page.tsx` + `notFound()` | 통과 |
| R7 | 내부 이동 `<Link>`, 문서 요청 0건(AC-01-2 테스트). 예외 1곳: `app/admin/orders/page.tsx:88` `<a href="/api/admin/shipping-list">`는 파일 내려받기라 맞다 | 통과 |
| R8 | 격자 2·3·4열, 표지 `aspect-3/4 object-cover` | 통과 |
| R9 | 없는 ID 방어(NFR-05), `.gitignore`의 `/node_modules`·`/.next/`·`.env*` | 통과 |

## 실행 결과 (공통)
| 항목 | 결과 | 분류 |
|---|---|---|
| GATE-01 타입 검사 | `npx tsc --noEmit` 통과. 단, 깨끗한 클론에서는 `PageProps`·`LayoutProps`를 찾지 못해 오류 18개(`next typegen` 뒤 통과) → C3 | 이번 변경 |
| GATE-02 린트 | `npm run lint` 오류 0 | — |
| GATE-03 단위 테스트 | 통과 76 / 실패 0 / 실행 76개 | — |
| GATE-04 빌드 | 환경 변수가 있으면 통과. 없으면 `/admin` 사전 렌더링에서 `CONFIG_MISSING`으로 실패 | 환경 문제(README대로 `.env.local`을 채우면 됨) |
| GATE-05 비밀값 | 3개 검사 모두 0줄. service role 사용처는 `lib/supabase/admin.ts`·`lib/data/{payments,members,rounds}.ts`이고 모두 `server-only` | — |
| GATE-06 금지 패턴 | 3개 검사 모두 0줄 | — |
| GATE-07 RLS·RPC | 스텁 DB에서 pgTAP 6파일: admin_ops 36·payments 35·pending_orders 19·rls 42·state_machine 29·subscription 62 = **ok 223 / not ok 0**. `GATE-07: public 모든 테이블 RLS 활성` 포함 | 원격 DB 재확인은 사람(아래) |
| 포맷 | `prettier --check .` 237개 파일 경고(GATE 아님) | 이번 변경(하, C4) |
| 의존성 | `npm audit --omit=dev` high 7건, 모두 `shadcn`(CLI)을 거침 | 기존 오류(main에도 같은 의존성) |
| 브랜치 충돌 | `origin/main`과 add/add 1건: `requirements/ubuntubooks-user-requirements-raw.md` | **이번 변경 → 반려** |
| e2e (`npm run test:e2e`) | 통과 61 / 예상 실패 2(결함 재현, M4) / 실행 63개. 연속 3회 전부 같음 | — |

## 발견 이슈
| # | 심각도 | 위치 | 내용 | 재현 방법 | 수정안 | 확인 수준 | 담당 |
|---|---|---|---|---|---|---|---|
| C1 | 상(머지 차단) | `requirements/ubuntubooks-user-requirements-raw.md` | main과 이 브랜치가 같은 파일을 각자 추가했다(add/add). 차이는 목록 기호 `*`→`-`, 줄 끝 공백 같은 서식뿐 | `git merge-tree --write-tree --name-only HEAD origin/main` | 입력 원본은 사람이 쓴 파일(IN-REQ 성격)이므로 main 버전을 그대로 쓴다: `git checkout origin/main -- requirements/ubuntubooks-user-requirements-raw.md` 후 커밋, 또는 main을 머지하면서 main 쪽을 택한다 | 재현됨 | 사람 / FE |
| C2 | 중 | `lib/auth/guards.ts:14`, `lib/data/session.ts:9`, `lib/supabase/proxy.ts:25` (`getClaims`) | 13개 경로에서 `Route "..." encountered the unstable value Date.now() while prerendering` 오류가 서버 로그에 계속 찍힌다. 같은 이유로 `[SCR-13]`·`[SCR-19]`·`[SCR-20]`에 `During prerendering, fetch() rejects…` → `AppError UNKNOWN` 로그가 섞인다. e2e 63개는 모두 통과해 화면 영향은 확인하지 못했다. 로그가 실제 장애를 가린다 | `next start` 후 아무 회원 화면이나 열고 서버 로그 확인 (e2e 1회에 이 오류 약 600줄) | 세션을 읽는 함수 맨 앞에서 `await connection()`(next/server)으로 요청 시점 렌더링임을 밝히거나, 세션 읽기를 `<Suspense>` 안 동적 구역으로만 옮긴다(Next 16 `cacheComponents` 문서 `blocking-prerender-current-time`) | 재현됨 | BE |
| C3 | 중 | `docs/02-arch/06-quality-gates.md` GATE-01, `README.md:69` | 깨끗한 클론에서 `npx tsc --noEmit`가 오류 18개로 실패한다(`PageProps`·`LayoutProps`는 `next typegen`/`dev`/`build`가 만드는 전역 타입) | 새 폴더에 `git archive HEAD` → `npm install` → `npx tsc --noEmit` | `"typecheck": "next typegen && tsc --noEmit"` 스크립트를 두고 GATE-01·README가 그것을 가리키게 한다 | 재현됨 | ARCH(게이트 명령) / FE(README) |
| C4 | 하 | 저장소 전체 | `.prettierrc`(prettier-plugin-tailwindcss)가 있는데 237개 파일이 포맷과 다르다. GATE가 아니라 판정에는 넣지 않았다 | `npx prettier --check .` | 별도 커밋 1개로 `npm run format`을 적용하거나, 포맷을 GATE에 넣을지 ARCH가 정한다 | 재현됨 | ARCH |
| C5 | 하 | `components/ui/dropdown-menu.tsx`, `lib/utils.ts`, `shared/utils/cn.ts`, 패키지 `cn` | 쓰지 않는 shadcn 컴포넌트 1개, `cn`이 세 군데(`cn` 패키지·`shared/utils/cn.ts`·그것을 다시 내보내는 `lib/utils.ts`). `cn` 패키지는 겹치는 Tailwind 클래스를 정리하지 않아 M4 이슈 #3(외곽선 버튼)의 원인이 된다 | `rg -l "dropdown-menu" app components` → 자기 자신뿐 | `components/ui/*`도 `@/shared/utils/cn`(tailwind-merge)을 쓰게 하고 `cn` 패키지·`lib/utils.ts`·안 쓰는 컴포넌트를 지운다 | 재현됨 | FE |
| C6 | 하 | `supabase/seed.sql`, `data/products.ts` | 표지 주소가 모두 외부 서비스(picsum.photos)다. 그 서비스가 막히거나 바뀌면 시연 화면 표지가 전부 대체 표지가 된다(NFR-16 "이미지 주소 전부 열림") | 이 환경에서 `/_next/image?url=https://picsum.photos/...` → 500, 서버 로그 `ENOTFOUND picsum.photos` | 시연 전 Vercel에서 한 번 확인. 불안하면 표지를 Supabase `book-covers` 버킷에 올려 seed 주소를 바꾼다 | 환경 문제로 재현 | 사람 / DB |

## 사용자 관점 검증 [AI 시뮬레이션]
- UX-n(M1 화면): UX-2·3·4·5·6·7·8·11·16·19 자동 확인 통과(`e2e/ux.spec.ts`). UX-1 검색은 아래.
- UX-1 검색 결과: 색 하드코딩은 일러스트 SVG(`WindowArt`·`LetterArt`·`BlindBook`·`FallbackCover`)와 소셜 로그인 버튼(`LoginButtons`)뿐이라 예외 목록에 해당한다. `[#…]`/`[Npx]` 임의값은 `LoginButtons`(예외)와 shadcn 생성 파일 `components/ui/badge.tsx`(`ring-[3px]`)·`dropdown-menu.tsx`(`min-w-[96px]`, 안 씀) → `[취향]`. `style={{` 0건.
- 시안 대조(SCR-01~04, 360·1280): 순서·배치·버튼 종류·색·글꼴이 시안과 같다. 메인 서가 칸의 책등 장식 색만 다르다(`[취향]`).

| ID | 결과 | 단계 수 | 막힌 지점 | 관련 UX-n / AC | 스크린샷 |
|---|---|---|---|---|---|
| S1-1 | 성공 | 0 | — | UX-4, UX-5 | `docs/06-qa/screens/S1-1-360.jpg` |
| S1-2 | 성공 | 3 | — | AC-02-2 | `docs/06-qa/screens/S1-2-360.jpg` |
| S1-3 | 성공 | 0 | — | AC-03-1, UX-6·8 | `docs/06-qa/screens/S1-3-360.jpg` |
| S1-5 | 성공 | 1 | — | AC-03-4 | `docs/06-qa/screens/S1-5-360.jpg` |

화면 캡처(360·768·1280): `docs/06-qa/screens/M1-{main,products,product,not-found}-{360,768,1280}.jpg`

## AI 부채 체크
- 사람이 이해하기 어려운 코드/과설계: 큰 문제 없음. `cn` 3중 정의(C5)가 버튼 모양 버그를 숨기고 있어 이해 비용이 크다.
- 미래 위험과 최소화 방법: C2 로그가 쌓이면 진짜 오류를 못 본다(→ `connection()` 한 줄). 외부 표지 서비스 의존(C6). 깨끗한 클론에서 GATE-01이 실패하는 것(C3)은 다음 사람이 "타입이 깨졌다"고 오해하기 쉽다.

## 추가한 테스트
- `e2e/` 전체(이 브랜치에서 새로 만듦, QA-E2E). 실행: `npm run test:e2e` (앱 빌드 + seed 들어간 Supabase + `.env.local` 필요)
  - `m1-shop.spec.ts` 11개: M1 AC·NFR (이 티켓)
  - `ux.spec.ts` 20개, `privacy.spec.ts` 5개, `m2-member.spec.ts` 6개, `m3-payment.spec.ts` 4개, `scenarios/p1·p2·p3` 17개
  - `support/`: 테스트 회원 생성·세션 쿠키 로그인(`supabase.ts`), 회차 상태 만들기(`states.ts`), 공통 픽스처(`test.ts`)
- 이유: UX-PLAN-QA §3이 "자동"으로 정한 UX-n과 페르소나 시나리오를 매 수정 뒤 다시 돌릴 수 있게 하려고. 사용자가 저장소에 남기기로 결정(2026-10-22).
- 안전장치: 테스트는 회원·책·회차를 만들고 지우지 않는다. 그래서 Supabase 주소가 localhost가 아니면 `E2E_ALLOW_REMOTE_WRITES=1` 없이 실행되지 않는다(`e2e/support/supabase.ts`).

## 절차 예외
| 승인자 | 날짜 | 내용 | 이유 |
|---|---|---|---|
| 사용자 | 2026-10-22 | QA가 `package.json`(`@playwright/test` 1.56.1 devDependency, `test:e2e` 스크립트), `package-lock.json`(Playwright 4개 항목만 추가), `.gitignore`(`/test-results/`, `/playwright-report/`), `playwright.config.ts`를 수정·추가했다. 레지스트리에 QA-E2E·QA-SHOTS 행을 추가하고 `qa-agent` 스킬 §6을 같은 커밋에서 맞췄다 | 사용자가 "브라우저 테스트를 저장소에 남긴다"고 결정. AR-GATE §5 "새 테스트 도구 0"과 어긋나므로 ARCH 확인이 필요하다(아래) |

## 사람이 결정할 것
1. **C1 충돌**: main의 요구사항 원문을 그대로 쓸지(권장), 이 브랜치의 서식 정리본을 쓸지.
2. **AR-GATE 갱신(ARCH)**: `npm run test:e2e`를 GATE-08로 둘지, 실행 조건(빌드된 앱 + seed DB + 키)과 적용 티켓을 정한다. `AGENTS.md` 디렉토리 지도에 `e2e/`를 넣을지도 같이 정한다.
3. **GATE-07 원격 재확인**: 이 결과는 스텁 DB 기준이다. 사람이 `npx supabase test db --linked`로 원격에서 같은 223개가 통과하는지 확인해야 한다.
4. **NFR-01**: Vercel 배포 주소에서 Lighthouse 모바일 3회를 다시 잰다. 로컬 참고값은 `/products`·상세가 기준 미달이다.
5. **NFR-16**: Vercel에서 표지 이미지 8장이 열리는지 확인한다(C6).
