import { StockRow } from './StockRow';
import { getStockList } from '@/lib/data/admin';

// SCR-20 재고 수량 (Should, US-25)
export default async function AdminStockPage() {
    const products = await getStockList();
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">재고</h1>
            <p className="text-muted-foreground text-sm">
                책이 들어오면 수량만 고쳐 주세요. 책 정보와 노트는 제작팀이
                바꿔요.
            </p>
            <ul className="flex flex-col divide-y rounded-xl border">
                {products.map((product) => (
                    <StockRow
                        key={product.id}
                        productId={product.id}
                        name={product.name}
                        author={product.author}
                        stockQuantity={product.stockQuantity}
                    />
                ))}
            </ul>
        </div>
    );
}
