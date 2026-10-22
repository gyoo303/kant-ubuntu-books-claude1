import Link from 'next/link';
import { cn } from '@/lib/utils';
import { THEMES, type Theme } from '@/types/product';

// 4개 테마 + 전체. 선택 상태는 URL(?theme=)에 둔다.
export function ThemeSelector({ current }: { current: Theme | null }) {
    const items = [{ value: null, label: '전체' }, ...THEMES];
    return (
        <nav aria-label="테마 서가" className="flex flex-wrap gap-2">
            {items.map((item) => {
                const active = item.value === current;
                return (
                    <Link
                        key={item.label}
                        href={
                            item.value
                                ? `/products?theme=${item.value}`
                                : '/products'
                        }
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            'rounded-full border px-4 py-1.5 text-sm transition-colors',
                            active
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background hover:bg-muted',
                        )}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
