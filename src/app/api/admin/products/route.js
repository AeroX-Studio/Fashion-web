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
    const status = searchParams.get('status') || '';

    let sql = `
      SELECT p.*, c.name AS category_name,
             COALESCE(
               (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1),
               (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1),
               ''
             ) AS image
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
      const numCat = Number(categoryId);
      if (Number.isFinite(numCat) && numCat > 0) {
        sql += ` AND p.category_id = ?`;
        params.push(numCat);
      }
    }

    if (status === 'active') {
      sql += ` AND p.is_active = 1`;
    } else if (status === 'inactive') {
      sql += ` AND p.is_active = 0`;
    }

    sql += ` ORDER BY p.id DESC`;

    const products = all(sql, params).map((p) => {
      const variants = all('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC', [p.id]);
      const images = all('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC', [p.id]);
      return {
        ...p,
        image: images[0]?.url || p.image || '',
        images,
        variants,
      };
    });

    return NextResponse.json(products);
  } catch (err) {
    console.error('GET /api/admin/products error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch products' }, { status: 500 });
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
      images,
      variants,
    } = body;

    const numericPrice = Number(price);
    if (!name || !String(name).trim() || price === '' || price === null || price === undefined || !Number.isFinite(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: 'Valid product name and price are required.' }, { status: 400 });
    }

    const numericSalePrice = salePrice === '' || salePrice === null || salePrice === undefined
      ? null
      : Number(salePrice);
    if (numericSalePrice !== null && (!Number.isFinite(numericSalePrice) || numericSalePrice < 0)) {
      return NextResponse.json({ error: 'Sale price must be a valid positive number.' }, { status: 400 });
    }

    const numericStock = Number(stock || 0);
    if (!Number.isFinite(numericStock) || numericStock < 0) {
      return NextResponse.json({ error: 'Stock must be zero or greater.' }, { status: 400 });
    }

    // Auto-generate collision-proof slug
    let rawSlug = (slug || name || `product-${Date.now()}`)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    if (!rawSlug) {
      rawSlug = `product-${Date.now()}`;
    }

    let generatedSlug = rawSlug;
    let slugIndex = 1;
    while (get('SELECT id FROM products WHERE slug = ?', [generatedSlug])) {
      generatedSlug = `${rawSlug}-${slugIndex}`;
      slugIndex++;
    }

    // Auto-generate or validate SKU
    let generatedSku = (sku && String(sku).trim()) || '';
    if (!generatedSku) {
      let attempts = 0;
      do {
        generatedSku = `PRY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        attempts++;
      } while (get('SELECT id FROM products WHERE sku = ?', [generatedSku]) && attempts < 20);
    } else {
      if (get('SELECT id FROM products WHERE sku = ?', [generatedSku])) {
        return NextResponse.json({ error: 'A product with this SKU already exists. Try another SKU.' }, { status: 409 });
      }
    }

    // Resolve valid category
    let validCategoryId = null;
    if (categoryId && Number(categoryId) > 0) {
      const cat = get('SELECT id FROM categories WHERE id = ?', [Number(categoryId)]);
      if (cat) {
        validCategoryId = cat.id;
      }
    }
    if (!validCategoryId) {
      const fallbackCat = get('SELECT id FROM categories WHERE is_active = 1 ORDER BY sort_order ASC LIMIT 1');
      if (fallbackCat) validCategoryId = fallbackCat.id;
    }

    // Validate variants if supplied
    let normalizedVariants = Array.isArray(variants) ? variants : [];
    if (typeof variants === 'string') {
      try { normalizedVariants = JSON.parse(variants); } catch (e) {}
    }

    if (normalizedVariants.length > 0) {
      for (const v of normalizedVariants) {
        const vStock = Number(v.stock || 0);
        const vPrice = v.price === '' || v.price === null || v.price === undefined ? numericPrice : Number(v.price);
        if (!Number.isFinite(vStock) || vStock < 0 || !Number.isFinite(vPrice) || vPrice < 0) {
          return NextResponse.json({ error: 'Each size variant needs a valid price and non-negative stock.' }, { status: 400 });
        }
      }
    }

    // Normalize images (multi-image support)
    let normalizedImages = [];
    if (Array.isArray(images)) {
      images.forEach((img, idx) => {
        const url = typeof img === 'string' ? img.trim() : (img?.url || '').trim();
        if (url) {
          normalizedImages.push({
            url,
            alt: (typeof img === 'object' && img?.alt) ? img.alt : name.trim(),
            is_primary: (typeof img === 'object' && img?.is_primary) ? 1 : 0,
            sort_order: (typeof img === 'object' && Number.isInteger(img?.sort_order)) ? img.sort_order : idx,
          });
        }
      });
    } else if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) {
          parsed.forEach((img, idx) => {
            const url = typeof img === 'string' ? img.trim() : (img?.url || '').trim();
            if (url) {
              normalizedImages.push({
                url,
                alt: (typeof img === 'object' && img?.alt) ? img.alt : name.trim(),
                is_primary: (typeof img === 'object' && img?.is_primary) ? 1 : 0,
                sort_order: idx,
              });
            }
          });
        }
      } catch (e) {}
    }

    if (normalizedImages.length === 0 && imageUrl && String(imageUrl).trim()) {
      normalizedImages.push({
        url: String(imageUrl).trim(),
        alt: name.trim(),
        is_primary: 1,
        sort_order: 0,
      });
    }

    if (normalizedImages.length > 0 && !normalizedImages.some((i) => i.is_primary === 1)) {
      normalizedImages[0].is_primary = 1;
    }

    const database = getDb();
    let inSavepoint = false;
    try {
      database.run('SAVEPOINT create_product_tx');
      inSavepoint = true;
    } catch (e) {}

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
          validCategoryId,
          generatedSku,
          numericPrice,
          numericSalePrice,
          numericStock,
          isFeatured ? 1 : 0,
          isNewArrival ? 1 : 0,
          isBestSeller ? 1 : 0,
        ]
      );

      if (!productId) {
        throw new Error('Failed to generate product record ID.');
      }

      // Save product images
      for (let i = 0; i < normalizedImages.length; i++) {
        const img = normalizedImages[i];
        insert(
          `INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
           VALUES (?, ?, ?, ?, ?)`,
          [productId, img.url, img.alt, img.is_primary, img.sort_order !== undefined ? img.sort_order : i]
        );
      }

      // Save variants
      if (normalizedVariants.length > 0) {
        for (let i = 0; i < normalizedVariants.length; i++) {
          const v = normalizedVariants[i];
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
        insert(
          `INSERT INTO product_variants (
            product_id, size_name, sku, price, stock, is_active, sort_order
          ) VALUES (?, 'Free', ?, ?, ?, 1, 0)`,
          [productId, `${generatedSku}-FREE`, numericPrice, numericStock]
        );
      }

      if (inSavepoint) {
        try {
          database.run('RELEASE create_product_tx');
        } catch (e) {}
      }

      saveImmediately();
      return NextResponse.json({ success: true, productId, slug: generatedSlug });
    } catch (err) {
      if (inSavepoint) {
        try {
          database.run('ROLLBACK TO create_product_tx');
          database.run('RELEASE create_product_tx');
        } catch (e) {}
      }
      throw err;
    }
  } catch (err) {
    console.error('POST /api/admin/products error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const body = await req.json();
    const productId = searchParams.get('id') || body.id;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required for update' }, { status: 400 });
    }

    const existingProduct = get('SELECT * FROM products WHERE id = ?', [productId]);
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

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
      images,
      variants,
    } = body;

    const numericPrice = Number(price);
    const numericSalePrice = salePrice === '' || salePrice === null || salePrice === undefined
      ? null
      : Number(salePrice);
    const numericStock = Number(stock || 0);

    if (!name || !String(name).trim() || price === '' || price === null || price === undefined || !Number.isFinite(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: 'Valid product name and price are required' }, { status: 400 });
    }

    let cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `product-${productId}`;

    const existingSlug = get('SELECT id FROM products WHERE slug = ? AND id <> ?', [cleanSlug, productId]);
    if (existingSlug) {
      cleanSlug = `${cleanSlug}-${productId}`;
    }

    let validCategoryId = existingProduct.category_id;
    if (categoryId && Number(categoryId) > 0) {
      const cat = get('SELECT id FROM categories WHERE id = ?', [Number(categoryId)]);
      if (cat) validCategoryId = cat.id;
    }

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
        validCategoryId,
        sku || existingProduct.sku,
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

    // Update images if provided
    if (Array.isArray(images) || typeof imageUrl === 'string') {
      let imageList = [];
      if (Array.isArray(images)) {
        images.forEach((img, idx) => {
          const url = typeof img === 'string' ? img.trim() : (img?.url || '').trim();
          if (url) {
            imageList.push({
              url,
              alt: (typeof img === 'object' && img?.alt) ? img.alt : name.trim(),
              is_primary: (typeof img === 'object' && img?.is_primary) ? 1 : 0,
              sort_order: (typeof img === 'object' && Number.isInteger(img?.sort_order)) ? img.sort_order : idx,
            });
          }
        });
      } else if (imageUrl && String(imageUrl).trim()) {
        imageList.push({
          url: String(imageUrl).trim(),
          alt: name.trim(),
          is_primary: 1,
          sort_order: 0,
        });
      }

      if (imageList.length > 0 && !imageList.some((i) => i.is_primary === 1)) {
        imageList[0].is_primary = 1;
      }

      run('DELETE FROM product_images WHERE product_id = ?', [productId]);
      for (let i = 0; i < imageList.length; i++) {
        const img = imageList[i];
        insert(
          'INSERT INTO product_images (product_id, url, alt, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)',
          [productId, img.url, img.alt, img.is_primary, img.sort_order !== undefined ? img.sort_order : i]
        );
      }
    }

    // Update variants if provided
    if (Array.isArray(variants)) {
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
            v.price === '' || v.price === null || v.price === undefined ? numericPrice : Number(v.price),
            Number(v.stock || 0),
            i,
          ]
        );
      }
    }

    saveImmediately();
    return NextResponse.json({ success: true, productId, slug: cleanSlug });
  } catch (err) {
    console.error('PUT /api/admin/products error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update product' }, { status: 500 });
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
    let id = searchParams.get('id');
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = get('SELECT id, name FROM products WHERE id = ?', [id]);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if product is referenced in order items
    const orderItem = get('SELECT id FROM order_items WHERE product_id = ? LIMIT 1', [id]);
    const forceDelete = searchParams.get('force') === 'true' || searchParams.get('permanent') === 'true';

    if (!orderItem || forceDelete) {
      // Completely remove product and child records
      run('DELETE FROM product_images WHERE product_id = ?', [id]);
      run('DELETE FROM product_variants WHERE product_id = ?', [id]);
      run('DELETE FROM size_charts WHERE product_id = ?', [id]);
      run('DELETE FROM reviews WHERE product_id = ?', [id]);
      run('DELETE FROM products WHERE id = ?', [id]);
    } else {
      // Soft-archive to preserve historical customer invoice records
      run("UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?", [id]);
    }

    saveImmediately();
    return NextResponse.json({ success: true, message: 'Product removed successfully' });
  } catch (err) {
    console.error('DELETE /api/admin/products error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete product' }, { status: 500 });
  }
}
