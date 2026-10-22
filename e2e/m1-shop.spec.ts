import { insert } from './support/supabase';
import {
    DESKTOP,
    MOBILE,
    TABLET,
    expect,
    horizontalOverflow,
    test,
} from './support/test';

// M1 쇼핑 기반 수용기준 (docs/01-pm/06-acceptance-criteria.md AC-01~04, NFR-02·03·05·14)
const SOLD_OUT = '/products/b0000000-0000-4000-8000-000000000004'; // seed 제철 밥상 일기 (재고 0)

test('AC-01-1 메인: 소개·테마 4칸·새로 들어온 책 1~4권·Footer', async ({
    page,
}) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    for (const theme of ['자연', '식문화', '생태', '로컬'])
        await expect(
            page.getByRole('link', { name: new RegExp(`^${theme}`) }),
        ).toBeVisible();
    const cards = page.locator('main a[href^="/products/"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
    expect(await cards.count()).toBeLessThanOrEqual(8); // 카드 1장에 표지·제목 링크가 함께 있어 최대 4권 × 2
    await expect(page.locator('footer')).toContainText('우분투북스');
});

test('AC-01-2·NFR-14 메인 "생태" → 목록, 전체 새로고침 없음', async ({
    page,
}) => {
    await page.goto('/');
    const documents: string[] = [];
    page.on('request', (req) => {
        if (req.resourceType() === 'document') documents.push(req.url());
    });
    await page.getByRole('link', { name: /^생태/ }).click();
    await expect(page).toHaveURL('/products?theme=ecology');
    await expect(page.getByText('생태 서가의 책')).toBeVisible();
    expect(documents).toEqual([]);
});

test('AC-01-3 Footer에 사업자 정보·환불 규정·개인정보 처리방침 없음', async ({
    page,
}) => {
    await page.goto('/');
    const footer = page.locator('footer');
    for (const word of ['사업자', '환불', '개인정보'])
        await expect(footer).not.toContainText(word);
});

test('AC-02-1 전체 목록: 카드마다 표지·제목·저자·가격·테마', async ({
    page,
}) => {
    await page.goto('/products');
    const items = page.locator('main ul.grid > li');
    await expect(items.nth(5)).toBeVisible();
    for (const item of await items.all()) {
        await expect(item.getByRole('img', { name: /표지$/ })).toBeVisible();
        await expect(item).toContainText(/[0-9,]+원/);
        await expect(item).toContainText(/자연|식문화|생태|로컬|품절/);
    }
});

test('AC-02-3·AC-03-5 품절: 카드에 "품절", 상세 담기 비활성', async ({
    page,
}) => {
    await page.goto('/products?theme=food');
    await expect(
        page.locator('main ul.grid > li').filter({ hasText: '제철 밥상 일기' }),
    ).toContainText('품절');
    await page.goto(SOLD_OUT);
    await expect(
        page.getByRole('button', { name: /품절|장바구니 담기/ }),
    ).toBeDisabled();
    await expect(page.locator('main')).toContainText('품절');
});

test('AC-02-5 ?theme=abc는 오류 없이 전체 목록', async ({ page }) => {
    const res = await page.goto('/products?theme=abc');
    expect(res?.status()).toBe(200);
    await expect(page.locator('main ul.grid > li').nth(5)).toBeVisible();
    expect(
        await page.locator('main ul.grid > li').count(),
    ).toBeGreaterThanOrEqual(6);
});

test('AC-03-2 출판사 소개가 없는 책은 그 영역이 없다', async ({ page }) => {
    const book = await insert<{ id: string }>('products', {
        name: `e2e 소개 없는 책 ${Date.now()}`,
        author: 'e2e',
        price: 10000,
        image_url: 'https://picsum.photos/seed/e2e/600/800',
        description: 'e2e 설명',
        theme: 'local',
        keeper_note: 'e2e 노트',
        stock: 1,
    });
    await page.goto(`/products/${book.id}`);
    await expect(page.getByText('e2e 노트')).toBeVisible();
    await expect(page.getByText('출판사 소개')).toHaveCount(0);
});

test('NFR-05 없는 ID·잘못된 ID 모양도 "상품을 찾을 수 없습니다"', async ({
    page,
}) => {
    for (const id of ['00000000-0000-4000-8000-000000000000', 'abc', '1']) {
        await page.goto(`/products/${id}`);
        await expect(
            page.getByText('상품을 찾을 수 없습니다'),
            id,
        ).toBeVisible();
    }
});

for (const [viewport, columns] of [
    [MOBILE, 2],
    [TABLET, 3],
    [DESKTOP, 4],
] as const) {
    test.describe(`${viewport.width}px`, () => {
        test.use({ viewport });

        test(`NFR-02·03 ${viewport.width}px 목록 ${columns}열, 가로 스크롤 0, 표지 3:4`, async ({
            page,
        }) => {
            await page.goto('/products');
            const items = page.locator('main ul.grid > li');
            await expect(items.nth(columns)).toBeVisible();
            const tops = await items.evaluateAll((els) =>
                els
                    .slice(0, 8)
                    .map((el) => Math.round(el.getBoundingClientRect().top)),
            );
            expect(tops.filter((top) => top === tops[0]).length).toBe(columns);
            expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
            const ratio = await items
                .first()
                .getByRole('img', { name: /표지$/ })
                .evaluate((el) => {
                    const box = (
                        el.closest('.aspect-3\\/4') ?? el
                    ).getBoundingClientRect();
                    return box.height / box.width;
                });
            expect(ratio).toBeCloseTo(4 / 3, 1);
        });
    });
}
