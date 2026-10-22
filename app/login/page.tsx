import { Suspense } from 'react';
import { DevLoginPanel } from '@/components/DevLoginPanel';
import { LoginButtons } from '@/components/LoginButtons';
import { safeNextPath } from '@/lib/domain/redirect';
import { serverEnv } from '@/lib/env';

async function LoginContent({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;
    const next = safeNextPath(
        typeof params.next === 'string' ? params.next : null,
    );
    const cancelled = params.error === 'cancelled';
    return (
        <div className="mx-auto flex max-w-sm flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold">로그인</h1>
                <p className="text-muted-foreground text-sm break-keep">
                    아이디와 비밀번호 없이, 쓰시던 계정으로 바로 시작해요.
                </p>
            </div>
            {cancelled ? (
                <p role="alert" className="rounded-lg border p-3 text-sm">
                    로그인이 취소되었습니다
                </p>
            ) : null}
            <LoginButtons next={next} />
            {serverEnv.devTestLoginEnabled() ? (
                <DevLoginPanel next={next} />
            ) : null}
        </div>
    );
}

// SCR-05 로그인
export default function LoginPage(props: PageProps<'/login'>) {
    return (
        <Suspense fallback={null}>
            <LoginContent searchParams={props.searchParams} />
        </Suspense>
    );
}
