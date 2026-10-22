import { ShipOrderButton } from './ShipOrderButton';
import { getOrdersToShip } from '@/lib/data/admin';

const dateFormat = new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeZone: 'Asia/Seoul',
});

// SCR-17 관리자 주문 목록 (오래된 순, US-11)
export default async function AdminOrdersPage() {
    const orders = await getOrdersToShip();
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">보낼 주문</h1>
            {orders.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                    지금 보낼 주문이 없어요.
                </p>
            ) : (
                <ul className="flex flex-col divide-y rounded-xl border">
                    {orders.map((order) => (
                        <li
                            key={order.id}
                            className="flex flex-wrap items-start justify-between gap-3 p-4 text-sm"
                        >
                            <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground">
                                    {dateFormat.format(
                                        new Date(order.createdAt),
                                    )}
                                </span>
                                <span className="font-medium">
                                    {order.recipientName} · {order.phone}
                                </span>
                                <span>
                                    ({order.postalCode}) {order.address1}{' '}
                                    {order.address2}
                                </span>
                                <span className="text-muted-foreground break-keep">
                                    {order.items
                                        .map(
                                            (item) =>
                                                `${item.productName} × ${item.quantity}`,
                                        )
                                        .join(', ')}
                                </span>
                            </div>
                            <ShipOrderButton orderId={order.id} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
