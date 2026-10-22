// GATE-05·06: 금지 패턴과 의존 방향을 검사한다.
// 규칙 원본: docs/02-arch/05-structure-conventions.md §2, §4
import { globSync, readFileSync } from 'node:fs';

const SOURCE_GLOBS = [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'types/**/*.ts',
    'data/**/*.ts',
    'proxy.ts',
];
const EXCLUDED = ['types/database.ts'];
const SECRET_NAMES = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'TOSS_SECRET_KEY',
    'CRON_SECRET',
    'DEV_TEST_LOGIN_SECRET',
    'NAVER_CLIENT_SECRET',
];
const SERVICE_CLIENT_ALLOWED = [
    'lib/supabase/server.ts',
    'lib/api/auth.ts',
    'lib/api/devLogin.ts',
    'lib/api/naverLogin.ts',
    'app/api/cron/',
    'app/api/payments/',
    'app/api/billing/',
    'app/api/orders/[orderId]/cancel/',
    'app/api/dev/',
];

const rules = [
    {
        id: '1',
        test: (line) =>
            /:\s*any\b|<any>|\bas any\b|as unknown as|@ts-ignore|@ts-expect-error/.test(
                line,
            ),
        message: '타입 우회',
    },
    {
        id: '2',
        test: (line) => /catch\s*(\([^)]*\))?\s*\{\s*\}/.test(line),
        message: '빈 catch',
    },
    {
        id: '10',
        test: (line) => /^\s*['"]use server['"]/.test(line),
        message: 'Server Actions 금지 (ADR-002)',
    },
];

const violations = [];
const files = [...new Set(SOURCE_GLOBS.flatMap((pattern) => globSync(pattern)))]
    .map((file) => file.replaceAll('\\', '/'))
    .filter((file) => !EXCLUDED.includes(file));

for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    const isClient =
        /^\s*['"]use client['"]/.test(lines[0] ?? '') ||
        file.startsWith('components/') ||
        file.startsWith('lib/client/');

    lines.forEach((line, index) => {
        for (const rule of rules) {
            if (rule.test(line))
                violations.push(
                    `${file}:${index + 1} 규칙 ${rule.id} ${rule.message}`,
                );
        }
        // 규칙 4: 비밀값을 클라이언트에서 참조하거나 NEXT_PUBLIC_으로 만들기
        for (const name of SECRET_NAMES) {
            if (line.includes(`NEXT_PUBLIC_${name}`))
                violations.push(
                    `${file}:${index + 1} 규칙 4 비밀값을 NEXT_PUBLIC_으로 노출`,
                );
            if (isClient && line.includes(name))
                violations.push(
                    `${file}:${index + 1} 규칙 4 클라이언트 코드에서 ${name} 참조`,
                );
        }
        // 규칙 9: service role 클라이언트 사용 위치
        if (
            line.includes('createSupabaseServiceClient(') &&
            !SERVICE_CLIENT_ALLOWED.some((allowed) => file.startsWith(allowed))
        ) {
            violations.push(
                `${file}:${index + 1} 규칙 9 허용되지 않은 위치에서 service role 클라이언트 사용`,
            );
        }
    });

    // 규칙 8: lib/domain은 I/O를 하지 않는다
    if (file.startsWith('lib/domain/') && !file.endsWith('.test.ts')) {
        lines.forEach((line, index) => {
            if (
                /new Date\(\s*\)|Date\.now\(|Math\.random\(|\bfetch\(|from ['"]@supabase|from ['"]next|from ['"]react/.test(
                    line,
                )
            ) {
                violations.push(
                    `${file}:${index + 1} 규칙 8 lib/domain에서 I/O·프레임워크 사용`,
                );
            }
            if (/from ['"]@\/lib\/(?!domain)/.test(line))
                violations.push(
                    `${file}:${index + 1} 의존 방향 lib/domain → 다른 lib`,
                );
        });
    }

    // 의존 방향: components는 서버 데이터 계층을 import하지 않는다
    if (file.startsWith('components/')) {
        lines.forEach((line, index) => {
            if (
                /from ['"]@\/lib\/(data|supabase\/server|payments\/toss['"]|api)/.test(
                    line,
                )
            ) {
                violations.push(
                    `${file}:${index + 1} 의존 방향 components → 서버 전용 계층`,
                );
            }
        });
    }
}

if (violations.length > 0) {
    console.error(violations.join('\n'));
    console.error(`[GATE-06] 위반 ${violations.length}건`);
    process.exit(1);
}

console.log(`[GATE-06] 파일 ${files.length}개 검사, 위반 0건`);
