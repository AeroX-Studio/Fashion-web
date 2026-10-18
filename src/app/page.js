import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductCard } from '@/components/store/ProductCard';
import { NewsletterForm } from '@/components/store/NewsletterForm';
import { initDatabase, all, get } from '@/lib/db';
import { getImageUrl } from '@/lib/imageHelper';

export const revalidate = 0; // Dynamic server rendering

async function getHomepageData() {
  await initDatabase();

  // Categories for homepage
  const categories = all(
    'SELECT * FROM categories WHERE is_active = 1 AND show_on_homepage = 1 ORDER BY sort_order ASC'
  );

  // New arrivals
  const newArrivals = all(`
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1 AND p.is_new_arrival = 1
    ORDER BY p.id DESC
    LIMIT 8
  `);

  // Featured products
  const featuredProducts = all(`
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1 AND p.is_featured = 1
    ORDER BY p.id DESC
    LIMIT 8
  `);

  // Best sellers
  const bestSellers = all(`
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1 AND p.is_best_seller = 1
    ORDER BY p.id DESC
    LIMIT 8
  `);

  // Attach images and variants to each product
  const enrichProducts = (prods) => {
    return prods.map((p) => {
      const images = all('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC', [p.id]);
      const variants = all('SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY sort_order ASC', [p.id]);
      return {
        ...p,
        image: images[0]?.url || p.image || '/placeholder.jpg',
        images,
        variants,
      };
    });
  };

  return {
    categories,
    newArrivals: enrichProducts(newArrivals),
    featuredProducts: enrichProducts(featuredProducts),
    bestSellers: enrichProducts(bestSellers),
  };
}

