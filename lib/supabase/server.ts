import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import type { Database } from '@/types/database';
import { publicEnv, serverEnv } from '@/lib/env';

// 쿠키 세션을 쓰는 클라이언트 (RLS 적용). cookies()를 읽으므로 <Suspense> 안·Route Handler에서만 (CONV-03).
export async function createSupabaseServerClient() {
    // 요청 시점에만 실행 (Partial Prefetching이 세션 확인을 미리 그리지 않게, Date.now() 사용 포함)
    await connection();
    const cookieStore = await cookies();
    return createServerClient<Database>(
        publicEnv.supabaseUrl(),
        publicEnv.supabasePublishableKey(),
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    try {
                        for (const { name, value, options } of cookiesToSet)
                            cookieStore.set(name, value, options);
                    } catch (error) {
                        // Server Component 렌더 중에는 쿠키를 쓸 수 없다. 세션 갱신은 proxy.ts가 맡는다.
                        if (
                            !(error instanceof Error) ||
                            !error.message.includes(
                                'Cookies can only be modified',
                            )
                        )
                            throw error;
                    }
                },
            },
        },
    );
}

// 쿠키 없는 클라이언트 (anon 권한, 공개 데이터 캐시용, CONV-04)
export function createSupabaseAnonClient() {
    return createClient<Database>(
        publicEnv.supabaseUrl(),
        publicEnv.supabasePublishableKey(),
        {
            auth: { persistSession: false, autoRefreshToken: false },
        },
    );
}

// service role 클라이언트 (RLS 우회). 허용된 위치에서만 호출한다 (금지 패턴 9).
export function createSupabaseServiceClient() {
    return createClient<Database>(
        publicEnv.supabaseUrl(),
        serverEnv.supabaseServiceRoleKey(),
        {
            auth: { persistSession: false, autoRefreshToken: false },
        },
    );
}
