import type { Product } from '@/types/product';

export type OrderStatus =
    'pending_payment' | 'paid' | 'shipped' | 'cancelled' | 'refunded';
export type SubscriptionStatus = 'active' | 'cancelled' | 'ended';
export type CycleStatus =
    'awaiting_letter' | 'letter_arrived' | 'reading' | 'shipped' | 'unboxed';
// 창가 그림 4종. unboxed는 waiting과 같은 그림 (D-010)
export type BookshopWindowState =
    'waiting' | 'letter_arrived' | 'lamp_on' | 'mailbox_lit';

// 결제 수단 선택 (이전 작업의 결제 수단 버튼을 이어 씀). 가상계좌는 입금 대기·웹훅이 없어 제외
export type PaymentMethodChoice = 'card' | 'kakaopay' | 'naverpay';
// 자동결제 등록 수단: 토스 빌링이 지원하는 간편결제는 토스페이·네이버페이 (카카오페이 미지원)
export type BillingMethodChoice = 'card' | 'naverpay';

export interface CartLine {
    productId: string;
    quantity: number;
}

export interface CartQuoteLine {
    productId: string;
    name: string;
    imageUrl: string;
    unitPrice: number;
    quantity: number;
    stockQuantity: number;
    soldOut: boolean;
    lineAmount: number;
}

export interface CartQuote {
    lines: CartQuoteLine[];
    itemsAmount: number;
    shippingFee: number;
    totalAmount: number;
    freeShippingThreshold: number; // 이 금액 이상이면 배송비 무료 (D-039)
    amountToFreeShipping: number; // 무료배송까지 남은 금액 (이미 무료거나 담긴 책이 없으면 0)
}

export interface ShippingAddress {
    recipientName: string;
    phone: string;
    postalCode: string;
    address1: string;
    address2: string;
    consentedAt: string;
}

export interface MyOrder {
    id: string;
    createdAt: string;
    status: OrderStatus;
    totalAmount: number;
    items: { productName: string; quantity: number }[];
    canCancel: boolean;
}

export interface BlindBook {
    cycleId: string;
    cycleNo: number;
    teaser: string;
    shippedAt: string;
}

export interface OpenedBook {
    cycleId: string;
    cycleNo: number;
    product: Pick<Product, 'id' | 'name' | 'author' | 'imageUrl'>;
    replyLetter: string;
    postcardUrl: string | null;
    unboxedAt: string;
    memo: { body: string; updatedAt: string } | null;
}

export interface MySubscriptionOverview {
    subscription: {
        id: string;
        status: SubscriptionStatus;
        nextBillingDate: string | null;
        monthlyPrice: number;
    } | null;
    window: BookshopWindowState | null;
    latestCycle: { id: string; cycleNo: number; status: CycleStatus } | null;
    canWriteLetter: boolean;
    storedLetter: { id: string; body: string } | null;
}

export interface CurrentUser {
    id: string;
    displayName: string;
    isAdmin: boolean;
}

export interface AppConstants {
    shippingFee: number;
    subscriptionMonthlyPrice: number;
    freeShippingThreshold: number;
}
