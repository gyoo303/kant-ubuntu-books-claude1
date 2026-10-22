import { insert } from './support/supabase';
import { REPLY, TEASER, createRound } from './support/states';
import { createUser, expect, test } from './support/test';

// 권한·개인정보 화면 확인 (NFR-06·08·09, INV-19, UX-PLAN-QA §5 "개인정보가 보이는 화면")

test('NFR-06 비회원은 회원·관리자 화면에서 로그인으로 보내지고 돌아올 주소가 남는다', async ({
    page,
}) => {
    for (const path of [
        '/mypage',
        '/mypage/window',
        '/mypage/shelf',
        '/mypage/orders',
        '/cart',
        '/checkout',
        '/admin',
        '/admin/desk',
        '/admin/orders',
    ]) {
        await page.goto(path);
        await expect(page, path).toHaveURL(
            `/login?next=${encodeURIComponent(path)}`,
        );
    }
});

test('NFR-06 일반 회원은 관리자 화면·주소록 API를 쓸 수 없다', async ({
    pageAs,
    request,
}) => {
    const member = await createUser('p-member');
    const page = await pageAs(member);
    for (const path of [
        '/admin',
        '/admin/desk',
        '/admin/orders',
        '/admin/products/new',
    ]) {
        // 부분 사전 렌더링(PPR)이라 껍데기가 먼저 나가 상태 코드는 200일 수 있다. 화면이 404인지와 데이터가 없는지를 본다
        const res = await page.goto(path);
        await expect(
            page.getByRole('heading', { name: '404' }),
            path,
        ).toBeVisible();
        const html = (await res?.text()) ?? '';
        // 정적 껍데기(제목·메뉴 이름)는 사전 렌더링돼 함께 내려온다. 회원 이름·연락처 같은 데이터만 없어야 한다
        for (const secret of ['김독자', '010-', '어은로'])
            expect(html, `${path} ${secret}`).not.toContain(secret);
    }
    const csv = await page.request.get('/api/admin/shipping-list');
    expect(csv.status()).toBeGreaterThanOrEqual(400);
    expect(await csv.text()).not.toContain('010-');
    const anon = await request.get('/api/admin/shipping-list');
    expect(anon.status()).toBeGreaterThanOrEqual(400);
});

test('NFR-09 회원 B는 회원 A의 회차·언박싱 화면을 열어도 내용이 없다', async ({
    pageAs,
}) => {
    const a = await createUser('p-a');
    const b = await createUser('p-b');
    const shipped = await createRound(a, 'shipped');
    const pb = await pageAs(b);
    const res = await pb.goto(`/mypage/rounds/${shipped.id}`);
    const html = (await res?.text()) ?? '';
    await expect(pb.getByText('편지를 찾을 수 없어요')).toBeVisible();
    for (const secret of [TEASER, REPLY, shipped.book.name, '어은로'])
        expect(html, secret).not.toContain(secret);
});

test('NFR-09 회원 B의 창가·서가에는 회원 A의 편지·메모가 없다', async ({
    pageAs,
}) => {
    const a = await createUser('p-a2');
    const b = await createUser('p-b2');
    const unboxed = await createRound(a, 'unboxed');
    await insert('shelf_memos', {
        round_id: unboxed.id,
        member_id: a.id,
        body: 'A만 보는 메모',
    });
    const pb = await pageAs(b);
    for (const path of ['/mypage/window', '/mypage/shelf', '/mypage/orders']) {
        const res = await pb.goto(path);
        const html = (await res?.text()) ?? '';
        for (const secret of [
            'A만 보는 메모',
            REPLY,
            '요즘 숲길을 자주 걸어요',
        ])
            expect(html, `${path} ${secret}`).not.toContain(secret);
    }
});

test('NFR-08 언박싱 전에는 본인 화면의 응답·HTML에도 책 제목·표지·답장이 없다', async ({
    pageAs,
}) => {
    const member = await createUser('p-blind');
    const round = await createRound(member, 'shipped');
    const page = await pageAs(member);
    for (const path of [
        '/mypage/window',
        '/mypage',
        '/mypage/shelf',
        `/mypage/rounds/${round.id}`,
    ]) {
        const res = await page.goto(path);
        await page.waitForLoadState('networkidle');
        const sources = [(await res?.text()) ?? '', await page.content()];
        for (const html of sources) {
            for (const secret of [round.book.name, round.book.image_url, REPLY])
                expect(html, `${path} ${secret}`).not.toContain(secret);
        }
    }
    await expect(page.getByText(TEASER).first()).toBeVisible();
});
