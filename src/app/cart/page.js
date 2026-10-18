'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export function CartPageClient() {
  const router = useRouter();
  const {
    items,
    itemCount,
    subtotal,
    discount,
    deliveryCharge,
    deliveryZone,
    setDeliveryZone,
    grandTotal,
    coupon,
    setCoupon,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });

      const data = await res.json();
      if (res.ok && data.coupon) {
        setCoupon(data.coupon);
        setCouponCode('');
      } else {
        setCouponError(data.error || 'Invalid or expired coupon code.');
      }
    } catch (err) {
      setCouponError('Failed to validate coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
  };

  if (items.length === 0) {
    return (
      <div className="container sec-pad" style={{ textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
        <i
          className="ri-shopping-bag-line"
          style={{ fontSize: '64px', color: 'var(--text-light)', display: 'block', marginBottom: '16px' }}
        ></i>
        <h2 style={{ fontSize: '26px', color: 'var(--navy)', marginBottom: '10px' }}>Your shopping bag is empty</h2>
        <p style={{ fontSize: '14.5px', color: 'var(--text-muted)', marginBottom: '28px' }}>
          Explore our collection of authentic Pakistani three-piece, sarees, and exclusive co-ords.
        </p>
        <Link href="/shop" className="btn btn-primary btn-lg">
          Start Shopping &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="container sec-pad">
      <h1 style={{ fontSize: '28px', color: 'var(--navy)', marginBottom: '24px' }}>
        Shopping Bag ({itemCount} {itemCount === 1 ? 'item' : 'items'})
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 380px',
          gap: '32px',
          alignItems: 'start',
        }}
      >
        {/* Cart Items Table */}
        <div className="data-card">
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.key}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: '56px', height: '68px', objectFit: 'cover', borderRadius: '6px' }}
                        />
                        <div>
                          <Link
                            href={`/product/${item.slug}`}
                            style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '14px' }}
                          >
                            {item.name}
                          </Link>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SKU: {item.sku || 'N/A'}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        style={{
                          background: 'var(--paper-2)',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          fontWeight: 700,
                          border: '1px solid var(--border)',
                        }}
                      >
                        {item.size} {item.color && `• ${item.color}`}
                      </span>
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      ৳{item.price.toLocaleString('en-BD')}
                    </td>

                    <td>
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
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                      ৳{(item.price * item.quantity).toLocaleString('en-BD')}
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.key)}
                        style={{ color: 'var(--danger)', fontSize: '16px' }}
                        title="Remove item"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', background: 'var(--paper-2)' }}>
            <Link href="/shop" className="btn btn-secondary btn-sm">
              &larr; Continue Shopping
            </Link>
            <button type="button" className="btn btn-outline btn-sm" onClick={clearCart}>
              Clear Bag
            </button>
          </div>
        </div>

        {/* Order Summary & Checkout Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="data-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '18px', borderBottom: '1.5px solid var(--border)', paddingBottom: '10px' }}>
              Order Summary
            </h3>

            {/* Delivery Destination */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
                Delivery Destination:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDeliveryZone('dhaka')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    border: deliveryZone === 'dhaka' ? '2px solid var(--primary)' : '1px solid var(--border-dark)',
                    background: deliveryZone === 'dhaka' ? 'var(--primary-wash)' : '#fff',
                    color: deliveryZone === 'dhaka' ? 'var(--primary)' : 'var(--text-main)',
                  }}
                >
                  Inside Dhaka (৳80)
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryZone('outside_dhaka')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    border: deliveryZone === 'outside_dhaka' ? '2px solid var(--primary)' : '1px solid var(--border-dark)',
                    background: deliveryZone === 'outside_dhaka' ? 'var(--primary-wash)' : '#fff',
                    color: deliveryZone === 'outside_dhaka' ? 'var(--primary)' : 'var(--text-main)',
                  }}
                >
                  Outside Dhaka (৳150)
                </button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>৳{subtotal.toLocaleString('en-BD')}</span>
              </div>

              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                  <span>Discount {coupon && `(${coupon.code})`}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    -৳{discount.toLocaleString('en-BD')}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Delivery Charge</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>৳{deliveryCharge}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--navy)',
                }}
              >
                <span>Grand Total</span>
                <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                  ৳{grandTotal.toLocaleString('en-BD')}
                </span>
              </div>
            </div>

            {/* Coupon Box */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginBottom: '20px' }}>
              {coupon ? (
                <div
                  style={{
                    background: 'var(--success-bg)',
                    border: '1px solid #A7F3D0',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--success)' }}>{coupon.code}</strong> applied!
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{ color: 'var(--danger)', fontSize: '12px', fontWeight: 600 }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Coupon code (e.g. NOBO10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1.5px solid var(--border-dark)',
                      fontSize: '13px',
                      textTransform: 'uppercase',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    className="btn btn-secondary btn-sm"
                    disabled={couponLoading}
                  >
                    {couponLoading ? 'Applying...' : 'Apply'}
                  </button>
                </form>
              )}
              {couponError && (
                <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '6px' }}>{couponError}</div>
              )}
            </div>

            {/* Checkout Button */}
            <button
              type="button"
              className="btn btn-primary btn-block btn-lg"
              onClick={() => router.push('/checkout')}
            >
              Checkout with Cash on Delivery &rarr;
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <i className="ri-shield-check-line" style={{ color: 'var(--success)' }}></i> Pay cash at your door after delivery
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return <CartPageClient />;
}
