// API-01 장바구니 견적 (공개)
import { computeCartQuote } from '@/lib/domain/cart';
import { fail, ok, parseJson } from '@/lib/api/http';
import { logServerError } from '@/lib/api/errors';
import { CartQuoteInput } from '@/lib/api/schemas';
import { getProductsByIds } from '@/lib/data/products';
import { getAppConstants } from '@/lib/data/settings';

export async function POST(request: Request) {
    const input = await parseJson(request, CartQuoteInput);
    if (input instanceof Response) return input;
    try {
        const [products, constants] = await Promise.all([
            getProductsByIds(input.items.map((item) => item.productId)),
            getAppConstants(),
        ]);
        return ok(computeCartQuote(input.items, products, constants));
    } catch (error) {
        logServerError('API-01', error);
        return fail('INTERNAL');
    }
}
