import { insert, select, update, type TestUser } from './supabase';

// 시나리오 시작 상태 (scenarios.md §2). 결제 확정 RPC는 토스 키가 필요하므로 결과 상태를 직접 넣는다
// 회차 상태 순서: pending_payment → arrived(결제 확정) → reading(책방지기 열람) → shipped → unboxed (AR-API §6)

export type RoundState =
    'pending_payment' | 'arrived' | 'reading' | 'shipped' | 'unboxed';

export interface Book {
    id: string;
    name: string;
    image_url: string;
}

export async function anyBook(): Promise<Book> {
    const [book] = await select<Book>(
        'products',
        'select=id,name,image_url&stock=gt.0&order=created_at&limit=1',
    );
    if (!book)
        throw new Error(
            'E2E_SETUP: seed 책이 없다 (supabase/seed.sql 적용 필요)',
        );
    return book;
}

export const LETTER =
    '요즘 숲길을 자주 걸어요. 바람 소리가 들리는 책을 읽고 싶어요.';
export const REPLY = '숲길을 걷는 분께 이 책을 골랐어요. 천천히 읽어 주세요.';
export const TEASER = '바람이 지나간 자리에 남은 이야기';

export interface Round {
    id: string;
    subscriptionId: string;
    book: Book;
    code: string; // 발송 이후 회차만 의미 있음. 사용 전 코드는 전체에서 고유 (unboxing_codes_active_unique)
}

const randomCode = () => String(Math.floor(100000 + Math.random() * 900000));

export async function createRound(
    member: TestUser,
    state: RoundState,
    options: { recipient?: string } = {},
): Promise<Round> {
    const now = new Date().toISOString();
    const book = await anyBook();
    const code = randomCode();
    // 회원당 진행 중 구독은 1개 (subscriptions_one_active)
    const [active] = await select<{ id: string }>(
        'subscriptions',
        `select=id&member_id=eq.${member.id}&status=eq.active`,
    );
    const sub =
        active ??
        (await insert<{ id: string }>('subscriptions', {
            member_id: member.id,
        }));
    const round = await insert<{ id: string }>('subscription_rounds', {
        member_id: member.id,
        subscription_id: sub.id,
        status: 'pending_payment',
        ship_recipient_name: options.recipient ?? '김독자',
        ship_phone: '010-1234-5678',
        ship_address: '대전 유성구 어은로 1',
    });
    await insert('reader_letters', {
        round_id: round.id,
        member_id: member.id,
        body: LETTER,
    });
    if (state === 'pending_payment')
        return { id: round.id, subscriptionId: sub.id, book, code };

    const steps: Record<string, string | null> = {
        paid_at: now,
        opened_at: null,
        shipped_at: null,
        unboxed_at: null,
    };
    if (state !== 'arrived') steps.opened_at = now;
    if (state === 'shipped' || state === 'unboxed') {
        steps.shipped_at = now;
        steps.teaser = TEASER;
        await insert('round_contents', {
            round_id: round.id,
            product_id: book.id,
            reply_letter: REPLY,
        });
        await insert('unboxing_codes', {
            round_id: round.id,
            code,
            used_at: state === 'unboxed' ? now : null,
        });
    } else if (state === 'reading') {
        await insert('round_contents', { round_id: round.id });
    }
    if (state === 'unboxed') steps.unboxed_at = now;
    await update('subscription_rounds', `id=eq.${round.id}`, {
        ...steps,
        status: state,
    });
    return { id: round.id, subscriptionId: sub.id, book, code };
}

export async function saveAddress(member: TestUser): Promise<void> {
    await insert('shipping_addresses', {
        member_id: member.id,
        recipient_name: '김독자',
        phone: '010-1234-5678',
        address: '대전 유성구 어은로 1',
    });
}
