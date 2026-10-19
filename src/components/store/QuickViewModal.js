'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUI } from '@/context/UIContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

import { getImageUrl } from '@/lib/imageHelper';

export function QuickViewModal() {

  const { quickViewProduct, closeQuickView, setIsCartOpen, openSizeChart } = useUI();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (quickViewProduct) {
      const variants = quickViewProduct.variants || [];
      if (variants.length > 0) {
        setSelectedVariant(variants[0]);
      } else {
        setSelectedVariant(null);
      }
      setQuantity(1);
      setAdded(false);
    }
  }, [quickViewProduct]);

  if (!quickViewProduct) return null;

  const variants = quickViewProduct.variants || [];
  const currentPrice = selectedVariant?.price || quickViewProduct.sale_price || quickViewProduct.price;
  const inWishlist = isInWishlist(quickViewProduct.id);

  const handleAdd = () => {
    const sizeName = selectedVariant?.size_name || 'Free';
    addToCart(quickViewProduct, sizeName, quantity, selectedVariant?.id, selectedVariant?.color_name);
    setAdded(true);
    setTimeout(() => {
      closeQuickView();
      setIsCartOpen(true);
    }, 400);
  };

  return (
    <div
      className="quick-view-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={closeQuickView}
    >
      <div
        className="quick-view-panel"
        style={{
          background: '#fff',
          borderRadius: '16px',
          maxWidth: '720px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 320px) 1fr',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeQuickView}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 10,
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--paper-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: 'var(--navy)',
          }}
        >
          <i className="ri-close-line"></i>
        </button>

        {/* Media Column */}
        <div style={{ background: 'var(--paper-3)', position: 'relative', aspectRatio: '4/5' }}>
          <img
            src={getImageUrl(quickViewProduct.image || (quickViewProduct.images && quickViewProduct.images[0]?.url))}
            alt={quickViewProduct.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>


        {/* Details Column */}
        <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 700 }}>
              {quickViewProduct.category_name || 'Nobo Fashion'}
            </span>
            <h3 style={{ fontSize: '20px', color: 'var(--navy)', marginTop: '4px', lineHeight: 1.3 }}>
              {quickViewProduct.name}
            </h3>
          </div>

          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
            ৳{currentPrice?.toLocaleString('en-BD')}
          </div>

          {quickViewProduct.description && (
            <p style={{ fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.5, maxHeight: '80px', overflowY: 'auto' }}>
              {quickViewProduct.description}
            </p>
          )}

          {/* Size / Variant Options */}
          {variants.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase' }}>
                  Select Size {selectedVariant && `(${selectedVariant.size_name})`}
                </span>
                <button
                  type="button"
                  onClick={() => openSizeChart(quickViewProduct.category_name)}
                  style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
                >
                  <i className="ri-ruler-line"></i> Size Chart
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {variants.map((v) => (
                  <button
                    key={v.id || v.size_name}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      border: selectedVariant?.id === v.id ? '2px solid var(--primary)' : '1px solid var(--border-dark)',
                      background: selectedVariant?.id === v.id ? 'var(--primary)' : '#fff',
                      color: selectedVariant?.id === v.id ? '#fff' : 'var(--text-main)',
                      cursor: 'pointer',
                    }}
                  >
                    {v.size_name} {v.color_name && `• ${v.color_name}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto', paddingTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--border-dark)', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ width: '32px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
              >
                −
              </button>
              <span style={{ width: '36px', textAlign: 'center', fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                style={{ width: '32px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1, height: '40px' }}
              onClick={handleAdd}
            >
              {added ? (
                <>
                  <i className="ri-check-line"></i> Added to Bag
                </>
              ) : (
                <>
                  <i className="ri-shopping-bag-line"></i> Add to Bag
                </>
              )}
            </button>

            <button
              type="button"
              className={`ox-icon-btn ${inWishlist ? 'active' : ''}`}
              onClick={() => toggleWishlist(quickViewProduct)}
              style={{ border: '1.5px solid var(--border)', height: '40px', width: '40px' }}
            >
              <i className={inWishlist ? 'ri-heart-fill' : 'ri-heart-line'} style={{ color: inWishlist ? 'var(--primary)' : 'inherit' }}></i>
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <Link
              href={`/product/${quickViewProduct.slug}`}
              onClick={closeQuickView}
              style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'underline' }}
            >
              View Full Product Details &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
