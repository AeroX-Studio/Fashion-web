'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useUI } from '@/context/UIContext';

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { setIsCartOpen, setIsWishlistOpen } = useUI();

  return (
    <nav className="mobile-bottom-nav">
      <Link href="/" className={`mob-nav-btn ${pathname === '/' ? 'active' : ''}`}>
        <i className="ri-home-4-line"></i>
        <span>Home</span>
      </Link>

      <Link href="/shop" className={`mob-nav-btn ${pathname.startsWith('/shop') ? 'active' : ''}`}>
        <i className="ri-store-2-line"></i>
        <span>Shop</span>
      </Link>

      <button type="button" className="mob-nav-btn" onClick={() => setIsCartOpen(true)}>
        <i className="ri-shopping-bag-line"></i>
        <span>Cart</span>
        {itemCount > 0 && <span className="mob-badge">{itemCount}</span>}
      </button>

      <button type="button" className="mob-nav-btn" onClick={() => setIsWishlistOpen(true)}>
        <i className="ri-heart-line"></i>
        <span>Wishlist</span>
        {wishlistCount > 0 && <span className="mob-badge">{wishlistCount}</span>}
      </button>

      <Link
        href={session ? '/account' : '/login'}
        className={`mob-nav-btn ${pathname.startsWith('/account') || pathname.startsWith('/login') ? 'active' : ''}`}
      >
        <i className="ri-user-line"></i>
        <span>{session ? 'Account' : 'Sign In'}</span>
      </Link>
    </nav>
  );
}
