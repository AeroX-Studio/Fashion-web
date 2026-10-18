'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getImageUrl } from '@/lib/imageHelper';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (selectedCategory) params.set('category', selectedCategory);

      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(console.error);
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert('Failed to delete product.');
      }
    } catch (e) {
      alert('Error deleting product.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--navy)' }}>Products Catalog</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Manage pieces, size variants, prices, and stock inventory
          </p>
        </div>

        <Link href="/admin/products/new" className="btn btn-primary">
          <i className="ri-add-line"></i> Add New Product
        </Link>
      </div>

      {/* Filter Row */}
      <div className="data-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="search"
              placeholder="Search product name, SKU, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-dark)',
                fontSize: '13.5px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ width: '220px' }}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-dark)',
                fontSize: '13.5px',
                background: '#fff',
                outline: 'none',
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchProducts}
          >
            Filter
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="data-card">
        <div className="data-card-header">
          <strong>Products ({products.length})</strong>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading products...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No products found matching criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Sizes in Stock</th>
                  <th>Total Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={getImageUrl(p.image)}
                          alt={p.name}
                          style={{ width: '46px', height: '56px', objectFit: 'cover', borderRadius: '6px' }}
                        />
                        <div>
                          <strong style={{ fontSize: '13.5px', color: 'var(--navy)' }}>{p.name}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Sold: {p.total_sold || 0} pieces
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <code style={{ fontSize: '11.5px', background: 'var(--paper-2)', padding: '2px 6px', borderRadius: '4px' }}>
                        {p.sku || 'N/A'}
                      </code>
                    </td>

                    <td>{p.category_name || 'Uncategorized'}</td>

                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                        ৳{(p.sale_price || p.price)?.toLocaleString('en-BD')}
                      </div>
                      {p.sale_price && (
                        <del style={{ fontSize: '11px', color: 'var(--text-light)', fontFamily: 'var(--font-mono)' }}>
                          ৳{p.price?.toLocaleString('en-BD')}
                        </del>
                      )}
                    </td>

                    {/* Sizes chips */}
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '180px' }}>
                        {(p.variants || []).map((v) => (
                          <span
                            key={v.id || v.size_name}
                            style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'var(--paper-2)',
                              border: '1px solid var(--border)',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 600,
                            }}
                          >
                            {v.size_name}: {v.stock}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: p.stock <= 5 ? 'var(--danger)' : 'var(--navy)',
                        }}
                      >
                        {p.stock}
                      </span>
                    </td>

                    <td>
                      <span className={`status-pill ${p.is_active ? 'status-delivered' : 'status-cancelled'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="ox-icon-btn"
                          style={{ width: '32px', height: '32px', border: '1px solid var(--border)', color: 'var(--primary)' }}
                          title="Edit product"
                        >
                          <i className="ri-edit-line" style={{ fontSize: '14px' }}></i>
                        </Link>

                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          className="ox-icon-btn"
                          style={{ width: '32px', height: '32px', border: '1px solid var(--border)' }}
                          title="View on store"
                        >
                          <i className="ri-external-link-line" style={{ fontSize: '14px' }}></i>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.name)}
                          className="ox-icon-btn"
                          style={{ width: '32px', height: '32px', border: '1px solid var(--border)' }}
                          title="Delete product"
                        >
                          <i className="ri-delete-bin-line" style={{ color: 'var(--danger)', fontSize: '14px' }}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
