'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/client/apiFetch';

// 발송 전 주문 취소 (AC-10-2·4). 실패하면 상태 그대로 + 안내
export function CancelOrderButton({ orderId }: { orderId: string }) {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    return (
        <div className="flex flex-col items-end gap-1">
            <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={async () => {
                    setPending(true);
                    setError(null);
                    const result = await apiFetch<{ status: 'refunded' }>(
                        `/api/orders/${orderId}/cancel`,
                        { method: 'POST' },
                    );
                    setPending(false);
                    if (!result.ok) {
                        setError(result.error.message);
                        return;
                    }
                    router.refresh();
                }}
            >
                {pending ? '취소하는 중…' : '주문 취소'}
            </Button>
            {error ? (
                <span role="alert" className="text-destructive text-xs">
                    {error}
                </span>
            ) : null}
        </div>
    );
}
