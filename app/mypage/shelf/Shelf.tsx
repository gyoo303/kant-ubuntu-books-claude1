'use client';

import { useState } from 'react';
import type { BlindBook, OpenedBook } from '@/types/domain';
import { BlindBookCard } from '@/components/BlindBookCard';
import { EmptyState } from '@/components/EmptyState';
import { OpenedBookCard } from '@/components/OpenedBookCard';

// 블라인드 북을 열면 그 자리에서 열린 책으로 바뀐다
export function Shelf({
    blind,
    opened,
}: {
    blind: BlindBook[];
    opened: OpenedBook[];
}) {
    const [blindBooks, setBlindBooks] = useState(blind);
    const [openedBooks, setOpenedBooks] = useState(opened);
    const [justOpened, setJustOpened] = useState<string | null>(null);

    if (blindBooks.length === 0 && openedBooks.length === 0) {
        return (
            <EmptyState
                title="아직 서가에 도착한 책이 없어요"
                description="책방지기가 책을 보내면 여기에 꽂혀요."
                href="/mypage"
                linkLabel="마이페이지로"
            />
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {blindBooks.map((book) => (
                <BlindBookCard
                    key={book.cycleId}
                    book={book}
                    onOpened={(openedBook) => {
                        setBlindBooks((current) =>
                            current.filter(
                                (item) => item.cycleId !== book.cycleId,
                            ),
                        );
                        setOpenedBooks((current) => [openedBook, ...current]);
                        setJustOpened(openedBook.cycleId);
                    }}
                />
            ))}
            {openedBooks.map((book) => (
                <OpenedBookCard
                    key={book.cycleId}
                    book={book}
                    justOpened={book.cycleId === justOpened}
                />
            ))}
        </div>
    );
}
