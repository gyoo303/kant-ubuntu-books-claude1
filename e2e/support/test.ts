import { test as base, expect, type Page } from '@playwright/test';
import { createUser, login, type TestUser } from './supabase';

// 공통 픽스처: pageAs(user)로 그 회원이 로그인한 새 탭을 연다 (뷰포트와 contextOptions(동작 줄이기 등)는 test.use 설정을 따른다)
export const test = base.extend<{ pageAs: (user: TestUser) => Promise<Page> }>({
    pageAs: async ({ browser, baseURL, viewport, contextOptions }, provide) => {
        const opened: Page[] = [];
        await provide(async (user) => {
            const context = await browser.newContext({
                ...contextOptions,
                baseURL,
                viewport,
                locale: 'ko-KR',
            });
            await login(context, user, baseURL ?? '');
            const page = await context.newPage();
            opened.push(page);
            return page;
        });
        await Promise.all(opened.map((page) => page.context().close()));
    },
});

export { expect, createUser };

export const MOBILE = { width: 360, height: 640 };
export const TABLET = { width: 768, height: 1024 };
export const DESKTOP = { width: 1280, height: 800 };

// 회원 화면 본문 글자 (Header·Footer 포함)
export async function visibleText(page: Page): Promise<string> {
    return page.evaluate(() => document.body.innerText);
}

// 가로 스크롤 0 (NFR-02, UX-2)
export async function horizontalOverflow(page: Page): Promise<number> {
    return page.evaluate(
        () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
    );
}

// 기본(primary) 버튼 모양의 링크·버튼 개수 (UX-11). components/ui/button default 변형과 같은 bg-primary 클래스를 센다
export async function primaryActionCount(page: Page): Promise<number> {
    return page.evaluate(
        () =>
            [...document.querySelectorAll('main a, main button')].filter(
                (el) =>
                    (el.getAttribute('class') ?? '')
                        .split(/\s+/)
                        .includes('bg-primary') &&
                    (el as HTMLElement).offsetParent !== null,
            ).length,
    );
}
