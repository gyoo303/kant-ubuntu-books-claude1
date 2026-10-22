import 'server-only';
import { cacheLife } from 'next/cache';
import type { AppConstants } from '@/types/domain';
import { createSupabaseAnonClient } from '@/lib/supabase/server';

// 배송비·무료배송 기준·구독료 (예시 금액, D-032, D-039). DB 함수 app_constants()가 원천이다.
export async function getAppConstants(): Promise<AppConstants> {
    'use cache';
    cacheLife('hours');
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase.rpc('app_constants').single();
    if (error) throw new Error(`[settings.getAppConstants] ${error.message}`);
    return {
        shippingFee: data.shipping_fee,
        subscriptionMonthlyPrice: data.subscription_monthly_price,
        freeShippingThreshold: data.free_shipping_threshold,
    };
}
