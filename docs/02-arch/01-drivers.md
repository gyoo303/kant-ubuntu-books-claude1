# 01. 아키텍처 드라이버 (AR-DRV)

- 입력: `docs/01-pm/04-scope.md` Architect 요약 블록 + 블록이 가리키는 ID 섹션
- 이 문서의 ID(`DRV-`, `RISK-`)는 모든 ADR의 "근거" 칸에서 참조된다.

## 0. A0 입력 검증 결과 (2026-10-21)
| 확인 항목 | 결과 |
|---|---|
| 미해결 Q | 0 (`02-assumptions-questions.md` 답변 섹션) |
| D-xx 승인 | D-001~007 모두 `[APPROVED]`, `[PENDING]` 0 |
| Must US → AC | US-01~26 모두 AC ≥ 1, 예외 AC ≥ 1 (PM P9 스크립트 확인) |
| INV·상태 흐름 | INV-01~19, 상태 흐름 §5.1~§5.6 정의됨 |
| KANT 매트릭스 | 28행, 빈 칸 0 |
| 결손 | 없음 → 진행 |

### →ARCH 질문 배정
| ID | 주제 | 답하는 곳 |
|---|---|---|
| →ARCH-01 | 카카오·네이버 연동 | A2 ADR-003 |
| →ARCH-02 | 관리자 인증·권한 | A2 ADR-003, A3 RLS |
| →ARCH-03 | 언박싱 코드 실패 제한 | A5 SEQ (코드 입력) |
| →ARCH-04 | 블라인드 응답 차단 | A3 RLS·뷰, A4 API |
| →ARCH-05 | 토스 단건·자동결제 | A2 ADR-004 |
| →ARCH-06 | 촛불 반영 방식 | A2 (Q-020 확정: 페이지 열 때 조회) |
| →ARCH-07 | `data/products.ts` 역할 | A2 ADR-001 |
| →ARCH-08 | Storage·엑셀·배송지 보관 | A3 Storage, A4 API |
| →ARCH-09 | 재고 동시성 | A3 제약, A5 트랜잭션 |

### 저장소 현황 (설계에 영향)
| 관찰 | 영향 |
|---|---|
| Next.js 16.4.2, React 19.3, `cacheComponents: true`, `partialPrefetching: true` | 요청 시점 데이터(`cookies()`)는 `<Suspense>` 안에서만 읽어야 함(밖이면 빌드 에러). `params`는 `Promise`. `middleware` → `proxy.ts` |
| Tailwind 4, shadcn(base-ui) `components/ui/*`, lucide | UI 기본 부품 재사용 |
| `@supabase/ssr`, `@supabase/supabase-js`, `supabase` CLI 설치됨 | 추가 설치 없이 Supabase 사용 |
| `npm run lint` = `next lint` → **실패** (Next 16에서 명령 제거) | GATE-02에서 `eslint .`로 교체 필요 |
| `npm test` → **0개 실행** (Windows에서 `'{app,domains,shared}/**/*.test.ts'` 따옴표 패턴이 펼쳐지지 않음). `prebuild`가 이 테스트를 돌려 빌드가 0개로 "통과" | GATE-03에서 패턴 수정 필요 |
| 팀원이 올린 스타터: `domains/{boards,categories,files}` 타입, `shared/mocks/mockData.ts`(패션 카테고리), `shared/utils/{cn,formatPrice}`, `src/shared/utils/cn.ts`, `lib/utils.ts`(`cn` 패키지 재수출) | 본 도메인과 무관한 파일, `cn` 3중 정의, `src/`는 KANT 경로 규칙과 충돌 → A6 ADR-006 |

## 1. 제약 (DRV-C)
| ID | 제약 | 출처 |
|---|---|---|
| DRV-C-01 | DB·인증·파일은 Supabase(Postgres·Auth·Storage). 상품 포함 운영 데이터 원천은 Supabase | REQ-T01 |
| DRV-C-02 | Next.js App Router + TypeScript + Tailwind CSS, `src/` 미사용 | REQ-T05, KANT-R2·C4 |
| DRV-C-03 | KANT 고정 경로: `package.json`, `.gitignore`, `README.md`, `types/product.ts`, `data/products.ts`, `components/Header.tsx`, `components/Footer.tsx`, `components/ProductCard.tsx`, `app/products/page.tsx`, `app/products/[id]/page.tsx` | KANT |
| DRV-C-04 | 상품 타입 필수 속성 `id`, `name`, `price`, `imageUrl`, `description` + 도메인 속성(`03-domain.md` §4) | KANT-C5 |
| DRV-C-05 | 로그인은 카카오·네이버만 | REQ-016 |
| DRV-C-06 | 결제는 토스페이먼츠, 단건 + 매달 자동결제, 테스트 모드만 | D-002, Q-017 |
| DRV-C-07 | 마일스톤 순서 M1 → M5, 완성 기준 Must + Should, 2주 참고 타임박스 | D-001 |
| DRV-C-08 | 실시간 반영 불필요 (촛불은 페이지를 열 때 최신 상태) | Q-020 |
| DRV-C-09 | 관리자는 책방지기 1명, 비전문가 | D-012, REQ-037 |

