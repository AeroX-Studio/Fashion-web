import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, get, all, run, insert, saveImmediately } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;
    const product = get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const images = all('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC', [productId]);
    const variants = all('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC', [productId]);

    return NextResponse.json({
      ...product,
      image: images[0]?.url || product.image || '',
      images,
      variants,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;
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
      isActive,
      imageUrl,
      variants,
    } = body;

    if (!name || !price) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    run(
      `UPDATE products
       SET name = ?, slug = ?, description = ?, category_id = ?, sku = ?, price = ?,
           sale_price = ?, stock = ?, is_featured = ?, is_new_arrival = ?, is_best_seller = ?,
           is_active = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        name.trim(),
        cleanSlug,
        description || null,
        categoryId ? Number(categoryId) : null,
        sku || null,
        Number(price),
        salePrice ? Number(salePrice) : null,
        Number(stock || 0),
        isFeatured ? 1 : 0,
        isNewArrival ? 1 : 0,
        isBestSeller ? 1 : 0,
        isActive !== undefined ? (isActive ? 1 : 0) : 1,
        productId,
      ]
    );

    // Update image
    if (imageUrl) {
      const existingImage = get('SELECT id FROM product_images WHERE product_id = ? AND is_primary = 1', [productId]);
      if (existingImage) {
        run('UPDATE product_images SET url = ?, alt = ? WHERE id = ?', [imageUrl, name, existingImage.id]);
      } else {
        insert(
          'INSERT INTO product_images (product_id, url, alt, is_primary, sort_order) VALUES (?, ?, ?, 1, 0)',
          [productId, imageUrl, name]
        );
      }
    }

    // Update variants
    if (Array.isArray(variants)) {
      // Remove old variants and re-insert
      run('DELETE FROM product_variants WHERE product_id = ?', [productId]);
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
            v.sku || `${sku || 'PRY'}-${v.size_name || 'FREE'}`,
            v.price ? Number(v.price) : Number(price),
            Number(v.stock || 0),
            i,
          ]
        );
      }
    }

    saveImmediately();

    return NextResponse.json({ success: true, slug: cleanSlug });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
