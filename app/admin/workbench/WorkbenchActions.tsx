'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch, jsonBody } from '@/lib/client/apiFetch';
import { POSTCARD_MAX_BYTES, REPLY_MAX, TEASER_MAX } from '@/lib/domain/limits';

// 서재 작업 화면의 버튼·입력. 저장할 때마다 router.refresh()로 서버 화면을 다시 그린다.
function useAction() {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    async function run<T>(
        request: () => Promise<
            | { ok: true; data: T }
            | {
                  ok: false;
                  error: {
                      message: string;
                      details?: Record<string, string | number | null>;
                  };
              }
        >,
    ) {
        setPending(true);
        setError(null);
        const result = await request();
        setPending(false);
        if (!result.ok) {
            const missing = result.error.details?.missing;
            setError(
                missing
                    ? `${result.error.message} (빠진 것: ${missing})`
                    : result.error.message,
            );
            return null;
        }
        router.refresh();
        return result.data;
    }
    return { pending, error, run };
}

function ErrorText({ error }: { error: string | null }) {
    return error ? (
        <p role="alert" className="text-destructive text-sm">
            {error}
        </p>
    ) : null;
}

export function StartReadingButton({ cycleId }: { cycleId: string }) {
    const { pending, error, run } = useAction();
    return (
        <div className="flex flex-col gap-2">
            <Button
                size="lg"
                disabled={pending}
                onClick={() =>
                    run(() =>
                        apiFetch(`/api/admin/cycles/${cycleId}/start-reading`, {
                            method: 'POST',
                        }),
                    )
                }
            >
                읽기 시작 (손님 창가에 촛불 켜기)
            </Button>
            <ErrorText error={error} />
        </div>
    );
}

export function ProductSearchForm({
    cycleId,
    initialQuery,
}: {
    cycleId: string;
    initialQuery: string;
}) {
    const router = useRouter();
    const [query, setQuery] = useState(initialQuery);
    return (
        <form
            className="flex gap-2"
            onSubmit={(event) => {
                event.preventDefault();
                router.push(
                    `/admin/workbench?cycle=${cycleId}&q=${encodeURIComponent(query)}`,
                );
            }}
        >
            <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="책 제목이나 저자"
                aria-label="책 검색"
            />
            <Button type="submit" variant="outline">
                찾기
            </Button>
        </form>
    );
}

export function MatchButton({
    cycleId,
    productId,
    disabled,
}: {
    cycleId: string;
    productId: string;
    disabled: boolean;
}) {
    const { pending, error, run } = useAction();
    return (
        <div className="flex flex-col items-end gap-1">
            <Button
                size="sm"
                variant="outline"
                disabled={disabled || pending}
                onClick={() =>
                    run(() =>
                        apiFetch(`/api/admin/cycles/${cycleId}/content`, {
                            method: 'PATCH',
                            body: jsonBody({ productId }),
                        }),
                    )
                }
            >
                {disabled ? '품절' : '이 책으로'}
            </Button>
            <ErrorText error={error} />
        </div>
    );
}

export function TextContentForm({
    cycleId,
    field,
    label,
    initialValue,
    multiline,
}: {
    cycleId: string;
    field: 'replyLetter' | 'teaser';
    label: string;
    initialValue: string;
    multiline: boolean;
}) {
    const { pending, error, run } = useAction();
    const [value, setValue] = useState(initialValue);
    const [saved, setSaved] = useState(false);
    const max = field === 'replyLetter' ? REPLY_MAX : TEASER_MAX;
    return (
        <form
            className="flex flex-col gap-2"
            onSubmit={async (event) => {
                event.preventDefault();
                setSaved(false);
                const result = await run(() =>
                    apiFetch(`/api/admin/cycles/${cycleId}/content`, {
                        method: 'PATCH',
                        body: jsonBody({ [field]: value }),
                    }),
                );
                if (result) setSaved(true);
            }}
        >
            <label className="flex flex-col gap-2">
                <span className="font-medium">{label}</span>
                {multiline ? (
                    <textarea
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        rows={8}
                        className="bg-card max-w-xl rounded-xl border p-4 leading-relaxed"
                    />
                ) : (
                    <Input
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        className="max-w-xl"
                    />
                )}
            </label>
            <div className="flex items-center gap-3 text-sm">
                <span
                    className={
                        value.length > max
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                    }
                >
                    {value.length}/{max}자
                </span>
                <Button
                    type="submit"
                    size="sm"
                    disabled={
                        pending ||
                        value.trim().length === 0 ||
                        value.length > max
                    }
                >
                    저장
                </Button>
                {saved ? (
                    <span className="text-muted-foreground">저장했어요</span>
                ) : null}
            </div>
            <ErrorText error={error} />
        </form>
    );
}

export function PostcardUpload({ cycleId }: { cycleId: string }) {
    const { pending, error, run } = useAction();
    const [localError, setLocalError] = useState<string | null>(null);
    return (
        <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">
                    손글씨 엽서 사진 (선택, 5MB 이하 jpg·png·webp)
                </span>
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={pending}
                    onChange={async (event) => {
                        const file = event.target.files?.[0];
                        setLocalError(null);
                        if (!file) return;
                        if (file.size > POSTCARD_MAX_BYTES) {
                            setLocalError('5MB 이하 사진만 올릴 수 있어요.');
                            return;
                        }
                        const form = new FormData();
                        form.append('file', file);
                        await run(() =>
                            apiFetch(`/api/admin/cycles/${cycleId}/postcard`, {
                                method: 'POST',
                                body: form,
                            }),
                        );
                    }}
                />
            </label>
            <ErrorText error={localError ?? error} />
        </div>
    );
}

export function ShipButton({
    cycleId,
    ready,
}: {
    cycleId: string;
    ready: boolean;
}) {
    const { pending, error, run } = useAction();
    const [code, setCode] = useState<string | null>(null);
    if (code) return <IssuedCode code={code} />;
    return (
        <div className="flex flex-col gap-2">
            <Button
                size="lg"
                disabled={!ready || pending}
                onClick={async () => {
                    const data = await run<{ code: string }>(() =>
                        apiFetch<{ code: string }>(
                            `/api/admin/cycles/${cycleId}/ship`,
                            { method: 'POST' },
                        ),
                    );
                    if (data) setCode(data.code);
                }}
            >
                {pending ? '보내는 중…' : '발송'}
            </Button>
            {!ready ? (
                <p className="text-muted-foreground text-sm">
                    책, 답장, 힌트를 모두 채우면 보낼 수 있어요.
                </p>
            ) : null}
            <ErrorText error={error} />
        </div>
    );
}

export function IssuedCode({ code }: { code: string }) {
    return (
        <div className="bg-muted flex flex-col gap-2 rounded-xl border p-6">
            <span className="text-muted-foreground text-sm">
                손글씨 카드에 옮겨 적을 코드
            </span>
            <span className="text-4xl font-semibold tracking-widest">
                {code}
            </span>
        </div>
    );
}
