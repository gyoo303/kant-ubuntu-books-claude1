'use client';

import { Keyboard, LockKeyhole, MailOpen, Package } from 'lucide-react';
import { useState } from 'react';
import type { BlindBook, OpenedBook } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { CodeInput } from '@/components/CodeInput';
import { apiFetch, jsonBody } from '@/lib/client/apiFetch';

const STEPS = [
    {
        icon: Package,
        title: '1. 상자를 열어요',
        text: '포장 안쪽에 작은 손글씨 카드가 들어 있어요.',
    },
    {
        icon: Keyboard,
        title: '2. 코드를 입력해요',
        text: '카드에 적힌 6자리 숫자를 그대로 입력해요.',
    },
    {
        icon: MailOpen,
        title: '3. 답장이 열려요',
        text: '책 표지와 제목, 답장 편지, 손글씨 엽서가 보여요.',
    },
];

const dateFormat = new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeZone: 'Asia/Seoul',
});
const shippedLabel = (iso: string) =>
    iso ? dateFormat.format(new Date(iso)) : '';

const timeFormat = new Intl.DateTimeFormat('ko-KR', {
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
});

// 블라인드 북: 실루엣 + 힌트 + 코드 입력칸만 (INV-01). 책 정보는 맞는 코드 뒤 서버가 내려준다.
export function BlindBookCard({
    book,
    onOpened,
}: {
    book: BlindBook;
    onOpened: (opened: OpenedBook) => void;
}) {
    const [code, setCode] = useState('');
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const valid = /^[0-9]{6}$/.test(code);

    async function open(event: React.FormEvent) {
        event.preventDefault();
        if (!valid) return;
        setPending(true);
        setMessage(null);
        const result = await apiFetch<{ opened: OpenedBook }>(
            `/api/cycles/${book.cycleId}/unbox`,
            {
                method: 'POST',
                body: jsonBody({ code }),
            },
        );
        setPending(false);
        if (result.ok) {
            onOpened(result.data.opened);
            return;
        }
        if (result.error.code === 'CODE_MISMATCH') {
            setMessage(
                `코드가 맞지 않아요. 남은 시도 ${result.error.details?.remainingAttempts ?? 0}번`,
            );
        } else if (result.error.code === 'CODE_LOCKED') {
            const until = result.error.details?.lockedUntil;
            setMessage(
                `잠시 후 다시 입력해 주세요.${typeof until === 'string' ? ` (${timeFormat.format(new Date(until))}부터 가능)` : ''}`,
            );
        } else {
            setMessage(result.error.message);
        }
    }

    return (
        <article className="bg-card grid gap-8 rounded-2xl border p-5 sm:p-8 md:grid-cols-3">
            {/* 봉인된 책: 제목·표지 없이 실루엣만 (INV-01) */}
            <div
                className="bg-night text-candle-soft flex aspect-3/4 w-full max-w-48 flex-col items-center justify-center gap-3 self-center justify-self-center rounded-lg"
                role="img"
                aria-label="아직 열지 않은 책"
            >
                <LockKeyhole className="size-10 opacity-70" aria-hidden />
                <span className="typo-eyebrow">{book.cycleNo}회차</span>
            </div>
            <div className="flex min-w-0 flex-col justify-center gap-5 md:col-span-2">
                <span className="bg-post text-card self-start rounded-full px-3 py-1 text-xs font-bold">
                    발송 완료 · {shippedLabel(book.shippedAt)}
                </span>
                <div className="flex flex-col gap-2">
                    <p className="typo-eyebrow text-olive">
                        책방지기가 남긴 힌트
                    </p>
                    <p className="typo-h3 break-keep">“{book.teaser}”</p>
                    <p className="text-ink-2 text-sm">
                        제목은 상자를 열 때 알게 돼요. 그 전까지는 힌트 한
                        문장만 먼저 보내드려요.
                    </p>
                </div>
                <form
                    onSubmit={open}
                    className="bg-paper-2 flex flex-col gap-4 rounded-2xl p-5"
                >
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        <LockKeyhole className="size-4" aria-hidden />
                        카드 속 6자리 코드
                        <span className="text-muted-foreground text-xs font-normal">
                            · 상자 속 손글씨 카드에 적혀 있어요
                        </span>
                    </p>
                    <CodeInput
                        value={code}
                        onChange={setCode}
                        disabled={pending}
                        invalid={Boolean(message)}
                        describedBy={
                            message ? `unbox-error-${book.cycleId}` : undefined
                        }
                    />
                    <Button
                        type="submit"
                        size="lg"
                        className="self-start"
                        disabled={!valid || pending}
                    >
                        {pending ? '여는 중…' : '상자 열기'}
                    </Button>
                    {message ? (
                        <p
                            id={`unbox-error-${book.cycleId}`}
                            role="alert"
                            className="text-destructive text-sm"
                        >
                            {message}
                        </p>
                    ) : null}
                </form>
            </div>
            {/* 1·2·3단계 안내 (출처: project_ubuntu_books/shopping-mall SealedUnboxingView) */}
            <ol className="grid gap-3 md:col-span-3 md:grid-cols-3">
                {STEPS.map(({ icon: Icon, title, text }) => (
                    <li
                        key={title}
                        className="border-line rounded-xl border p-4"
                    >
                        <Icon className="text-olive size-5" aria-hidden />
                        <p className="mt-3 text-sm font-medium">{title}</p>
                        <p className="text-ink-2 mt-1 text-xs leading-relaxed">
                            {text}
                        </p>
                    </li>
                ))}
            </ol>
        </article>
    );
}
