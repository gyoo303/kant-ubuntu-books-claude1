import { select } from '../support/supabase';
import { createRound } from '../support/states';
import { DESKTOP, createUser, expect, test } from '../support/test';

// P3 책방지기, PC 1280px (docs/uiux/review/QA/scenarios.md §2). [환불]은 토스 테스트 키가 생기면 이어서 확인한다
test.use({ viewport: DESKTOP });

const SHOTS = process.env.E2E_SHOTS;
const shot = async (page: import('@playwright/test').Page, name: string) => {
    if (SHOTS)
        await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
};

// 1×1 PNG (표지 업로드용)
const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
);

test('S3-1 새 책 등록: 잘못된 가격은 칸 아래 이유, 고치면 저장되고 상세에 보인다 (AC-06-1·4, UX-15)', async ({
    pageAs,
}) => {
    const keeper = await createUser('s31', { keeper: true });
    const page = await pageAs(keeper);
    const name = `e2e 새 책 ${Date.now()}`;
    await page.goto('/admin');
    await page.getByRole('link', { name: '책 관리' }).first().click();
    await page.getByRole('link', { name: '새 책 등록' }).click();
    await expect(page).toHaveURL('/admin/products/new');

    await page.getByLabel('제목').fill(name);
    await page.getByLabel('저자').fill('e2e 저자');
    await page.getByLabel('가격 (원)').fill('-1000');
    await page
        .locator('label')
        .filter({ hasText: /^자연$/ })
        .click(); // 테마 알약(라디오는 sr-only)
    await page.getByLabel('표지 이미지').setInputFiles({
        name: 'cover.png',
        mimeType: 'image/png',
        buffer: PNG,
    });
    await page.getByLabel(/짧은 설명/).fill('e2e 설명');
    await page.getByLabel(/책방지기 노트/).fill('e2e 노트');
    await page.getByLabel('재고').fill('3');
    await page.getByRole('button', { name: '저장' }).click();
    const price = page.getByLabel('가격 (원)');
    await expect(price).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#price-error')).toBeVisible();
    await shot(page, 'S3-1-invalid-1280');

    await price.fill('15000');
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('저장했어요')).toBeVisible();
    const [row] = await select<{ id: string }>(
        'products',
        `select=id&name=eq.${encodeURIComponent(name)}`,
    );
    expect(row).toBeTruthy();
    await page.goto(`/products/${row.id}`);
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
    await expect(page.locator('blockquote')).toHaveText('e2e 노트');
});

test('S3-2 편지 처리: 열기 → 책·답장 → 힌트 → 발송, 한 화면에서 끝나고 코드가 크게 보인다 (AC-13-1·2, AC-15-1·3, NFR-13)', async ({
    pageAs,
}) => {
    const member = await createUser('s32-m');
    const keeper = await createUser('s32-k', { keeper: true });
    const round = await createRound(member, 'arrived');
    const page = await pageAs(keeper);
    const paths: string[] = [];
    page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame())
            paths.push(new URL(frame.url()).pathname);
    });

    await page.goto(`/admin/desk?round=${round.id}`);
    await expect(page.getByText('요즘 숲길을 자주 걸어요')).toBeVisible();
    const [opened] = await select<{ status: string }>(
        'subscription_rounds',
        `select=status&id=eq.${round.id}`,
    );
    expect(opened.status).toBe('reading'); // AC-13-2

    await expect(
        page.getByText('아직 빠진 것: 책, 답장, 힌트 문장'),
    ).toBeVisible(); // AC-15-3
    await expect(page.getByRole('button', { name: '발송' })).toBeDisabled();

    const stocked = page
        .locator('label')
        .filter({ hasText: /재고 [1-9]/ })
        .first();
    await stocked.click();
    await page
        .getByLabel('답장 편지')
        .fill('e2e 답장입니다. 천천히 읽어 주세요.');
    await page.getByRole('button', { name: '책과 답장 저장' }).click();
    await expect(page.getByText('저장했어요')).toBeVisible();
    await page.getByLabel(/힌트 문장/).fill('e2e 힌트 문장');
    await page.getByRole('button', { name: '발송' }).click();

    const code = page.getByLabel(/^언박싱 코드/);
    await expect(code).toBeVisible();
    expect(((await code.textContent()) ?? '').replace(/\s/g, '')).toMatch(
        /^\d{6}$/,
    );
    const fontSize = await code.evaluate((el) =>
        parseFloat(getComputedStyle(el).fontSize),
    );
    expect(fontSize).toBeGreaterThanOrEqual(36);
    await shot(page, 'S3-2-shipped-1280');

    expect(new Set(paths), 'NFR-13 다른 화면 이동 0회').toEqual(
        new Set(['/admin/desk']),
    );
    const [shipped] = await select<{ status: string }>(
        'subscription_rounds',
        `select=status&id=eq.${round.id}`,
    );
    expect(shipped.status).toBe('shipped');
});

