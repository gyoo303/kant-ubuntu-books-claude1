import { defineConfig, devices } from '@playwright/test';

// 화면 자동 확인 (UX-n, 페르소나 시나리오, 개인정보 화면). 단위 테스트(npm test)와 따로 돈다: npm run test:e2e
// 필요: seed가 들어간 Supabase + .env.local, 빌드된 앱(npm run build). 결제 승인은 토스 테스트 키가 있어야 해 여기서 다루지 않는다
try {
    process.loadEnvFile('.env.local');
} catch {
    // CI 등에서는 환경변수로 받는다
}

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
    testDir: './e2e',
    outputDir: './test-results',
    fullyParallel: true,
    retries: 0,
    workers: 2, // 앱·DB 한 벌을 여러 테스트가 같이 쓴다. 더 늘리면 응답이 늦어 시간 초과가 난다
    reporter: [['list']],
    use: {
        baseURL,
        locale: 'ko-KR',
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1280, height: 800 },
            },
        },
    ],
    webServer: {
        command: 'npm run start',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
    },
});
