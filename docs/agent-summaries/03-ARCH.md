# [아키텍트] 작업 요약 — `uiux-agent-full-pipe4`

- 브랜치 마지막 커밋: `ecb1f7e` (2026-10-21) "아키텍처 설계 산출물과 하위 단계 티켓 추가" (19파일, +1,122줄)
- 산출 폴더: `docs/02-arch/` + 루트 `AGENTS.md`(디렉토리 지도)
- 입력: PM 산출물(`docs/01-pm/`, 특히 PM-SCOPE 요약 블록과 →ARCH 질문 A-01~A-11), UX-CTX-ORCH
- 이후 DB 단계 브랜치(`pipe5`)에서 설계 보완 커밋이 5개 더 있다(§6).

## 1. 산출물
| ID | 파일 | 내용 |
|---|---|---|
| AR-DRV | `01-drivers.md` | 입력 검증(A0), 제약 DRV-C, 품질 속성 우선순위 DRV-Q, 핵심 리스크 RISK-01~15 |
| AR-SYS | `02-system-architecture.md` | 구성도, 기술 스택, 외부 연동, 렌더링·캐시 전략(Next 16 Cache Components) |
| AR-DB | `03-db-schema.md` | 엔티티 → 테이블, enum, DDL 요지, RLS(기본 거부), RPC(`security definer`, `search_path=''`), Storage, 탈퇴 처리, seed·타입, 마이그레이션 파일 계획 |
| AR-API | `04-interfaces-api.md` | TS 타입, 에러 모델, API spec(Server Action / Route Handler), 페이지 데이터 계약, 실행 흐름 SEQ, 상태 머신, 외부 I/O 격리 규칙 |
| AR-CONV | `05-structure-conventions.md` | 디렉토리(`src/` 없음), 의존 방향, 코딩 컨벤션 CONV, 금지 패턴, 환경·저장소 파일 |
| AR-GATE | `06-quality-gates.md` | GATE-01~07, 테스트 전략 우선순위, AC ↔ 테스트 ID 규칙, 실패 처리 |
| AR-HAND | `HANDOFF.md` | 마일스톤별 티켓(담당·읽을 것·산출·완료 조건·선행), 티켓 수, 남은 리스크 |
| ADR | `adr/ADR-001`~`009` | 기술 결정 9건(아래) |
| AR-MAP | `AGENTS.md` | 디렉토리 지도와 단계별 쓰는 곳 |
| (PM 갱신) | `docs/01-pm/08-kant-traceability.md`, `decision-log.md` | KANT 증빙 경로를 설계 기준으로 채움, Architect 자율 결정 기록 |

## 2. 기술 스택 (AR-SYS §2)
| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js 16.4.2 App Router(`cacheComponents: true`), React 19.3, TypeScript strict |
| 스타일 | Tailwind CSS 4 + shadcn(base-nova, `@base-ui/react`), 아이콘 `lucide-react` |
| DB·인증·파일 | Supabase(Postgres·Auth·Storage), `@supabase/ssr`·`supabase-js` |
| 결제 | 토스페이먼츠 SDK 2.x + 서버 승인 API |
| 입력 검증 | `zod` 4.x |
| 비밀값 보호 | `server-only` |
| 단위 테스트 | `node --test` + `tsx` (추가 의존성 0) |
| 호스팅 | Vercel Production 1개 |

- 추가 패키지는 3개(`@tosspayments/tosspayments-sdk`, `zod`, `server-only`)뿐이다. 제거 대상: `react-icons`, `cn` 패키지 검토(TKT-FE-00).

