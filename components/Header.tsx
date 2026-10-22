import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { CartLink } from '@/components/CartLink';
import { HeaderMenu } from '@/components/HeaderMenu';
import { HeaderNav, NavLinks } from '@/components/HeaderNav';

// KANT-R4, C7: 모든 화면 공통 상단 (디자인 출처: project_ubuntu_books/shopping-mall Header)
// 로그인 영역(userSlot)은 layout이 넘기고, 여기서 <Suspense>로 감싼다 (CONV-03).
const loginFallback = (
    <Link
        href="/login"
        className="text-ink-2 hover:text-ink text-sm transition-colors"
    >
        로그인
    </Link>
);

export default function Header({ userSlot }: { userSlot: ReactNode }) {
    return (
        <header className="border-line bg-paper/95 sticky top-0 z-50 w-full border-b backdrop-blur-sm">
            <div className="relative mx-auto flex h-16 w-full max-w-6xl items-center gap-10 px-4">
                <Link href="/" className="flex shrink-0 items-baseline gap-2">
                    <span className="text-lg font-medium">우분투북스</span>
                    <span className="text-muted-foreground typo-eyebrow hidden text-xs sm:inline">
                        UBUNTU BOOKS
                    </span>
                </Link>

                <Suspense fallback={<NavLinks pathname={null} />}>
                    <HeaderNav />
                </Suspense>

                <div className="ml-auto flex items-center gap-4">
                    <CartLink />
                    <div className="hidden items-center lg:flex">
                        <Suspense fallback={loginFallback}>{userSlot}</Suspense>
                    </div>
                    <Link
                        href="/subscribe/letter"
                        className="bg-ink text-card hover:bg-ink-2 hidden h-8 items-center rounded-full px-4 text-xs font-bold transition-colors lg:inline-flex"
                    >
                        편지로 구독하기
                    </Link>
                    <HeaderMenu
                        userSlot={
                            <Suspense fallback={loginFallback}>
                                {userSlot}
                            </Suspense>
                        }
                    />
                </div>
            </div>
        </header>
    );
}
