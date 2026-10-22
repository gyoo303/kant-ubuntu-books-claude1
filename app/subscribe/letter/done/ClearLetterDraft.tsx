'use client';

import { useEffect } from 'react';

// 신청이 끝났으니 브라우저에 남긴 편지 초안을 지운다
export function ClearLetterDraft() {
    useEffect(() => {
        window.sessionStorage.removeItem('ubb-letter-draft-v1');
    }, []);
    return null;
}
