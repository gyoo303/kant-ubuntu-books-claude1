import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import ProductCard from '@/components/ProductCard';
import { ThemeIcon } from '@/components/ThemeIcon';
import { EmptyState } from '@/components/EmptyState';
import { buttonVariants } from '@/components/ui/button';
import { getFeaturedProducts } from '@/lib/data/products';
import { ABOUT, ABOUT_GALLERY } from '@/lib/content/policies';
import { THEMES } from '@/types/product';

const THEME_COPY: Record<string, string> = {
    nature: '숲과 계절의 속도로 걷는 책',
    food: '제철 밥상과 부엌의 시간',
    ecology: '작은 생명과 함께 사는 법',
    local: '골목과 동네의 이야기',
};

// 추천 책: 데이터 실패 시 이 영역만 안내 문구 (AC-01-3)
async function FeaturedBooks() {
    const products = await getFeaturedProducts(4).catch((error: unknown) => {
        console.error('[SCR-01 추천 책]', error);
        return null;
    });
    if (products === null)
        return (
            <EmptyState
                title="책을 불러오지 못했어요."
                description="잠시 후 다시 들러 주세요."
            />
        );
    if (products.length === 0)
        return <EmptyState title="아직 서가에 꽂힌 책이 없어요." />;
    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}

// SCR-01 메인
export default function HomePage() {
    return (
        <div className="flex flex-col gap-14">
            {/* 왼쪽 문구 + 오른쪽 책방 사진 (작은 화면에서는 위아래) */}
            <section className="grid items-center gap-8 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                    <p className="typo-eyebrow text-olive">
                        SLOW BY DESIGN · 대전 어은동 골목 책방
                    </p>
                    <h1 className="typo-h1 text-balance break-keep">
                        조금 느리게, 손편지로 고르는 책
                    </h1>
                    <p className="text-muted-foreground max-w-xl break-keep">
                        {ABOUT.tagline}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href="/subscribe"
                            className={buttonVariants({ size: 'lg' })}
                        >
                            편지로 구독 시작하기
                        </Link>
                        <Link
                            href="/about"
                            className={buttonVariants({
                                variant: 'outline',
                                size: 'lg',
                            })}
                        >
                            책방 소개 보기
                        </Link>
                    </div>
                </div>
                <div className="bg-muted relative aspect-4/3 overflow-hidden rounded-2xl">
                    <Image
                        src={ABOUT_GALLERY[0].src}
                        alt={ABOUT_GALLERY[0].alt}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover"
                        priority
                    />
                </div>
            </section>

            <section aria-labelledby="themes" className="flex flex-col gap-4">
                <h2 id="themes" className="typo-h2">
                    네 개의 서가
                </h2>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {THEMES.map((theme) => (
                        <Link
                            key={theme.value}
                            href={`/products?theme=${theme.value}`}
                            className="bg-card hover:bg-muted flex flex-col gap-2 rounded-xl border p-5 transition-colors"
                        >
                            <ThemeIcon
                                theme={theme.value}
                                className="text-olive size-6"
                            />
                            <span className="text-lg font-medium">
                                {theme.label}
                            </span>
                            <span className="text-muted-foreground text-sm break-keep">
                                {THEME_COPY[theme.value]}
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            <section aria-labelledby="featured" className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                    <h2 id="featured" className="typo-h2">
                        책방지기가 고른 책
                    </h2>
                    <Link
                        href="/products"
                        className="text-sm underline-offset-4 hover:underline"
                    >
                        전체 서가 보기
                    </Link>
                </div>
                <Suspense
                    fallback={
                        <p className="text-muted-foreground text-sm">
                            책을 꺼내는 중…
                        </p>
                    }
                >
                    <FeaturedBooks />
                </Suspense>
            </section>

            <section className="bg-muted flex flex-col gap-3 rounded-xl border p-6">
                <h2 className="typo-h2">손편지 구독</h2>
                <p className="text-muted-foreground max-w-xl break-keep">
                    편지를 보내면 책방지기가 한 권을 골라 보내드려요.
                </p>
                <div>
                    <Link href="/subscribe" className={buttonVariants()}>
                        손편지 띄우기
                    </Link>
                </div>
            </section>
        </div>
    );
}
