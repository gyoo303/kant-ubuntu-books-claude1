'use client';

import { X, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

// 손글씨 엽서 사진 + 크게 보기 (출처: project_ubuntu_books/shopping-mall UnboxingPostcard)
// 서명 URL은 이미지 최적화 캐시에 넣지 않는다(unoptimized).
export function PostcardPhoto({ url }: { url: string }) {
    const [open, setOpen] = useState(false);
    const closeRef = useRef<HTMLButtonElement>(null);
    const openRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        closeRef.current?.focus();
        const onKey = (event: KeyboardEvent) =>
            event.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    function close() {
        setOpen(false);
        openRef.current?.focus();
    }

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <div className="bg-card relative aspect-4/3 w-full max-w-xs -rotate-2 overflow-hidden rounded-sm shadow-lg">
                <Image
                    src={url}
                    alt="책방지기의 손글씨 엽서"
                    fill
                    sizes="320px"
                    className="object-cover"
                    unoptimized
                />
            </div>
            <div>
                <p className="font-bold">손글씨 엽서</p>
                <p className="text-ink-2 mt-1 text-sm">
                    상자 속 엽서를 함께 보관해요.
                </p>
                <button
                    ref={openRef}
                    type="button"
                    onClick={() => setOpen(true)}
                    className="border-line hover:border-olive mt-3 inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition-colors"
                >
                    <ZoomIn className="size-4" strokeWidth={1.8} aria-hidden />
                    크게 보기
                </button>
            </div>
            {open ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="손글씨 엽서 크게 보기"
                    className="bg-ink/70 fixed inset-0 z-50 grid place-items-center p-4"
                    onClick={close}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        className="relative w-full max-w-3xl"
                    >
                        <div className="bg-card relative aspect-4/3 w-full overflow-hidden rounded-sm">
                            <Image
                                src={url}
                                alt="책방지기의 손글씨 엽서 (크게)"
                                fill
                                sizes="768px"
                                className="object-contain"
                                unoptimized
                            />
                        </div>
                        <button
                            ref={closeRef}
                            type="button"
                            onClick={close}
                            aria-label="닫기"
                            className="bg-ink text-card absolute -top-4 -right-4 grid size-9 place-items-center rounded-full"
                        >
                            <X className="size-4" aria-hidden />
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
