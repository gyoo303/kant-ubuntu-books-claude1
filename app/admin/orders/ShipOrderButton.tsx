'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/client/apiFetch';

export function ShipOrderButton({ orderId }: { orderId: string }) {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    return (
        <div className="flex flex-col items-end gap-1">
            <Button
                size="sm"
                disabled={pending}
                onClick={async () => {
                    setPending(true);
                    setError(null);
                    const result = await apiFetch(
                        `/api/admin/orders/${orderId}/ship`,
                        { method: 'POST' },
                    );
                    setPending(false);
                    if (!result.ok) setError(result.error.message);
                    else router.refresh();
                }}
            >
                발송 처리
            </Button>
            {error ? (
                <span className="text-destructive text-xs">{error}</span>
            ) : null}
        </div>
    );
}
