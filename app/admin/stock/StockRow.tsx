'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch, jsonBody } from '@/lib/client/apiFetch';

// 재고 수량만 고친다 (D-004, D-006)
export function StockRow({
    productId,
    name,
    author,
    stockQuantity,
}: {
    productId: string;
    name: string;
    author: string;
    stockQuantity: number;
}) {
    const [value, setValue] = useState(String(stockQuantity));
    const [saved, setSaved] = useState(stockQuantity);
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const parsed = Number(value);
    const valid = value !== '' && Number.isInteger(parsed) && parsed >= 0;
    return (
        <li className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
            <span className="break-keep">
                {name} · <span className="text-muted-foreground">{author}</span>
            </span>
            <form
                className="flex items-center gap-2"
                onSubmit={async (event) => {
                    event.preventDefault();
                    setPending(true);
                    setMessage(null);
                    const result = await apiFetch<{ stockQuantity: number }>(
                        `/api/admin/products/${productId}/stock`,
                        {
                            method: 'PATCH',
                            body: jsonBody({ stockQuantity: parsed }),
                        },
                    );
                    setPending(false);
                    if (!result.ok) setMessage(result.error.message);
                    else {
                        setSaved(result.data.stockQuantity);
                        setMessage('저장했어요');
                    }
                }}
            >
                <Input
                    type="number"
                    min={0}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    className="w-24"
                    aria-label={`${name} 재고`}
                    aria-invalid={!valid}
                />
                <span>권</span>
                <Button
                    type="submit"
                    size="sm"
                    disabled={!valid || pending || parsed === saved}
                >
                    저장
                </Button>
                {message ? (
                    <span className="text-muted-foreground text-xs">
                        {message}
                    </span>
                ) : null}
            </form>
        </li>
    );
}
