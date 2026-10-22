'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LETTER_MAX } from '@/lib/domain/limits';

// 편지지 (REQ-019): 체크박스·설문 없이 자유 글 한 칸. 제출 중 버튼 잠금
export function LetterPaper({
    initialBody,
    label,
    submitLabel,
    pending,
    onSubmit,
    disabled = false,
}: {
    initialBody: string;
    label: string;
    submitLabel: string;
    pending: boolean;
    onSubmit: (body: string) => void;
    disabled?: boolean;
}) {
    const [body, setBody] = useState(initialBody);
    const length = body.trim().length;
    const invalid = length === 0 || body.length > LETTER_MAX;
    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
                event.preventDefault();
                if (!invalid) onSubmit(body);
            }}
        >
            <label className="flex flex-col gap-2">
                <span className="font-medium">{label}</span>
                <textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    rows={12}
                    maxLength={LETTER_MAX + 100}
                    className="bg-ruled typo-letter w-full rounded-xl border px-5 py-0"
                    placeholder="요즘 마음 날씨는 어떤가요? 읽고 싶은 책의 결을 적어 주세요."
                />
            </label>
            <div className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
                <span
                    aria-live="polite"
                    className={
                        body.length > LETTER_MAX
                            ? 'text-destructive'
                            : undefined
                    }
                >
                    {body.length} / {LETTER_MAX}자
                </span>
                <Button
                    type="submit"
                    size="lg"
                    disabled={invalid || pending || disabled}
                >
                    {pending ? '우체통으로 가는 중…' : submitLabel}
                </Button>
            </div>
            {length === 0 && body.length > 0 ? (
                <p className="text-destructive text-sm">
                    빈 편지는 보낼 수 없어요.
                </p>
            ) : null}
        </form>
    );
}
