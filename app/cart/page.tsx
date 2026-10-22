import { CartView } from './CartView';

// SCR-08 장바구니 (비회원도 사용, Q-006)
export default function CartPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold">장바구니</h1>
            <CartView />
        </div>
    );
}
