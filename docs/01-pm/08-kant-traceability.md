# 08. KANT 추적 매트릭스 (PM-KANT)

- 입력: IN-KANT, PM 산출물 전체. ARCH는 `Architect로 이관` 행의 증빙 경로·상태를 갱신한다.
- ARCH 갱신(2026-10-21): 이관 행 24개 모두 `설계 증빙` 열에 설계 ID / 확정 경로 / 티켓을 채움. `docs/02-arch/` 기준 (API = `04-interfaces-api.md`, CONV·구조 = `05-structure-conventions.md`)
- 상태: `정의됨` = PM 산출물로 충족 / `Architect로 이관` = PM이 기준(US·AC·NFR)을 정의했고 구현·증빙은 하위 단계

## 1. 요구사항 (R)
| KANT | 요구사항 | 담당 단계 | 연결 US / AC / SCR | 증빙 산출물 | 상태 | 설계 증빙 (ARCH) |
|---|---|---|---|---|---|---|
| R1 | 기획·범위 정의 | PM | US-01·03·04, SCR-01·03·04 | `03-domain.md` §1, `04-scope.md`, `07-screens.md` §3 | 정의됨 | — |
| R2 | Next.js(App Router)+TS+Tailwind 생성·로컬 구동 | ARCH → FE | US-26, AC-26-1, NFR-03 | `package.json`, 실행 캡처, 초기 커밋 | Architect로 이관 — 프로젝트 생성은 구현 단계 | ADR-005, ADR-006, CONV §5, GATE-04 / `package.json` / TKT-ARCH-00 |
| R3 | TS 상품 인터페이스 + Mock 6개 이상 | ARCH → DB | NFR-15, `03-domain.md` §4 | `types/product.ts`, `data/products.ts` | Architect로 이관 — 속성은 정의됨, Mock 역할은 →ARCH-07 | ADR-001, ENT-01, API §1.1 / `types/product.ts`, `data/products.ts` / TKT-DB-01 |
| R4 | Header/Footer/ProductCard 분리, Props | ARCH → FE | `07-screens.md` §2, AC-01-1, AC-03-1 | `components/` | Architect로 이관 — 화면 요소 정의됨 | API §2.1, CONV-02, 구조 §1 / `components/Header.tsx`·`Footer.tsx`·`ProductCard.tsx`, `app/layout.tsx` / TKT-FE-01 |
| R5 | 목록 `.map()` 동적 렌더링 | FE | US-03, AC-03-1·2 | `app/products/page.tsx` | Architect로 이관 — 경로·구조 확정 필요 | API §2.1, CONV-07·08 / `app/products/page.tsx` / TKT-FE-02 |
| R6 | `[id]` 동적 라우팅 상세 | FE | US-04, AC-04-1·2 | `app/products/[id]/page.tsx` | Architect로 이관 | API §2.1 (`params: Promise`) / `app/products/[id]/page.tsx` / TKT-FE-02 |
| R7 | `<Link>` 클라이언트 네비게이션 | FE | AC-01-2, NFR-16 | 화면 전환 동작 | Architect로 이관 | CONV-05 / TKT-FE-01·02 |
| R8 | Tailwind 그리드·플렉스·여백·이미지 비율 | FE | NFR-02, SCR-03 와이어프레임 | 스크린샷, 클래스명 | Architect로 이관 | CONV-06·07 / TKT-FE-02 |
| R9 | 없는 ID 방어, `.gitignore` | FE, ARCH | AC-04-3, NFR-04, NFR-14 | 예외 분기 코드, 저장소 파일 목록 | Architect로 이관 | API §2.1 `notFound()`, CONV §5 `.gitignore` / `app/products/[id]/not-found.tsx`, `.gitignore` / TKT-FE-02, TKT-ARCH-00 |
| R10 | README, 시연 발표 | FE·QA (README), 사람 (발표) | US-26, AC-26-1~4, `07-screens.md` §5 | `README.md`, 시연 | Architect로 이관 — 시연 흐름 초안은 정의됨 | HANDOFF README 목차 / `README.md` / TKT-FE-10, TKT-QA-06 |

