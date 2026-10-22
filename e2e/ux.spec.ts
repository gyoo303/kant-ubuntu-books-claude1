import { createRound, saveAddress } from './support/states';
import {
    DESKTOP,
    MOBILE,
    TABLET,
    createUser,
    expect,
    horizontalOverflow,
    primaryActionCount,
    test,
    visibleText,
} from './support/test';

// UX-n 자동 확인 (docs/uiux/review/QA/README.md §3). 정의는 docs/uiux/review/frontend/README.md §3
const PRODUCT = '/products/b0000000-0000-4000-8000-000000000001'; // seed 숲의 시간을 걷다 (재고 있음)
const PUBLIC_PAGES = [
    '/',
    '/products',
    '/products?theme=food',
    PRODUCT,
    '/login',
    '/products/00000000-0000-4000-8000-000000000000',
];
const MEMBER_PAGES = [
    '/mypage',
    '/mypage/window',
    '/mypage/shelf',
    '/mypage/orders',
    '/mypage/address',
    '/cart',
    '/letters/new',
    '/mypage/farewell',
];

test.describe('360px Header·가로 스크롤', () => {
    test.use({ viewport: MOBILE });

    test('UX-2 360px Header 메뉴 4개가 모두 보이고 가로 스크롤 0', async ({
        page,
    }) => {
        for (const path of PUBLIC_PAGES) {
            await page.goto(path);
            const header = page.locator('header');
            for (const name of [
                '테마 서가',
                '편지 띄우기',
                '장바구니',
                '로그인',
            ]) {
                await expect(
                    header.getByRole('link', { name, exact: true }),
                    `${path} ${name}`,
                ).toBeInViewport();
            }
            expect(await horizontalOverflow(page), path).toBeLessThanOrEqual(0);
        }
    });

    test('UX-2 회원 화면 360px 가로 스크롤 0', async ({ pageAs }) => {
        const member = await createUser('ux2');
        const page = await pageAs(member);
        for (const path of MEMBER_PAGES) {
            await page.goto(path);
            expect(await horizontalOverflow(page), path).toBeLessThanOrEqual(0);
        }
    });

    test('UX-4 360×640 첫 화면에 제목·소개 글 첫 줄', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
        await expect(
            page.getByText('대전 어은동 골목 안쪽에서'),
        ).toBeInViewport({ ratio: 0.1 });
    });

    test('UX-7 360px 상세 표지 너비 ≤ 200px', async ({ page }) => {
        await page.goto(PRODUCT);
        // 이미지가 깨지면 같은 자리에 대체 표지(role=img)가 그려진다 (AC-04-2). 둘 다 이름이 "<제목> 표지"
        const cover = page.getByRole('img', { name: /표지$/ }).first();
        await expect(cover).toBeVisible();
        const width = await cover.evaluate(
            (el) => el.getBoundingClientRect().width,
        );
        expect(width).toBeLessThanOrEqual(200);
    });

    test('UX-6 360px 노트 ≥ 20px, 바탕체, 설명보다 큼', async ({ page }) => {
        await page.goto(PRODUCT);
        const note = page.locator('blockquote').first();
        const style = await note.evaluate((el) => ({
            size: parseFloat(getComputedStyle(el).fontSize),
            family: getComputedStyle(el).fontFamily,
        }));
        const descSize = await page
            .getByText('숲길', { exact: false })
            .last()
            .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
        expect(style.size).toBeGreaterThanOrEqual(20);
        expect(style.family).toMatch(/Gowun Batang/i);
        expect(style.size).toBeGreaterThan(descSize);
    });
});

test.describe('768px', () => {
    test.use({ viewport: TABLET });

    test('UX-6 768px 이상 노트 ≥ 24px', async ({ page }) => {
        await page.goto(PRODUCT);
        const size = await page
            .locator('blockquote')
            .first()
            .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
        expect(size).toBeGreaterThanOrEqual(24);
    });

    test('NFR-02 768px 가로 스크롤 0, 목록 3열', async ({ page }) => {
        await page.goto('/products');
        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
        await expect(page.locator('main ul.grid > li').nth(2)).toBeVisible();
        const tops = await page
            .locator('main ul.grid > li')
            .evaluateAll((items) =>
                items
                    .slice(0, 3)
                    .map((el) => Math.round(el.getBoundingClientRect().top)),
            );
        expect(new Set(tops).size, '첫 세 칸이 한 줄').toBe(1);
    });
});

