import { EmptyState } from '@/components/EmptyState';

// KANT-C14, AC-04-3: 잘못된 상품 ID
export default function ProductNotFound() {
    return (
        <EmptyState
            title="상품을 찾을 수 없습니다"
            description="주소가 맞는지 확인해 주세요."
            href="/products"
            linkLabel="목록으로"
        />
    );
}
