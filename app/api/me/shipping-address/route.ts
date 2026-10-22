// API-02 배송지 저장 (회원)
import type { ShippingAddress } from '@/types/domain';
import { requireUser } from '@/lib/api/auth';
import { fail, ok, parseJson } from '@/lib/api/http';
import { fromRpcError, logServerError } from '@/lib/api/errors';
import { ShippingAddressInput } from '@/lib/api/schemas';

export async function PUT(request: Request) {
    const input = await parseJson(request, ShippingAddressInput);
    if (input instanceof Response) return input;
    const auth = await requireUser();
    if (auth instanceof Response) return auth;

    const { data, error } = await auth.supabase
        .from('shipping_addresses')
        .upsert(
            {
                user_id: auth.userId,
                recipient_name: input.recipientName,
                phone: input.phone,
                postal_code: input.postalCode,
                address1: input.address1,
                address2: input.address2,
                consented_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
        )
        .select()
        .single();
    if (error) {
        logServerError('API-02', error);
        return fail(fromRpcError(error));
    }
    const address: ShippingAddress = {
        recipientName: data.recipient_name,
        phone: data.phone,
        postalCode: data.postal_code,
        address1: data.address1,
        address2: data.address2,
        consentedAt: data.consented_at,
    };
    return ok(address);
}
