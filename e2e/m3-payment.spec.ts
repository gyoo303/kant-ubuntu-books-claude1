import { insert, select } from './support/supabase';
import { anyBook, saveAddress } from './support/states';
import { createUser, expect, test } from './support/test';

// M3 구매 중 토스 키 없이 확인할 수 있는 것: 금액 변조·잘못된 콜백·빈 배송지 (AC-08-7·8, NFR-19)
// 실제 결제 승인·환불·중복 확정(AC-08-1·6, AC-10-*)은 토스 테스트 키가 생기면 확인한다 (supabase/tests/payments.test.sql이 DB 쪽을 덮는다)

async function pendingOrder(memberId: string, amount: number) {
    const book = await anyBook();
    const [before] = await select<{ stock: number }>(
        'products',
        `select=stock&id=eq.${book.id}`,
    );
    const order = await insert<{ id: string }>('orders', {
        order_number: `E2E-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
        member_id: memberId,
        total_amount: amount,
        ship_recipient_name: '김독자',
        ship_phone: '010-1234-5678',
        ship_address: '대전 유성구 어은로 1',
    });
    await insert('order_items', {
        order_id: order.id,
        product_id: book.id,
        product_name: book.name,
        unit_price: amount,
        quantity: 1,
    });
    const pgOrderId = `e2e-${order.id}`;
    await insert('payments', {
        order_id: order.id,
        pg_order_id: pgOrderId,
        amount,
    });
    return {
        orderId: order.id,
        pgOrderId,
        bookId: book.id,
        stockBefore: before.stock,
    };
}

test('AC-08-8·NFR-19 승인 금액이 주문 합계와 다르면 확정하지 않고 재고 그대로', async ({
    request,
}) => {
    const member = await createUser('m3-tamper');
    const order = await pendingOrder(member.id, 45000);
    const res = await request.get(
        `/api/payments/toss/success?paymentKey=e2e-fake-key&orderId=${order.pgOrderId}&amount=1000`,
        { maxRedirects: 0 },
    );
    expect(res.status()).toBe(303);
    const location = new URL(res.headers().location, 'http://x');
    expect(location.pathname).toBe('/checkout/result');
    expect(location.searchParams.get('status')).toBe('fail');

    const [payment] = await select<{
        status: string;
        pg_payment_key: string | null;
    }>(
        'payments',
        `select=status,pg_payment_key&pg_order_id=eq.${order.pgOrderId}`,
    );
    expect(payment.status).toBe('failed');
    expect(payment.pg_payment_key).toBeNull();
    const [after] = await select<{ status: string }>(
        'orders',
        `select=status&id=eq.${order.orderId}`,
    );
    expect(after.status).toBe('pending_payment');
    const [stock] = await select<{ stock: number }>(
        'products',
        `select=stock&id=eq.${order.bookId}`,
    );
    expect(stock.stock).toBe(order.stockBefore);
});

test('결제 콜백 쿼리가 잘못되면 실패 화면으로 보낸다', async ({ request }) => {
    for (const query of [
        '',
        '?orderId=x&amount=1',
        '?paymentKey=a&orderId=abcdef&amount=-1',
        '?paymentKey=a&orderId=abcdef&amount=1e3',
    ]) {
        const res = await request.get(`/api/payments/toss/success${query}`, {
            maxRedirects: 0,
        });
        expect(res.status(), query).toBe(303);
        expect(res.headers().location, query).toContain('status=fail');
    }
});

test('AC-08-7 받는 곳에 빈칸이 있으면 결제 창이 열리지 않고 칸에 이유가 보인다', async ({
    pageAs,
}) => {
    const member = await createUser('m3-empty');
    const book = await anyBook();
    await insert('cart_items', {
        member_id: member.id,
        product_id: book.id,
        quantity: 1,
    });
    const page = await pageAs(member);
    await page.goto('/checkout');
    await page.getByLabel('받는 사람').fill('');
    await page.getByLabel('연락처').fill('');
    await page.getByLabel('주소').fill('');
    const external: string[] = [];
    page.on('request', (req) => {
        if (/tosspayments/.test(req.url())) external.push(req.url());
    });
    await page.getByRole('button', { name: '결제하기' }).click();
    await expect(
        page.locator('main [aria-invalid="true"]').first(),
    ).toBeVisible();
    expect(
        external.filter((url) => !url.includes('js.tosspayments.com')),
    ).toEqual([]);
    expect(
        await select('orders', `select=id&member_id=eq.${member.id}`),
    ).toHaveLength(0);
});

test('AC-08-2 저장한 기본 배송지가 주문서에 미리 채워진다', async ({
    pageAs,
}) => {
    const member = await createUser('m3-prefill');
    await saveAddress(member);
    const book = await anyBook();
    await insert('cart_items', {
        member_id: member.id,
        product_id: book.id,
        quantity: 1,
    });
    const page = await pageAs(member);
    await page.goto('/checkout');
    await expect(page.getByLabel('받는 사람')).toHaveValue('김독자');
    await expect(page.getByLabel('주소')).toHaveValue('대전 유성구 어은로 1');
});
