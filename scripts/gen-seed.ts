// data/products.ts(원천) → supabase/seed.sql(생성물). ADR-001
// 실행: npm run db:seed:gen
import { writeFileSync } from 'node:fs';
import { products } from '@/data/products';
import { buildProductSeedSql } from '@/scripts/seedSql';

const sql = buildProductSeedSql(products);
writeFileSync('supabase/seed.sql', sql, 'utf8');
console.log(`supabase/seed.sql 생성: 상품 ${products.length}개`);
