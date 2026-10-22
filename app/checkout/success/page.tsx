import Link from 'next/link';
import { ClearOrderedItems } from './ClearOrderedItems';
import { buttonVariants } from '@/components/ui/button';

// SCR-10 결제 성공
export default function CheckoutSuccessPage() {
    return (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-12 text-center">
            <ClearOrderedItems />
            <h1 className="text-2xl font-semibold">주문이 접수되었어요</h1>
            <p className="text-muted-foreground break-keep">
                책방지기가 정성껏 포장해서 보내드릴게요. 주문 상태는
                마이페이지에서 볼 수 있어요.
            </p>
            <Link href="/mypage" className={buttonVariants()}>
                마이페이지로
            </Link>
        </div>
    );
}
