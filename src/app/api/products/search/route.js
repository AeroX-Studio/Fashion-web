import { NextResponse } from 'next/server';
import { initDatabase, all } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await initDatabase();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    if (q.trim().length < 2) {
      return NextResponse.json([]);
    }

    const pattern = `%${q.trim()}%`;
    const products = all(
      `SELECT p.id, p.name, p.slug, p.price, p.sale_price, c.name AS category_name,
              (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = 1 AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ? OR p.tags LIKE ?)
       LIMIT 6`,
      [pattern, pattern, pattern, pattern]
    );

    return NextResponse.json(products);
  } catch (err) {
    console.error('Search API error:', err);
    return NextResponse.json([], { status: 500 });
  }
}
