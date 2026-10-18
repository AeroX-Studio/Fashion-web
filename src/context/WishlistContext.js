'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getImageUrl } from '@/lib/imageHelper';

const WishlistContext = createContext();

const WISHLIST_STORAGE_KEY = 'nobo_wishlist_v1';

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY) || localStorage.getItem('priyo_wishlist_v1');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load wishlist', e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const toggleWishlist = (product) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === product.id);
      if (exists) {
        return prev.filter((i) => i.id !== product.id);
      } else {
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.sale_price || product.price,
            image: getImageUrl(product.image || (product.images && product.images[0]?.url)),
            categoryName: product.category_name || '',
          },
        ];
      }
    });
  };


  const isInWishlist = (productId) => {
    return items.some((i) => i.id === productId);
  };

  const removeFromWishlist = (productId) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        wishlistCount: items.length,
        toggleWishlist,
        isInWishlist,
        removeFromWishlist,
        isLoaded,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
