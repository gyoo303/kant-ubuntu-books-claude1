import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import type { Database } from '@/types/database';
import type { Product, Theme } from '@/types/product';
import { createSupabaseAnonClient } from '@/lib/supabase/server';

type ProductRow = Database['public']['Tables']['products']['Row'];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// DB 행 → KANT Product. 변환은 여기 한 곳에서만 한다.
export function toProduct(row: ProductRow): Product {
    return {
        id: row.id,
        name: row.name,
        price: row.price,
        imageUrl: row.image_url,
        description: row.description,
        author: row.author,
        publisher: row.publisher,
        theme: row.theme,
        bookkeeperNote: row.bookkeeper_note,
        stockQuantity: row.stock_quantity,
    };
}

export async function getProducts(theme?: Theme): Promise<Product[]> {
    'use cache';
    cacheTag('products');
    cacheLife('minutes');
    const supabase = createSupabaseAnonClient();
    let query = supabase.from('products').select('*').order('name');
    if (theme) query = query.eq('theme', theme);
    const { data, error } = await query;
    if (error) throw new Error(`[products.getProducts] ${error.message}`);
    return data.map(toProduct);
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
    'use cache';
    cacheTag('products');
    cacheLife('minutes');
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error)
        throw new Error(`[products.getFeaturedProducts] ${error.message}`);
    return data.map(toProduct);
}

// uuid 형식이 아니면 DB를 조회하지 않고 null (KANT-C14, AC-04-3)
export async function getProductById(id: string): Promise<Product | null> {
    'use cache';
    cacheTag('products', `product-${id}`);
    cacheLife('minutes');
    if (!UUID.test(id)) return null;
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error) throw new Error(`[products.getProductById] ${error.message}`);
    return data ? toProduct(data) : null;
}

// 장바구니 견적·주문용: 캐시하지 않은 최신 값
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
    const valid = ids.filter((id) => UUID.test(id));
    if (valid.length === 0) return [];
    const supabase = createSupabaseAnonClient();
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', valid);
    if (error) throw new Error(`[products.getProductsByIds] ${error.message}`);
    return data.map(toProduct);
}
