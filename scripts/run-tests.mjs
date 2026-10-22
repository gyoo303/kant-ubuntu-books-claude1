// GATE-03: 테스트 파일을 직접 찾아 node:test로 실행한다.
// 셸마다 다른 경로 패턴 해석(Windows 따옴표 문제)을 피하고, 0개 실행이면 실패로 처리한다.
import { globSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const PATTERNS = [
    'lib/**/*.test.ts',
    'scripts/**/*.test.ts',
    'app/**/*.test.ts',
];

const files = [
    ...new Set(PATTERNS.flatMap((pattern) => globSync(pattern))),
].sort();

if (files.length === 0) {
    console.error(
        '[GATE-03] 테스트 파일을 찾지 못했습니다. 0개 실행은 실패로 봅니다.',
    );
    process.exit(1);
}

const result = spawnSync(
    process.execPath,
    ['--import', 'tsx', '--test', ...files],
    {
        encoding: 'utf8',
    },
);

process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');

const testsMatch = /ℹ tests (\d+)/.exec(result.stdout ?? '');
const testCount = testsMatch ? Number(testsMatch[1]) : 0;

if (testCount === 0) {
    console.error('[GATE-03] 실행된 테스트가 0개입니다. 실패로 봅니다.');
    process.exit(1);
}

process.exit(result.status ?? 1);
