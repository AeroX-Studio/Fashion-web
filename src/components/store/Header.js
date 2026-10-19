'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useUI } from '@/context/UIContext';
import { getImageUrl } from '@/lib/imageHelper';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { setIsCartOpen, setIsWishlistOpen } = useUI();

  const [isStuck, setIsStuck] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle glass sticky effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsStuck(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Instant live search suggestions
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery.trim())}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data);
            setShowSuggestions(true);
          }
        } catch (e) {
          console.error(e);
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop All', href: '/shop' },
    { name: '3 Piece', href: '/category/3-piece', badge: 'Popular' },
    { name: 'Co-Ord / 2 Piece', href: '/category/co-ord-2-piece' },
    { name: '1 Piece / Kurti', href: '/category/1-piece-kurti' },
    { name: 'Saree', href: '/category/saree' },
    { name: 'Jewellery', href: '/category/jewellery' },
    { name: 'Ladies Parts', href: '/category/ladies-parts' },
    { name: 'Festive & Eid', href: '/shop?tag=festive', isNew: true },
  ];

  return (
    <>
      {/* ── 1. Top Announcement Bar ── */}
      <div className="pc-topbar">
        <div className="container pc-topbar-inner">
          <div className="pc-topbar-left">
            <span className="pc-pulse-dot"></span>
            <span>UTTARA BOUTIQUE COUNTER OPEN · 10 AM - 9 PM</span>
          </div>
          <div className="pc-topbar-center">
            <span>✨ 100% AUTHENTIC THREE-PIECE &amp; PAKISTANI LAWN • CASH ON DELIVERY ALL OVER BANGLADESH</span>
          </div>
          <div className="pc-topbar-right">
            <a href="tel:09638044440" className="pc-hotline-link">
              <i className="ri-phone-fill"></i> 09638-044440
            </a>
          </div>
        </div>
      </div>

      {/* ── 2. Main Master Header ── */}
      <header className={`ox-header ${isStuck ? 'is-stuck' : ''}`}>
        <div className="ox-mainhead">
          <div className="container ox-mainhead-wrap">
            {/* Nobo Fashion brand mark */}
            <Link href="/" className="ox-logo" aria-label="Nobo Fashion home">
              <Image
                src="/logo.jpg"
                alt="Nobo Fashion"
                width={72}
                height={72}
                priority
                className="ox-logo-image"
              />
            </Link>

            {/* Centered Luxury Capsule Search */}
            <div className="ox-search">
              <form onSubmit={handleSearchSubmit}>
                <div className="ox-search-pill">
                  <input
                    type="search"
                    className="ox-search-input"
                    placeholder="Search 3-piece, Pakistani lawn, kurti, saree..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions(false), 250);
                    }}
                  />
                  <button type="submit" className="ox-search-submit" title="Search">
                    <i className="ri-search-line"></i>
                  </button>
                </div>
              </form>

              {/* Live Search Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="ox-search-dropdown">
                  <div className="ox-dropdown-header">
                    <span>Matching Products ({suggestions.length})</span>
                  </div>
                  {suggestions.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      onClick={() => setShowSuggestions(false)}
                      className="ox-search-result-item"
                    >
                      <img
                        src={getImageUrl(p.image)}
                        alt={p.name}
                        className="ox-search-thumb"
                      />
                      <div className="ox-search-info">
                        <div className="ox-search-name">{p.name}</div>
                        <div className="ox-search-cat">{p.category_name || 'Nobo Fashion'}</div>
                      </div>
                      <div className="ox-search-price">
                        ৳{(p.sale_price || p.price)?.toLocaleString('en-BD')}
                      </div>
                    </Link>
                  ))}
                  <Link
                    href={`/shop?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => setShowSuggestions(false)}
                    className="ox-search-viewall"
                  >
                    View all results for &quot;{searchQuery}&quot; &rarr;
                  </Link>
                </div>
              )}
            </div>

            {/* Right Action Icons & Menu */}
            <div className="ox-head-actions">
              {/* Wishlist Button with Badge */}
              <button
                type="button"
                className="ox-action-btn"
                onClick={() => setIsWishlistOpen(true)}
                title="Wishlist"
              >
                <div className="ox-action-icon-wrap">
                  <i className="ri-heart-line"></i>
                  <span className="ox-badge-count">{wishlistCount}</span>
                </div>
              </button>

              {/* Shopping Bag Button with Badge */}
              <button
                type="button"
                className="ox-action-btn"
                onClick={() => setIsCartOpen(true)}
                title="Shopping Bag"
              >
                <div className="ox-action-icon-wrap">
                  <i className="ri-shopping-bag-line"></i>
                  <span className="ox-badge-count">{itemCount}</span>
                </div>
              </button>

              {/* Luxury MENU Button */}
              <button
                type="button"
                className="ox-menu-trigger"
                onClick={() => setMobileMenuOpen(true)}
                title="Menu"
              >
                <span className="ox-menu-bar">
                  <i className="ri-menu-line"></i>
                </span>
                <span className="ox-menu-label">MENU</span>
              </button>

              {/* User Account Menu (Optional Quick Dropdown) */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="ox-user-avatar-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  title="Account"
                >
                  <i className="ri-user-3-line"></i>
                </button>

                {userMenuOpen && (
                  <div
                    className="ox-user-dropdown"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    {session ? (
                      <>
                        <div className="ox-user-header">
                          <strong className="ox-user-name">{session.user.name}</strong>
                          <span className="ox-user-sub">{session.user.phone || session.user.email}</span>
                        </div>

                        {session.user.userType === 'admin' && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="ox-user-link highlight"
                          >
                            <i className="ri-dashboard-line"></i> Admin Dashboard
                          </Link>
                        )}

                        <Link
                          href="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="ox-user-link"
                        >
                          <i className="ri-user-settings-line"></i> My Profile
                        </Link>
                        <Link
                          href="/account/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="ox-user-link"
                        >
                          <i className="ri-file-list-3-line"></i> My Orders
                        </Link>
                        <Link
                          href="/account/invoices"
                          onClick={() => setUserMenuOpen(false)}
                          className="ox-user-link"
                        >
                          <i className="ri-bill-line"></i> My Invoices
                        </Link>

                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            signOut({ callbackUrl: '/' });
                          }}
                          className="ox-user-signout"
                        >
                          <i className="ri-logout-box-r-line"></i> Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setUserMenuOpen(false)}
                          className="ox-user-link highlight"
                        >
                          <i className="ri-login-box-line"></i> Sign In to Account
                        </Link>
                        <Link
                          href="/register"
                          onClick={() => setUserMenuOpen(false)}
                          className="ox-user-link"
                        >
                          <i className="ri-user-add-line"></i> Create New Account
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Category Navigation Bar ── */}
        <nav className="ox-nav">
          <div className="container">
            <ul className="ox-nav-list">
              {navLinks.map((item) => (
                <li key={item.href} className="ox-nav-item">
                  <Link href={item.href} className={pathname === item.href ? 'active' : ''}>
                    {item.name}
                    {item.badge && <span className="ox-nav-badge">{item.badge}</span>}
                    {item.isNew && <span className="ox-nav-badge-new">New</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {/* ── 4. Slide-over Luxury Menu Drawer ── */}
      {mobileMenuOpen && (
        <div className="ox-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="ox-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="ox-drawer-head">
              <Link href="/" className="ox-drawer-logo" aria-label="Nobo Fashion home" onClick={() => setMobileMenuOpen(false)}>
                <Image src="/logo.jpg" alt="Nobo Fashion" width={96} height={96} className="ox-logo-image ox-drawer-brand-image" />
              </Link>
              <button
                type="button"
                className="ox-drawer-close"
                onClick={() => setMobileMenuOpen(false)}
              >
                <i className="ri-close-line"></i>
              </button>
            </div>

            <div className="ox-drawer-body">
              <div className="ox-drawer-section">
                <span className="ox-drawer-tag">CATALOG &amp; PIECES</span>
                <div className="ox-drawer-links">
                  {navLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="ox-drawer-link"
                    >
                      <span>{l.name}</span>
                      <i className="ri-arrow-right-s-line"></i>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="ox-drawer-section">
                <span className="ox-drawer-tag">UTTARA SHOWROOM</span>
                <div className="ox-drawer-info-card">
                  <div className="ox-info-row">
                    <i className="ri-map-pin-2-fill"></i>
                    <div>
                      <strong>Nobo Fashion Showroom</strong>
                      <p>Shop # 6, Basement, Uttara Square Mall, Sonargaon Janapath, Sector 13, Uttara, Dhaka</p>
                    </div>
                  </div>
                  <div className="ox-info-row">
                    <i className="ri-time-fill"></i>
                    <div>
                      <strong>Showroom Hours</strong>
                      <p>Saturday - Thursday: 10:00 AM - 9:00 PM</p>
                    </div>
                  </div>
                  <div className="ox-info-row">
                    <i className="ri-phone-fill"></i>
                    <div>
                      <strong>Order Hotline</strong>
                      <a href="tel:09638044440" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                        09638-044440
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ox-drawer-actions">
                <a
                  href="https://wa.me/8801800033223"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp btn-block"
                >
                  <i className="ri-whatsapp-line"></i> Order on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

