import { Suspense } from 'react';
import ProductCard from '@/components/ProductCard';
import { EmptyState } from '@/components/EmptyState';
import { ThemeSelector } from '@/components/ThemeSelector';
import { getProducts } from '@/lib/data/products';
import { THEMES, isTheme, type Theme } from '@/types/product';

const THEME_DESCRIPTION: Record<Theme, string> = {
    nature: '숲과 산, 계절의 속도로 걷게 하는 책들',
    food: '제철 재료와 느린 부엌의 이야기',
    ecology: '작은 생명들과 함께 사는 법을 묻는 책들',
    local: '골목과 동네, 작은 가게의 기록',
};

// KANT-R5, C11: 상품 배열을 .map()으로 카드 목록에 바인딩한다.
async function ProductGrid({
    searchParams,
}: {
    searchParams: Promise<{ theme?: string | string[] }>;
}) {
    const raw = (await searchParams).theme;
    const value = Array.isArray(raw) ? raw[0] : raw;
    const theme: Theme | null = isTheme(value) ? value : null;
    const invalidTheme = value !== undefined && theme === null;
    const label = theme
        ? THEMES.find((item) => item.value === theme)?.label
        : null;
    const products = await getProducts(theme ?? undefined);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold">
                    {label ? `${label}의 서가` : '전체 서가'}
                </h1>
                {theme ? (
                    <p className="text-muted-foreground">
                        {THEME_DESCRIPTION[theme]}
                    </p>
                ) : null}
                {invalidTheme ? (
                    <p className="text-muted-foreground text-sm">
                        찾는 서가가 없어서 전체 서가를 보여드려요.
                    </p>
                ) : null}
            </div>
            <ThemeSelector current={theme} />
            {products.length === 0 ? (
                <EmptyState
                    title="이 서가는 아직 준비 중입니다"
                    href="/products"
                    linkLabel="전체 서가 보기"
                />
            ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}

// SCR-03 상품 목록·테마 서가
export default function ProductsPage(props: PageProps<'/products'>) {
    return (
        <Suspense
            fallback={
                <p className="text-muted-foreground text-sm">
                    서가를 정리하는 중…
                </p>
            }
        >
            <ProductGrid searchParams={props.searchParams} />
        </Suspense>
    );
}
