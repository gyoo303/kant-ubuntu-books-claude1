---
stage: QA
tickets: [TKT-QA-M5]
status: partial
inputs_read: [AR-MAP, AR-HAND, AR-GATE, PM-AC, UX-CTX-QA, UX-PLAN-QA, FE-BRIEF, QA-BRIEF]
next_readers: [사람]
---

# QA 브리핑 – TKT-QA-M5 깨끗한 클론 실행, Vercel 배포 점검, 시연 리허설 (`claude/serene-mayer-ma4ulh` 5613bf3)

판정: ❌ 반려 (브랜치 공통 C1 충돌). 충돌을 풀어도 M5는 **보류**다. Vercel 배포 점검과 시연 리허설은 배포 주소·실제 로그인·토스 키가 있어야 한다

## 요약
- 깨끗한 클론(`git archive HEAD` → 새 폴더)에서 README 3절대로 `npm install` → `cp .env.example .env.local` → `npm run dev` 하면 메인이 열린다. 환경 변수가 비어 있어도 화면이 멈추지 않고 필요한 값 안내가 나온다(AC-21-4).
- README의 `npx tsc --noEmit`은 깨끗한 클론에서 실패한다(공통 C3).
- Vercel 배포와 시연 리허설은 하지 못했다. 사람 확인 항목이다.

## 수용기준 검증
| 수용기준 | 테스트 | 결과 |
|---|---|---|
| AC-21-1 | README 목차 확인: 소개, 화면과 흐름(1), 컴포넌트 트리(2), 로컬 실행(3), 환경 변수(4), 결제 테스트(5), 운영 절차(6), 화면 캡처(7) | 통과 |
| AC-21-2 | 깨끗한 클론에서 README 명령 → `npm run dev` → `/` 200 | 통과 |
| AC-21-3 (NFR-04) | `npm run build`: 환경 변수를 채우면 통과, 비어 있으면 `/admin` 사전 렌더링에서 실패 | 통과(README 순서대로면) |
| AC-21-3 (NFR-15) | GATE-05 | 통과 |
| AC-21-4 | 환경 변수 없이 `npm run dev` → 메인에 `NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 안내 | 통과 |
| README `npx tsc --noEmit` (README §3 표) | 깨끗한 클론에서 오류 18개 | **실패 → 공통 C3** |
| NFR-04·15 Vercel | — | 미검증 |
| 시연 흐름(PM-SCR §5) | e2e 시나리오 P1~P3로 대신 실행(결제·실제 로그인 제외) | 부분 |

## 실행 결과
| 항목 | 결과 | 분류 |
|---|---|---|
| 깨끗한 클론 `npm install` | 성공 | — |
| 깨끗한 클론 `npx tsc --noEmit` | 실패 18개(`PageProps`·`LayoutProps` 없음) | 이번 변경(C3) |
| 깨끗한 클론 `npm run dev` (환경 변수 없음) | `/` 200 + 안내 | — |
| 전체 회귀 `npm run test:e2e` | 통과 61 / 예상 실패 2 / 실행 63개, 3회 연속 같음 | — |
| 단위 테스트 | 통과 76 / 실패 0 / 실행 76개 | — |
| Vercel 배포 | 실행하지 않음 | 환경 문제(배포 주소·권한 없음) |

## 발견 이슈
새 이슈 없음. 공통 C1(충돌)·C3(타입 검사 명령)이 이 티켓의 완료 조건(AC-21-2·3)에 걸린다. M4 이슈 #1~#3은 시연 흐름 7~10에서 눈에 띄므로 시연 전에 고쳐야 한다.

## 사용자 관점 검증 [AI 시뮬레이션]
- 시나리오 전체 결과는 `briefing-TKT-QA-M4.md` 표(S2·S3)와 `briefing-TKT-QA-01.md` 표(S1)를 본다. 시연에 영향을 주는 것: S2-6(#1), S3-3(#2), 외곽선 버튼(#3).

## AI 부채 체크
- 미래 위험과 최소화 방법: e2e는 로컬 Supabase(또는 테스트 전용 프로젝트)를 전제로 한다. 시연용 원격 DB에 돌리면 테스트 회원·책이 손님 화면에 남는다. 그래서 주소가 localhost가 아니면 `E2E_ALLOW_REMOTE_WRITES=1` 없이는 실행되지 않게 막아 두었다.

## 추가한 테스트
- 없음(전체 회귀는 `e2e/` 전체로 했다).

## 사람이 결정할 것
1. **Vercel 점검**: 배포 주소에서 빌드 로그(NFR-04), 환경 변수 7개, 카카오·네이버 리다이렉트 주소, 표지 이미지 8장(NFR-16), Lighthouse 모바일(NFR-01)을 확인한다.
2. **시연 리허설**: PM-SCR §5 흐름을 실제 카카오 계정 + 토스 테스트 결제로 한 번 끝까지 진행한다. M4 #1~#3을 고친 뒤에 하기를 권한다.
3. C1·C3 해결 뒤 이 티켓을 다시 검증할지.
