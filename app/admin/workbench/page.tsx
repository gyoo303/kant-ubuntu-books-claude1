import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import {
    IssuedCode,
    MatchButton,
    PostcardUpload,
    ProductSearchForm,
    ShipButton,
    StartReadingButton,
    TextContentForm,
} from './WorkbenchActions';
import { EmptyState } from '@/components/EmptyState';
import {
    getWorkbenchCycle,
    getWorkbenchQueue,
    searchProductsForMatch,
} from '@/lib/data/admin';
import { cn } from '@/lib/utils';
import type { CycleStatus } from '@/types/domain';

const STATUS_LABEL: Partial<Record<CycleStatus, string>> = {
    letter_arrived: '편지 도착',
    awaiting_letter: '이번 달 편지 없음',
    reading: '읽는 중',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Workbench({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;
    const cycleId =
        typeof params.cycle === 'string' && UUID.test(params.cycle)
            ? params.cycle
            : null;
    const query = typeof params.q === 'string' ? params.q : '';
    const [queue, cycle, results] = await Promise.all([
        getWorkbenchQueue(),
        cycleId ? getWorkbenchCycle(cycleId) : Promise.resolve(null),
        cycleId && query ? searchProductsForMatch(query) : Promise.resolve([]),
    ]);
    const reading = cycle?.cycle.status === 'reading';
    const ready = Boolean(
        cycle?.content.product &&
        cycle?.content.replyLetter &&
        cycle?.cycle.teaser,
    );

    return (
        // 좌우 분할 없이 위→아래 한 줄 (REQ-038, AC-16-1)
        <div className="flex max-w-3xl flex-col gap-10">
            <section aria-labelledby="queue" className="flex flex-col gap-3">
                <h2 id="queue" className="text-lg font-semibold">
                    처리할 편지
                </h2>
                {queue.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        지금 처리할 편지가 없어요.
                    </p>
                ) : (
                    <ul className="flex flex-col divide-y rounded-xl border">
                        {queue.map((item) => (
                            <li key={item.cycleId}>
                                <Link
                                    href={`/admin/workbench?cycle=${item.cycleId}`}
                                    className={cn(
                                        'hover:bg-muted flex justify-between gap-2 p-3 text-sm',
                                        item.cycleId === cycleId && 'bg-muted',
                                    )}
                                >
                                    <span>
                                        {item.memberName} · {item.cycleNo}회차
                                    </span>
                                    <span className="text-muted-foreground">
                                        {STATUS_LABEL[item.status]}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {cycleId && !cycle ? (
                <EmptyState
                    title="이 회차를 찾을 수 없어요"
                    href="/admin/workbench"
                    linkLabel="목록으로"
                />
            ) : null}

            {cycle ? (
                <>
                    {/* ① 편지 읽기 → 읽기 시작 (US-16). 열람만으로는 촛불이 켜지지 않는다 (INV-09) */}
                    <section
                        aria-labelledby="letter"
                        className="flex flex-col gap-3"
                    >
                        <h2 id="letter" className="text-lg font-semibold">
                            ① {cycle.cycle.memberName}님의 편지 (
                            {cycle.cycle.cycleNo}회차)
                        </h2>
                        {cycle.letter ? (
                            <>
                                {!cycle.letter.isFromCurrentCycle ? (
                                    <p className="text-muted-foreground text-sm">
                                        이번 달 편지 없음 — 가장 최근 편지를
                                        보여드려요.
                                    </p>
                                ) : null}
                                <p className="bg-card max-w-xl rounded-xl border p-5 leading-relaxed break-keep whitespace-pre-line">
                                    {cycle.letter.body}
                                </p>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                편지가 없어요.
                            </p>
                        )}
                        {cycle.cycle.status === 'letter_arrived' ||
                        cycle.cycle.status === 'awaiting_letter' ? (
                            <StartReadingButton cycleId={cycle.cycle.id} />
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                손님 창가에 촛불이 켜져 있어요.
                            </p>
                        )}
                    </section>

                    {/* ② 책 매칭·답장·엽서 (US-17) */}
                    <section
                        aria-labelledby="match"
                        className={cn(
                            'flex flex-col gap-4',
                            !reading && 'opacity-50',
                        )}
                    >
                        <h2 id="match" className="text-lg font-semibold">
                            ② 책 고르기와 답장
                        </h2>
                        {reading ? (
                            <>
                                <p className="text-sm">
                                    고른 책:{' '}
                                    <strong>
                                        {cycle.content.product
                                            ? `${cycle.content.product.name} (${cycle.content.product.author})`
                                            : '아직 없음'}
                                    </strong>
                                </p>
                                <ProductSearchForm
                                    cycleId={cycle.cycle.id}
                                    initialQuery={query}
                                />
                                {query && results.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">
                                        찾는 책이 없습니다
                                    </p>
                                ) : null}
                                {results.length > 0 ? (
                                    <ul className="flex flex-col divide-y rounded-xl border">
                                        {results.map((product) => (
                                            <li
                                                key={product.id}
                                                className="flex items-center justify-between gap-3 p-3 text-sm"
                                            >
                                                <span className="break-keep">
                                                    {product.name} ·{' '}
                                                    {product.author} · 재고{' '}
                                                    {product.stockQuantity}권
                                                </span>
                                                <MatchButton
                                                    cycleId={cycle.cycle.id}
                                                    productId={product.id}
                                                    disabled={
                                                        product.stockQuantity <=
                                                        0
                                                    }
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                                <TextContentForm
                                    cycleId={cycle.cycle.id}
                                    field="replyLetter"
                                    label="답장 편지"
                                    initialValue={
                                        cycle.content.replyLetter ?? ''
                                    }
                                    multiline
                                />
                                {cycle.content.postcardUrl ? (
                                    <div className="bg-muted relative aspect-4/3 w-full max-w-sm overflow-hidden rounded-lg">
                                        <Image
                                            src={cycle.content.postcardUrl}
                                            alt="올린 엽서 사진"
                                            fill
                                            sizes="384px"
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                ) : null}
                                <PostcardUpload cycleId={cycle.cycle.id} />
                            </>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                위에서 [읽기 시작]을 누르면 책을 고를 수 있어요.
                            </p>
                        )}
                    </section>

                    {/* ③ 힌트·발송 → 6자리 코드 (US-18) */}
                    <section
                        aria-labelledby="ship"
                        className={cn(
                            'flex flex-col gap-4',
                            !reading &&
                                cycle.cycle.status !== 'shipped' &&
                                'opacity-50',
                        )}
                    >
                        <h2 id="ship" className="text-lg font-semibold">
                            ③ 힌트와 발송
                        </h2>
                        {reading ? (
                            <>
                                <TextContentForm
                                    cycleId={cycle.cycle.id}
                                    field="teaser"
                                    label="힌트 문장 (손님에게 보이는 유일한 책 정보)"
                                    initialValue={cycle.cycle.teaser ?? ''}
                                    multiline={false}
                                />
                                <ShipButton
                                    cycleId={cycle.cycle.id}
                                    ready={ready}
                                />
                            </>
                        ) : cycle.code ? (
                            <IssuedCode code={cycle.code} />
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                책과 답장을 채운 뒤 보낼 수 있어요.
                            </p>
                        )}
                    </section>
                </>
            ) : null}
        </div>
    );
}

// SCR-16 서재 작업 화면
export default function WorkbenchPage(props: PageProps<'/admin/workbench'>) {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold">서재 작업</h1>
            <Suspense
                fallback={
                    <p className="text-muted-foreground text-sm">
                        편지를 펼치는 중…
                    </p>
                }
            >
                <Workbench searchParams={props.searchParams} />
            </Suspense>
        </div>
    );
}
