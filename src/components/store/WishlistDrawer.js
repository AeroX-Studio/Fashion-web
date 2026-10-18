'use client';

import React from 'react';
import Link from 'next/link';
import { useUI } from '@/context/UIContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';

export function WishlistDrawer() {
  const { isWishlistOpen, setIsWishlistOpen, setIsCartOpen } = useUI();
  const { items, wishlistCount, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (!isWishlistOpen) return null;

  const handleMoveToCart = (product) => {
    addToCart(product, 'Free', 1);
    removeFromWishlist(product.id);
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  };

  return (
    <>
      <div className={`drawer-backdrop ${isWishlistOpen ? 'open' : ''}`} onClick={() => setIsWishlistOpen(false)}></div>

      <div className={`drawer ${isWishlistOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-title">
            <i className="ri-heart-line" style={{ color: 'var(--primary)' }}></i>
            <span>My Wishlist ({wishlistCount})</span>
          </div>
          <button type="button" className="drawer-close" onClick={() => setIsWishlistOpen(false)}>
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="drawer-body">
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <i className="ri-heart-line" style={{ fontSize: '48px', color: 'var(--text-light)', marginBottom: '14px', display: 'block' }}></i>
              <h4 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '8px' }}>Your wishlist is empty</h4>
              <p style={{ fontSize: '13.5px', marginBottom: '24px' }}>Save items you love to find them later easily.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsWishlistOpen(false)}
              >
                Browse Collection
              </button>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <div key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-item-img" />

                  <div className="cart-item-info">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={() => setIsWishlistOpen(false)}
                      className="cart-item-name"
                    >
                      {item.name}
                    </Link>

                    <div className="cart-item-price">
                      ৳{item.price?.toLocaleString('en-BD')}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleMoveToCart(item)}
                      >
                        <i className="ri-shopping-bag-line"></i> Move to Bag
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
          )}
        </div>
      </div>
    </>
  );
}
