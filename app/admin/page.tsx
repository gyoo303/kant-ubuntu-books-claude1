import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { getDashboardCounts } from '@/lib/data/admin';

// SCR-15 관리자 첫 화면 (+ 주소록 엑셀, US-22)
export default async function AdminHomePage() {
    const counts = await getDashboardCounts();
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold">책방지기의 서재</h1>
            <div className="grid gap-4 md:grid-cols-2">
                <Link
                    href="/admin/workbench"
                    className="bg-card hover:bg-muted flex flex-col gap-2 rounded-xl border p-6"
                >
                    <span className="text-muted-foreground text-sm">
                        편지 읽고 책 보내기
                    </span>
                    <span className="text-3xl font-semibold">
                        {counts.cyclesToProcess}통
                    </span>
                </Link>
                <Link
                    href="/admin/orders"
                    className="bg-card hover:bg-muted flex flex-col gap-2 rounded-xl border p-6"
                >
                    <span className="text-muted-foreground text-sm">
                        보낼 주문
                    </span>
                    <span className="text-3xl font-semibold">
                        {counts.ordersToShip}건
                    </span>
                </Link>
            </div>
            <section className="flex flex-col gap-2 rounded-xl border p-6">
                <h2 className="font-medium">택배 주소록</h2>
                <p className="text-muted-foreground text-sm">
                    구독 중인 손님 모두의 이름·연락처·주소가 엑셀 파일로
                    내려받아져요.
                </p>
                {/* 파일 내려받기는 페이지 이동이 아니라 <a download> (CONV-05 예외) */}
                <a
                    href="/api/admin/address-book"
                    download
                    className={
                        buttonVariants({ variant: 'outline' }) + ' self-start'
                    }
                >
                    주소록 엑셀 받기
                </a>
            </section>
        </div>
    );
}
