'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useUI } from '@/context/UIContext';
import { ProductCard } from '@/components/store/ProductCard';
import { getImageUrl } from '@/lib/imageHelper';

export function ProductDetailClient({ product, relatedProducts }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { setIsCartOpen, openSizeChart } = useUI();

  const variants = product.variants || [];
  const images = product.images || [];

  const initialImageUrl = getImageUrl(images[0]?.url || product.image || '/placeholder.jpg');
  const [activeImage, setActiveImage] = useState(initialImageUrl);
  const [selectedVariant, setSelectedVariant] = useState(variants[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [addedAnimation, setAddedAnimation] = useState(false);


  const inWishlist = isInWishlist(product.id);
  const currentPrice = selectedVariant?.price || product.sale_price || product.price;
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    const sizeName = selectedVariant?.size_name || 'Free';
    addToCart(product, sizeName, quantity, selectedVariant?.id, selectedVariant?.color_name);

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);

    setIsCartOpen(true);
  };

  const handleBuyNow = () => {
    const sizeName = selectedVariant?.size_name || 'Free';
    addToCart(product, sizeName, quantity, selectedVariant?.id, selectedVariant?.color_name);
    router.push('/checkout');
  };

  const waMessage = `Hi Nobo Fashion! I want to order "${product.name}" in size ${selectedVariant?.size_name || 'Free'} (SKU: ${product.sku}). Is it available?`;
  const waUrl = `https://wa.me/8801800033223?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="container sec-pad">
      {/* Breadcrumb */}
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
        <Link href="/">Home</Link> &gt; <Link href="/shop">Shop</Link> &gt;{' '}
        {product.category_name && (
          <>
            <Link href={`/category/${product.category_slug}`}>{product.category_name}</Link> &gt;{' '}
          </>
        )}
        <span>{product.name}</span>
      </div>

      {/* Main Product Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1fr)',
          gap: '48px',
          alignItems: 'start',
          marginBottom: '64px',
        }}
      >
        {/* Left: Gallery */}
        <div>
          {/* Main Large Image */}
          <div
            style={{
              aspectRatio: '4/5',
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'var(--paper-3)',
              border: '1px solid var(--border)',
              marginBottom: '16px',
            }}
          >
            <img
              src={activeImage}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
              {images.map((img, idx) => {
                const imgUrl = getImageUrl(img.url);
                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    style={{
                      width: '70px',
                      height: '84px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: activeImage === imgUrl ? '2px solid var(--primary)' : '1px solid var(--border)',
                      padding: 0,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {/* Right: Info & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
              }}
            >
              {product.category_name || 'Nobo Fashion'}
            </span>
            <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', color: 'var(--navy)', marginTop: '6px', lineHeight: 1.2 }}>
              {product.name}
            </h1>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              SKU: <strong style={{ fontFamily: 'var(--font-mono)' }}>{product.sku || 'PRY-PC'}</strong>
            </div>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
              ৳{currentPrice?.toLocaleString('en-BD')}
            </div>
            {product.sale_price && product.sale_price < product.price && (
              <del style={{ fontSize: '18px', color: 'var(--text-light)', fontFamily: 'var(--font-mono)' }}>
                ৳{product.price?.toLocaleString('en-BD')}
              </del>
            )}
            <span
              style={{
                background: 'var(--primary-wash)',
                color: 'var(--primary)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              Cash on Delivery
            </span>
          </div>

          {/* In-Stock Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isOutOfStock ? 'var(--danger)' : 'var(--success)',
              }}
            ></span>
            <span style={{ color: isOutOfStock ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
              {isOutOfStock ? 'Out of Stock' : 'In Stock at Uttara Store'}
            </span>
          </div>

          {/* ── Visual Size Chips Selector ── */}
          {variants.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--navy)' }}>
                  Select Size:{' '}
                  <span style={{ color: 'var(--primary)', fontWeight: 800 }}>
                    {selectedVariant?.size_name}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => openSizeChart(product.category_name)}
                  style={{
                    fontSize: '12px',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'underline',
                  }}
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
                    disabled={v.stock <= 0}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '14px',
                      fontWeight: 700,
                      border: selectedVariant?.id === v.id ? '2px solid var(--primary)' : '1.5px solid var(--border-dark)',
                      background: selectedVariant?.id === v.id ? 'var(--primary)' : '#fff',
                      color: selectedVariant?.id === v.id ? '#fff' : 'var(--text-main)',
                      cursor: v.stock <= 0 ? 'not-allowed' : 'pointer',
                      opacity: v.stock <= 0 ? 0.4 : 1,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {v.size_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Buy Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              {/* Quantity Counter */}
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--border-dark)', borderRadius: '8px', height: '48px' }}>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ width: '40px', height: '100%', fontSize: '18px', fontWeight: 700 }}
                >
                  −
                </button>
                <span style={{ width: '44px', textAlign: 'center', fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  style={{ width: '40px', height: '100%', fontSize: '18px', fontWeight: 700 }}
                >
                  +
                </button>
              </div>

              {/* Add to Bag Button */}
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                style={{ flex: 1, height: '48px' }}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {addedAnimation ? (
                  <>
                    <i className="ri-check-line"></i> Added to Bag
                  </>
                ) : (
                  <>
                    <i className="ri-shopping-bag-line"></i> Add to Bag
                  </>
                )}
              </button>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  color: inWishlist ? 'var(--primary)' : 'var(--navy)',
                  background: '#fff',
                }}
                title="Save to Wishlist"
              >
                <i className={inWishlist ? 'ri-heart-fill' : 'ri-heart-line'}></i>
              </button>
            </div>

            {/* Buy Now (Direct to COD checkout) */}
            <button
              type="button"
              className="btn btn-primary btn-lg btn-block"
              style={{ height: '48px' }}
              onClick={handleBuyNow}
              disabled={isOutOfStock}
            >
              <i className="ri-flashlight-line"></i> Buy Now (Cash on Delivery)
            </button>

            {/* Order via WhatsApp */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-block"
              style={{
                background: '#25D366',
                color: '#fff',
                border: 'none',
                height: '44px',
                fontWeight: 700,
              }}
            >
              <i className="ri-whatsapp-line" style={{ fontSize: '18px' }}></i> Order via WhatsApp
            </a>
          </div>

          {/* Store Assurance Badges */}
          <div
            style={{
              background: 'var(--paper-2)',
              borderRadius: '12px',
              padding: '16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <i className="ri-truck-line" style={{ color: 'var(--primary)', fontSize: '18px' }}></i>
              <span>Cash on Delivery nationwide</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <i className="ri-shield-check-line" style={{ color: 'var(--primary)', fontSize: '18px' }}></i>
              <span>100% Authentic quality guaranteed</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <i className="ri-exchange-box-line" style={{ color: 'var(--primary)', fontSize: '18px' }}></i>
              <span>Easy 7-day size exchange</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <i className="ri-store-2-line" style={{ color: 'var(--primary)', fontSize: '18px' }}></i>
              <span>Pickup at Uttara counter</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Product Information Tabs ── */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '64px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--paper-2)', overflowX: 'auto' }}>
          <button
            type="button"
            onClick={() => setActiveTab('description')}
            style={{
              padding: '16px 24px',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              borderBottom: activeTab === 'description' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'description' ? 'var(--primary)' : 'var(--text-muted)',
              background: activeTab === 'description' ? '#fff' : 'transparent',
            }}
          >
            Description & Details
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sizing')}
            style={{
              padding: '16px 24px',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              borderBottom: activeTab === 'sizing' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'sizing' ? 'var(--primary)' : 'var(--text-muted)',
              background: activeTab === 'sizing' ? '#fff' : 'transparent',
            }}
          >
            Sizing & Care
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('delivery')}
            style={{
              padding: '16px 24px',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              borderBottom: activeTab === 'delivery' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'delivery' ? 'var(--primary)' : 'var(--text-muted)',
              background: activeTab === 'delivery' ? '#fff' : 'transparent',
            }}
          >
            Delivery & Exchange
          </button>
        </div>

        <div style={{ padding: '32px' }}>
          {activeTab === 'description' && (
            <div style={{ fontSize: '14.5px', color: 'var(--text-body)', lineHeight: 1.8 }}>
              <p>{product.description || 'Authentic Nobo Fashion exclusive piece.'}</p>
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ fontSize: '15px', color: 'var(--navy)', marginBottom: '8px' }}>Product Specifications</h4>
                <ul style={{ paddingLeft: '20px' }}>
                  <li>Brand: <strong>Nobo Fashion</strong></li>
                  <li>Category: <strong>{product.category_name}</strong></li>
                  <li>SKU: <strong>{product.sku}</strong></li>
                  <li>Payment Mode: <strong>Cash on Delivery (COD)</strong></li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'sizing' && (
            <div>
              <p style={{ fontSize: '14px', color: 'var(--text-body)', marginBottom: '16px' }}>
                All pieces are hand-measured at our Uttara counter.
              </p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => openSizeChart(product.category_name)}
              >
                <i className="ri-ruler-line"></i> Open Detailed Size Chart
              </button>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.8 }}>
              <h4 style={{ fontSize: '15px', color: 'var(--navy)', marginBottom: '8px' }}>Delivery Information</h4>
              <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                <li><strong>Inside Dhaka:</strong> ৳80 delivery charge (1–2 business days)</li>
                <li><strong>Outside Dhaka:</strong> ৳150 delivery charge (2–4 business days)</li>
                <li>Cash on delivery everywhere in Bangladesh. You may inspect the package at your door.</li>
              </ul>
              <h4 style={{ fontSize: '15px', color: 'var(--navy)', marginBottom: '8px' }}>Exchange Policy</h4>
              <p>
                If the size does not fit or if you wish to exchange, please inform our support within 7 days of delivery.
                Items must be unworn with tags attached.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section>
          <div className="sec-head">
            <div>
              <span className="sec-eyebrow">You May Also Like</span>
              <h2 className="sec-title">Related Pieces</h2>
            </div>
          </div>

          <div className="product-grid">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}

      {/* ── Sticky Mobile Bottom Buy Bar ── */}
      <div
        style={{
          position: 'fixed',
          bottom: '60px',
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid var(--border)',
          padding: '10px 16px',
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 89,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
        }}
        className="mobile-sticky-bar"
      >
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Price</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
            ৳{currentPrice?.toLocaleString('en-BD')}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            <i className="ri-shopping-bag-line"></i> Add to Bag
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .mobile-sticky-bar {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
