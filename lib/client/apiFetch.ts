import { API_ERRORS, type ApiResponse } from '@/types/api';

// 클라이언트 쓰기 요청의 유일한 진입점 (04-interfaces-api.md §1.4). 네트워크 오류도 ApiResponse로 바꾼다.
export async function apiFetch<T>(
    path: string,
    init?: RequestInit,
): Promise<ApiResponse<T>> {
    try {
        const isForm = init?.body instanceof FormData;
        const response = await fetch(path, {
            ...init,
            headers: isForm
                ? init?.headers
                : { 'Content-Type': 'application/json', ...init?.headers },
        });
        const json: unknown = await response.json();
        return json as ApiResponse<T>;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
            throw error;
        return {
            ok: false,
            error: { code: 'INTERNAL', message: API_ERRORS.INTERNAL.message },
        };
    }
}

export function jsonBody(value: unknown): string {
    return JSON.stringify(value);
}
