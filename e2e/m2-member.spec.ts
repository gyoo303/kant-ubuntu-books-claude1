import { insert, select, update } from './support/supabase';
import { createRound } from './support/states';
import { createUser, expect, test } from './support/test';

// M2 회원·관리자 수용기준 (AC-05·06, NFR-06). 카카오·네이버 실제 로그인은 제공자 화면이라 자동화하지 않는다(브리핑 "사람 확인")

test('AC-05-1 로그인 수단은 카카오·네이버 2개, 아이디·비밀번호 칸 없음', async ({
    page,
}) => {
    await page.goto('/login');
    await expect(page.locator('main button')).toHaveCount(2);
    await expect(
        page.getByRole('button', { name: '카카오로 시작하기' }),
    ).toBeVisible();
    await expect(
        page.getByRole('button', { name: /네이버로 시작하기/ }),
    ).toBeVisible();
    await expect(page.locator('main input')).toHaveCount(0);
});

test('AC-05-5 소셜 로그인 취소로 돌아오면 안내', async ({ page }) => {
    await page.goto('/auth/callback?error=access_denied');
    await expect(page).toHaveURL('/login?error=1');
    await expect(page.getByText('로그인을 마치지 못했어요')).toBeVisible();
});

test('AC-05-3 마이페이지 메뉴, "창가"는 창가 화면으로', async ({ pageAs }) => {
    const member = await createUser('m2-menu');
    const page = await pageAs(member);
    await page.goto('/mypage');
    for (const name of ['주문 현황', '창가', '나의 서가', '기본 배송지'])
        await expect(
            page.getByRole('link', { name, exact: true }),
        ).toBeVisible();
    for (const name of ['로그아웃', '탈퇴'])
        await expect(page.getByRole('button', { name })).toBeVisible();
    await page.getByRole('link', { name: '창가', exact: true }).click();
    await expect(page).toHaveURL('/mypage/window');
});

test('AC-05-7 읽는 중 회차가 있으면 탈퇴되지 않고 이유가 보인다', async ({
    pageAs,
}) => {
    const member = await createUser('m2-busy');
    await createRound(member, 'reading');
    const page = await pageAs(member);
    await page.goto('/mypage');
    await page.getByRole('button', { name: '탈퇴' }).click();
    await expect(page.getByText('지금은 탈퇴할 수 없어요')).toBeVisible();
    expect(
        await select('profiles', `select=id&id=eq.${member.id}`),
    ).toHaveLength(1);
});

test('AC-05-4 진행 중인 것이 없는 회원은 탈퇴되고 메인으로 간다', async ({
    pageAs,
}) => {
    const member = await createUser('m2-bye');
    await insert('shipping_addresses', {
        member_id: member.id,
        recipient_name: '탈퇴손님',
        phone: '010-0000-0000',
        address: '대전',
    });
    const page = await pageAs(member);
    await page.goto('/mypage');
    await page.getByRole('button', { name: '탈퇴' }).click();
    await expect(page).toHaveURL('/');
    expect(
        await select('profiles', `select=id&id=eq.${member.id}`),
    ).toHaveLength(0);
    expect(
        await select(
            'shipping_addresses',
            `select=member_id&member_id=eq.${member.id}`,
        ),
    ).toHaveLength(0);
});

test('AC-06-2·3 재고 0으로 고치면 품절, 책 관리에 삭제 버튼 없음', async ({
    pageAs,
}) => {
    const keeper = await createUser('m2-k', { keeper: true });
    const book = await insert<{ id: string }>('products', {
        name: `e2e 재고 바꿀 책 ${Date.now()}`,
        author: 'e2e',
        price: 12000,
        image_url: 'https://picsum.photos/seed/e2e2/600/800',
        description: 'e2e',
        theme: 'nature',
        keeper_note: 'e2e 노트',
        stock: 2,
    });
    const page = await pageAs(keeper);
    await page.goto('/admin/products');
    await expect(page.getByRole('button', { name: /삭제/ })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /삭제/ })).toHaveCount(0);
    await page.goto(`/admin/products/${book.id}`);
    await page.getByLabel('재고').fill('0');
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('저장했어요')).toBeVisible();
    await page.goto(`/products/${book.id}`);
    await expect(page.locator('main')).toContainText('품절');
    await expect(
        page.getByRole('button', { name: '장바구니 담기' }),
    ).toBeDisabled();
    await update('products', `id=eq.${book.id}`, { stock: 0 });
});
