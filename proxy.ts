import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Supabase 세션 쿠키 갱신만 한다. 권한 판단은 Route Handler·데이터 계층·RLS에서 (ADR-002).
export async function proxy(request: NextRequest) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return NextResponse.next({ request });

    let response = NextResponse.next({ request });
    const supabase = createServerClient(url, key, {
        cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: (cookiesToSet) => {
                for (const { name, value } of cookiesToSet)
                    request.cookies.set(name, value);
                response = NextResponse.next({ request });
                for (const { name, value, options } of cookiesToSet)
                    response.cookies.set(name, value, options);
            },
        },
    });
    await supabase.auth.getClaims();
    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
