import { MapPin, type LucideProps } from 'lucide-react';
import type { Theme } from '@/types/product';

// 테마 아이콘 (출처: project_ubuntu_books/shopping-mall ThemeIcon — 시안에 맞춘 직접 그린 아이콘)
function svgProps(props: LucideProps) {
    return {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        ...props,
    };
}

// 나무 두 그루 (자연)
function Trees(props: LucideProps) {
    return (
        <svg {...svgProps(props)}>
            <path d="M8 3.4A2 2 0 0 1 11 4.7A2.3 2.3 0 0 1 12.5 8A2.4 2.4 0 0 1 12 11.8A2.1 2.1 0 0 1 9.6 14.3A2 2 0 0 1 6.4 14.3A2.1 2.1 0 0 1 4 11.8A2.4 2.4 0 0 1 3.5 8A2.3 2.3 0 0 1 5 4.7A2 2 0 0 1 8 3.4Z" />
            <path d="M8 21V8" />
            <path d="M8 13l-2-2" />
            <path d="M8 11l2-2" />
            <path d="M13.5 4.5l3 4h-1.5l3 4h-1.5l4.5 5H13" />
            <path d="M15.5 17.5V21" />
        </svg>
    );
}

// 그릇 (식문화)
function Bowl(props: LucideProps) {
    return (
        <svg {...svgProps(props)}>
            <path d="M4 8h16l-3.2 7.4a1.8 1.8 0 0 1-1.6 1.1H8.8a1.8 1.8 0 0 1-1.6-1.1L4 8Z" />
        </svg>
    );
}

// 연꽃 (생태)
function Lotus(props: LucideProps) {
    return (
        <svg {...svgProps(props)}>
            <path d="M12 4C10 6.5 9.8 10.5 12 14C14.2 10.5 14 6.5 12 4Z" />
            <path d="M4 8C4 12.5 7.5 16 12 16C16.5 16 20 12.5 20 8C17 8.5 14.5 10.5 12 14C9.5 10.5 7 8.5 4 8Z" />
        </svg>
    );
}

const ICONS: Record<Theme, (props: LucideProps) => React.ReactElement> = {
    nature: Trees,
    food: Bowl,
    ecology: Lotus,
    local: (props) => <MapPin {...props} />,
};

export function ThemeIcon({ theme, ...props }: { theme: Theme } & LucideProps) {
    const Icon = ICONS[theme];
    return <Icon aria-hidden="true" {...props} />;
}
