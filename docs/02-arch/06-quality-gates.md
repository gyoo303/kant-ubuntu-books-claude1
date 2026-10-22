# 06. 품질 게이트 & 테스트 전략 (AR-GATE)

- 근거: ADR-009, `01-drivers.md` RISK-11·12, KANT-C15·C16, PM NFR
- DB·BE·FE 에이전트는 브리핑을 쓰기 전에 아래 게이트를 모두 실행하고, 명령과 결과(통과 수·에러 수)를 브리핑에 적는다.

## 1. 게이트
| GATE | 명령 | 통과 기준 | 실행 단계 |
|---|---|---|---|
| GATE-01 타입 | `npm run typecheck` (`tsc --noEmit`) | 에러 0 | DB·BE·FE·QA |
| GATE-02 린트 | `npm run lint` (`eslint .`) | 에러 0 | DB·BE·FE·QA |
| GATE-03 단위 테스트 | `npm test` (`node scripts/run-tests.mjs`) | 실행 테스트 수 ≥ 1 **그리고** 실패 0. 0개 실행은 실패(RISK-11) | DB·BE·FE·QA |
| GATE-04 빌드 | `npm run build` (`.env.local` 필요) | 성공, "Uncached data was accessed outside of `<Suspense>`" 류 에러 0 (KANT-C15) | BE·FE·QA |
| GATE-05 비밀값 | `git ls-files \| grep -E '(^\|/)\.env'` 결과가 `.env.example`뿐, `npm run check:forbidden` 안의 비밀값 규칙 통과 | 위반 0 (KANT-C16, NFR-13) | 전 단계 |
| GATE-06 금지 패턴 | `npm run check:forbidden` (`scripts/check-forbidden.mjs`) | `05-structure-conventions.md` §4의 1·2·4·8·9·10번, §2 의존 방향 위반 0 | DB·BE·FE·QA |
| GATE-07 RLS | `npm run check:rls` (`scripts/check-rls.mjs`, service role로 RPC `audit_rls()` 호출) | `public` 스키마의 RLS 꺼진 테이블 0, 테이블별 정책 수가 `03-db-schema.md` §4 표와 일치 | DB·QA |

### 게이트 스크립트 명세
- `scripts/run-tests.mjs`: Node `fs.globSync`로 `lib/**/*.test.ts`, `scripts/**/*.test.ts`를 찾아 `node --import tsx --test <파일들>` 실행. 찾은 파일 0개 또는 출력의 `tests` 수 0이면 종료 코드 1. (Windows 따옴표 문제 회피)
- `scripts/check-forbidden.mjs`: 저장소 파일을 읽어 정규식 검사. 대상·예외(`types/database.ts`, `node_modules`, `.next`)는 스크립트 상단 상수. 위반마다 `파일:줄 규칙번호`를 출력하고 1개 이상이면 종료 코드 1.
- `audit_rls()` (DB 함수, service_role 전용): `returns table (table_name text, rls_enabled boolean, policy_count int)`.

## 2. 테스트 전략 (ADR-009)
| 순위 | 대상 | 방법 | 위치 |
|---|---|---|---|
| 1 | 도메인 불변 규칙 (`lib/domain`) | `node:test` 단위 테스트, 픽스처 `data/products.ts` | `lib/domain/*.test.ts` |
| 2 | 상태 전이·멱등성 (RPC) | DB 단계가 `supabase/tests/<rpc>.md`에 SQL 시나리오(입력·기대 결과)를 쓰고 클라우드 dev DB의 SQL 편집기 또는 `npm run check:rls`와 같은 service role 스크립트로 실행해 결과를 브리핑에 붙인다 | `supabase/tests/` |
| 3 | 입력 검증 (`lib/api/schemas.ts`) | zod 스키마 단위 테스트 (경계값: 0자, 2000자, 2001자, 6자리 코드) | `lib/api/schemas.test.ts` |
| 4 | 예외 시나리오 (REJ) | API를 `curl`로 호출해 상태 코드·`error.code` 확인 (QA) | QA 브리핑 |
| 5 | 화면 | QA가 내장 브라우저로 AC 순서대로 조작, 360/768/1280 폭 확인, Lighthouse(NFR-01) | QA 브리핑 |
- 테스트에 목(mock)이 3개 이상 필요하면 테스트를 늘리지 말고 설계 결함으로 Architect에 보고한다(I/O 격리 실패).
- 브라우저 자동화 도구(Playwright 등)는 추가하지 않는다(ADR-009).

## 3. AC ↔ 테스트 연결 규칙
- 자동 테스트 이름은 AC·NFR ID로 시작한다: `test('AC-08-4 재고보다 많은 수량은 재고까지만', ...)`.
- QA 브리핑에 `AC-ID | 확인 방법(단위/curl/브라우저) | 결과 | 근거(파일:줄 또는 캡처)` 표를 쓴다. 확인하지 못한 AC는 "확인하지 못함"으로 남긴다.
- 우선 자동화 대상 AC: AC-08-2·4·5, AC-13-2, AC-15-1(`toWindowState`), AC-19-7, AC-20-4, AC-12-5, NFR-15(Mock 속성·개수).

## 4. 실패 처리
- 게이트 실패 → 오류 요약(명령, 첫 에러 3줄)만 남기고 고친 뒤 다시 실행.
- 같은 게이트를 3회 연속 실패 → 설계 문제로 보고 브리핑 `status: blocked` + Architect에 질문(무엇을, 왜 막혔는지).
- 외부 연동(카카오·네이버·토스)이 키 없음으로 확인 불가 → 실패가 아니라 "확인하지 못함"으로 적고, 필요한 키 이름을 적는다.
