import { login } from '../support/supabase';
import { saveAddress } from '../support/states';
import { MOBILE, createUser, expect, test } from '../support/test';

// P1 골목 서가 산책자, 스마트폰 360px (docs/uiux/review/QA/scenarios.md §2). 결제 승인(토스)은 키가 생기면 이어서 확인한다
test.use({ viewport: MOBILE });

const SHOTS = process.env.E2E_SHOTS; // 지정하면 시나리오 스크린샷을 남긴다 (QA 브리핑 첨부용)
const shot = async (page: import('@playwright/test').Page, name: string) => {
    if (SHOTS)
        await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
};

test('S1-1 책방 알아보기: 스크롤 없이 소개 제목과 글', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
        '천천히 답장하는 책방',
    );
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
    await shot(page, 'S1-1-360');
});

test('S1-2 테마로 책 고르기: 서가 칸 → 목록 → 상세 3단계, 뒤로 가기로 테마 유지 (AC-02-2)', async ({
    page,
}) => {
    await page.goto('/');
    await page.getByRole('link', { name: /^식문화/ }).click();
    await expect(page).toHaveURL('/products?theme=food');
    // 클라이언트 이동 뒤에도 이전 화면이 숨은 채 DOM에 남으므로(Next 16) 보이는 링크만 고른다
    await expect(page.getByText('식문화 서가의 책')).toBeVisible();
    await page
        .locator('main ul.grid > li a')
        .filter({ visible: true })
        .first()
        .click();
    await expect(page).toHaveURL(/\/products\/[0-9a-f-]{36}$/);
    await page.goBack();
    await expect(page).toHaveURL('/products?theme=food');
    await expect(page.getByText('식문화 서가의 책')).toBeVisible();
    await shot(page, 'S1-2-360');
});

test('S1-3 왜 권하는지 읽기: 노트가 상세 맨 위 (AC-03-1)', async ({ page }) => {
    await page.goto('/products/b0000000-0000-4000-8000-000000000001');
    const firstHeading = page.locator('main h1, main h2').first();
    await expect(firstHeading).toHaveText('책방지기 노트');
    await shot(page, 'S1-3-360');
});

test('S1-4 비회원으로 담기 → 로그인 → 같은 상세로 복귀 → 장바구니 → 주문서 (AC-03-3, AC-05-1)', async ({
    page,
    context,
    baseURL,
}) => {
    const product = '/products/b0000000-0000-4000-8000-000000000001';
    await page.goto(product);
    await page.getByRole('button', { name: '장바구니 담기' }).click();
    await expect(page).toHaveURL(`/login?next=${encodeURIComponent(product)}`);
    await expect(page.locator('main input')).toHaveCount(0); // 아이디·비밀번호 칸 없음 (AC-05-1)
    await shot(page, 'S1-4-login-360');

    // 소셜 로그인 제공자 화면은 자동화할 수 없어 세션 쿠키로 대신한다. 콜백은 next로 보낸다(app/auth/callback/route.ts)
    const member = await createUser('s14');
    await saveAddress(member);
    await login(context, member, baseURL ?? '');
    await page.goto(product);
    await page.getByRole('button', { name: '장바구니 담기' }).click();
    await expect(page.getByText('장바구니에 담았어요')).toBeVisible();
    await page
        .locator('header')
        .getByRole('link', { name: /장바구니/ })
        .click();
    await page.getByRole('link', { name: '주문하기' }).click();
    await expect(page).toHaveURL('/checkout');
    await expect(page.getByText('숲의 시간을 걷다 × 1')).toBeVisible();
    await expect(page.getByText('기본 배송지를 채워 두었어요')).toBeVisible();
    await expect(page.getByRole('button', { name: '결제하기' })).toBeEnabled();
    await shot(page, 'S1-4-checkout-360');
});

test('S1-5 없는 책 주소: 안내 + 테마 서가로 1단계 (AC-03-4)', async ({
    page,
}) => {
    await page.goto('/products/00000000-0000-4000-8000-000000000000');
    await expect(page.getByText('상품을 찾을 수 없습니다')).toBeVisible();
    await page.getByRole('link', { name: '테마 서가로 가기' }).click();
    await expect(page).toHaveURL('/products');
    await shot(page, 'S1-5-360');
});
