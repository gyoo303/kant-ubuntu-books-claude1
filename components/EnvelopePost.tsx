'use client';

import { Mail, Mailbox } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// [우체통에 편지 넣기] 뒤 봉투가 닫히며 우체통으로 들어가는 전환 (REQ-020, AC-12-3·4)
// 0.1초 뒤 시작, 2.4초 안에 완료 메시지. 움직임 줄이기 설정이면 전환 없이 바로 완료.
export function EnvelopePost({ message }: { message: string }) {
    const [phase, setPhase] = useState<'start' | 'closing' | 'posted'>('start');

    useEffect(() => {
        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        const closing = window.setTimeout(
            () => setPhase(reduced ? 'posted' : 'closing'),
            reduced ? 0 : 100,
        );
        const posted = window.setTimeout(
            () => setPhase('posted'),
            reduced ? 0 : 2400,
        );
        return () => {
            window.clearTimeout(closing);
            window.clearTimeout(posted);
        };
    }, []);

    return (
        <div className="flex flex-col items-center gap-6 py-10 text-center">
            <div
                className="relative flex h-40 w-56 items-end justify-center"
                aria-hidden
            >
                <Mailbox className="text-muted-foreground size-20" />
                <Mail
                    className={cn(
                        'absolute size-16 transition-all duration-2000 ease-in-out motion-reduce:transition-none',
                        phase === 'start' && 'top-0 scale-110 opacity-100',
                        phase === 'closing' && 'top-24 scale-50 opacity-60',
                        phase === 'posted' && 'top-24 scale-0 opacity-0',
                    )}
                />
            </div>
            <div
                role="status"
                className={cn(
                    'flex flex-col items-center gap-3',
                    phase !== 'posted' && 'invisible',
                )}
            >
                <p className="text-lg font-medium">{message}</p>
                <Link href="/mypage" className={buttonVariants()}>
                    마이페이지 창가 보기
                </Link>
            </div>
        </div>
    );
}
