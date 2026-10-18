'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { UIProvider } from '@/context/UIContext';

export function Providers({ children }) {
  return (
    <SessionProvider>
      <CartProvider>
        <WishlistProvider>
          <UIProvider>{children}</UIProvider>
        </WishlistProvider>
      </CartProvider>
    </SessionProvider>
  );
}
