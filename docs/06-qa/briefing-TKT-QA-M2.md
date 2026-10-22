---
stage: QA
tickets: [TKT-QA-M2]
status: done
inputs_read: [AR-MAP, AR-HAND, AR-GATE, PM-AC, UX-CTX-QA, UX-PLAN-QA, UX-PERSONA, UX-DEC, BE-BRIEF, FE-BRIEF, QA-BRIEF]
next_readers: [UX, 사람]
---

# QA 브리핑 – TKT-QA-M2 로그인 2종·권한 차단 (`claude/serene-mayer-ma4ulh` 5613bf3)

판정: ❌ 반려 (브랜치 공통 C1: `origin/main` 충돌). 충돌을 풀면 M2 범위는 ⚠️ 조건부(카카오·네이버 실제 로그인은 사람 확인)

## 요약
- 권한 차단(NFR-06)은 화면·API 모두 통과했다. 비회원은 로그인으로 보내지고 돌아올 주소가 남는다. 일반 회원은 관리자 화면에서 404를 보고, 주소록 API는 401/403이다.
- 로그인 후 복귀 주소 검사(`safeNextPath`)는 공격 주소 19개가 모두 우리 origin으로 남았다. 다만 문자열 모양으로 거르는 방식이라 규칙상 이슈로 올린다(M2-1).
- 카카오·네이버 실제 로그인은 제공자 화면이 필요해 자동화하지 않았다. 사람 확인 항목이다.
- 공통 점검(게이트·DB·충돌·의존성·e2e 환경)은 `docs/06-qa/briefing-TKT-QA-01.md`에 있다.

## 수용기준 검증
| 수용기준 | 테스트 | 결과 |
|---|---|---|
| AC-05-1 | `e2e/m2-member.spec.ts` "AC-05-1" (버튼 2개, 입력 칸 0) | 통과 |
| AC-05-2 | — (카카오·네이버 OAuth) | 수동 확인 필요 |
| AC-05-3 | "AC-05-3" (메뉴 6개, 창가 → `/mypage/window`) | 통과 |
| AC-05-4 | "AC-05-4" (탈퇴 → `/`, `profiles`·`shipping_addresses` 0행) | 통과(스텁 Auth) |
| AC-05-5 | "AC-05-5" (`/auth/callback?error=…` → 안내) | 통과 |
| AC-05-6 | `e2e/privacy.spec.ts` "NFR-06 비회원…" 9개 경로 `?next=` 유지 | 통과 / 로그인 뒤 복귀는 콜백 코드 확인(`app/auth/callback/route.ts`) |
| AC-05-7 | "AC-05-7" (읽는 중 회차 → 탈퇴 거부 + 이유) | 통과 |
| AC-05-8·9 | `supabase/tests/admin_ops.test.sql` (스텁 DB ok 36) | 통과(DB) |
| AC-06-1 | `e2e/scenarios/p3-keeper.spec.ts` S3-1 | 통과(표지 업로드는 스텁 Storage) |
| AC-06-2·3 | "AC-06-2·3" | 통과 |
| AC-06-4 | S3-1 (가격 -1000 → 칸 아래 이유) | 통과 |
| AC-06-5, NFR-06 | `privacy.spec.ts` "NFR-06 일반 회원…" | 통과 |

### 복귀 주소 공격 케이스 (`shared/utils/safe-next-path.ts`)
반환값을 `new URL(값, 'http://localhost:3000')`으로 다시 해석해 origin을 봤다.

| 입력 | 결과 |
|---|---|
| `//evil.com`, `/\evil.com`, `/<탭>/evil.com`, `/<줄바꿈>/evil.com`, `https://evil.com`, `javascript:alert(1)`, `http://localhost:3001/x`, ` //evil.com`, `/\/evil.com`, `\\evil.com` | `/` (같은 origin) |
| `/%2F/evil.com`, `/%09/evil.com`, `/.//evil.com`, `/<전각 공백>/evil.com`, `/<NBSP>/evil.com`, `/<U+2028>/evil.com` | 그대로 통과하지만 해석하면 같은 origin의 경로 |
| `/products?theme=food`, `/mypage` | 그대로 (정상) |
| `http://localhost:3000/mypage` | `/` (같은 origin 절대 주소도 버림 — 기능상 문제 없음) |

## 실행 결과
| 항목 | 결과 | 분류 |
|---|---|---|
| 공통 게이트·DB·충돌 | `briefing-TKT-QA-01.md` §실행 결과 | — |
| `shared/utils/safe-next-path.test.ts` | GATE-03 76개 안에 포함, 통과 | — |
| e2e M2 관련 | `m2-member` 6, `privacy` 5, S1-4, S3-1 모두 통과 | — |

