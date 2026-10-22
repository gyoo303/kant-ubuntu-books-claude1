import 'server-only';
import type { CycleStatus } from '@/types/domain';
import type { Product } from '@/types/product';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// 모든 함수는 관리자 세션 기준이다. 권한은 RLS(is_admin)와 app/admin/layout.tsx가 함께 막는다.

const QUEUE_STATUSES: CycleStatus[] = [
    'letter_arrived',
    'awaiting_letter',
    'reading',
];
const POSTCARD_URL_TTL_SECONDS = 60 * 60;

function memberName(
    profile: { display_name: string } | null,
    recipient: string | null,
): string {
    return profile?.display_name || recipient || '이름 없는 손님';
}

async function recipientNames(userIds: string[]): Promise<Map<string, string>> {
    const supabase = await createSupabaseServerClient();
    if (userIds.length === 0) return new Map();
    const { data, error } = await supabase
        .from('shipping_addresses')
        .select('user_id, recipient_name')
        .in('user_id', userIds);
    if (error) throw new Error(`[admin.recipientNames] ${error.message}`);
    return new Map(data.map((row) => [row.user_id, row.recipient_name]));
}

export async function getDashboardCounts(): Promise<{
    cyclesToProcess: number;
    ordersToShip: number;
}> {
    const supabase = await createSupabaseServerClient();
    const [cycles, orders] = await Promise.all([
        supabase
            .from('subscription_cycles')
            .select('id', { count: 'exact', head: true })
            .in('status', QUEUE_STATUSES),
        supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'paid'),
    ]);
    if (cycles.error)
        throw new Error(`[admin.getDashboardCounts] ${cycles.error.message}`);
    if (orders.error)
        throw new Error(`[admin.getDashboardCounts] ${orders.error.message}`);
    return {
        cyclesToProcess: cycles.count ?? 0,
        ordersToShip: orders.count ?? 0,
    };
}

export interface WorkbenchQueueItem {
    cycleId: string;
    cycleNo: number;
    memberName: string;
    status: CycleStatus;
    createdAt: string;
}

export async function getWorkbenchQueue(): Promise<WorkbenchQueueItem[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from('subscription_cycles')
        .select(
            'id, cycle_no, status, created_at, user_id, profiles(display_name)',
        )
        .in('status', QUEUE_STATUSES)
        .order('created_at', { ascending: true });
    if (error) throw new Error(`[admin.getWorkbenchQueue] ${error.message}`);
    const names = await recipientNames([
        ...new Set(data.map((row) => row.user_id)),
    ]);
    return data.map((row) => ({
        cycleId: row.id,
        cycleNo: row.cycle_no,
        memberName: memberName(row.profiles, names.get(row.user_id) ?? null),
        status: row.status,
        createdAt: row.created_at,
    }));
}

export interface WorkbenchCycle {
    cycle: {
        id: string;
        cycleNo: number;
        status: CycleStatus;
        memberName: string;
        teaser: string | null;
    };
    letter: { body: string; isFromCurrentCycle: boolean } | null;
    content: {
        product: Pick<Product, 'id' | 'name' | 'author'> | null;
        replyLetter: string | null;
        postcardUrl: string | null;
    };
    code: string | null;
}

