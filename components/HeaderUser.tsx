import Link from 'next/link';
import type { CurrentUser } from '@/types/domain';
import { LogoutButton } from '@/components/LogoutButton';

// 로그인 영역. 세션은 page/layout이 <Suspense> 안에서 읽어 넘긴다 (CONV-03).
export function HeaderUser({ user }: { user: CurrentUser | null }) {
    if (!user) {
        return (
            <Link
                href="/login"
                className="hover:bg-muted rounded-md px-2 py-1 text-sm"
            >
                로그인
            </Link>
        );
    }
    return (
        <div className="flex items-center gap-1">
            {user.isAdmin ? (
                <Link
                    href="/admin"
                    className="hover:bg-muted rounded-md px-2 py-1 text-sm"
                >
                    서재 작업
                </Link>
            ) : null}
            <Link
                href="/mypage"
                className="hover:bg-muted rounded-md px-2 py-1 text-sm"
            >
                마이페이지
            </Link>
            <LogoutButton />
        </div>
    );
}