## 2. 품질 속성 우선순위 (DRV-Q)
| 순위 | ID | 속성 | PM 기준 | 이 순위인 이유 |
|---|---|---|---|---|
| 1 | DRV-Q-01 | 보안·개인정보 | NFR-05, NFR-06, NFR-07, NFR-13 | 배송지·편지·블라인드가 깨지면 서비스 의미(설렘)와 법적 책임이 함께 무너짐 |
| 2 | DRV-Q-02 | 결제·재고 정확성 | NFR-08, NFR-09, NFR-18, INV-05~08 | 돈과 실물이 오가므로 중복·음수는 되돌리기 어려움 |
| 3 | DRV-Q-03 | 상태 일관성 | INV-09, INV-10, INV-19 | 창가·회차 흐름이 핵심 경험이며 잘못된 전이는 손님에게 바로 보임 |
| 4 | DRV-Q-04 | 운영 단순성 | NFR-12 | 관리자가 비전문가. 운영 부품(서버·큐·실시간 연결) 수를 최소화 |
| 5 | DRV-Q-05 | KANT 증빙·빌드 | NFR-03, NFR-14~16 | 평가 기준. 경로·빌드가 깨지면 기능과 무관하게 감점 |
| 6 | DRV-Q-06 | 성능·반응형·접근성 | NFR-01, NFR-02, NFR-10, NFR-11 | 소규모 트래픽. 정적 셸 + 이미지 최적화로 충분 |
| 7 | DRV-Q-07 | 확장성 | — | 단일 서점·1인 운영. 확장 대비 설계는 하지 않음 (D3) |

## 3. 핵심 리스크 (RISK)
| ID | 리스크 | 가능성 | 영향 | 설계 대응 위치 |
|---|---|---|---|---|
| RISK-01 | 결제 성공 응답 중복·위변조(금액 조작, 다른 주문 ID) | 중 | 높음 | ADR-004, SEQ-02: 서버 금액 대조 + `payment_key` unique + 상태 조건부 RPC |
| RISK-02 | 토스 승인 성공 후 DB 저장 실패 → 돈은 나갔는데 주문 없음 | 낮음 | 높음 | ADR-004, SEQ-02: 저장 실패 시 즉시 결제 취소(보상) + 오류 로그 |
| RISK-03 | 자동결제 실패·해지 시점과 회차 생성이 엇갈림(해지했는데 결제됨, 같은 달 두 번 결제) | 중 | 높음 | ADR-004, SEQ-04: 결제 직전 구독 상태 재확인, `(subscription_id, cycle_no)` unique |
| RISK-04 | 6자리 코드 무차별 대입 | 중 | 중 | SEQ-07: 본인 회차만 대조, 계정당 5회 실패 시 10분 잠금 (DB 기록) |
| RISK-05 | 언박싱 전 책 정보가 응답·페이지 소스로 새어 나감 | 높음 | 높음 | ENT·RLS: 회원용 뷰에서 미언박싱 회차의 책·답장 컬럼 제외, 엽서 사진은 비공개 버킷 |
| RISK-06 | 관리자 권한 우회, 회원 간 데이터 열람(RLS 누락) | 중 | 높음 | ADR-003, A3: 전 테이블 RLS + `is_admin()`, GATE-07 |
| RISK-07 | 주소록 엑셀로 개인정보 대량 노출 | 낮음 | 높음 | API: 관리자 전용 Route Handler, 다운로드는 응답 스트림(파일 저장 안 함) |
| RISK-08 | 비밀키(service role, 토스 시크릿, 빌링키) 클라이언트 노출 | 중 | 높음 | ADR-005, CONV: `server-only` 모듈, `NEXT_PUBLIC_` 금지 목록, 빌링키 테이블 RLS 정책 0개 |
| RISK-09 | 네이버 사용자 정보가 `response` 안에 중첩 → Supabase 커스텀 OAuth2로 사용자 식별 실패 | 중 | 중 | ADR-003: 확인 티켓 선행 + 대안 경로 |
| RISK-10 | 재고 동시 차감으로 음수 | 낮음 | 중 | A3 `check (stock_quantity >= 0)` + 조건부 update RPC |
| RISK-11 | 테스트가 0개 실행돼도 게이트 통과 (현 `npm test`) | 높음 | 중 | GATE-03: 실행 수 0이면 실패 처리 |
| RISK-12 | `cacheComponents`에서 세션 읽기를 `<Suspense>` 밖에 두어 빌드 실패·전체 페이지 동적화 | 높음 | 중 | CONV: 세션 읽기 위치 규칙 |
| RISK-13 | 매달 결제 스케줄러가 멈춤 → 회차가 안 열림 | 낮음 | 중 | ADR-005: 하루 1회 실행 + 밀린 결제일 처리(오늘 이전 미처리 건 포함) |
