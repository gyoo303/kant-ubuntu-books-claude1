import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// 브라우저 클라이언트. 로그인 시작(signInWithOAuth)에만 쓴다.
export function createSupabaseBrowserClient() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    );
}
