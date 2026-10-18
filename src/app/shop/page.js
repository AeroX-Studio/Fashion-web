import React from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/store/ProductCard';
import { ShopSortSelect } from '@/components/store/ShopSortSelect';
import { initDatabase, all, get } from '@/lib/db';

export const revalidate = 0;

async function getShopData(searchParams) {
  await initDatabase();

  const q = searchParams.q || '';
  const categorySlug = searchParams.category || '';
  const size = searchParams.size || '';
  const sort = searchParams.sort || 'newest';
  const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : null;
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : null;

  // Categories for sidebar (only show_in_sidebar = 1)
  const sidebarCategories = all(`
    SELECT c.*, COUNT(p.id) AS product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
    WHERE c.is_active = 1 AND c.show_in_sidebar = 1
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.name ASC
  `);

  // Build query
  let sql = `
    SELECT DISTINCT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    WHERE p.is_active = 1
  `;
  const params = [];

  if (q) {
    sql += ` AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ? OR p.tags LIKE ?)`;
    const searchPattern = `%${q}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (categorySlug) {
    sql += ` AND c.slug = ?`;
    params.push(categorySlug);
  }

  if (size) {
    sql += ` AND pv.size_name = ?`;
    params.push(size);
  }

  if (minPrice !== null && !isNaN(minPrice)) {
    sql += ` AND (p.sale_price >= ? OR (p.sale_price IS NULL AND p.price >= ?))`;
    params.push(minPrice, minPrice);
  }

  if (maxPrice !== null && !isNaN(maxPrice)) {
    sql += ` AND (p.sale_price <= ? OR (p.sale_price IS NULL AND p.price <= ?))`;
    params.push(maxPrice, maxPrice);
  }

  // Sorting
  if (sort === 'price_asc') {
    sql += ` ORDER BY COALESCE(p.sale_price, p.price) ASC`;
  } else if (sort === 'price_desc') {
    sql += ` ORDER BY COALESCE(p.sale_price, p.price) DESC`;
  } else if (sort === 'best_seller') {
    sql += ` ORDER BY p.is_best_seller DESC, p.total_sold DESC`;
  } else {
    sql += ` ORDER BY p.id DESC`; // newest default
  }

  const rawProducts = all(sql, params);

  // Enrich with variants and images
  const products = rawProducts.map((p) => {
    const images = all('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC', [p.id]);
    const variants = all('SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY sort_order ASC', [p.id]);
    return {
      ...p,
      image: images[0]?.url || p.image || '/placeholder.jpg',
      images,
      variants,
    };
  });

  return {
    products,
    sidebarCategories,
    currentCategory: categorySlug ? get('SELECT * FROM categories WHERE slug = ?', [categorySlug]) : null,
    totalCount: products.length,
    q,
    categorySlug,
    size,
    sort,
  };
}

export default async function ShopPage({ searchParams }) {
  const data = await getShopData(searchParams);

  const availableSizes = ['Free', 'S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44', '46', '48', '50', '52'];

  return (
    <div className="container sec-pad">
      {/* Breadcrumb & Title */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
          <Link href="/">Home</Link> &gt; <span>Shop</span>
          {data.currentCategory && <span> &gt; {data.currentCategory.name}</span>}
          {data.q && <span> &gt; Search: &quot;{data.q}&quot;</span>}
        </div>
        <h1 style={{ fontSize: '28px', color: 'var(--navy)' }}>
          {data.currentCategory ? data.currentCategory.name : data.q ? `Search results for "${data.q}"` : 'All Products'}
        </h1>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Showing {data.totalCount} {data.totalCount === 1 ? 'piece' : 'pieces'}
        </span>
      </div>

      <div className="shop-layout">
        {/* ── Left Category Sidebar (Sidebar on/off toggle aware) ── */}
        <aside className="shop-sidebar">
          <div className="sidebar-title">
            <i className="ri-list-check-2"></i> Categories
          </div>

          <ul className="cat-nav-list" style={{ marginBottom: '24px' }}>
            <li className={`cat-nav-item ${!data.categorySlug ? 'active' : ''}`}>
              <Link href={`/shop${data.sort ? `?sort=${data.sort}` : ''}`}>
                <span>All Categories</span>
                <span className="cat-count">{data.sidebarCategories.reduce((s, c) => s + c.product_count, 0)}</span>
              </Link>
            </li>

            {data.sidebarCategories.map((cat) => (
              <li key={cat.id} className={`cat-nav-item ${data.categorySlug === cat.slug ? 'active' : ''}`}>
                <Link href={`/shop?category=${cat.slug}${data.sort ? `&sort=${data.sort}` : ''}`}>
                  <span>{cat.name}</span>
                  <span className="cat-count">{cat.product_count}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Size Filter */}
          <div className="sidebar-title" style={{ marginTop: '16px' }}>
            <i className="ri-ruler-line"></i> Filter by Size
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <Link
              href={`/shop?${new URLSearchParams({ ...searchParams, size: '' }).toString()}`}
              className={`sw-size-chip ${!data.size ? 'selected' : ''}`}
            >
              All
            </Link>
            {availableSizes.map((s) => (
              <Link
                key={s}
                href={`/shop?${new URLSearchParams({ ...searchParams, size: s }).toString()}`}
                className={`sw-size-chip ${data.size === s ? 'selected' : ''}`}
              >
                {s}
              </Link>
            ))}
          </div>

          {/* Clear Filters */}
          {(data.categorySlug || data.size || data.q) && (
            <Link href="/shop" className="btn btn-outline btn-block btn-sm">
              <i className="ri-close-circle-line"></i> Clear All Filters
            </Link>
          )}
        </aside>

        {/* ── Products Column ── */}
        <main>
          {/* Top Bar Sort Controls */}
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '13.5px', color: 'var(--text-body)' }}>
              <strong>{data.totalCount}</strong> products found
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label htmlFor="sort-select" style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>Sort by:</label>
              <ShopSortSelect currentSort={data.sort} />
            </div>
          </div>

          {/* Product Grid */}
          {data.products.length === 0 ? (
            <div
              style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                padding: '60px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <i className="ri-search-eye-line" style={{ fontSize: '48px', color: 'var(--text-light)', display: 'block', marginBottom: '14px' }}></i>
              <h3 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '8px' }}>No products match your criteria</h3>
              <p style={{ fontSize: '13.5px', marginBottom: '20px' }}>Try adjusting your filters or search keywords.</p>
              <Link href="/shop" className="btn btn-primary">
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className="product-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {data.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
