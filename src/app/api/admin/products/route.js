import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, all, get, getDb, run, insert, saveImmediately } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const categoryId = searchParams.get('category') || '';

    let sql = `
      SELECT p.*, c.name AS category_name,
             (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      sql += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)`;
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern);
    }

    if (categoryId) {
      sql += ` AND p.category_id = ?`;
      params.push(categoryId);
    }

    sql += ` ORDER BY p.id DESC`;

    const products = all(sql, params).map((p) => {
      const variants = all('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC', [p.id]);
      return {
        ...p,
        variants,
      };
    });

    return NextResponse.json(products);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      description,
      categoryId,
      sku,
      price,
      salePrice,
      stock,
      isFeatured,
      isNewArrival,
      isBestSeller,
      imageUrl,
      variants, // Array of { size_name, color_name, price, stock, sku }
    } = body;

    const numericPrice = Number(price);
    const numericSalePrice = salePrice === '' || salePrice === null || salePrice === undefined
      ? null
      : Number(salePrice);
    const numericStock = Number(stock || 0);

    if (!name || !String(name).trim() || price === '' || price === null || price === undefined || !Number.isFinite(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: 'Name and Price are required' }, { status: 400 });
    }

    const generatedSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `product-${Date.now()}`;

    if (!Number.isFinite(numericStock) || numericStock < 0) {
      return NextResponse.json({ error: 'Stock must be zero or greater.' }, { status: 400 });
    }
    if (numericSalePrice !== null && (!Number.isFinite(numericSalePrice) || numericSalePrice < 0)) {
      return NextResponse.json({ error: 'Sale price must be zero or greater.' }, { status: 400 });
    }
    if (get('SELECT id FROM products WHERE slug = ?', [generatedSlug])) {
      return NextResponse.json({ error: 'A product with this URL already exists.' }, { status: 409 });
    }
    if (sku && get('SELECT id FROM products WHERE sku = ?', [String(sku).trim()])) {
      return NextResponse.json({ error: 'A product with this SKU already exists.' }, { status: 409 });
    }
    if (categoryId && !get('SELECT id FROM categories WHERE id = ?', [Number(categoryId)])) {
      return NextResponse.json({ error: 'Choose a valid product category.' }, { status: 400 });
    }
    if (Array.isArray(variants) && variants.some((variant) => {
      const variantStock = Number(variant.stock || 0);
      const variantPrice = variant.price === '' || variant.price === null || variant.price === undefined ? numericPrice : Number(variant.price);
      return !Number.isFinite(variantStock) || variantStock < 0 || !Number.isFinite(variantPrice) || variantPrice < 0;
    })) {
      return NextResponse.json({ error: 'Each size needs a valid price and non-negative stock.' }, { status: 400 });
    }

    const generatedSku = sku || `PRY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    if (get('SELECT id FROM products WHERE sku = ?', [generatedSku])) {
      return NextResponse.json({ error: 'A product with this SKU already exists. Try another SKU.' }, { status: 409 });
    }

    const database = getDb();
    database.run('BEGIN TRANSACTION');
    let productId;
    try {
      productId = insert(
      `INSERT INTO products (
        name, slug, description, category_id, sku, price, sale_price, stock,
        is_featured, is_new_arrival, is_best_seller, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        name.trim(),
        generatedSlug,
        description || null,
        categoryId ? Number(categoryId) : null,
        generatedSku,
        numericPrice,
        numericSalePrice,
        numericStock,
        isFeatured ? 1 : 0,
        isNewArrival ? 1 : 0,
        isBestSeller ? 1 : 0,
      ]
      );

    // Save image
      if (imageUrl) {
        insert(
        `INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
         VALUES (?, ?, ?, 1, 0)`,
        [productId, imageUrl, name]
        );
      }

    // Save variants (sizes / colors)
      if (Array.isArray(variants) && variants.length > 0) {
        for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
          insert(
          `INSERT INTO product_variants (
            product_id, size_name, color_name, sku, price, stock, is_active, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
          [
            productId,
            v.size_name || 'Free',
            v.color_name || null,
            v.sku || `${generatedSku}-${v.size_name || 'FREE'}`,
            v.price === '' || v.price === null || v.price === undefined ? numericPrice : Number(v.price),
            Number(v.stock || 0),
            i,
          ]
          );
        }
      } else {
      // Default Free size variant
        insert(
        `INSERT INTO product_variants (
          product_id, size_name, sku, price, stock, is_active, sort_order
        ) VALUES (?, 'Free', ?, ?, ?, 1, 0)`,
        [productId, `${generatedSku}-FREE`, Number(price), Number(stock || 0)]
        );
      }

      database.run('COMMIT');
      saveImmediately();
    } catch (error) {
      database.run('ROLLBACK');
      throw error;
    }

    return NextResponse.json({ success: true, productId, slug: generatedSlug });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Keep order-item references and historical reports intact; hide products
    // from the storefront instead of physically deleting linked records.
    const product = get('SELECT id FROM products WHERE id = ?', [id]);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    run("UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?", [id]);
    saveImmediately();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to archive product' }, { status: 500 });
  }
}
