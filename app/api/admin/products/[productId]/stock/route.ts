// API-25 재고 수량 수정 (관리자) — D-004, 컬럼 권한으로 stock_quantity만 바뀐다
import { revalidateTag } from 'next/cache';
import { requireAdmin } from '@/lib/api/auth';
import { fail, ok, parseJson, parseValue } from '@/lib/api/http';
import { fromRpcError, logServerError } from '@/lib/api/errors';
import { IdParam, StockInput } from '@/lib/api/schemas';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ productId: string }> },
) {
    const productId = parseValue((await params).productId, IdParam);
    if (productId instanceof Response) return fail('NOT_FOUND');
    const input = await parseJson(request, StockInput);
    if (input instanceof Response) return input;
    const auth = await requireAdmin();
    if (auth instanceof Response) return auth;

    const { data, error } = await auth.supabase
        .from('products')
        .update({ stock_quantity: input.stockQuantity })
        .eq('id', productId)
        .select('stock_quantity')
        .maybeSingle();
    if (error) {
        logServerError('API-25', error);
        return fail(fromRpcError(error));
    }
    if (!data) return fail('NOT_FOUND');
    revalidateTag('products', 'max');
    return ok({ stockQuantity: data.stock_quantity });
}