## 2. 역할별 체크리스트 (C)
| KANT | 문항 요지 | 담당 단계 | 연결 US / AC / SCR | 증빙 산출물 | 상태 | 설계 증빙 (ARCH) |
|---|---|---|---|---|---|---|
| C1 | 콘셉트·대상 정의 | PM | — | `03-domain.md` §1·§2 | 정의됨 | — |
| C2 | 3페이지 필수 시각 요소 사전 정리 | PM | SCR-01·03·04 | `07-screens.md` §3 "필수 시각 요소" | 정의됨 | — |
| C3 | 범위 통제 (일정 차질 없음) | PM | — | `04-scope.md` §2·§3, D-001 | 정의됨 | — |
| C4 | Next.js·TS·Tailwind 옵션 | ARCH | NFR-03 | `package.json`, 설정 파일 | Architect로 이관 | ADR-006, CONV §5 / TKT-ARCH-00 |
| C5 | 상품 필수 속성 interface | ARCH → DB | `03-domain.md` §4, NFR-15 | `types/product.ts` | Architect로 이관 — 속성 정의됨 | API §1.1 / `types/product.ts` / TKT-DB-01 |
| C6 | Mock 6개+ 유효 이미지 | DB | NFR-15 | `data/products.ts` | Architect로 이관 (→ARCH-07) | ADR-001, NFR-15 / `data/products.ts` / TKT-DB-01 |
| C7 | Header·Footer 분리 | FE | `07-screens.md` §2 | `components/Header`, `components/Footer` | Architect로 이관 | 구조 §1 `app/layout.tsx` / TKT-FE-01 |
| C8 | ProductCard Props | FE | `07-screens.md` §2, AC-03-1 | `components/ProductCard` | Architect로 이관 | API §2.1 `{ product: Product }` / TKT-FE-01 |
| C9 | Flex·Grid 균일 간격 | FE | NFR-02, SCR-03 | 목록 화면 클래스 | Architect로 이관 | CONV-07 / TKT-FE-02 |
| C10 | object-cover 이미지 비율 | FE | NFR-02, SCR-03·04 | 카드·상세 클래스 | Architect로 이관 | CONV-06 / TKT-FE-01·02 |
| C11 | `products/page.tsx` `.map()` | FE | AC-03-1 | `app/products/page.tsx` | Architect로 이관 | API §2.1 / TKT-FE-02 |
| C12 | `[id]` params | FE | AC-04-1 | `app/products/[id]/page.tsx` | Architect로 이관 | API §2.1 / TKT-FE-02 |
| C13 | `<Link>` 사용 | FE | AC-01-2, NFR-16 | 링크 코드 | Architect로 이관 | CONV-05 / TKT-FE-01 |
| C14 | 잘못된 ID 안내 문구 | FE | AC-04-3, NFR-04 | 상세 예외 분기 | Architect로 이관 | API §2.1 / TKT-FE-02 |
| C15 | `npm run build` 성공 | QA (전 단계) | NFR-03 | 빌드 로그 | Architect로 이관 — 품질 게이트에 포함 필요 | GATE-04 / 전 티켓 공통 완료 조건 |
| C16 | `.gitignore` | ARCH | NFR-14 | `.gitignore`, 저장소 목록 | Architect로 이관 | CONV §5, GATE-05 / TKT-ARCH-00 |
| C17 | README(소개·트리·명령·캡처) | FE·QA | AC-26-2 | `README.md` | Architect로 이관 | HANDOFF README 목차 / TKT-FE-10 |
| C18 | 시연·발표 흐름 | PM (초안), 사람 (발표) | US-26, AC-26-3, `07-screens.md` §5 | 시연 | 정의됨 (초안) — 발표는 사람 | `docs/01-pm/07-screens.md` §5 / TKT-QA-06 |

## 3. 점검
- 행 28개(R10 + C18), 빈 칸 0.
- PM 직접 항목 R1, C1, C2, C3: 모두 `정의됨`.
- 팀 결정으로 C3 원문("백엔드 연동, 로그인 등 필수 범위를 벗어난 작업")과 다르게 로그인·결제·구독을 범위에 넣었다. 근거는 REQ-T02~T04, 통제 방법은 `04-scope.md` §2.
