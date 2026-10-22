import { Lamp, Mail, Mailbox, Moon } from 'lucide-react';
import type { BookshopWindowState } from '@/types/domain';
import { cn } from '@/lib/utils';

// 서점 창가 그림 4종 (REQ-021~024, AC-15-1). 택배 송장·단계 숫자는 보여주지 않는다 (AC-15-3)
// 색: 밤하늘(night) 창, 책방지기가 읽기 시작하면 촛불(candle), 발송하면 우체통(post)에 불
const STATES: Record<BookshopWindowState, { title: string; caption: string }> =
    {
        waiting: {
            title: '어두운 창가',
            caption: '책방지기에게 이번 달 마음을 적어 보내 주세요.',
        },
        letter_arrived: {
            title: '어두운 창가',
            caption: '편지가 책방에 도착했어요',
        },
        lamp_on: {
            title: '창가에 촛불이 켜졌어요',
            caption: '책방지기가 지금 편지를 읽고 책을 고르고 있어요.',
        },
        mailbox_lit: {
            title: '창가 옆 우체통에 불이 들어왔어요',
            caption: '책이 서점 문을 나섰습니다',
        },
    };

export function BookshopWindow({ state }: { state: BookshopWindowState }) {
    const view = STATES[state];
    const lampOn = state === 'lamp_on';
    const mailboxLit = state === 'mailbox_lit';
    return (
        <figure
            className="bg-card flex flex-col items-center gap-5 rounded-xl border p-6"
            aria-live="polite"
        >
            <div className="flex items-end gap-6">
                {/* 창: 나무틀(clay) 안의 밤하늘 */}
                <div
                    className="border-clay bg-night relative flex aspect-square w-40 items-center justify-center overflow-hidden rounded-t-full border-8"
                    role="img"
                    aria-label={view.title}
                >
                    <div
                        className={cn(
                            'bg-candle absolute inset-0 transition-opacity duration-1000 motion-reduce:transition-none',
                            lampOn ? 'opacity-25' : 'opacity-0',
                        )}
                        aria-hidden
                    />
                    {lampOn ? (
                        <Lamp
                            className="text-candle relative size-16 animate-pulse motion-reduce:animate-none"
                            aria-hidden
                        />
                    ) : state === 'letter_arrived' ? (
                        <Mail
                            className="text-candle-soft relative size-10"
                            aria-hidden
                        />
                    ) : (
                        <Moon
                            className="text-candle-soft relative size-10"
                            aria-hidden
                        />
                    )}
                </div>
                {/* 창가 옆 작은 우체통 */}
                <div
                    className={cn(
                        'flex size-14 items-center justify-center rounded-md border-2 transition-colors duration-700 motion-reduce:transition-none',
                        mailboxLit
                            ? 'border-post bg-post text-card'
                            : 'border-line bg-paper-2 text-ink-2',
                    )}
                    aria-hidden
                >
                    <Mailbox
                        className={cn(
                            'size-8',
                            mailboxLit &&
                                'animate-pulse motion-reduce:animate-none',
                        )}
                    />
                </div>
            </div>
            <figcaption className="flex flex-col items-center gap-1 text-center">
                <span className="typo-h3">{view.title}</span>
                <span className="text-ink-2 text-sm">{view.caption}</span>
            </figcaption>
        </figure>
    );
}
