// 글자 수·시도 횟수 기준. zod 스키마와 DB check 제약이 같은 값을 쓴다.
export const LETTER_MAX = 2000; // D-023
export const REPLY_MAX = 2000; // D-024
export const MEMO_MAX = 100; // D-017
export const TEASER_MAX = 100; // D-024
export const FAREWELL_NOTE_MAX = 2000;
export const UNBOX_MAX_FAILURES = 5; // NFR-07
export const UNBOX_LOCK_MINUTES = 10;
export const CART_MAX_LINES = 50;
export const CART_MAX_QUANTITY = 99;
export const STOCK_MAX = 9999;
export const POSTCARD_MAX_BYTES = 5 * 1024 * 1024; // 03-db-schema.md §6
export const POSTCARD_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
] as const;
