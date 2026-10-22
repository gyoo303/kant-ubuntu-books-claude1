import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AddToCartButton } from '@/components/AddToCartButton';
import { SoldOutBadge } from '@/components/SoldOutBadge';
import { Badge } from '@/components/ui/badge';
import { getProductById } from '@/lib/data/products';
import { formatPrice } from '@/lib/domain/format';
import { cn } from '@/lib/utils';
import { THEMES } from '@/types/product';

// KANT-R6, C12: URL의 [id]로 상품을 찾는다. 없으면 notFound() → not-found.tsx (KANT-C14)
async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await getProductById(id);
    if (!product) notFound();

    const themeLabel =
        THEMES.find((theme) => theme.value === product.theme)?.label ?? '';
    const soldOut = product.stockQuantity <= 0;

    return (
        <article className="flex flex-col gap-10">
            {/* 책방지기 노트 — 최상단, 본문보다 큰 글씨 (REQ-009, AC-04-1) */}
            <section
                aria-labelledby="note"
                className="bg-muted flex flex-col gap-3 rounded-xl border p-6"
            >
                <h2 id="note" className="text-muted-foreground text-sm">
                    책방지기의 한마디
                </h2>
                <p className="max-w-xl text-xl leading-relaxed break-keep md:text-2xl">
                    {product.bookkeeperNote}
                </p>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
                <div className="bg-muted relative aspect-3/4 w-full overflow-hidden rounded-xl">
                    <Image
                        src={product.imageUrl}
                        alt={`${product.name} 표지`}
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className={cn(
                            'object-cover',
                            soldOut && 'opacity-50 grayscale',
                        )}
                        priority
                    />
                    {soldOut ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <SoldOutBadge size="lg" />
                        </div>
                    ) : null}
                </div>
                <div className="flex flex-col gap-3">
                    <h1 className="text-2xl font-semibold break-keep">
                        {product.name}
                    </h1>
                    <p className="text-muted-foreground">
                        {product.author} · {product.publisher}
                    </p>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">{themeLabel}</Badge>
                        {soldOut ? (
                            <SoldOutBadge />
                        ) : (
                            <span className="text-muted-foreground text-sm">
                                남은 책 {product.stockQuantity}권
                            </span>
                        )}
                    </div>
                    <p
                        className={cn(
                            'text-xl font-semibold',
                            soldOut && 'text-muted-foreground line-through',
                        )}
                    >
                        {formatPrice(product.price)}
                    </p>
                    {soldOut ? (
                        <p
                            role="status"
                            className="border-post bg-paper-2 text-post rounded-lg border-2 px-4 py-3 font-bold"
                        >
                            지금은 품절이에요. 책이 다시 들어오면 서가에 바로
                            표시돼요.
                        </p>
                    ) : null}
                    <AddToCartButton
                        productId={product.id}
                        stockQuantity={product.stockQuantity}
                    />
                    {/* 출판사 소개는 노트 아래 접힌 상태 (AC-04-2) */}
                    <details className="rounded-lg border p-4">
                        <summary className="cursor-pointer text-sm font-medium">
                            출판사 소개 펼치기
                        </summary>
                        <p className="text-muted-foreground mt-3 max-w-xl text-sm leading-relaxed break-keep">
                            {product.description}
                        </p>
                    </details>
                </div>
            </section>

            <nav className="flex flex-wrap gap-4 text-sm">
                <Link
                    href={`/products?theme=${product.theme}`}
                    className="underline-offset-4 hover:underline"
                >
                    {themeLabel} 서가로
                </Link>
                <Link
                    href="/products"
                    className="underline-offset-4 hover:underline"
                >
                    전체 서가로
                </Link>
            </nav>
        </article>
    );
}

// SCR-04 상품 상세
export default function ProductPage(props: PageProps<'/products/[id]'>) {
    return (
        <Suspense
            fallback={
                <p className="text-muted-foreground text-sm">책을 꺼내는 중…</p>
            }
        >
            <ProductDetail params={props.params} />
        </Suspense>
    );
}
