'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// 주요 메뉴 (출처: project_ubuntu_books/shopping-mall HeaderNav). 현재 화면 메뉴를 굵게 표시한다.
export const NAV_ITEMS = [
    { href: '/about', label: '책방 소개' },
    { href: '/products', label: '테마 서가' },
    { href: '/subscribe', label: '손편지 구독' },
] as const;

function isActive(pathname: string | null, href: string) {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
}

// 경로를 모를 때(Suspense fallback)는 pathname=null로 그린다
export function NavLinks({ pathname }: { pathname: string | null }) {
    return (
        <nav aria-label="주요 메뉴" className="hidden gap-8 lg:flex">
            {NAV_ITEMS.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    aria-current={
                        isActive(pathname, item.href) ? 'page' : undefined
                    }
                    className={cn(
                        'text-ink-2 hover:text-ink text-sm transition-colors',
                        isActive(pathname, item.href) && 'text-ink font-bold',
                    )}
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}

// Cache Components 환경에서 usePathname은 Suspense 경계 안에서 쓴다
export function HeaderNav() {
    return <NavLinks pathname={usePathname()} />;
}
