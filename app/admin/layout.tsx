import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { getCurrentUser } from '@/lib/data/session';

// 관리자만 (INV-13, AC-07-2). 세션 읽기는 <Suspense> 안에서 (CONV-03)
async function AdminGuard({ children }: { children: ReactNode }) {
    const user = await getCurrentUser();
    if (!user) redirect('/login?next=/admin');
    if (!user.isAdmin) redirect('/');
    return <>{children}</>;
}

const MENU = [
    { href: '/admin', label: '처음' },
    { href: '/admin/workbench', label: '서재 작업' },
    { href: '/admin/orders', label: '주문 목록' },
    { href: '/admin/stock', label: '재고' },
    { href: '/admin/farewell-letters', label: '인사 편지' },
    { href: '/admin/farewell-inbox', label: '작별 편지함' },
];

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
    return (
        <div className="flex flex-col gap-6">
            <nav
                aria-label="서재 작업 메뉴"
                className="flex flex-wrap gap-2 border-b pb-3 text-sm"
            >
                {MENU.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="hover:bg-muted rounded-md px-3 py-1.5"
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>
            <Suspense
                fallback={
                    <p className="text-muted-foreground text-sm">
                        확인하는 중…
                    </p>
                }
            >
                <AdminGuard>{children}</AdminGuard>
            </Suspense>
        </div>
    );
}