test.describe('1280px', () => {
    test.use({ viewport: DESKTOP });

    test('UX-3 현재 메뉴에만 aria-current="page" 1개', async ({
        page,
        pageAs,
    }) => {
        await page.goto('/products?theme=nature');
        await expect(page.locator('header a[aria-current="page"]')).toHaveCount(
            1,
        );
        await expect(page.locator('header a[aria-current="page"]')).toHaveText(
            '테마 서가',
        );

        const member = await createUser('ux3');
        const mp = await pageAs(member);
        for (const [path, label] of [
            ['/letters/new', '편지 띄우기'],
            ['/cart', '장바구니'],
            ['/mypage/shelf', '마이페이지'],
        ]) {
            await mp.goto(path);
            await expect(
                mp.locator('header a[aria-current="page"]'),
                path,
            ).toHaveCount(1);
            await expect(
                mp.locator('header a[aria-current="page"]'),
                path,
            ).toContainText(label);
        }
        await mp.goto('/');
        await expect(mp.locator('header a[aria-current="page"]')).toHaveCount(
            0,
        );
    });

    test('UX-4 1280×800 첫 화면에 제목·소개 글·창가 그림', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
        await expect(
            page.getByText('대전 어은동 골목 안쪽에서'),
        ).toBeInViewport();
        await expect(
            page.locator('main svg[role="img"]').first(),
        ).toBeInViewport();
    });

    test('UX-5·UX-19 할인·순위·당일 표현, 느낌표·이모지 0건', async ({
        page,
        pageAs,
    }) => {
        const banned = [
            '할인',
            '%',
            '베스트',
            '순위',
            '당일',
            '오늘 출발',
            '★',
        ];
        const member = await createUser('ux5');
        const mp = await pageAs(member);
        for (const [p, path] of [
            ...PUBLIC_PAGES.map((x) => [page, x] as const),
            ...MEMBER_PAGES.map((x) => [mp, x] as const),
        ]) {
            await p.goto(path);
            const text = await visibleText(p);
            for (const word of banned)
                expect(text, `${path} "${word}"`).not.toContain(word);
            expect(text, `${path} 느낌표`).not.toMatch(/!/);
            expect(text, `${path} 이모지`).not.toMatch(
                /\p{Extended_Pictographic}/u,
            );
        }
    });

    test('UX-8 노트 max-width ≤ 36rem, line-height ≥ 1.8', async ({ page }) => {
        await page.goto(PRODUCT);
        const m = await page
            .locator('blockquote')
            .first()
            .evaluate((el) => {
                const s = getComputedStyle(el);
                return {
                    maxWidth: parseFloat(s.maxWidth),
                    lineHeight: parseFloat(s.lineHeight),
                    fontSize: parseFloat(s.fontSize),
                    rem: parseFloat(
                        getComputedStyle(document.documentElement).fontSize,
                    ),
                };
            });
        expect(m.maxWidth).toBeLessThanOrEqual(36 * m.rem);
        expect(m.lineHeight / m.fontSize).toBeGreaterThanOrEqual(1.8);
    });

    test('UX-10 편지 글자 수가 늘 보인다 (1·10·2,001자)', async ({
        pageAs,
    }) => {
        const member = await createUser('ux10');
        const page = await pageAs(member);
        await page.goto('/letters/new');
        const letter = page.getByLabel('책방지기에게 보내는 편지');
        for (const [input, shown] of [
            ['가', '1 / 2,000자'],
            ['가나다라마바사아자차', '10 / 2,000자'],
        ] as const) {
            await letter.fill(input);
            await expect(page.getByText(shown)).toBeVisible();
        }
        await letter.fill('가'.repeat(2001));
        await expect(page.getByText(/2,00[01] \/ 2,000자/)).toBeVisible();
    });

    test('UX-11 화면마다 기본 버튼 ≤ 1개', async ({ page, pageAs }) => {
        for (const path of PUBLIC_PAGES) {
            await page.goto(path);
            expect(await primaryActionCount(page), path).toBeLessThanOrEqual(1);
        }
        const member = await createUser('ux11');
        await saveAddress(member);
        const mp = await pageAs(member);
        for (const path of MEMBER_PAGES) {
            await mp.goto(path);
            expect(await primaryActionCount(mp), path).toBeLessThanOrEqual(1);
        }
    });

    test('UX-12 언박싱 코드는 숫자 키패드 한 칸', async ({ pageAs }) => {
        const member = await createUser('ux12');
        const round = await createRound(member, 'shipped');
        const page = await pageAs(member);
        await page.goto(`/mypage/rounds/${round.id}`);
        const inputs = page.locator('main input');
        await expect(inputs).toHaveCount(1);
        await expect(inputs).toHaveAttribute('inputmode', 'numeric');
        await expect(inputs).toHaveAttribute('autocomplete', 'one-time-code');
        await expect(inputs).toHaveAttribute('maxlength', '6');
    });

    test('UX-14 데이터 없는 회원: 정해진 문구 + 다음 행동 1개', async ({
        pageAs,
    }) => {
        const member = await createUser('ux14');
        const page = await pageAs(member);
        for (const [path, copy] of [
            ['/cart', '장바구니가 비어 있어요'],
            ['/mypage/orders', '아직 주문한 책이 없어요'],
            ['/mypage/shelf', '아직 서가에 꽂힌 책이 없어요'],
        ]) {
            await page.goto(path);
            await expect(page.getByText(copy), path).toBeVisible();
            await expect(page.locator('main a'), path).toHaveCount(1);
        }
    });

    test('UX-15 빈칸 제출 시 aria-invalid와 오류 문구 연결', async ({
        pageAs,
    }) => {
        const member = await createUser('ux15');
        const page = await pageAs(member);
        await page.goto('/mypage/address');
        await page.getByRole('button', { name: '저장' }).click();
        const invalid = page.locator('main [aria-invalid="true"]');
        await expect(invalid.first()).toBeVisible();
        const count = await invalid.count();
        for (let i = 0; i < count; i += 1) {
            const ids =
                (await invalid.nth(i).getAttribute('aria-describedby')) ?? '';
            const errorId = ids.split(' ').find((id) => id.endsWith('-error'));
            expect(errorId, `칸 ${i} aria-describedby="${ids}"`).toBeTruthy();
            await expect(page.locator(`[id="${errorId}"]`)).toBeVisible();
        }
    });

    test('UX-16 Tab 초점마다 링이 보인다', async ({ page }) => {
        for (const path of ['/', PRODUCT, '/login']) {
            await page.goto(path);
            const seen: string[] = [];
            for (let i = 0; i < 25; i += 1) {
                await page.keyboard.press('Tab');
                const info = await page.evaluate(() => {
                    const el = document.activeElement as HTMLElement | null;
                    if (!el || el === document.body) return null;
                    const s = getComputedStyle(el);
                    const ring =
                        (s.outlineStyle !== 'none' &&
                            parseFloat(s.outlineWidth) > 0) ||
                        (s.boxShadow !== 'none' && s.boxShadow !== '');
                    return {
                        label: `${el.tagName} ${(el.textContent ?? '').trim().slice(0, 20)}`,
                        ring,
                    };
                });
                if (!info) break;
                expect(info.ring, `${path} 초점 링 없음: ${info.label}`).toBe(
                    true,
                );
                seen.push(info.label);
            }
            expect(seen.length, path).toBeGreaterThan(0);
        }
    });

    test('UX-18 관리자 화면은 상단 바 primary 색, 본문 한 열', async ({
        pageAs,
    }) => {
        const keeper = await createUser('ux18', { keeper: true });
        const page = await pageAs(keeper);
        for (const path of [
            '/admin',
            '/admin/desk',
            '/admin/orders',
            '/admin/products/new',
        ]) {
            await page.goto(path);
            await expect(
                page
                    .locator('header')
                    .getByRole('navigation', { name: '관리자 메뉴' }),
            ).toBeVisible();
            const bar = await page.evaluate(() => {
                const primary = document.createElement('div');
                primary.style.background = 'var(--primary)';
                document.body.append(primary);
                const want = getComputedStyle(primary).backgroundColor;
                primary.remove();
                const first = [...document.querySelectorAll('header')].find(
                    (el) => el.checkVisibility(),
                );
                return {
                    want,
                    got: first ? getComputedStyle(first).backgroundColor : '',
                };
            });
            expect(bar.got, path).toBe(bar.want);
        }
    });
});

