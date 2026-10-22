import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

// 빈 목록·찾을 수 없음 안내 + 돌아갈 링크 (KANT-C14)
export function EmptyState({
    title,
    description,
    href,
    linkLabel,
}: {
    title: string;
    description?: string;
    href?: string;
    linkLabel?: string;
}) {
    return (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
            <p className="text-lg font-medium">{title}</p>
            {description ? (
                <p className="text-muted-foreground max-w-xl text-sm">
                    {description}
                </p>
            ) : null}
            {href && linkLabel ? (
                <Link
                    href={href}
                    className={buttonVariants({ variant: 'outline' })}
                >
                    {linkLabel}
                </Link>
            ) : null}
        </div>
    );
}
