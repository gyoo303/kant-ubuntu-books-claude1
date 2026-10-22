# ADR-002: 서버 로직 위치
- 상태: Accepted (user, 2026-10-21)
- 관련 계층: [어플리케이션] [레이어]
- 근거: DRV-Q-01~04, RISK-01·02·10, INV-05~08·18

## 맥락
읽기, 회원 폼 쓰기, 외부 리다이렉트·Cron 수신, 여러 테이블을 묶는 트랜잭션이 함께 있다. 위치가 섞이면 권한 검사와 트랜잭션 경계가 흩어진다.

## 검토한 옵션
| 옵션 | 장점 | 단점 | AI 부채 영향 | KANT 영향 | 되돌리기 비용 |
|---|---|---|---|---|---|
| A 모두 Route Handler(REST) | 한 가지 방식 | 폼마다 fetch·상태 코드 처리 코드가 늘어남 | 중 | 무관 | 중 |
| B Server Components(읽기) + Server Actions(폼 쓰기) + Route Handlers(외부 수신) + Postgres RPC(다중 테이블 트랜잭션) | 각 일이 맞는 곳에, 트랜잭션은 DB가 보장 | 네 가지 위치 규칙을 지켜야 함 | 낮음 — 규칙이 표로 고정됨 | 무관 | 중 |
| C B + Supabase Edge Functions(결제·Cron) | Supabase 안에서 Cron 가능 | 런타임·배포가 하나 더(Deno), 비밀값 두 곳 | 높음 | 무관 | 높음 |

## 계층 관점 설명
[어플리케이션] 하나의 Next.js 앱이 화면·API·외부 수신을 모두 맡는다. 관리자 화면도 같은 앱의 `/admin` 아래, 관리자 API는 `/api/admin/**` 아래다.
[레이어] 쓰기는 브라우저 → `app/api/**/route.ts` → (단일 테이블) 데이터 접근 함수 또는 (다중 테이블) `security definer` RPC. 다중 테이블 변경은 RPC 하나로 묶고 상태 조건(`where status = '...'`)으로 멱등하게 만든다.

## 결정 / 추천
결정: **A 변형** (사용자 선택 A + 적용 범위 확인, 2026-10-21)
| 일 | 위치 |
|---|---|
| 화면 읽기 (KANT 목록·상세 포함) | Server Components → 데이터 접근 함수 직접 호출 (자기 API를 다시 fetch하지 않음) |
| 모든 쓰기 (회원·관리자) | Route Handlers `app/api/**/route.ts` (JSON 요청·응답) |
| 외부 수신 (OAuth 콜백, 토스 리다이렉트, Cron, 엑셀) | Route Handlers |
| 다중 테이블 트랜잭션 | Route Handler가 Postgres RPC 호출 |
| Server Actions | 쓰지 않는다 |

## 결과
- 좋아지는 점: 쓰기 진입점이 `app/api/**` 한 종류라 권한·검증 위치가 고정, API를 curl로 테스트 가능
- 감수할 점: 클라이언트 폼이 fetch·응답 처리를 직접 한다 → 공용 `apiFetch` 1개로 통일(A4)
- 후속: `04-interfaces-api.md` API 표, TKT-DB(RPC), TKT-BE(Route Handlers)
