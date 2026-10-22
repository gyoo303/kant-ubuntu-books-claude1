'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { NAV_ITEMS } from '@/components/HeaderNav';

// 작은 화면용 펼침 메뉴 (출처: project_ubuntu_books/shopping-mall HeaderMenu)
export function HeaderMenu({ userSlot }: { userSlot: ReactNode }) {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);
    const Icon = open ? X : Menu;

    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) =>
            event.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    return (
        <div className="lg:hidden">
            <button
                type="button"
                aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
                aria-expanded={open}
                aria-controls="header-menu"
                onClick={() => setOpen((value) => !value)}
                className="text-ink-2 hover:text-ink inline-flex p-1 transition-colors"
            >
                <Icon className="size-5" strokeWidth={1.6} />
            </button>
            {open ? (
                <div
                    id="header-menu"
                    className="border-line bg-paper absolute inset-x-0 top-full border-y pt-3 pb-5"
                >
                    <div className="mx-auto flex w-full max-w-6xl flex-col px-4">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={close}
                                className="border-line hover:text-olive border-b py-3 transition-colors"
                            >
                                {item.label}
                            </Link>
                        ))}
                        <div
                            className="border-line border-b py-3"
                            onClick={close}
                        >
                            {userSlot}
                        </div>
                        <Link
                            href="/subscribe/letter"
                            onClick={close}
                            className="bg-olive text-card hover:bg-olive/90 mt-4 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-bold transition-colors"
                        >
                            편지로 구독하기
                        </Link>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
