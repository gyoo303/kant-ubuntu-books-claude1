import type { Product } from '@/types/product';

const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;

// 같은 id가 있으면 재고를 제외한 정보만 갱신한다(운영 중 재고는 DB가 원천, D-004).
export function buildProductSeedSql(products: Product[]): string {
    const rows = products.map(
        (product) =>
            `  (${[
                quote(product.id),
                quote(product.name),
                quote(product.author),
                quote(product.publisher),
                `${quote(product.theme)}::public.theme`,
                String(product.price),
                quote(product.imageUrl),
                quote(product.description),
                quote(product.bookkeeperNote),
                String(product.stockQuantity),
            ].join(', ')})`,
    );

    return [
        '-- 생성물: scripts/gen-seed.ts 가 data/products.ts 로 만든다. 직접 수정하지 않는다.',
        'insert into public.products (id, name, author, publisher, theme, price, image_url, description, bookkeeper_note, stock_quantity)',
        'values',
        rows.join(',\n'),
        'on conflict (id) do update set',
        '  name = excluded.name, author = excluded.author, publisher = excluded.publisher, theme = excluded.theme,',
        '  price = excluded.price, image_url = excluded.image_url, description = excluded.description,',
        '  bookkeeper_note = excluded.bookkeeper_note;',
        '',
    ].join('\n');
}
