import Image from 'next/image';
import Link from 'next/link';
import { SoldOutBadge } from '@/components/SoldOutBadge';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/domain/format';
import { cn } from '@/lib/utils';
import { THEMES, type Product } from '@/types/product';

// KANT-R4, C8: 상품 객체 하나를 Props로 받는다. 표지는 고정 비율 + object-cover (KANT-C10)
export default function ProductCard({ product }: { product: Product }) {
    const themeLabel =
        THEMES.find((theme) => theme.value === product.theme)?.label ?? '';
    const soldOut = product.stockQuantity <= 0;
    return (
        <Link
            href={`/products/${product.id}`}
            aria-label={soldOut ? `${product.name} (품절)` : undefined}
            className="group bg-card hover:bg-muted flex flex-col gap-3 rounded-xl border p-3 transition-colors focus-visible:outline-2"
        >
            <div className="bg-muted relative aspect-3/4 overflow-hidden rounded-lg">
                <Image
                    src={product.imageUrl}
                    alt={`${product.name} 표지`}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className={cn(
                        'object-cover transition-transform group-hover:scale-105 motion-reduce:transition-none',
                        soldOut && 'opacity-50 grayscale',
                    )}
                />
                {/* 품절: 표지를 흐리게 + 가운데 큰 표시 */}
                {soldOut ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <SoldOutBadge size="lg" />
                    </div>
                ) : null}
            </div>
            <div className="flex flex-col gap-1">
                <p
                    className={cn(
                        'line-clamp-2 font-medium break-keep',
                        soldOut && 'text-ink-2',
                    )}
                >
                    {product.name}
                </p>
                <p className="text-muted-foreground text-sm">
                    {product.author}
                </p>
                <div className="flex items-center justify-between gap-2">
                    {soldOut ? (
                        <span className="flex items-center gap-2">
                            <span className="text-muted-foreground line-through">
                                {formatPrice(product.price)}
                            </span>
                            <SoldOutBadge />
                        </span>
                    ) : (
                        <span className="font-semibold">
                            {formatPrice(product.price)}
                        </span>
                    )}
                    <Badge variant="outline">{themeLabel}</Badge>
                </div>
            </div>
        </Link>
    );
}
