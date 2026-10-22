import { cn } from '@/lib/utils';

// 품절 표시 — 어느 화면에서나 같은 모양으로 눈에 띄게 (우체통 색 post)
export function SoldOutBadge({
    size = 'sm',
    className,
}: {
    size?: 'sm' | 'lg';
    className?: string;
}) {
    return (
        <span
            className={cn(
                'bg-post text-card inline-flex items-center rounded-full font-bold tracking-wide',
                size === 'lg'
                    ? 'px-5 py-2 text-lg shadow-lg'
                    : 'px-2.5 py-0.5 text-xs',
                className,
            )}
        >
            품절
        </span>
    );
}
