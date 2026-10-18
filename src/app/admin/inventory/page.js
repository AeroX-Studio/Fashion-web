'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getImageUrl } from '@/lib/imageHelper';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLow, setFilterLow] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/products');
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
  }, []);

  const handleAdjust = async (productId, variantId, delta) => {
    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, variantId, delta }),
      });

      if (res.ok) {
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const displayedProducts = filterLow
    ? products.filter((p) => p.stock <= (p.low_stock_threshold || 5))
    : products;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--navy)' }}>Inventory & Stock Management</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Real-time stock tracking by SKU and size with instant adjustment (+/-)
          </p>
        </div>

        <button
          type="button"
          className={`btn ${filterLow ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setFilterLow(!filterLow)}
        >
          <i className="ri-alarm-warning-line"></i> {filterLow ? 'Showing Low Stock Only' : 'Show Low Stock Only'}
        </button>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <strong>Catalog Inventory ({displayedProducts.length} items)</strong>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading inventory...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Total Stock</th>
                  <th>Size Variants & Stock Controls</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((p) => {
                  const isLow = p.stock <= (p.low_stock_threshold || 5);

                  return (
                    <tr key={p.id} style={{ background: isLow ? '#FFFBEB' : '#fff' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={getImageUrl(p.image)}
                            alt={p.name}
                            style={{ width: '40px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                          />

                          <div>
                            <strong style={{ color: 'var(--navy)', fontSize: '13.5px' }}>{p.name}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.category_name}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <code style={{ fontSize: '11.5px', background: 'var(--paper-2)', padding: '2px 6px', borderRadius: '4px' }}>
                          {p.sku || 'N/A'}
                        </code>
                      </td>

                      <td>
                        <span
                          style={{
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '15px',
                            color: isLow ? 'var(--danger)' : 'var(--navy)',
                          }}
                        >
                          {p.stock} {isLow && '⚠️'}
                        </span>
                      </td>

                      {/* Variant Stock Adjuster Pills */}
                      <td>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {(p.variants || []).map((v) => (
                            <div
                              key={v.id || v.size_name}
                              style={{
                                background: '#fff',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: 'var(--shadow-sm)',
                              }}
                            >
                              <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--navy)' }}>
                                {v.size_name}: <strong>{v.stock}</strong>
                              </span>

                              <div style={{ display: 'flex', gap: '2px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleAdjust(p.id, v.id, -1)}
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '3px',
                                    background: 'var(--paper-2)',
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                  }}
                                  title="Decrease 1"
                                >
                                  −
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdjust(p.id, v.id, 1)}
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '3px',
                                    background: 'var(--paper-2)',
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                  }}
                                  title="Increase 1"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
