# ADR-003: 인증(카카오·네이버)과 관리자 판별
- 상태: Accepted (user, 2026-10-21)
- 관련 계층: [인프라]
- 근거: DRV-C-05, DRV-C-09, RISK-06, RISK-09, INV-13, →ARCH-01·02

## 맥락
카카오는 Supabase Auth 내장 provider다. 네이버는 내장이 아니다. Supabase는 커스텀 OAuth2 provider(무료 플랜 3개까지, `custom:` 식별자, `signInWithOAuth({ provider: "custom:naver" })`)를 지원하지만, 네이버 사용자 정보 응답은 `response` 객체 안에 중첩되어 있고 Supabase 문서에는 중첩 필드 매핑 설명이 없다(RISK-09). 관리자는 1명이고 같은 소셜 로그인을 쓴다.

## 검토한 옵션 (네이버)
| 옵션 | 장점 | 단점 | AI 부채 영향 | KANT 영향 | 되돌리기 비용 |
|---|---|---|---|---|---|
| A 커스텀 OAuth2 `custom:naver` (확인 티켓 TKT-BE-00 선행) | 카카오와 같은 호출, 세션 발급을 Supabase가 함 | 중첩 응답을 못 읽으면 동작 안 함 → 확인 전까지 불확실 | 낮음 (성공 시) | 무관 | 낮음 |
| B 서버가 네이버 OAuth를 직접 처리 → service role로 사용자 생성 → 매직링크 토큰으로 세션 발급 | 응답 구조와 무관하게 동작(커뮤니티 사례 있음) | 세션 발급을 우리 코드가 맡음, service role 사용 경로 증가 | 중 — 보안 민감 코드 증가 | 무관 | 중 |

## 관리자 판별
- `profiles.is_admin boolean not null default false`. 값은 SQL(대시보드 또는 운영 스크립트)로만 바꾸고 앱에는 쓰기 경로가 없다.
- RLS·서버 코드는 `public.is_admin()`(`security definer`, `auth.uid()` 기준) 하나로 판단한다.
- 책방지기도 카카오 또는 네이버로 로그인한다(별도 로그인 수단 없음).

## 결정 / 추천
결정: **A + 확인 티켓 선행, 실패하면 B로 전환** — TKT-BE-00에서 네이버 테스트 계정으로 로그인해 `auth.identities`에 네이버 id가 식별자로 남는지 확인한다. 실패하면 이 ADR을 B로 갱신(Superseded)하고 사용자에게 알린다.
- 이메일: 두 제공자 모두 이메일 동의를 필수로 받지 않는다. 카카오 provider는 "이메일 없는 사용자 허용", 네이버 커스텀 provider는 `email_optional: true`.

## 결과
- 좋아지는 점: 관리자 판별이 한 함수로 고정, 앱에 권한 상승 경로 없음
- 감수할 점: 네이버는 확인 전까지 불확실(M2 리스크)
- 후속: TKT-BE-00(네이버 확인), TKT-DB-02(profiles·is_admin), TKT-BE-02(로그인 콜백)

## 갱신 (2026-10-22)
- ~~네이버: 사용자가 `custom:naver`로 실제 로그인에 성공했다~~ → 정정: 동의 화면까지만 됐고, 로그인은 `error missing provider id`로 실패했다(서버 로그 `[API-15]`). 카카오도 같은 오류.
- 카카오: 내장 provider `kakao`는 동의항목 `account_email`을 항상 요청해, 이메일 동의항목이 없는(비즈 앱이 아닌) 카카오 앱에서는 `KOE205`로 막혔다. 네이버와 같은 커스텀 provider `custom:kakao`(Scopes `profile_nickname,profile_image`)로 바꿨다(D-041). 이메일을 받지 않는다는 위 결정과 맞는다.
- 카카오 실제 로그인 성공과 `auth.identities` 식별자 확인은 아직 하지 않음.

## 갱신 2 (2026-10-22): 네이버 → B안 (D-042)
- 원인: Supabase 커스텀 OAuth2 provider는 사용자 정보에서 회원 id를 찾지 못하면 `missing provider id`로 실패한다. 네이버는 `response.id`(중첩), 카카오는 숫자 `id`(sub 없음)라 둘 다 실패. 설정 화면에 필드 매핑이 없다.
- 네이버: B안으로 전환. `GET /api/auth/naver/start`(API-15a)가 state를 httpOnly 쿠키(경로 `/api/auth/naver`, 10분)에 두고 네이버로 보낸다. `GET /api/auth/naver/callback`(API-15b)이 state를 비교하고, 서버에서 토큰·프로필(`/v1/nid/me`)을 받아 `naver-<sha256(id) 앞 40자>@users.ubuntubooks.test` 회원을 `admin.generateLink({ type: 'magiclink' })`로 찾거나 만든 뒤 `verifyOtp`로 세션 쿠키를 심는다. 메일은 보내지 않는다.
- 카카오: 카카오 OpenID Connect를 켜고 `custom:kakao`를 Auto-discovery(Issuer `https://kauth.kakao.com`, Scopes `openid,profile_nickname,profile_image`)로 바꾸면 표준 `sub`가 생긴다 — 설정 변경, 동작 확인 전.
- 감수할 점: 세션 발급을 우리 코드가 맡는다(보안 민감 코드 증가). service role 사용 위치에 `lib/api/naverLogin.ts` 추가(금지 패턴 9).
