import 'server-only';
import type {
    BlindBook,
    CycleStatus,
    MyOrder,
    MySubscriptionOverview,
    OpenedBook,
    ShippingAddress,
} from '@/types/domain';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canWriteLetter, toWindowState } from '@/lib/domain/window';
import { DEFAULT_FAREWELL_LETTER } from '@/lib/content/defaultFarewellLetter';

const POSTCARD_URL_TTL_SECONDS = 60 * 60;

async function requireUserId() {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub ?? null;
    return { supabase, userId };
}

export async function getMyShippingAddress(): Promise<ShippingAddress | null> {
    const { supabase, userId } = await requireUserId();
    if (!userId) return null;
    const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) throw new Error(`[me.getMyShippingAddress] ${error.message}`);
    if (!data) return null;
    return {
        recipientName: data.recipient_name,
        phone: data.phone,
        postalCode: data.postal_code,
        address1: data.address1,
        address2: data.address2,
        consentedAt: data.consented_at,
    };
}

export async function getMyOrders(): Promise<MyOrder[]> {
    const { supabase, userId } = await requireUserId();
    if (!userId) return [];
    const { data, error } = await supabase
        .from('orders')
        .select(
            'id, created_at, status, total_amount, order_items(product_name, quantity)',
        )
        .eq('user_id', userId)
        .in('status', ['paid', 'shipped', 'refunded'])
        .order('created_at', { ascending: false });
    if (error) throw new Error(`[me.getMyOrders] ${error.message}`);
    return data.map((order) => ({
        id: order.id,
        createdAt: order.created_at,
        status: order.status,
        totalAmount: order.total_amount,
        items: order.order_items.map((item) => ({
            productName: item.product_name,
            quantity: item.quantity,
        })),
        canCancel: order.status === 'paid',
    }));
}

export async function getMySubscriptionOverview(): Promise<MySubscriptionOverview> {
    const empty: MySubscriptionOverview = {
        subscription: null,
        window: null,
        latestCycle: null,
        canWriteLetter: false,
        storedLetter: null,
    };
    const { supabase, userId } = await requireUserId();
    if (!userId) return empty;

    const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('id, status, next_billing_date, monthly_price')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error)
        throw new Error(`[me.getMySubscriptionOverview] ${error.message}`);
    if (!subscription) return empty;

    const [
        { data: cycle, error: cycleError },
        { data: stored, error: storedError },
    ] = await Promise.all([
        supabase
            .from('subscription_cycles')
            .select('id, cycle_no, status')
            .eq('subscription_id', subscription.id)
            .order('cycle_no', { ascending: false })
            .limit(1)
            .maybeSingle(),
        supabase
            .from('subscription_letters')
            .select('id, body')
            .eq('subscription_id', subscription.id)
            .is('cycle_id', null)
            .maybeSingle(),
    ]);
    if (cycleError)
        throw new Error(`[me.getMySubscriptionOverview] ${cycleError.message}`);
    if (storedError)
        throw new Error(
            `[me.getMySubscriptionOverview] ${storedError.message}`,
        );

    const latestStatus: CycleStatus | null = cycle?.status ?? null;
    return {
        subscription: {
            id: subscription.id,
            status: subscription.status,
            nextBillingDate: subscription.next_billing_date,
            monthlyPrice: subscription.monthly_price,
        },
        window: toWindowState(latestStatus),
        latestCycle: cycle
            ? { id: cycle.id, cycleNo: cycle.cycle_no, status: cycle.status }
            : null,
        canWriteLetter: canWriteLetter(
            subscription.status === 'active',
            latestStatus,
        ),
        storedLetter: stored ? { id: stored.id, body: stored.body } : null,
    };
}

