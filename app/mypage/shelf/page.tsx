import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Shelf } from './Shelf';
import { getMyShelf } from '@/lib/data/me';
import { getCurrentUser } from '@/lib/data/session';

async function ShelfContent() {
    const user = await getCurrentUser();
    if (!user) redirect('/login?next=/mypage/shelf');
    const { blind, opened } = await getMyShelf();
    return <Shelf blind={blind} opened={opened} />;
}

// SCR-13 나의 서가
export default function ShelfPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold">나의 서가</h1>
            <Suspense
                fallback={
                    <p className="text-muted-foreground text-sm">
                        서가를 둘러보는 중…
                    </p>
                }
            >
                <ShelfContent />
            </Suspense>
        </div>
    );
}
