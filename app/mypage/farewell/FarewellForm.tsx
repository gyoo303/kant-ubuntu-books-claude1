'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { apiFetch, jsonBody } from '@/lib/client/apiFetch';
import { FAREWELL_NOTE_MAX } from '@/lib/domain/limits';

// 작별 글(비워도 됨, D-018) + [구독을 마무리합니다] 한 번으로 해지 (INV-12). 경고·팝업·유예 없음
export function FarewellForm() {
    const [note, setNote] = useState('');
    const [pending, setPending] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (done) {
        return (
            <div role="status" className="flex flex-col gap-3">
                <p className="text-lg font-medium">
                    구독이 마무리되었어요. 그동안 고마웠습니다.
                </p>
                <p className="text-muted-foreground text-sm">
                    이미 보낸 책은 나의 서가에서 계속 열어 볼 수 있어요.
                </p>
                <Link
                    href="/"
                    className={buttonVariants({ variant: 'outline' })}
                >
                    메인으로
                </Link>
            </div>
        );
    }

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={async (event) => {
                event.preventDefault();
                setPending(true);
                setError(null);
                const result = await apiFetch('/api/subscriptions/cancel', {
                    method: 'POST',
                    body: jsonBody({ note }),
                });
                setPending(false);
                if (!result.ok) {
                    setError(result.error.message);
                    return;
                }
                setDone(true);
            }}
        >
            <label className="flex flex-col gap-2">
                <span className="font-medium">
                    책방지기에게 남기는 마지막 안부
                </span>
                <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={6}
                    maxLength={FAREWELL_NOTE_MAX}
                    className="bg-card max-w-xl rounded-xl border p-4 leading-relaxed"
                    placeholder="서운했던 점이나 마지막 안부를 자유롭게 적어 주세요. 비워 두어도 괜찮아요."
                />
            </label>
            <p className="text-muted-foreground text-sm">
                이미 결제된 회차의 책은 그대로 보내드려요.
            </p>
            <div>
                <Button type="submit" size="lg" disabled={pending}>
                    {pending ? '마무리하는 중…' : '구독을 마무리합니다'}
                </Button>
            </div>
            {error ? (
                <p role="alert" className="text-destructive text-sm">
                    {error}
                </p>
            ) : null}
        </form>
    );
}
