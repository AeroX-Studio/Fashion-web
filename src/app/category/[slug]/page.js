import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProductCard } from '@/components/store/ProductCard';
import { initDatabase, get, all } from '@/lib/db';

export const revalidate = 0;

export async function generateMetadata({ params }) {
  await initDatabase();
  const category = get('SELECT * FROM categories WHERE slug = ? AND is_active = 1', [params.slug]);
  if (!category) return { title: 'Category Not Found | Nobo Fashion' };

  return {
    title: `${category.name} Collection — Nobo Fashion`,
    description: category.description || `Shop authentic ${category.name} from Nobo Fashion with Cash on Delivery nationwide.`,
  };
}

export default async function CategoryPage({ params, searchParams }) {
  await initDatabase();

  const category = get('SELECT * FROM categories WHERE slug = ? AND is_active = 1', [params.slug]);
  if (!category) {
    notFound();
  }

  // Get other categories for sidebar
  const sidebarCategories = all(`
    SELECT c.*, COUNT(p.id) AS product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
    WHERE c.is_active = 1 AND c.show_in_sidebar = 1
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.name ASC
  `);

  // Query products in category
  const rawProducts = all(`
    SELECT p.*, c.name AS category_name
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.category_id = ? AND p.is_active = 1
    ORDER BY p.id DESC
  `, [category.id]);

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

  return (
    <div className="container sec-pad">
      {/* Breadcrumb */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
          <Link href="/">Home</Link> &gt; <Link href="/shop">Shop</Link> &gt; <span>{category.name}</span>
        </div>
        <h1 style={{ fontSize: '32px', color: 'var(--navy)' }}>{category.name}</h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {category.description || `Showing ${products.length} exclusive pieces in ${category.name}`}
        </p>
      </div>

      <div className="shop-layout">
        {/* Sidebar */}
        <aside className="shop-sidebar">
          <div className="sidebar-title">Categories</div>
          <ul className="cat-nav-list">
            <li className="cat-nav-item">
              <Link href="/shop">All Categories</Link>
            </li>
            {sidebarCategories.map((c) => (
              <li key={c.id} className={`cat-nav-item ${c.id === category.id ? 'active' : ''}`}>
                <Link href={`/category/${c.slug}`}>
                  <span>{c.name}</span>
                  <span className="cat-count">{c.product_count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Products */}
        <main>
          {products.length === 0 ? (
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
              <i className="ri-t-shirt-line" style={{ fontSize: '48px', color: 'var(--text-light)', display: 'block', marginBottom: '14px' }}></i>
              <h3 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '8px' }}>No pieces currently listed</h3>
              <p style={{ fontSize: '13.5px', marginBottom: '20px' }}>New stock arrives at our counter weekly.</p>
              <Link href="/shop" className="btn btn-primary">
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className="product-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