## 3. ADR (모두 Accepted)
| ADR | 주제 | 선택 | 요지 |
|---|---|---|---|
| 001 | 상품 데이터 원천 | C | Supabase seed가 원천. `data/products.ts`(KANT Mock)는 seed 생성 원천 + 테스트 픽스처 |
| 002 | 서버 로직 위치 | B | 화면 변경 = Server Action, 외부 콜백 = Route Handler, 여러 테이블 상태 전이 = Postgres RPC |
| 003 | 소셜 로그인·권한 | A(실패 시 B) | 카카오 기본 제공자, 네이버 `custom:naver` 스파이크 → 실패 시 Route Handler 직접 OAuth. 권한은 `profiles.role` + `is_keeper()` |
| 004 | 결제 | A | 토스페이먼츠 직접 연동, 서버 confirm + 공식 멱등키 |
| 005 | 배포·환경 | A | Vercel 1개 + Supabase 원격 1개. (pipe5에서 "로컬 Supabase 미사용"으로 개정) |
| 006 | 창가 상태 반영 | A | 화면 진입 시 조회, 캐시 없음. 실시간 반영은 하지 않음(의도된 느림) |
| 007 | 주소록 파일 | A | CSV(UTF-8 BOM, CRLF) + 다운로드 기록 테이블 |
| 008 | 입력 검증 | B | zod 스키마에서 타입 추론, `as` 단언 없이 외부 입력 처리 |
| 009 | 디렉토리 계층 | A | 기존 구조 기준. `domains/<d>/`(순수 규칙) + `lib/*`(I/O 어댑터) + `shared/utils` |

## 4. 품질 게이트 (AR-GATE)
| GATE | 내용 |
|---|---|
| 01 | `npx tsc --noEmit` |
| 02 | `npm run lint` (`eslint .`) |
| 03 | `npm test` (`node --test`) |
| 04 | `npm run build` |
| 05 | 비밀값·`.gitignore` 검사 |
| 06 | 금지 패턴 grep (`any`, `@ts-ignore`, 빈 catch, `domains/`의 I/O 등) |
| 07 | RLS·RPC pgTAP(`supabase/tests/*.test.sql`) |

- 테스트 우선순위: 도메인 규칙 → 상태 전이 → 멱등성·결제 → 권한·개인정보 → 화면(수동 + UX 시나리오). 새 테스트 도구는 들이지 않는다(§5 D3).

## 5. 핵심 리스크와 티켓
**대표 리스크**
- RISK-01 결제 확정 신호 중복
- RISK-02 금액 위변조
- RISK-03 승인 후 DB 확정 실패
- RISK-07 RLS 누락
- RISK-08 블라인드 깨짐
- RISK-10 비밀키 노출
- RISK-11 네이버 로그인
- RISK-13 Cache Components 규칙 위반

**티켓 수 (HANDOFF)**
| M | DB | BE | FE | QA | 계 |
|---|---|---|---|---|---|
| M1 | 2 | 0 | 4 | 1 | 7 |
| M2 | 0 | 3 | 2 | 1 | 6 |
| M3 | 1 | 3 | 2 | 1 | 7 |
| M4 | 2 | 4 | 3 | 1 | 10 |
| M5 | 0 | 0 | 1 | 1 | 2 |
| 계 | 5 | 10 | 12 | 5 | 32 |

남은 리스크로 기록한 것: RISK-03 보상 취소 실패, RISK-11 네이버 매핑, RISK-12 외부 심사, RISK-14 장기 보관 기록 처리.

## 6. 이후 설계 보완 (DB 단계 브랜치 `pipe5`에 있는 아키텍트 커밋)
| 커밋 | 내용 |
|---|---|
| `7035040` | 로컬 Supabase 미사용 — 원격 프로젝트 기준으로 설계 문서 개정(ADR-005, GATE-07) |
| `4880ffe` | Storage 버킷을 쓰는 티켓의 마이그레이션에 버킷 생성 배치(TKT-DB-01) |
| `bc547c5` | DB-02~04 시작 전 보완: 결제 FK 분할, 주문번호, 번호 간격, 테스트 결과 표 형식 |
| `5b15de2` | `ship_round`에 `p_teaser` 추가, 회차 취소 RPC 반환 규칙(TKT-DB-03) |
| `9d47df9` | `lib/data` 담당 구분: `products.ts`는 DB, 나머지 RPC 래퍼는 BE (사용자 결정 2026-10-22) |
