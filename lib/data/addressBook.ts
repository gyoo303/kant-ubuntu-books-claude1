import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface AddressBookRow {
    recipientName: string;
    phone: string;
    postalCode: string;
    address1: string;
    address2: string;
}

// 구독 중(active)인 회원의 배송지 (Q-012, INV-14). 관리자 세션의 RLS로만 읽힌다.
export async function getAddressBookRows(): Promise<AddressBookRow[]> {
    const supabase = await createSupabaseServerClient();
    const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('status', 'active');
    if (error)
        throw new Error(`[addressBook.getAddressBookRows] ${error.message}`);
    const userIds = subscriptions.map((row) => row.user_id);
    if (userIds.length === 0) return [];
    const { data, error: addressError } = await supabase
        .from('shipping_addresses')
        .select('recipient_name, phone, postal_code, address1, address2')
        .in('user_id', userIds)
        .order('recipient_name');
    if (addressError)
        throw new Error(
            `[addressBook.getAddressBookRows] ${addressError.message}`,
        );
    return data.map((row) => ({
        recipientName: row.recipient_name,
        phone: row.phone,
        postalCode: row.postal_code,
        address1: row.address1,
        address2: row.address2,
    }));
}
