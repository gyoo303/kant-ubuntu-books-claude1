// KANT-R3, C5: 상품 규격. 필수 속성은 id, name, price, imageUrl, description.
export type Theme = 'nature' | 'food' | 'ecology' | 'local';

export interface Product {
    id: string; // uuid
    name: string;
    price: number; // 원
    imageUrl: string;
    description: string; // 출판사 소개
    author: string;
    publisher: string;
    theme: Theme;
    bookkeeperNote: string;
    stockQuantity: number;
}

export const THEMES: readonly { value: Theme; label: string }[] = [
    { value: 'nature', label: '자연' },
    { value: 'food', label: '식문화' },
    { value: 'ecology', label: '생태' },
    { value: 'local', label: '로컬' },
];

export function isTheme(value: string | undefined | null): value is Theme {
    return THEMES.some((theme) => theme.value === value);
}
