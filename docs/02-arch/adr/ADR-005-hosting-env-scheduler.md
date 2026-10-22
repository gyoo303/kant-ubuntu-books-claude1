# ADR-005: 배포·환경변수·스케줄러
- 상태: Accepted (user, 2026-10-21)
- 관련 계층: [인프라]
- 근거: DRV-C-01·06, DRV-Q-04, RISK-08·13, KANT-R10, NFR-13·18

## 맥락
매달 자동결제를 거는 스케줄러가 필요하고(ADR-004), 비밀값(service role, 토스 시크릿)을 클라이언트에 노출하지 않아야 한다. 운영자는 비전문가이고 결제는 테스트 모드다.

## 검토한 옵션
| 옵션 | 장점 | 단점 | AI 부채 영향 | KANT 영향 | 되돌리기 비용 |
|---|---|---|---|---|---|
| A Vercel + Supabase 클라우드 프로젝트 1개 + Vercel Cron 하루 1회 → `/api/cron/billing` (`CRON_SECRET` 확인) | 부품 최소, 비밀값은 Vercel 한 곳 | 개발·시연이 같은 DB(테스트 모드라 허용) | 낮음 | 충족 | 낮음 |
| B A + 로컬 개발은 `supabase start`(Docker) | 개발 데이터 분리 | 제3자 실행에 Docker 필요 | 중 | 위험 (R10 실행 난이도) | 중 |
| C Supabase `pg_cron` + `pg_net`으로 Next Route 호출 | 스케줄이 DB 안 | 비밀값이 DB에도 필요, 디버깅 어려움 | 중 | 무관 | 중 |

## 결정 / 추천
결정: **A**
| 환경변수 | 공개 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 공개 | Supabase 주소 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 공개 | publishable(anon) 키, RLS 적용 |
| `SUPABASE_SERVICE_ROLE_KEY` | 비밀 | 서버 전용: Cron·결제 처리·빌링키 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 공개 | 토스 테스트 클라이언트 키 |
| `TOSS_SECRET_KEY` | 비밀 | 토스 테스트 시크릿 키 |
| `CRON_SECRET` | 비밀 | Cron 요청 확인 |
| `NEXT_PUBLIC_SITE_URL` | 공개 | OAuth·결제 리다이렉트 기준 주소 |
- 카카오·네이버 키는 Supabase 대시보드에만 둔다(앱 환경변수 아님).
- 마이그레이션은 `supabase db push`로 클라우드에 적용한다.

## 결과
- 좋아지는 점: 비밀값 위치 한 곳, 스케줄러 1개
- 감수할 점: Vercel Hobby Cron은 하루 1회 → 결제 시각은 "그날 1회"
- 후속: TKT-BE(cron route), TKT-QA(GATE-05 비밀값 점검), README 환경변수 절
