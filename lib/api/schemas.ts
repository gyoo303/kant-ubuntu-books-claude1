// 모든 API 입력 스키마 (ADR-007). 이름은 04-interfaces-api.md §3 표의 입력 타입 그대로.
import { z } from 'zod';
import {
    CART_MAX_LINES,
    CART_MAX_QUANTITY,
    FAREWELL_NOTE_MAX,
    LETTER_MAX,
    MEMO_MAX,
    REPLY_MAX,
    STOCK_MAX,
    TEASER_MAX,
} from '@/lib/domain/limits';

const trimmed = (min: number, max: number) =>
    z.string().trim().min(min).max(max);

export const CartLineSchema = z.object({
    productId: z.uuid(),
    quantity: z.number().int().min(1).max(CART_MAX_QUANTITY),
});

export const CartQuoteInput = z.object({
    items: z.array(CartLineSchema).min(1).max(CART_MAX_LINES),
});
export const CreateOrderInput = CartQuoteInput;

export const ShippingAddressInput = z.object({
    recipientName: trimmed(1, 50),
    phone: z
        .string()
        .trim()
        .regex(
            /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/,
            '휴대폰 번호 형식이 아니에요.',
        ),
    postalCode: z
        .string()
        .trim()
        .regex(/^[0-9]{5}$/, '우편번호 5자리를 입력해 주세요.'),
    address1: trimmed(1, 200),
    address2: z.string().trim().max(100).default(''),
    consent: z.literal(true, '개인정보 수집에 동의해 주세요.'),
});

export const PaymentSuccessQuery = z.object({
    paymentKey: z.string().min(1).max(200),
    orderId: z.string().regex(/^[A-Za-z0-9_-]{6,64}$/),
    amount: z.coerce.number().int().positive(),
});

export const PaymentFailQuery = z.object({
    code: z.string().max(100).optional(),
    message: z.string().max(500).optional(),
    orderId: z
        .string()
        .regex(/^[A-Za-z0-9_-]{6,64}$/)
        .optional(),
});

export const SubscriptionDraftInput = z.object({
    letterBody: trimmed(1, LETTER_MAX),
});

export const BillingSuccessQuery = z.object({
    customerKey: z.uuid(),
    authKey: z.string().min(1).max(300),
});

export const BillingFailQuery = z.object({
    code: z.string().max(100).optional(),
    message: z.string().max(500).optional(),
});

export const LetterInput = z.object({ body: trimmed(1, LETTER_MAX) });
export const UnboxInput = z.object({
    code: z.string().regex(/^[0-9]{6}$/, '숫자 6자리를 입력해 주세요.'),
});
export const MemoInput = z.object({ body: trimmed(1, MEMO_MAX) });
export const CancelSubscriptionInput = z.object({
    note: z.string().trim().max(FAREWELL_NOTE_MAX).default(''),
});

export const AuthCallbackQuery = z.object({
    code: z.string().min(1).optional(),
    next: z.string().optional(),
    error: z.string().optional(),
    error_code: z.string().optional(),
    error_description: z.string().optional(),
});

export const NaverStartQuery = z.object({
    next: z.string().optional(),
});

export const NaverCallbackQuery = z.object({
    code: z.string().min(1).optional(),
    state: z.string().optional(),
    error: z.string().optional(),
    error_description: z.string().optional(),
});

export const DevLoginInput = z.object({
    role: z.enum(['member', 'member2', 'admin']),
});

export const CycleContentInput = z
    .object({
        productId: z.uuid().optional(),
        replyLetter: trimmed(1, REPLY_MAX).optional(),
        teaser: trimmed(1, TEASER_MAX).optional(),
    })
    .refine(
        (value) => value.productId || value.replyLetter || value.teaser,
        '바꿀 내용이 없어요.',
    );

export const StockInput = z.object({
    stockQuantity: z.number().int().min(0).max(STOCK_MAX),
});
export const FarewellLetterInput = z.object({ body: trimmed(1, LETTER_MAX) });

export const IdParam = z.uuid();
