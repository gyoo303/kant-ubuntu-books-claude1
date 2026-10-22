import 'server-only';
import type { CurrentUser } from '@/types/domain';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// 쿠키를 읽으므로 반드시 <Suspense> 안에서 호출한다 (CONV-03, RISK-12).
export async function getCurrentUser(): Promise<CurrentUser | null> {
    const supabase = await createSupabaseServerClient();
    const { data: claims } = await supabase.auth.getClaims();
    const userId = claims?.claims.sub;
    if (!userId) return null;
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('display_name, is_admin')
        .eq('id', userId)
        .maybeSingle();
    if (error) throw new Error(`[session.getCurrentUser] ${error.message}`);
    if (!profile) return null;
    return {
        id: userId,
        displayName: profile.display_name,
        isAdmin: profile.is_admin,
    };
}