export default async function HomePage() {
  const data = await getHomepageData();

  return (
    <div>
      {/* ── 1. Full-Bleed 10/10 Boutique Hero Section ── */}
      <section className="sw-hero-10">
        {/* Background Showroom Photograph from data/images */}
        <div className="sw-hero-bg-wrapper">
          <img
            src="/api/images/hero-boutique.jpg"
            alt="Nobo Fashion Luxury Showroom Uttara"
            className="sw-hero-bg-img"
            fetchPriority="high"
            decoding="async"
          />
        </div>

        {/* Silky Frosted Gradient Overlay */}
        <div className="sw-hero-overlay"></div>

        <div className="container">
          <div className="sw-hero-content">
            {/* Live Showroom Status Badge */}
            <div className="sw-hero-badge">
              <span className="pc-pulse-dot"></span>
              <span>SELECTED AT THE COUNTER · UTTARA, DHAKA</span>
            </div>

            {/* Editorial Magazine Headline */}
            <h1 className="sw-hero-title">
              Chosen<br />
              by hand,<br />
              <em>worn by you.</em>
            </h1>

            {/* Value Narrative */}
            <p className="sw-hero-lead">
              <strong>1,336 pieces</strong>, picked one at a time at our Uttara counter. 100% authentic three-piece,
              Pakistani lawn &amp; luxury festive wear with Cash on Delivery anywhere in Bangladesh.
            </p>

            {/* Call to Action Buttons */}
            <div className="sw-hero-actions">
              <Link href="/shop" className="btn-hero-primary">
                <i className="ri-shopping-bag-3-fill"></i> SHOP ALL PIECES
              </Link>
              <Link href="/category/3-piece" className="btn-hero-secondary">
                3 PIECE
              </Link>
            </div>

            {/* Quick Category Tag Pills */}
            <div className="sw-hero-quicktags">
              <span className="sw-hero-quicklabel">POPULAR:</span>
              <Link href="/category/3-piece" className="sw-hero-pill">
                👗 3 Piece
              </Link>
              <Link href="/category/co-ord-2-piece" className="sw-hero-pill">
                ✨ Pakistani 2-Piece
              </Link>
              <Link href="/category/1-piece-kurti" className="sw-hero-pill">
                🌸 Cotton Kurti
              </Link>
              <Link href="/category/saree" className="sw-hero-pill">
                🥻 Saree
              </Link>
              <Link href="/category/jewellery" className="sw-hero-pill">
                💎 Jewellery
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Showroom Trust Strip ── */}
      <section className="showroom-trust-strip">
        <div className="container">
          <div className="showroom-trust-grid">
            <div className="showroom-trust-card">
              <div className="showroom-trust-icon">
                <i className="ri-shield-check-fill"></i>
              </div>
              <div className="showroom-trust-info">
                <strong>100% Authentic Fabric</strong>
                <p>Genuine Pakistani lawn, digital prints &amp; handloom</p>
              </div>
            </div>

            <div className="showroom-trust-card">
              <div className="showroom-trust-icon">
                <i className="ri-store-2-fill"></i>
              </div>
              <div className="showroom-trust-info">
                <strong>Uttara Counter Selection</strong>
                <p>Handpicked one piece at a time at Uttara Square Mall</p>
              </div>
            </div>

            <div className="showroom-trust-card">
              <div className="showroom-trust-icon">
                <i className="ri-truck-fill"></i>
              </div>
              <div className="showroom-trust-info">
                <strong>Fast Nationwide Delivery</strong>
                <p>24h inside Dhaka (৳80) • 48h all 64 districts (৳150)</p>
              </div>
            </div>

            <div className="showroom-trust-card">
              <div className="showroom-trust-icon">
                <i className="ri-hand-coin-fill"></i>
              </div>
              <div className="showroom-trust-info">
                <strong>Cash on Delivery &amp; Trial</strong>
                <p>Check parcel at your door before paying the courier</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Brand Marquee Strip ── */}
      <div className="brand-marquee">
        <div className="marquee-track">
          <span className="marquee-item">★ NOBO FASHION</span>
          <span className="marquee-item">PAKISTANI LAWN</span>
          <span className="marquee-item">BIN HAMEED INSPIRED</span>
          <span className="marquee-item">AGHA NOOR 2 PIECE</span>
          <span className="marquee-item">EXCLUSIVE SAREES</span>
          <span className="marquee-item">HANDLOOM BATIK</span>
          <span className="marquee-item">LADIES LUXURY CLUTCHES</span>
          <span className="marquee-item">CASH ON DELIVERY NATIONWIDE</span>
          <span className="marquee-item">★ NOBO FASHION</span>
          <span className="marquee-item">PAKISTANI LAWN</span>
          <span className="marquee-item">BIN HAMEED INSPIRED</span>
        </div>
      </div>

      {/* ── 4. Hot Categories ── */}
      <section className="sec-pad">
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="sec-eyebrow">Explore Collections</span>
              <h2 className="sec-title">Featured Categories</h2>
            </div>
            <Link href="/shop" className="btn btn-outline btn-sm">
              View All Categories &rarr;
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '16px',
            }}
          >
            {data.categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                style={{
                  background: '#fff',
                  border: '1.5px solid var(--border)',
                  borderRadius: '12px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'var(--primary-wash)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: 'var(--primary)',
                    overflow: 'hidden',
                  }}
                >
                  {cat.image ? (
                    <img
                      src={getImageUrl(cat.image)}
                      alt={cat.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <i className="ri-t-shirt-line"></i>
                  )}
                </div>
                <strong style={{ fontSize: '14px', color: 'var(--navy)' }}>{cat.name}</strong>
                <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>Explore &rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Flash Sale / COD Banner ── */}
      <div className="container">
        <div className="flash-sale-bar">
          <div>
            <div style={{ fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.9 }}>
              ⚡ Special Offer
            </div>
            <h3 style={{ fontSize: '24px', color: '#fff', margin: '4px 0' }}>
              Free Delivery on Orders Over ৳3,000
            </h3>
            <p style={{ fontSize: '13px', opacity: 0.85 }}>
              Use coupon code <strong>NOBO10</strong> at checkout for 10% instant discount!
            </p>
          </div>

          <div className="countdown-box">
            <div className="countdown-digit">
              <b>02</b>
              <small>Days</small>
            </div>
            <span style={{ fontSize: '20px', fontWeight: 800 }}>:</span>
            <div className="countdown-digit">
              <b>14</b>
              <small>Hours</small>
            </div>
            <span style={{ fontSize: '20px', fontWeight: 800 }}>:</span>
            <div className="countdown-digit">
              <b>45</b>
              <small>Mins</small>
            </div>
          </div>

          <Link href="/shop" className="btn btn-secondary btn-lg" style={{ background: '#fff', color: 'var(--primary)' }}>
            Shop Sale Pieces
          </Link>
        </div>
      </div>

      {/* ── 6. New Arrivals Grid with Size Chips ── */}
      <section className="sec-pad" style={{ background: 'var(--paper-2)' }}>
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="sec-eyebrow">Just In At The Counter</span>
              <h2 className="sec-title">New Arrivals</h2>
            </div>
            <Link href="/shop?sort=newest" className="btn btn-outline btn-sm">
              View All New &rarr;
            </Link>
          </div>

          <div className="product-grid">
            {data.newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Best Sellers Grid ── */}
      <section className="sec-pad">
        <div className="container">
          <div className="sec-head">
            <div>
              <span className="sec-eyebrow">Customer Favorites</span>
              <h2 className="sec-title">Best Sellers</h2>
            </div>
            <Link href="/shop?sort=best_seller" className="btn btn-outline btn-sm">
              See All &rarr;
            </Link>
          </div>

          <div className="product-grid">
            {data.bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. "Our Story" Editorial Section ── */}
      <section className="sec-pad" style={{ background: 'var(--navy)', color: '#fff' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '48px', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent-wash)' }}>
                Our Story
              </span>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: '#fff', margin: '12px 0 20px', lineHeight: 1.15 }}>
                We are a counter before we are a website.
              </h2>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: '16px' }}>
                Nobo Fashion runs from a basement unit at Uttara Square, and it still works the same way it always
                has: one rail at a time, choosing pieces that hang properly and hold their colour. Nothing is
                drop-shipped, and nothing goes online that has not been through the shop.
              </p>
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: '28px' }}>
                The website exists so the same rail is available to everyone who cannot get to Sector 13 on a Thursday
                evening.
              </p>

              <div style={{ display: 'flex', gap: '36px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '20px' }}>
                <div>
                  <b style={{ display: 'block', fontSize: '24px', fontFamily: 'var(--font-mono)' }}>1,336</b>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.7 }}>Hand-picked Pieces</span>
                </div>
                <div>
                  <b style={{ display: 'block', fontSize: '24px', fontFamily: 'var(--font-mono)' }}>33</b>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.7 }}>Curated Categories</span>
                </div>
                <div>
                  <b style={{ display: 'block', fontSize: '24px', fontFamily: 'var(--font-mono)' }}>100%</b>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.7 }}>Cash on Delivery</span>
                </div>
              </div>
            </div>

            <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', background: '#1E293B' }}>
              <img
                src="/api/images/hero-boutique.jpg"
                alt="Nobo Fashion Storefront"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. "Why Choose Us" ── */}
      <section className="sec-pad">
        <div className="container">
          <div className="why-grid">
            <div className="why-card">
              <i className="ri-hand-coin-line"></i>
              <h4>Pay When It Arrives</h4>
              <p>Cash on delivery everywhere in Bangladesh. Check the piece at your door before you pay the courier.</p>
            </div>

            <div className="why-card">
              <i className="ri-ruler-2-line"></i>
              <h4>Sizes, Stated Plainly</h4>
              <p>6,769 size variants running 22 to 52. Every product card lists the exact sizes currently in stock.</p>
            </div>

            <div className="why-card">
              <i className="ri-store-3-line"></i>
              <h4>A Shop You Can Walk Into</h4>
              <p>Shop # 6, Basement, Uttara Square Shopping Mall, Sector 13, Uttara, Dhaka. Easy returns &amp; exchange.</p>
            </div>

            <div className="why-card">
              <i className="ri-customer-service-2-line"></i>
              <h4>Answered by a Person</h4>
              <p>Call 09638-044440 or chat with us on Live Chat &amp; WhatsApp &mdash; answered directly by store staff.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. Newsletter ── */}
      <section style={{ background: 'var(--paper-2)', padding: '60px 0', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth: '680px', textAlign: 'center' }}>
          <span className="sec-eyebrow">Stay Connected</span>
          <h2 style={{ fontSize: '28px', color: 'var(--navy)', marginBottom: '10px' }}>
            New pieces, once a week.
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Receive an email when the week&rsquo;s new rail goes online. No spam, ever.
          </p>

          <NewsletterForm />
        </div>
      </section>

    </div>
  );
}

