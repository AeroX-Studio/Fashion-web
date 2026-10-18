'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useUI } from '@/context/UIContext';
import { getImageUrl } from '@/lib/imageHelper';

export function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { openQuickView, setIsCartOpen } = useUI();

  // Extract variants/sizes
  const variants = product.variants || [];
  const initialSize = variants.length === 1 ? variants[0].size_name : null;
  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const price = product.sale_price || product.price;
  const inWishlist = isInWishlist(product.id);

  const handleSizeClick = (e, size) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize(size);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // If multiple variants exist and no size is chosen, open QuickView
    if (variants.length > 1 && !selectedSize) {
      openQuickView(product);
      return;
    }

    const chosenSize = selectedSize || (variants[0] ? variants[0].size_name : 'Free');
    const matchedVariant = variants.find((v) => v.size_name === chosenSize);

    addToCart(product, chosenSize, 1, matchedVariant ? matchedVariant.id : null);

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);

    // Open slide-out cart drawer
    setIsCartOpen(true);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const isLowStock = product.stock > 0 && product.stock <= (product.low_stock_threshold || 5);
  const isOutOfStock = product.stock <= 0;

  const rawImage = product.image || (product.images && product.images[0]?.url) || '/placeholder.jpg';
  const displayImage = getImageUrl(rawImage);

  return (
    <article className="sw-card">
      {/* Product Image & Link */}
      <Link href={`/product/${product.slug}`} className="sw-card-media">
        <img
          src={displayImage}
          alt={product.name}
          loading="lazy"
        />


        {/* Badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 3 }}>
          {product.is_new_arrival === 1 && <span className="sw-card-badge badge-new">New</span>}
          {product.sale_price && product.sale_price < product.price && (
            <span className="sw-card-badge badge-sale">Sale</span>
          )}
          {isLowStock && <span className="sw-card-badge badge-low">Low Stock</span>}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          className={`sw-card-wish ${inWishlist ? 'active' : ''}`}
          onClick={handleWishlistToggle}
          title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <i className={inWishlist ? 'ri-heart-fill' : 'ri-heart-line'} style={{ color: inWishlist ? 'var(--primary)' : 'inherit' }}></i>
        </button>

        {/* Quick Size Selection & Add to Cart on Card */}
        <div className="sw-card-quick">
          {variants.length > 0 && (
            <>
              <span className="sw-sizes-label">Sizes in stock</span>
              <div className="sw-sizes">
                {variants.slice(0, 6).map((v) => (
                  <button
                    key={v.id || v.size_name}
                    type="button"
                    className={`sw-size-chip ${selectedSize === v.size_name ? 'selected' : ''} ${v.stock <= 0 ? 'disabled' : ''}`}
                    onClick={(e) => handleSizeClick(e, v.size_name)}
                    disabled={v.stock <= 0}
                  >
                    {v.size_name}
                  </button>
                ))}
                {variants.length > 6 && (
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      openQuickView(product);
                    }}
                    style={{ fontSize: '11px', color: 'var(--accent)', cursor: 'pointer', alignSelf: 'center', fontWeight: 700 }}
                  >
                    +{variants.length - 6} more
                  </span>
                )}
              </div>
            </>
          )}

          <button
            type="button"
            className="sw-card-atc"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            {addedAnimation ? (
              <>
                <i className="ri-check-line"></i> Added to Bag
              </>
            ) : isOutOfStock ? (
              'Out of Stock'
            ) : (
              <>
                <i className="ri-shopping-bag-line"></i> {variants.length > 1 && !selectedSize ? 'Select Size' : 'Add to Bag'}
              </>
            )}
          </button>
        </div>
      </Link>

      {/* Card Body */}
      <div className="sw-card-body">
        <span className="sw-card-cat">{product.category_name || 'Nobo Fashion'}</span>

        <Link href={`/product/${product.slug}`} className="sw-card-name" title={product.name}>
          {product.name}
        </Link>

        <div className="sw-card-foot">
          <div className="sw-card-price">
            ৳{price?.toLocaleString('en-BD')}
            {product.sale_price && product.sale_price < product.price && (
              <del>৳{product.price?.toLocaleString('en-BD')}</del>
            )}
          </div>

          <div className="sw-card-sizes-info">
            {variants.length > 1 ? `${variants.length} sizes` : '1 size'}
          </div>
        </div>
      </div>
    </article>
  );
}