## 발견 이슈
| # | 심각도 | 위치 | 내용 | 재현 방법 | 수정안 | 확인 수준 | 담당 |
|---|---|---|---|---|---|---|---|
| M2-1 | 중 | `shared/utils/safe-next-path.ts:3-9` | `startsWith('/')`·`!startsWith('//')` 같은 문자열 모양 검사다. QA 규칙상 상으로 올리는 패턴이지만, 공격 케이스 19개가 모두 같은 origin으로 남아 지금 우회 경로는 찾지 못했다. 그래서 중으로 낮췄다. 브라우저 해석 규칙이 바뀌거나 이 함수를 다른 곳(절대 주소를 받는 곳)에 쓰면 깨질 수 있다 | 위 표 | `const url = new URL(next, 'http://x.invalid'); return url.origin === 'http://x.invalid' ? url.pathname + url.search : fallback;` (해석한 뒤 origin 비교, 경로+쿼리만 반환) | 재현 시도(우회 없음) | BE |
| M2-2 | 하 | `app/admin/layout.tsx` (부분 사전 렌더링) | 일반 회원이 `/admin`에 들어가면 화면은 404지만 HTTP 상태는 200이다. 응답 안에 관리자 화면의 정적 틀(제목 "오늘 할 일", 메뉴 이름, 숫자 자리 `–`)이 RSC 데이터로 함께 내려온다. 회원 데이터(이름·연락처·주소)는 없음을 확인했다(NFR-06 통과) | 일반 회원으로 `/admin` 요청 후 응답 본문 검색 | 상태 코드가 필요하면 `proxy.ts`에서 관리자 경로를 먼저 막는다. 정적 틀 노출은 위험이 낮아 그대로 둬도 된다 | 재현됨 | BE / 사람 |
| M2-3 | 하 | `/admin` (`app/admin/page.tsx`, `components/AdminBar.tsx`) | 같은 화면에 `aria-label="관리자 메뉴"` 탐색 영역이 2개다. 스크린 리더 랜드마크 목록에서 구분되지 않는다 | `/admin`에서 `getByRole('navigation', { name: '관리자 메뉴' })` → 2개 | 본문 쪽 이름을 "할 일 바로 가기" 등으로 바꾼다 | 재현됨 | FE |

## 사용자 관점 검증 [AI 시뮬레이션]
- SCR-05 로그인·SCR-06 마이페이지·SCR-07 배송지·SCR-08 책 관리 시안 대조: 순서·버튼 종류가 같다. 차이 1건 — SCR-08 360px 목록에 **테마 칸이 빠졌다**(시안·screens.md는 제목·테마·가격·재고·[고치기]) → `[불편]`.
- UX-15(입력 오류와 칸 연결): 배송지·새 책 폼 통과.
- UX-13 관련 탈퇴 버튼은 흐린 글자이고 빨간색이 아니다(UX-D-09). 다만 탈퇴가 **확인 없이 한 번에** 실행된다. 설계(screens.md SCR-06)대로이지만 되돌릴 수 없는 동작이라 UX가 한 번 더 보도록 남긴다.

| ID | 결과 | 단계 수 | 막힌 지점 | 관련 UX-n / AC | 스크린샷 |
|---|---|---|---|---|---|
| S1-4 (로그인 부분) | 성공 | 1 | — | AC-03-3, AC-05-1 | `docs/06-qa/screens/S1-4-login-360.jpg` |
| S3-1 | 성공 | 9 | — | AC-06-1·4, UX-15 | `docs/06-qa/screens/S3-1-invalid-1280.jpg` |

## AI 부채 체크
- 사람이 이해하기 어려운 코드/과설계: 권한 검사가 페이지(`lib/auth/guards.ts`), API(`app/api/admin/shipping-list/route.ts`), DB(RLS·`is_keeper()`) 세 층에 있고 각 층의 역할이 주석에 적혀 있어 따라가기 쉽다.
- 미래 위험과 최소화 방법: 복귀 주소 검사(M2-1)는 지금 안전하지만 모양 검사라 바꾸기 쉬운 곳이다. 위 수정안으로 바꾸고 기존 테스트에 위 표의 케이스를 더하면 회귀를 막을 수 있다.

## 추가한 테스트
- `e2e/m2-member.spec.ts` 6개, `e2e/privacy.spec.ts` 5개(NFR-06·08·09). 복귀 주소 공격 케이스는 QA 작업 폴더에서 일회성으로 돌렸다. `shared/utils/safe-next-path.test.ts`에 위 표의 케이스를 추가하라고 BE에 제안한다(QA는 단위 테스트를 쓰지 않는다).

## 사람이 결정할 것
1. **AC-05-2**: 실제 카카오·네이버 계정으로 처음 로그인 → 추가 입력 없이 회원이 되고 원래 화면으로 돌아오는지 확인한다(Supabase 대시보드 제공자 설정 필요, README §4).
2. **탈퇴 즉시 실행**(확인 없음)을 유지할지 UX와 정한다.
3. M2-1 수정안 적용 여부.
