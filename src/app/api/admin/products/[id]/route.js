import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, get, all, getDb, run, insert, saveImmediately } from '@/lib/db';

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

    const numericPrice = Number(price);
    const numericSalePrice = salePrice === '' || salePrice === null || salePrice === undefined
      ? null
      : Number(salePrice);
    const numericStock = Number(stock || 0);

    if (!name || !String(name).trim() || price === '' || price === null || price === undefined || !Number.isFinite(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `product-${productId}`;

    const product = get('SELECT id FROM products WHERE id = ?', [productId]);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    if (!Number.isFinite(numericStock) || numericStock < 0) {
      return NextResponse.json({ error: 'Stock must be zero or greater.' }, { status: 400 });
    }
    if (numericSalePrice !== null && (!Number.isFinite(numericSalePrice) || numericSalePrice < 0)) {
      return NextResponse.json({ error: 'Sale price must be zero or greater.' }, { status: 400 });
    }
    if (get('SELECT id FROM products WHERE slug = ? AND id <> ?', [cleanSlug, productId])) {
      return NextResponse.json({ error: 'A product with this URL already exists.' }, { status: 409 });
    }
    if (sku && get('SELECT id FROM products WHERE sku = ? AND id <> ?', [String(sku).trim(), productId])) {
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

    const existingVariants = all('SELECT id, size_name, color_name FROM product_variants WHERE product_id = ?', [productId]);
    const existingVariantIds = new Set(existingVariants.map((variant) => Number(variant.id)));
    const requestedIds = (Array.isArray(variants) ? variants : [])
      .filter((variant) => variant.id !== null && variant.id !== undefined && variant.id !== '')
      .map((variant) => Number(variant.id));
    if (requestedIds.some((id) => !Number.isInteger(id) || !existingVariantIds.has(id)) || new Set(requestedIds).size !== requestedIds.length) {
      return NextResponse.json({ error: 'One or more size variants do not belong to this product.' }, { status: 400 });
    }

    const database = getDb();
    database.run('BEGIN TRANSACTION');
    try {
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
        numericPrice,
        numericSalePrice,
        numericStock,
        isFeatured ? 1 : 0,
        isNewArrival ? 1 : 0,
        isBestSeller ? 1 : 0,
        isActive !== undefined ? (isActive ? 1 : 0) : 1,
        productId,
      ]
    );

    // Update image
    if (typeof imageUrl === 'string') {
      const existingImage = get('SELECT id FROM product_images WHERE product_id = ? AND is_primary = 1', [productId]);
      if (imageUrl.trim() && existingImage) {
        run('UPDATE product_images SET url = ?, alt = ? WHERE id = ?', [imageUrl.trim(), name, existingImage.id]);
      } else if (imageUrl.trim()) {
        insert(
          'INSERT INTO product_images (product_id, url, alt, is_primary, sort_order) VALUES (?, ?, ?, 1, 0)',
          [productId, imageUrl.trim(), name]
        );
      } else {
        run('DELETE FROM product_images WHERE product_id = ?', [productId]);
      }
    }

    // Update variants
    if (Array.isArray(variants)) {
      // Keep existing variant IDs so old orders can still restore stock when
      // an administrator reopens a cancelled order. Retire removed sizes.
      const keptVariantIds = new Set();
      let variantStock = 0;
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const requestedId = v.id ? Number(v.id) : null;
        const normalizedSize = String(v.size_name || 'Free').trim().toLowerCase();
        const normalizedColor = String(v.color_name || '').trim().toLowerCase();
        const matchedVariant = requestedId
          ? existingVariants.find((variant) => Number(variant.id) === requestedId)
          : existingVariants.find((variant) =>
            !keptVariantIds.has(Number(variant.id)) &&
            String(variant.size_name || 'Free').trim().toLowerCase() === normalizedSize &&
            String(variant.color_name || '').trim().toLowerCase() === normalizedColor
          );
        const sizeName = String(v.size_name || 'Free').trim() || 'Free';
        const colorName = String(v.color_name || '').trim() || null;
        const variantSku = String(v.sku || `${sku || 'PRY'}-${sizeName}`).trim();
        const variantPrice = v.price === '' || v.price === null || v.price === undefined ? numericPrice : Number(v.price);
        const stock = Number(v.stock || 0);

        if (matchedVariant) {
          const variantId = Number(matchedVariant.id);
          keptVariantIds.add(variantId);
          run(
            `UPDATE product_variants
             SET size_name = ?, color_name = ?, sku = ?, price = ?, stock = ?, is_active = 1, sort_order = ?
             WHERE id = ? AND product_id = ?`,
            [sizeName, colorName, variantSku, variantPrice, stock, i, variantId, productId]
          );
        } else {
          const variantId = insert(
            `INSERT INTO product_variants (
              product_id, size_name, color_name, sku, price, stock, is_active, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
            [productId, sizeName, colorName, variantSku, variantPrice, stock, i]
          );
          keptVariantIds.add(Number(variantId));
        }
        variantStock += stock;
      }

      for (const oldVariant of existingVariants) {
        if (!keptVariantIds.has(Number(oldVariant.id))) {
          run('UPDATE product_variants SET is_active = 0, stock = 0 WHERE id = ?', [oldVariant.id]);
        }
      }
      run('UPDATE products SET stock = ? WHERE id = ?', [variantStock, productId]);
    }

      database.run('COMMIT');
      saveImmediately();
    } catch (error) {
      database.run('ROLLBACK');
      throw error;
    }

    return NextResponse.json({ success: true, slug: cleanSlug });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
