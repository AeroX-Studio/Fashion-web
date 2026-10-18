'use client';

import React from 'react';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useUI } from '@/context/UIContext';

export default function AccountWishlistPage() {
  const { items, wishlistCount, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { setIsCartOpen } = useUI();

  const handleMoveToCart = (product) => {
    addToCart(product, 'Free', 1);
    removeFromWishlist(product.id);
    setIsCartOpen(true);
  };

  return (
    <div className="data-card">
      <div className="data-card-header">
        <h1 style={{ fontSize: '20px', color: 'var(--navy)' }}>My Wishlist ({wishlistCount})</h1>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <i className="ri-heart-line" style={{ fontSize: '48px', color: 'var(--text-light)', display: 'block', marginBottom: '12px' }}></i>
          <h3 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '8px' }}>Your wishlist is empty</h3>
          <p style={{ fontSize: '13.5px', marginBottom: '20px' }}>Explore our collection and save pieces you adore.</p>
          <Link href="/shop" className="btn btn-primary btn-sm">
            Browse Store
          </Link>
        </div>
      ) : (
        <div style={{ padding: '24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px',
            }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ aspectRatio: '4/5', background: 'var(--paper-3)', overflow: 'hidden' }}>
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <Link href={`/product/${item.slug}`} style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy)' }}>
                    {item.name}
                  </Link>

                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)', fontSize: '15px' }}>
                    ৳{item.price?.toLocaleString('en-BD')}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => handleMoveToCart(item)}
                    >
                      <i className="ri-shopping-bag-line"></i> Add to Bag
                    </button>

                    <button
                      type="button"
                      onClick={() => removeFromWishlist(item.id)}
                      className="ox-icon-btn"
                      style={{ width: '32px', height: '32px', border: '1px solid var(--border)' }}
                      title="Remove"
                    >
                      <i className="ri-delete-bin-line" style={{ color: 'var(--danger)', fontSize: '14px' }}></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
