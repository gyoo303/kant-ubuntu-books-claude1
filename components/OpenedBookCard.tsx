'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { OpenedBook } from '@/types/domain';
import { PostcardPhoto } from '@/components/PostcardPhoto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch, jsonBody } from '@/lib/client/apiFetch';
import { MEMO_MAX } from '@/lib/domain/limits';
import { cn } from '@/lib/utils';

const dateFormat = new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeZone: 'Asia/Seoul',
});

// 열린 책: 표지·제목·답장·엽서 + 한 줄 메모 (US-19·20). 별점·공유·댓글 없음 (AC-20-3)
export function OpenedBookCard({
    book,
    justOpened = false,
}: {
    book: OpenedBook;
    justOpened?: boolean;
}) {
    const [revealed, setRevealed] = useState(!justOpened);
    const [memo, setMemo] = useState(book.memo);
    const [draft, setDraft] = useState(book.memo?.body ?? '');
    const [editing, setEditing] = useState(!book.memo);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 방금 연 책은 실루엣이 걷히는 전환 (2초 안, 움직임 줄이기면 즉시) — AC-19-3·4
    useEffect(() => {
        if (revealed) return;
        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        const timer = window.setTimeout(
            () => setRevealed(true),
            reduced ? 0 : 50,
        );
        return () => window.clearTimeout(timer);
    }, [revealed]);

    async function saveMemo(event: React.FormEvent) {
        event.preventDefault();
        setPending(true);
        setError(null);
        const result = await apiFetch<{ body: string; updatedAt: string }>(
            `/api/cycles/${book.cycleId}/memo`,
            {
                method: 'PUT',
                body: jsonBody({ body: draft }),
            },
        );
        setPending(false);
        if (!result.ok) {
            setError(result.error.message);
            return;
        }
        setMemo(result.data);
        setEditing(false);
    }

    async function deleteMemo() {
        setPending(true);
        const result = await apiFetch(`/api/cycles/${book.cycleId}/memo`, {
            method: 'DELETE',
        });
        setPending(false);
        if (!result.ok) {
            setError(result.error.message);
            return;
        }
        setMemo(null);
        setDraft('');
        setEditing(true);
    }

    return (
        <article className="bg-card flex flex-col gap-5 rounded-xl border p-5">
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="bg-foreground relative aspect-3/4 w-28 shrink-0 overflow-hidden rounded-lg">
                    <Image
                        src={book.product.imageUrl}
                        alt={`${book.product.name} 표지`}
                        fill
                        sizes="112px"
                        className={cn(
                            'object-cover transition-all duration-1500 motion-reduce:transition-none',
                            revealed
                                ? 'opacity-100 blur-none'
                                : 'opacity-0 blur-md',
                        )}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <p className="text-muted-foreground text-sm">
                        {book.cycleNo}회차
                    </p>
                    <h3 className="text-lg font-semibold break-keep">
                        {book.product.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        {book.product.author}
                    </p>
                </div>
            </div>
            <section
                className={cn(
                    'flex flex-col gap-6 transition-opacity duration-1500 motion-reduce:transition-none',
                    revealed ? 'opacity-100' : 'opacity-0',
                )}
            >
                {/* 줄노트 편지지에 쓴 답장 (출처: project_ubuntu_books/shopping-mall UnboxingLetter) */}
                <article className="border-line bg-letter rounded-2xl border px-6 py-8 shadow-sm md:px-12 md:py-12">
                    <p className="text-olive text-sm">
                        From. 우분투북스 책방지기
                    </p>
                    <h4 className="typo-h3 mt-2">{book.cycleNo}회차 답장</h4>
                    <p className="bg-ruled typo-letter mt-5 max-w-xl break-keep whitespace-pre-line">
                        {book.replyLetter}
                    </p>
                    <p className="text-ink-2 mt-5 text-right">
                        — 어은동에서, 책방지기
                    </p>
                </article>
                {book.postcardUrl ? (
                    <PostcardPhoto url={book.postcardUrl} />
                ) : null}
            </section>
            <section className="flex flex-col gap-2 border-t pt-4">
                <h4 className="text-sm font-medium">나만의 한 줄</h4>
                {memo && !editing ? (
                    <div className="flex flex-wrap items-center gap-3">
                        <p className="break-keep">{memo.body}</p>
                        <span className="text-muted-foreground text-xs">
                            {dateFormat.format(new Date(memo.updatedAt))}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditing(true)}
                        >
                            고치기
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            onClick={deleteMemo}
                        >
                            지우기
                        </Button>
                    </div>
                ) : (
                    <form
                        onSubmit={saveMemo}
                        className="flex flex-wrap items-center gap-2"
                    >
                        <Input
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            placeholder="이 책을 덮으며 남기고 싶은 한 줄"
                            className="max-w-md flex-1"
                            aria-label="한 줄 메모"
                        />
                        <span
                            className={cn(
                                'text-xs',
                                draft.length > MEMO_MAX
                                    ? 'text-destructive'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {draft.length}/{MEMO_MAX}
                        </span>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={
                                pending ||
                                draft.trim().length === 0 ||
                                draft.length > MEMO_MAX
                            }
                        >
                            저장
                        </Button>
                    </form>
                )}
                {error ? (
                    <p role="alert" className="text-destructive text-sm">
                        {error}
                    </p>
                ) : null}
            </section>
        </article>
    );
}