export async function getWorkbenchCycle(
    cycleId: string,
): Promise<WorkbenchCycle | null> {
    const supabase = await createSupabaseServerClient();
    const { data: cycle, error } = await supabase
        .from('subscription_cycles')
        .select(
            'id, cycle_no, status, teaser, user_id, subscription_id, profiles(display_name)',
        )
        .eq('id', cycleId)
        .maybeSingle();
    if (error) throw new Error(`[admin.getWorkbenchCycle] ${error.message}`);
    if (!cycle) return null;

    const [current, latest, content, code, names] = await Promise.all([
        supabase
            .from('subscription_letters')
            .select('body')
            .eq('cycle_id', cycleId)
            .maybeSingle(),
        supabase
            .from('subscription_letters')
            .select('body')
            .eq('subscription_id', cycle.subscription_id)
            .not('cycle_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        supabase
            .from('cycle_contents')
            .select('reply_letter, postcard_path, products(id, name, author)')
            .eq('cycle_id', cycleId)
            .maybeSingle(),
        supabase
            .from('unboxing_codes')
            .select('code')
            .eq('cycle_id', cycleId)
            .maybeSingle(),
        recipientNames([cycle.user_id]),
    ]);
    for (const result of [current, latest, content, code]) {
        if (result.error)
            throw new Error(
                `[admin.getWorkbenchCycle] ${result.error.message}`,
            );
    }

    let postcardUrl: string | null = null;
    if (content.data?.postcard_path) {
        const { data: signed } = await supabase.storage
            .from('postcards')
            .createSignedUrl(
                content.data.postcard_path,
                POSTCARD_URL_TTL_SECONDS,
            );
        postcardUrl = signed?.signedUrl ?? null;
    }

    // 이번 회차 편지가 없으면 가장 최근 편지를 기준으로 고른다 (Q-018)
    const letter = current.data
        ? { body: current.data.body, isFromCurrentCycle: true }
        : latest.data
          ? { body: latest.data.body, isFromCurrentCycle: false }
          : null;

    return {
        cycle: {
            id: cycle.id,
            cycleNo: cycle.cycle_no,
            status: cycle.status,
            memberName: memberName(
                cycle.profiles,
                names.get(cycle.user_id) ?? null,
            ),
            teaser: cycle.teaser,
        },
        letter,
        content: {
            product: content.data?.products
                ? {
                      id: content.data.products.id,
                      name: content.data.products.name,
                      author: content.data.products.author,
                  }
                : null,
            replyLetter: content.data?.reply_letter ?? null,
            postcardUrl,
        },
        code: code.data?.code ?? null,
    };
}

export async function searchProductsForMatch(
    q: string,
): Promise<Pick<Product, 'id' | 'name' | 'author' | 'stockQuantity'>[]> {
    const keyword = q
        .trim()
        .replace(/[%_,()\\]/g, ' ')
        .trim();
    if (!keyword) return [];
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from('products')
        .select('id, name, author, stock_quantity')
        .or(`name.ilike.%${keyword}%,author.ilike.%${keyword}%`)
        .order('name')
        .limit(20);
    if (error)
        throw new Error(`[admin.searchProductsForMatch] ${error.message}`);
    return data.map((row) => ({
        id: row.id,
        name: row.name,
        author: row.author,
        stockQuantity: row.stock_quantity,
    }));
}

export interface OrderToShip {
    id: string;
    createdAt: string;
    recipientName: string;
    phone: string;
    postalCode: string;
    address1: string;
    address2: string;
    items: { productName: string; quantity: number }[];
}

export async function getOrdersToShip(): Promise<OrderToShip[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from('orders')
        .select(
            'id, created_at, ship_recipient_name, ship_phone, ship_postal_code, ship_address1, ship_address2, order_items(product_name, quantity)',
        )
        .eq('status', 'paid')
        .order('paid_at', { ascending: true });
    if (error) throw new Error(`[admin.getOrdersToShip] ${error.message}`);
    return data.map((order) => ({
        id: order.id,
        createdAt: order.created_at,
        recipientName: order.ship_recipient_name,
        phone: order.ship_phone,
        postalCode: order.ship_postal_code,
        address1: order.ship_address1,
        address2: order.ship_address2,
        items: order.order_items.map((item) => ({
            productName: item.product_name,
            quantity: item.quantity,
        })),
    }));
}

export async function getStockList(): Promise<
    Pick<Product, 'id' | 'name' | 'author' | 'stockQuantity'>[]
> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from('products')
        .select('id, name, author, stock_quantity')
        .order('name');
    if (error) throw new Error(`[admin.getStockList] ${error.message}`);
    return data.map((row) => ({
        id: row.id,
        name: row.name,
        author: row.author,
        stockQuantity: row.stock_quantity,
    }));
}

export async function getActiveSubscribersWithLetters(): Promise<
    { userId: string; name: string; farewellLetter: string | null }[]
> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from('subscriptions')
        .select('user_id, profiles(display_name)')
        .eq('status', 'active')
        .order('started_at', { ascending: true });
    if (error)
        throw new Error(
            `[admin.getActiveSubscribersWithLetters] ${error.message}`,
        );
    const userIds = data.map((row) => row.user_id);
    const [names, letters] = await Promise.all([
        recipientNames(userIds),
        userIds.length === 0
            ? Promise.resolve({ data: [], error: null })
            : supabase
                  .from('farewell_letters')
                  .select('user_id, body')
                  .in('user_id', userIds),
    ]);
    if (letters.error)
        throw new Error(
            `[admin.getActiveSubscribersWithLetters] ${letters.error.message}`,
        );
    return data.map((row) => ({
        userId: row.user_id,
        name: memberName(row.profiles, names.get(row.user_id) ?? null),
        farewellLetter:
            letters.data.find((letter) => letter.user_id === row.user_id)
                ?.body ?? null,
    }));
}

export async function getFarewellInbox(): Promise<
    { createdAt: string; name: string; body: string }[]
> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from('farewell_notes')
        .select('created_at, body, user_id, profiles(display_name)')
        .order('created_at', { ascending: false });
    if (error) throw new Error(`[admin.getFarewellInbox] ${error.message}`);
    const names = await recipientNames([
        ...new Set(data.map((row) => row.user_id)),
    ]);
    return data.map((row) => ({
        createdAt: row.created_at,
        name: memberName(row.profiles, names.get(row.user_id) ?? null),
        body: row.body,
    }));
}
