# ADR-001: 상품 데이터와 KANT Mock(`data/products.ts`)의 관계
- 상태: Accepted (user, 2026-10-21)
- 관련 계층: [레이어] [모듈 협력 구조]
- 근거: DRV-C-01, DRV-C-03, DRV-C-04, KANT-R3·C5·C6·R10, NFR-15, →ARCH-07

## 맥락
상품 원천은 Supabase여야 하고, `data/products.ts`(6개 이상, 유효 이미지 URL)는 평가 증빙이면서 실제로 쓰여야 한다(쓰이지 않으면 죽은 코드). 이미지 URL은 평가 시점에 HTTP 200이어야 한다.

## 검토한 옵션
| 옵션 | 장점 | 단점 | AI 부채 영향 | KANT 영향 | 되돌리기 비용 |
|---|---|---|---|---|---|
| A seed 원천만: `scripts/gen-seed.ts`가 `data/products.ts`로 `supabase/seed.sql`을 만든다 | 데이터 경로 1개, 가장 단순 | 실행하려면 Supabase 필요 | 낮음 | 충족 (R10은 README에 Supabase 준비 안내) | 낮음 |
| B seed 원천 + Supabase 환경변수가 없으면 Mock으로 화면 표시 | Supabase 없이 메인·목록·상세 실행 | 읽기 경로 2개 → 저장소 인터페이스 필요, 운영에서 Mock이 실수로 보일 위험 | 중 | 충족 | 중 |
| C A + `lib/domain` 단위 테스트 픽스처로도 사용 | 경로 1개 유지, Mock이 테스트에서도 쓰임 | A와 같음 | 낮음 | 충족 | 낮음 |

## 계층 관점 설명
[레이어] C는 화면 → 데이터 접근 계층 → Supabase 한 경로만 있다. `data/products.ts`는 화면 코드에서 import하지 않고, seed 생성 스크립트와 테스트만 import한다. 저장소 인터페이스(추상화)가 필요 없다.
[모듈 협력 구조] 상품을 바꾸려면 `data/products.ts` 수정 → `npm run db:seed:gen` → seed SQL 적용. 원천은 파일 한 곳이다. 단, 운영 중 재고 수량은 관리자 화면에서 바뀌므로 DB가 원천이 된다(D-004).

## 결정 / 추천
결정: **C** — 경로 하나로 단순하고, Mock이 seed와 테스트 양쪽에서 실제로 쓰인다.
- 이미지: Unsplash 원격 URL(`images.unsplash.com`)을 쓰고 `next.config.ts` `images.remotePatterns`에 등록한다. 실제 책 표지는 저작권 문제로 쓰지 않는다(공개 전 의뢰인 사진으로 교체, Q-015와 같은 임시 처리).

## 결과
- 좋아지는 점: 읽기 경로 1개, 증빙 파일이 실제로 쓰임
- 감수할 점: README만으로 실행하려면 Supabase 프로젝트 준비 필요(README에 단계 기재)
- 후속: TKT-DB-01(products·seed), TKT-QA-01(NFR-15 이미지 200 확인)