// 나의 서가. 블라인드 북에는 힌트만 담는다 (INV-01). 열린 책은 RLS가 unboxed 회차만 내준다.
export async function getMyShelf(): Promise<{
    blind: BlindBook[];
    opened: OpenedBook[];
}> {
    const { supabase, userId } = await requireUserId();
    if (!userId) return { blind: [], opened: [] };

    const { data: cycles, error } = await supabase
        .from('subscription_cycles')
        .select('id, cycle_no, status, teaser, shipped_at, unboxed_at')
        .eq('user_id', userId)
        .in('status', ['shipped', 'unboxed'])
        .order('cycle_no', { ascending: false });
    if (error) throw new Error(`[me.getMyShelf] ${error.message}`);

    const blind: BlindBook[] = cycles
        .filter((cycle) => cycle.status === 'shipped')
        .map((cycle) => ({
            cycleId: cycle.id,
            cycleNo: cycle.cycle_no,
            teaser: cycle.teaser ?? '',
            shippedAt: cycle.shipped_at ?? '',
        }));

    const unboxedIds = cycles
        .filter((cycle) => cycle.status === 'unboxed')
        .map((cycle) => cycle.id);
    const opened =
        unboxedIds.length === 0 ? [] : await loadOpenedBooks(unboxedIds);
    return { blind, opened };
}

// 언박싱한 회차의 책·답장·엽서·메모. API-12 응답에서도 같은 변환을 쓴다.
export async function loadOpenedBooks(
    cycleIds: string[],
): Promise<OpenedBook[]> {
    const supabase = await createSupabaseServerClient();
    const [
        { data: cycles, error: cycleError },
        { data: contents, error: contentError },
        { data: memos, error: memoError },
    ] = await Promise.all([
        supabase
            .from('subscription_cycles')
            .select('id, cycle_no, unboxed_at')
            .in('id', cycleIds),
        supabase
            .from('cycle_contents')
            .select(
                'cycle_id, reply_letter, postcard_path, products(id, name, author, image_url)',
            )
            .in('cycle_id', cycleIds),
        supabase
            .from('shelf_memos')
            .select('cycle_id, body, updated_at')
            .in('cycle_id', cycleIds),
    ]);
    if (cycleError)
        throw new Error(`[me.loadOpenedBooks] ${cycleError.message}`);
    if (contentError)
        throw new Error(`[me.loadOpenedBooks] ${contentError.message}`);
    if (memoError) throw new Error(`[me.loadOpenedBooks] ${memoError.message}`);

    const opened: OpenedBook[] = [];
    for (const cycle of [...cycles].sort((a, b) => b.cycle_no - a.cycle_no)) {
        const content = contents.find((row) => row.cycle_id === cycle.id);
        if (!content || !content.products) continue;
        let postcardUrl: string | null = null;
        if (content.postcard_path) {
            const { data: signed } = await supabase.storage
                .from('postcards')
                .createSignedUrl(
                    content.postcard_path,
                    POSTCARD_URL_TTL_SECONDS,
                );
            postcardUrl = signed?.signedUrl ?? null;
        }
        const memo = memos.find((row) => row.cycle_id === cycle.id);
        opened.push({
            cycleId: cycle.id,
            cycleNo: cycle.cycle_no,
            product: {
                id: content.products.id,
                name: content.products.name,
                author: content.products.author,
                imageUrl: content.products.image_url,
            },
            replyLetter: content.reply_letter ?? '',
            postcardUrl,
            unboxedAt: cycle.unboxed_at ?? '',
            memo: memo ? { body: memo.body, updatedAt: memo.updated_at } : null,
        });
    }
    return opened;
}

export async function getMyFarewellLetter(): Promise<{
    body: string;
    isDefault: boolean;
}> {
    const { supabase, userId } = await requireUserId();
    if (!userId) return { body: DEFAULT_FAREWELL_LETTER, isDefault: true };
    const { data, error } = await supabase
        .from('farewell_letters')
        .select('body')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) throw new Error(`[me.getMyFarewellLetter] ${error.message}`);
    return data
        ? { body: data.body, isDefault: false }
        : { body: DEFAULT_FAREWELL_LETTER, isDefault: true };
}