test('S3-3 취소 요청 처리: 회원 요청 → 발송 막힘 → 책방지기 [취소 거절] → 회원 창가 안내 (AC-20-3·6)', async ({
    pageAs,
}) => {
    const member = await createUser('s33-m');
    const keeper = await createUser('s33-k', { keeper: true });
    const recipient = `취소손님${Date.now()}`;
    const round = await createRound(member, 'reading', { recipient });
    const mp = await pageAs(member);
    await mp.goto('/mypage/window');
    await mp.getByRole('button', { name: '취소 요청' }).click();
    await expect(mp.getByText('취소 요청 중')).toBeVisible(); // AC-12-7

    const kp = await pageAs(keeper);
    await kp.goto(`/admin/desk?round=${round.id}`);
    await expect(kp.getByRole('button', { name: '발송' })).toBeDisabled(); // AC-20-3
    const item = kp.locator('li').filter({ hasText: `${recipient} 님의 편지` });
    await item.getByRole('button', { name: '취소 거절' }).click();
    await expect(item.getByRole('button', { name: '취소 거절' })).toHaveCount(
        0,
    );
    await shot(kp, 'S3-3-keeper-1280');

    await mp.reload();
    await expect(
        mp.getByText(
            '책방지기가 취소 요청을 받지 않았어요. 책은 그대로 보내드려요',
        ),
    ).toBeVisible(); // AC-20-6
});

test('S3-3 오늘 할 일 "취소 요청"에서 회차 취소 요청까지 바로 간다 (scenarios.md S3-3 성공 기준)', async ({
    pageAs,
}) => {
    // QA 이슈 TKT-QA-M4 #2: 관리자 홈 "취소 요청" 칸은 /admin/orders로 가지만 회차 취소 요청은 서재 작업 목록에만 있다.
    // 회차 취소 요청만 있으면 주문 처리 화면에 "지금 보낼 책이 없어요"만 보인다. 고쳐지면 이 표시를 지운다
    test.fail();
    const member = await createUser('s33b-m');
    const keeper = await createUser('s33b-k', { keeper: true });
    const recipient = `홈취소손님${Date.now()}`;
    await createRound(member, 'reading', { recipient });
    const mp = await pageAs(member);
    await mp.goto('/mypage/window');
    await mp.getByRole('button', { name: '취소 요청' }).click();
    await expect(mp.getByText('취소 요청 중')).toBeVisible();

    const kp = await pageAs(keeper);
    await kp.goto('/admin');
    await kp.getByRole('link', { name: /취소 요청/ }).click();
    await expect(kp.getByText(`${recipient} 님의 편지`)).toBeVisible({
        timeout: 3000,
    });
});

test('S3-4 주소록 받기: 엑셀에서 바로 열리는 CSV, 보낼 곳만 담긴다 (AC-19-1)', async ({
    pageAs,
}) => {
    const member = await createUser('s34-m');
    const shippedMember = await createUser('s34-s');
    const keeper = await createUser('s34-k', { keeper: true });
    const reading = `주소록손님${Date.now()}`;
    const shipped = `발송끝손님${Date.now()}`;
    await createRound(member, 'reading', { recipient: reading });
    await createRound(shippedMember, 'shipped', { recipient: shipped });
    const page = await pageAs(keeper);
    await page.goto('/admin/orders');
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('link', { name: '주소록 내려받기' }).click(),
    ]);
    const path = await download.path();
    const bytes = await import('node:fs').then((fs) => fs.readFileSync(path));
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // UTF-8 BOM: 엑셀 한글 (AC-19-1)
    const text = bytes.toString('utf8');
    expect(text).toContain(reading);
    expect(text).not.toContain(shipped);
    expect(text).toContain('\r\n');
});
