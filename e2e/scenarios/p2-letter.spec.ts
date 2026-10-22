import { REPLY, TEASER, createRound, saveAddress } from '../support/states';
import { DESKTOP, MOBILE, createUser, expect, test } from '../support/test';

// P2 창가의 편지 손님 (docs/uiux/review/QA/scenarios.md §2). S2-1·S2-2(결제창)는 토스 테스트 키가 생기면 이어서 확인한다
const SHOTS = process.env.E2E_SHOTS;
const shot = async (page: import('@playwright/test').Page, name: string) => {
    if (SHOTS)
        await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
};

const WINDOW = [
    ['arrived', '편지가 서점에 도착했어요'],
    ['reading', '책방지기가 당신의 편지를 읽고 있어요'],
    ['shipped', '책이 서점 문을 나섰습니다'],
] as const;

for (const viewport of [MOBILE, DESKTOP]) {
    test.describe(`${viewport.width}px`, () => {
        test.use({ viewport });

        test(`S2-3 다시 들어와 단계 확인: 창가 문구와 그림이 함께 보인다 (AC-12-1~3, UX-9) ${viewport.width}px`, async ({
            pageAs,
        }) => {
            for (const [state, copy] of WINDOW) {
                const member = await createUser(`s23-${state}`);
                await createRound(member, state);
                const page = await pageAs(member);
                await page.goto('/mypage/window');
                const status = page.locator(
                    'section[aria-label="창가"] [role="status"]',
                );
                await expect(status).toHaveText(copy);
                await expect(status).toBeInViewport();
                const art = page.getByRole('img', { name: copy });
                await expect(art).toBeInViewport({
                    ratio: viewport === MOBILE ? 0.5 : 1,
                });
                await expect(page.locator('main')).not.toContainText(
                    /택배|운송장|[0-9]단계/,
                ); // AC-12-4
                await shot(page, `S2-3-${state}-${viewport.width}`);
            }
        });
    });
}

