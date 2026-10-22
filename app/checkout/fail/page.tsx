import Link from 'next/link';
import { Suspense } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { API_ERRORS, isApiErrorCode } from '@/types/api';

async function FailMessage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const code = (await searchParams).code;
    const reason =
        typeof code === 'string' &&
        isApiErrorCode(code) &&
        code !== 'PAYMENT_FAILED'
            ? API_ERRORS[code].message
            : null;
    return reason ? <p className="text-muted-foreground">{reason}</p> : null;
}

// SCR-10 결제 실패 (AC-09-4·5·6)
export default function CheckoutFailPage(props: PageProps<'/checkout/fail'>) {
    return (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-12 text-center">
            <h1 className="text-2xl font-semibold">
                결제가 완료되지 않았습니다
            </h1>
            <Suspense fallback={null}>
                <FailMessage searchParams={props.searchParams} />
            </Suspense>
            <p className="text-muted-foreground text-sm">
                장바구니는 그대로 남아 있어요.
            </p>
            <Link
                href="/cart"
                className={buttonVariants({ variant: 'outline' })}
            >
                장바구니로
            </Link>
        </div>
    );
}
