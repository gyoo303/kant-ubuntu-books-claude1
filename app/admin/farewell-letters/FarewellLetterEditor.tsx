'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch, jsonBody } from '@/lib/client/apiFetch';
import { LETTER_MAX } from '@/lib/domain/limits';

// 손님별 마지막 인사 편지 미리 쓰기 (Should, US-23)
export function FarewellLetterEditor({
    userId,
    name,
    initial,
}: {
    userId: string;
    name: string;
    initial: string | null;
}) {
    const [body, setBody] = useState(initial ?? '');
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    return (
        <form
            className="flex flex-col gap-2 rounded-xl border p-4"
            onSubmit={async (event) => {
                event.preventDefault();
                setPending(true);
                setMessage(null);
                const result = await apiFetch(
                    `/api/admin/farewell-letters/${userId}`,
                    { method: 'PUT', body: jsonBody({ body }) },
                );
                setPending(false);
                setMessage(result.ok ? '저장했어요' : result.error.message);
            }}
        >
            <label className="flex flex-col gap-2">
                <span className="font-medium">{name}님께</span>
                <textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    rows={5}
                    className="bg-card max-w-xl rounded-lg border p-3 leading-relaxed"
                    placeholder="비워 두면 기본 인사 편지가 보여요."
                />
            </label>
            <div className="flex items-center gap-3 text-sm">
                <Button
                    type="submit"
                    size="sm"
                    disabled={
                        pending ||
                        body.trim().length === 0 ||
                        body.length > LETTER_MAX
                    }
                >
                    저장
                </Button>
                {message ? (
                    <span className="text-muted-foreground">{message}</span>
                ) : null}
            </div>
        </form>
    );
}
