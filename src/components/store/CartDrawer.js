'use client';

import React from 'react';
import Link from 'next/link';
import { useUI } from '@/context/UIContext';
import { useCart } from '@/context/CartContext';

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen } = useUI();
  const { items, itemCount, subtotal, grandTotal, deliveryCharge, updateQuantity, removeFromCart } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className={`drawer-backdrop ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}></div>

      {/* Drawer Panel */}
      <div className={`drawer ${isCartOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title">
            <i className="ri-shopping-bag-line" style={{ color: 'var(--primary)' }}></i>
            <span>Shopping Bag ({itemCount})</span>
          </div>
          <button type="button" className="drawer-close" onClick={() => setIsCartOpen(false)}>
            <i className="ri-close-line"></i>
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <i className="ri-shopping-bag-line" style={{ fontSize: '48px', color: 'var(--text-light)', marginBottom: '14px', display: 'block' }}></i>
              <h4 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '8px' }}>Your bag is empty</h4>
              <p style={{ fontSize: '13.5px', marginBottom: '24px' }}>Explore our collection and find pieces you love.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsCartOpen(false)}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <div key={item.key} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-item-img" />

                  <div className="cart-item-info">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={() => setIsCartOpen(false)}
                      className="cart-item-name"
                    >
                      {item.name}
                    </Link>

                    <div className="cart-item-meta">
                      Size: <strong>{item.size}</strong> {item.color && `• ${item.color}`}
                    </div>

                    <div className="cart-item-price">
                      ৳{(item.price * item.quantity).toLocaleString('en-BD')}
                      {item.quantity > 1 && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 400 }}>
                          (৳{item.price} each)
                        </span>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                      <div className="cart-qty-ctrl">
                        <button
                          type="button"
                          className="cart-qty-btn"
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="cart-qty-val">{item.quantity}</span>
                        <button
                          type="button"
                          className="cart-qty-btn"
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.key)}
                        style={{ fontSize: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        <i className="ri-delete-bin-line"></i> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="drawer-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>৳{subtotal.toLocaleString('en-BD')}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '13.5px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estimated Delivery</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {deliveryCharge > 0 ? `৳${deliveryCharge}` : 'Calculated at checkout'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '18px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border)',
                fontSize: '17px',
                fontWeight: 800,
                color: 'var(--navy)',
              }}
            >
              <span>Total</span>
              <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                ৳{grandTotal.toLocaleString('en-BD')}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                href="/checkout"
                className="btn btn-primary btn-block btn-lg"
                onClick={() => setIsCartOpen(false)}
              >
                Proceed to Checkout (COD) &rarr;
              </Link>

              <Link
                href="/cart"
                className="btn btn-secondary btn-block"
                onClick={() => setIsCartOpen(false)}
              >
                View Full Bag
              </Link>
            </div>

            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
              <i className="ri-shield-check-line" style={{ color: 'var(--success)' }}></i> Cash on Delivery available across Bangladesh
            </div>
          </div>
        )}
      </div>
    </>
  );
}
