// GATE-07: public 테이블의 RLS 활성 여부와 정책 수가 03-db-schema.md §4 표와 같은지 확인한다.
// 실행: npm run check:rls  (.env.local의 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요)
import { createClient } from '@supabase/supabase-js';

// 03-db-schema.md §4 정책 표 기준 (테이블: 정책 수)
const EXPECTED = {
    products: 2,
    profiles: 2,
    shipping_addresses: 4,
    orders: 2,
    order_items: 2,
    payments: 2,
    subscriptions: 2,
    billing_keys: 0,
    subscription_drafts: 4,
    subscription_cycles: 2,
    subscription_letters: 2,
    cycle_contents: 2,
    unboxing_codes: 1,
    unboxing_attempts: 0,
    shelf_memos: 4,
    farewell_letters: 4,
    farewell_notes: 1,
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
    console.error(
        '[GATE-07] NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 필요합니다 (.env.local).',
    );
    process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data, error } = await supabase.rpc('audit_rls');
if (error) {
    console.error(`[GATE-07] audit_rls 호출 실패: ${error.message}`);
    process.exit(1);
}

const problems = [];
const actual = new Map(data.map((row) => [row.table_name, row]));
for (const row of data) {
    if (!row.rls_enabled) problems.push(`${row.table_name}: RLS 꺼짐`);
    if (!(row.table_name in EXPECTED))
        problems.push(`${row.table_name}: 설계 표에 없는 테이블`);
}
for (const [table, count] of Object.entries(EXPECTED)) {
    const row = actual.get(table);
    if (!row) problems.push(`${table}: 테이블 없음`);
    else if (row.policy_count !== count)
        problems.push(`${table}: 정책 ${row.policy_count}개 (설계 ${count}개)`);
}

if (problems.length > 0) {
    console.error(problems.join('\n'));
    console.error(`[GATE-07] 불일치 ${problems.length}건`);
    process.exit(1);
}
console.log(`[GATE-07] 테이블 ${data.length}개 RLS 활성, 정책 수 설계와 일치`);
