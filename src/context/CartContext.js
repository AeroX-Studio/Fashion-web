'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

import { getImageUrl } from '@/lib/imageHelper';

const CartContext = createContext();


const CART_STORAGE_KEY = 'nobo_cart_v1';

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [deliveryZone, setDeliveryZone] = useState('dhaka'); // 'dhaka' | 'outside_dhaka'

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY) || localStorage.getItem('priyo_cart_v1');
      if (stored) {
        setItems(JSON.parse(stored));
      }
      const storedCoupon = localStorage.getItem('nobo_coupon') || localStorage.getItem('priyo_coupon');
      if (storedCoupon) {
        setCoupon(JSON.parse(storedCoupon));
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded]);

  // Save coupon
  useEffect(() => {
    if (isLoaded) {
      if (coupon) {
        localStorage.setItem('nobo_coupon', JSON.stringify(coupon));
      } else {
        localStorage.removeItem('nobo_coupon');
        localStorage.removeItem('priyo_coupon');
      }
    }
  }, [coupon, isLoaded]);

  // Add product to cart with size/variant
  const addToCart = (product, sizeName = 'Free', quantity = 1, variantId = null, colorName = null) => {
    const itemKey = `${product.id}-${sizeName}-${colorName || ''}`;
    const price = product.sale_price || product.price;

    setItems((prevItems) => {
      const existingIdx = prevItems.findIndex((i) => i.key === itemKey);
      if (existingIdx > -1) {
        const updated = [...prevItems];
        updated[existingIdx].quantity += quantity;
        return updated;
      } else {
        return [
          ...prevItems,
          {
            key: itemKey,
            productId: product.id,
            variantId: variantId,
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            image: getImageUrl(product.image || (product.images && product.images[0]?.url)),

            price: Number(price),
            size: sizeName,
            color: colorName,
            quantity: Number(quantity),
          },
        ];
      }
    });
  };

  // Update quantity
  const updateQuantity = (itemKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemKey);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.key === itemKey ? { ...item, quantity: Number(quantity) } : item))
    );
  };

  // Remove from cart
  const removeFromCart = (itemKey) => {
    setItems((prev) => prev.filter((item) => item.key !== itemKey));
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
    setCoupon(null);
  };

  // Calculations
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Delivery charge (Dhaka: 80, Outside: 150)
  const deliveryCharge = subtotal > 0 ? (deliveryZone === 'dhaka' ? 80 : 150) : 0;

  // Discount calculation
  let discount = 0;
  if (coupon && subtotal >= (coupon.min_order_amount || 0)) {
    if (coupon.discount_type === 'percentage') {
      discount = (subtotal * coupon.discount_value) / 100;
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = coupon.discount_value;
    }
  }

  const grandTotal = Math.max(0, subtotal - discount + deliveryCharge);

  return (
    <CartContext.Provider
      value={{
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
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
