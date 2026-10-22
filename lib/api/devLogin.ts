import 'server-only';
import { createHmac } from 'node:crypto';
import {
    createSupabaseServerClient,
    createSupabaseServiceClient,
} from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env';

// 개발 전용 테스트 로그인 (D-034). production에서는 serverEnv.devTestLoginEnabled()가 항상 false.
export type DevRole = 'member' | 'member2' | 'admin';

const ACCOUNTS: Record<
    DevRole,
    { email: string; name: string; isAdmin: boolean }
> = {
    member: {
        email: 'dev-member@ubuntubooks.test',
        name: '테스트 손님',
        isAdmin: false,
    },
    member2: {
        email: 'dev-member2@ubuntubooks.test',
        name: '테스트 손님 2',
        isAdmin: false,
    },
    admin: {
        email: 'dev-admin@ubuntubooks.test',
        name: '테스트 책방지기',
        isAdmin: true,
    },
};

// 비밀번호는 저장하지 않고 비밀 문자열에서 유도한다. 화면·응답에 나오지 않는다.
function passwordFor(email: string): string {
    return createHmac('sha256', serverEnv.devTestLoginSecret())
        .update(email)
        .digest('hex');
}

export async function devLogin(
    role: DevRole,
): Promise<{ ok: true } | { ok: false; message: string }> {
    const account = ACCOUNTS[role];
    const password = passwordFor(account.email);
    const supabase = await createSupabaseServerClient();

    let signIn = await supabase.auth.signInWithPassword({
        email: account.email,
        password,
    });
    if (signIn.error) {
        const service = createSupabaseServiceClient();
        const created = await service.auth.admin.createUser({
            email: account.email,
            password,
            email_confirm: true,
            user_metadata: { name: account.name },
        });
        if (
            created.error &&
            !created.error.message.toLowerCase().includes('already')
        ) {
            return { ok: false, message: created.error.message };
        }
        signIn = await supabase.auth.signInWithPassword({
            email: account.email,
            password,
        });
        if (signIn.error) return { ok: false, message: signIn.error.message };
    }

    if (account.isAdmin) {
        const service = createSupabaseServiceClient();
        const { error } = await service
            .from('profiles')
            .update({ is_admin: true })
            .eq('id', signIn.data.user.id);
        if (error) return { ok: false, message: error.message };
    }
    return { ok: true };
}
