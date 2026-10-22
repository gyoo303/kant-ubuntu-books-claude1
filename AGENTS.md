<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 에이전트 파이프라인 규칙 (모든 작업에 적용)

이 저장소는 `PM → ARCH → DB → BE → FE → QA` (+ 횡단 UX) 에이전트 파이프라인으로 작업한다. 스킬을 쓰지 않는 작업에도 적용된다.

1. 문서 경로의 기준은 `docs/PIPELINE.md`(산출물 레지스트리) 하나다. 스킬 문서와 다르면 레지스트리를 따른다.
2. 파이프라인 단계 작업(기획·설계·DB·백엔드·프론트·QA·UX)은 해당 스킬(`pm-agent`, `architect-agent`, `db-agent`, `backend-agent`, `frontend-impl`, `qa-agent`, `ubuntubooks-uiux-domain`)을 로드해서 한다.
3. 작업 전 `node scripts/check-handoff.mjs <STAGE>`를 실행한다. 마지막 줄이 `STATUS: READY`가 아니면 작업하지 않고 그 STATUS 줄을 보고한 뒤 멈춘다.
4. 산출물은 레지스트리에서 `만드는 단계`가 내 단계인 경로에만 쓰고, 끝나면 `node scripts/check-handoff.mjs <STAGE> --post --ticket <TKT>`로 확인한다.
5. 순차 실행은 `scripts/run-stage.sh <STAGE> [TKT]`로 한다 (`docs/PIPELINE.md` §5).

## 디렉토리 지도

설계 원본: `docs/02-arch/05-structure-conventions.md`. 구조가 바뀌면 같은 커밋에서 이 지도를 고친다. 전체 탐색 대신 이 표부터 본다.

| 경로 | 책임 | 주요 진입 파일 |
|---|---|---|
| `app/` | 화면(Server Components)과 `app/api/**/route.ts`(모든 쓰기 API). 비즈니스 규칙 금지 | `layout.tsx`, `products/page.tsx`, `products/[id]/page.tsx` |
| `components/` | 화면 부품. 서버 데이터는 props로만 받음 | `Header.tsx`, `Footer.tsx`, `ProductCard.tsx`, `ui/` |
| `types/` | 공용 타입. `database.ts`는 생성물 | `product.ts`, `domain.ts`, `api.ts` |
| `data/` | KANT Mock = seed 원천 + 테스트 픽스처 | `products.ts` |
| `lib/domain/` | 순수 함수(I/O 0), 단위 테스트 1순위 | `cart.ts`, `billing.ts`, `window.ts` |
| `lib/data/` | 화면용 Supabase 읽기 | `products.ts`, `me.ts`, `admin.ts` |
| `lib/api/` | Route Handler 공용(검증·권한·응답) | `http.ts`, `auth.ts`, `schemas.ts`, `errors.ts` |
| `lib/supabase/` | Supabase 클라이언트 생성만 | `server.ts`, `browser.ts` |
| `lib/payments/` | 토스 연동(서버 `toss.ts`, 브라우저 `tossClient.ts`) | `toss.ts` |
| `lib/client/` | 브라우저 전용(API 호출, 장바구니) | `apiFetch.ts`, `cart.ts` |
| `supabase/` | 마이그레이션·seed(생성물) | `migrations/*.sql` |
| `scripts/` | 파이프라인·seed 생성·금지 패턴 검사 | `check-handoff.mjs`, `gen-seed.ts` |

### 이 작업은 이 폴더만 본다
| 단계 | 쓰는 곳 | 읽는 설계 |
|---|---|---|
| DB | `supabase/`, `lib/data/`, `types/database.ts`, `data/`, `scripts/gen-seed.ts` | `docs/02-arch/03-db-schema.md` |
| BE | `app/api/`, `lib/api/`, `lib/payments/toss.ts`, `lib/domain/`, `proxy.ts` | `docs/02-arch/04-interfaces-api.md` §1·§3~§7 |
| FE | `app/**/page.tsx`, `components/`, `lib/client/`, `lib/payments/tossClient.ts`, `lib/content/` | `04-interfaces-api.md` §1·§2, `docs/01-pm/07-screens.md` |
| QA | `**/*.test.ts`, `docs/06-qa/` | `docs/02-arch/06-quality-gates.md`, `docs/01-pm/06-acceptance-criteria.md` |

### 쓰지 않는 것
- `src/`, `domains/`, `shared/` (스타터 잔여, TKT-ARCH-00에서 정리), Server Actions, 새 패키지(승인 목록 밖)
- 티켓·순서: `docs/02-arch/HANDOFF.md`