test.describe('동작 줄이기', () => {
    test.use({
        viewport: DESKTOP,
        contextOptions: { reducedMotion: 'reduce' },
    });

    test('UX-17 동작 줄이기 켜면 창가 촛불도 멈춘다', async ({ pageAs }) => {
        const member = await createUser('ux17r');
        await createRound(member, 'reading');
        const page = await pageAs(member);
        await page.goto('/mypage/window');
        await expect(page.getByRole('status').first()).toBeVisible();
        const running = await page.evaluate(
            () =>
                document
                    .getAnimations()
                    .filter((a) => a.playState === 'running').length,
        );
        expect(running).toBe(0);
    });
});

test.describe('동작 기본', () => {
    test.use({ viewport: DESKTOP });

    test('UX-17 반복 움직임은 촛불뿐', async ({ pageAs }) => {
        const member = await createUser('ux17');
        await createRound(member, 'reading');
        const page = await pageAs(member);
        await page.goto('/mypage/window');
        await expect(page.getByRole('status').first()).toBeVisible();
        const infinite = await page.evaluate(() =>
            document
                .getAnimations()
                .filter((a) => a.effect?.getTiming().iterations === Infinity)
                .map((a) => (a as CSSAnimation).animationName),
        );
        expect(infinite.length).toBeGreaterThan(0);
        for (const name of infinite) expect(name).toBe('candle-flicker');
    });
});
