'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch, jsonBody } from '@/lib/client/apiFetch';

// 개발 전용 테스트 로그인 (D-034). 서버가 개발 환경에서만 이 컴포넌트를 렌더한다.
const ROLES = [
    { role: 'member', label: '테스트 손님' },
    { role: 'member2', label: '테스트 손님 2' },
    { role: 'admin', label: '테스트 책방지기' },
] as const;

export function DevLoginPanel({ next }: { next: string }) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function login(role: (typeof ROLES)[number]['role']) {
        setPending(true);
        setError(null);
        const result = await apiFetch<{ ok: true }>('/api/dev/login', {
            method: 'POST',
            body: jsonBody({ role }),
        });
        if (!result.ok) {
            setError(result.error.message);
            setPending(false);
            return;
        }
        // 로그인 전에 미리 받아 둔 화면(로그인 리다이렉트 포함)을 버리도록 전체 이동한다
        window.location.assign(
            role === 'admin' && next === '/' ? '/admin' : next,
        );
    }

    return (
        <section className="flex flex-col gap-3 rounded-xl border border-dashed p-4">
            <p className="text-sm font-medium">개발 전용 테스트 로그인</p>
            <p className="text-muted-foreground text-xs">
                로컬 개발 환경에서만 보입니다. 배포 환경에서는 꺼집니다.
            </p>
            <div className="flex flex-wrap gap-2">
                {ROLES.map((item) => (
                    <Button
                        key={item.role}
                        variant="secondary"
                        disabled={pending}
                        onClick={() => login(item.role)}
                    >
                        {item.label}
                    </Button>
                ))}
            </div>
            {error ? (
                <p role="alert" className="text-destructive text-sm">
                    {error}
                </p>
            ) : null}
        </section>
    );
}
