// API-16 로그아웃
import { ok } from '@/lib/api/http';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return ok({ ok: true as const });
}
