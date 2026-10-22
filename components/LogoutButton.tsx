'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/client/apiFetch';

export function LogoutButton() {
    const [pending, setPending] = useState(false);
    return (
        <button
            type="button"
            disabled={pending}
            className="hover:bg-muted rounded-md px-2 py-1 text-sm disabled:opacity-50"
            onClick={async () => {
                setPending(true);
                await apiFetch('/api/auth/logout', { method: 'POST' });
                // 로그인 상태로 받아 둔 화면을 버리도록 전체 이동한다
                // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- 인증 상태가 바뀌어 라우터 캐시를 버려야 함
                window.location.assign('/');
            }}
        >
            로그아웃
        </button>
    );
}
