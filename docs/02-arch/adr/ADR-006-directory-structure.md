# ADR-006: 디렉토리 구조와 기존 스타터 파일 처리
- 상태: Accepted (user, 2026-10-21)
- 관련 계층: [레이어]
- 근거: DRV-C-02, DRV-C-03, DRV-Q-05, RISK-11, KANT 고정 경로

## 맥락
저장소에는 팀원이 올린 쇼핑몰 스타터가 있다: `domains/{boards,categories,files}/types`(게시판·카테고리·파일 타입), `shared/mocks/mockData.ts`(패션 카테고리), `shared/utils/{cn,formatPrice}`, `src/shared/utils/cn.ts`, `lib/utils.ts`(`cn` 패키지 재수출), `components.json` 별칭은 `@/shared/*`. 우분투북스 도메인과 무관하고, `cn`이 세 곳에 있으며, `src/`는 KANT 경로 규칙(`src/` 미사용)과 충돌한다. KANT는 `components/`, `types/`, `data/`를 루트에 요구한다.

## 검토한 옵션
| 옵션 | 장점 | 단점 | AI 부채 영향 | KANT 영향 | 되돌리기 비용 |
|---|---|---|---|---|---|
| A 루트 계층형: `app/` `components/` `types/` `data/` `lib/{domain,data,supabase,payments,api}` `supabase/` | KANT 경로와 한 체계, 계층 3개 이하, 의존 방향이 폴더로 보임 | 팀 스타터의 `domains/` 관례와 다름 | 낮음 | 충족 | 중 |
| B 기능별 `domains/<기능>/{components,server,client,types,utils}` + `shared/` + KANT 루트 경로 | 팀 스타터·이전 토스 작업과 같은 관례 | KANT 루트 `components/`·`types/`와 기능 폴더가 섞여 같은 종류 파일이 두 체계에 흩어짐 | 중 | 충족 (경로 혼재) | 중 |

## 스타터 파일 처리 (A·B 공통)
- 지울 것: `src/`, `domains/{boards,categories,files}`, `shared/mocks/mockData.ts`, 중복 `cn`(하나만 남김), 루트 `lib/utils.ts`의 `cn` 패키지 재수출(같은 일을 하는 패키지 2개, `cn` 패키지 제거)
- 이 파일들은 팀원이 Git에 올린 것이므로 **기능 작업과 섞지 않고 별도 정리 작업(TKT-ARCH-00)으로 한 번에 처리**한다. 커밋 여부는 사용자가 정한다.

## 결정 / 추천
결정: **A** — KANT 경로와 같은 체계라 하위 에이전트가 "이 종류 파일은 여기"를 한 규칙으로 찾는다.

## 결과
- 후속: `05-structure-conventions.md`, 루트 `AGENTS.md` 디렉토리 지도, `components.json` 별칭을 `@/components`, `@/lib/utils`로 교체, TKT-ARCH-00(스타터 정리)
