'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

// 카카오·네이버 두 가지만 (REQ-016, AC-05-1, ADR-003)
// 카카오: Supabase 커스텀 provider. 내장 provider는 이메일(account_email)을 항상 요청해 비즈 앱이 아니면 KOE205
// 네이버: Supabase가 응답의 response.id를 못 읽어 서버가 직접 처리한다 (D-042, API-15a)
const PROVIDERS = [
    { id: 'custom:kakao', label: '카카오로 시작하기' },
    { id: 'naver', label: '네이버로 시작하기' },
] as const;

export function LoginButtons({ next }: { next: string }) {
    const [pending, setPending] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function signIn(provider: (typeof PROVIDERS)[number]['id']) {
        setPending(provider);
        setError(null);
        if (provider === 'naver') {
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 페이지가 아니라 네이버로 302하는 Route Handler라 전체 이동이 필요함
            window.location.assign(
                `/api/auth/naver/start?next=${encodeURIComponent(next)}`,
            );
            return;
        }
        const origin =
            process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
        const { error: signInError } =
            await createSupabaseBrowserClient().auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
                },
            });
        if (signInError) {
            setError(
                '로그인을 시작하지 못했어요. 다른 방법으로 다시 시도해 주세요.',
            );
            setPending(null);
        }
    }

    return (
        <div className="flex flex-col gap-3">
            {PROVIDERS.map((provider) => (
                <Button
                    key={provider.id}
                    size="lg"
                    variant="outline"
                    disabled={pending !== null}
                    onClick={() => signIn(provider.id)}
                >
                    {pending === provider.id ? '이동하는 중…' : provider.label}
                </Button>
            ))}
            {error ? (
                <p role="alert" className="text-destructive text-sm">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