test.describe('360px 흐름', () => {
    test.use({ viewport: MOBILE });

    test('S2-1 편지지: 설문 없이 편지 한 칸 + 받는 곳, 글자 수가 보인다 (AC-11-1, UX-10)', async ({
        pageAs,
    }) => {
        const member = await createUser('s21');
        await saveAddress(member);
        const page = await pageAs(member);
        await page.goto('/');
        await page
            .locator('header')
            .getByRole('link', { name: '편지 띄우기' })
            .click();
        await expect(page).toHaveURL('/letters/new');
        await expect(page.locator('main textarea')).toHaveCount(1);
        await expect(
            page.locator(
                'main select, main input[type="radio"], main input[type="checkbox"]',
            ),
        ).toHaveCount(0);
        await page
            .getByLabel('책방지기에게 보내는 편지')
            .fill('요즘 숲길을 자주 걸어요.');
        await expect(page.getByText('14 / 2,000자')).toBeVisible();
        await expect(page.getByText('30,000원')).toBeVisible();
        await shot(page, 'S2-1-360');
    });

    test('S2-4 상자 열기: 힌트 → 코드 입력 → 틀린 코드 안내 → 재입력 → 책·답장 공개 (AC-16-2·3)', async ({
        pageAs,
    }) => {
        const member = await createUser('s24');
        const round = await createRound(member, 'shipped');
        const page = await pageAs(member);
        await page.goto('/mypage/window');
        await expect(page.getByText(TEASER)).toBeVisible();
        await page.getByRole('link', { name: '코드 입력하기' }).click();
        await expect(page).toHaveURL(`/mypage/rounds/${round.id}`);

        const input = page.getByLabel('상자 속 카드의 여섯 자리 코드');
        const wrong = round.code === '000000' ? '111111' : '000000';
        await input.fill(wrong);
        await page.getByRole('button', { name: '열기' }).click();
        await expect(page.getByRole('alert')).toBeVisible();
        await expect(input).toHaveAttribute('aria-invalid', 'true');
        await shot(page, 'S2-4-wrong-360');

        await input.fill(round.code);
        await page.getByRole('button', { name: '열기' }).click();
        await expect(
            page.getByRole('heading', { name: round.book.name }),
        ).toBeVisible();
        await expect(page.getByText(REPLY)).toBeVisible();
        await shot(page, 'S2-4-opened-360');
    });

    test('S2-5 한 줄 메모: 서가에 100자 이내로 남기고 날짜가 보인다 (AC-17-1)', async ({
        pageAs,
    }) => {
        const member = await createUser('s25');
        const round = await createRound(member, 'unboxed');
        const page = await pageAs(member);
        await page.goto(`/mypage/rounds/${round.id}`);
        await page
            .getByRole('link', { name: '나의 서가에 한 줄 남기기' })
            .click();
        await expect(page).toHaveURL(/\/mypage\/shelf/);
        await expect(page.getByText('메모는 나만 볼 수 있어요')).toBeVisible();
        await page.getByRole('button', { name: /한 줄 메모 남기기/ }).click();
        await page.getByLabel('한 줄 메모').fill('바람 소리를 들었다');
        await page.getByRole('button', { name: '저장' }).click();
        await expect(page.getByText('바람 소리를 들었다')).toBeVisible();
        await expect(page.getByText(/\d{4}-\d{2}-\d{2}/).first()).toBeVisible();
        await shot(page, 'S2-5-360');
    });

    test('S2-6 구독 마무리: 인사 편지 → 버튼 1번, 확인 팝업·빨간 버튼 없음 (AC-18-2, UX-13)', async ({
        pageAs,
    }) => {
        const member = await createUser('s26');
        await createRound(member, 'unboxed');
        const page = await pageAs(member);
        await page.goto('/mypage');
        await page.getByRole('link', { name: '구독 마무리하기' }).click();
        await expect(page).toHaveURL('/mypage/farewell');
        await shot(page, 'S2-6-letter-360');
        const button = page.getByRole('button', {
            name: '구독을 마무리합니다',
        });
        const color = await button.evaluate(
            (el) => getComputedStyle(el).backgroundColor,
        );
        const destructive = await page.evaluate(() => {
            const probe = document.createElement('div');
            probe.style.background = 'var(--destructive)';
            document.body.append(probe);
            const value = getComputedStyle(probe).backgroundColor;
            probe.remove();
            return value;
        });
        expect(color).not.toBe(destructive);
        let dialogs = 0;
        page.on('dialog', async (dialog) => {
            dialogs += 1;
            await dialog.dismiss();
        });
        await button.click();
        await expect(
            page
                .getByText('진행 중인 구독이 없어요')
                .or(page.getByText('그동안 고마웠어요')),
        ).toBeVisible();
        await expect(page.getByRole('dialog')).toHaveCount(0);
        expect(dialogs).toBe(0);
        await shot(page, 'S2-6-done-360');
        await page.goto('/mypage');
        await expect(
            page.getByRole('link', { name: '구독 마무리하기' }),
        ).toHaveCount(0); // AC-18-7
    });

    test('S2-6 구독 마무리 뒤 감사 인사가 보인다 (US-18 정상 흐름 3)', async ({
        pageAs,
    }) => {
        // QA 이슈 TKT-QA-M4 #1: 마무리 직후 revalidatePath('/mypage/farewell')가 화면을 다시 그려
        // "그동안 고마웠어요"가 잠깐 보였다가 "진행 중인 구독이 없어요"로 바뀐다. 고쳐지면 이 표시를 지운다
        test.fail();
        const member = await createUser('s26b');
        await createRound(member, 'unboxed');
        const page = await pageAs(member);
        await page.goto('/mypage/farewell');
        await page.getByRole('button', { name: '구독을 마무리합니다' }).click();
        await expect(
            page
                .getByText('진행 중인 구독이 없어요')
                .or(page.getByText('그동안 고마웠어요')),
        ).toBeVisible();
        await page.waitForTimeout(3000); // 다시 그리기가 끝날 때까지 기다린 뒤에도 인사가 남아 있어야 한다
        await expect(page.getByText('그동안 고마웠어요')).toBeVisible({
            timeout: 1000,
        });
    });
});
