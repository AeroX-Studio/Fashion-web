'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="ox-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Col 1: Brand & Contact Info */}
          <div>
            <div style={{ marginBottom: '18px' }}>
              <Link href="/" className="ox-logo" aria-label="Nobo Fashion home">
                <Image src="/logo.jpg" alt="Nobo Fashion" width={96} height={96} className="ox-logo-image ox-footer-brand-image" />
              </Link>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.6 }}>
              Shop Nobo Fashion for authentic luxury three-piece, gowns, sarees and unstitched dresses. Cash on
              delivery nationwide across Bangladesh.
            </p>

            <div className="footer-contact-item">
              <i className="ri-map-pin-line"></i>
              <span>Shop # 6, Basement, Uttara Square Shopping Mall, Sonargaon Janapath, Sector 13, Uttara, Dhaka</span>
            </div>

            <div className="footer-contact-item">
              <i className="ri-phone-line"></i>
              <span>09638-044440, 09639-774962</span>
            </div>

            <div className="footer-contact-item">
              <i className="ri-mail-line"></i>
              <span>info@nobofashion.com</span>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <div className="footer-col-title">Categories</div>
            <ul className="footer-links">
              <li><Link href="/category/1-piece-kurti">1 Piece / Kurti</Link></li>
              <li><Link href="/category/3-piece">3 Piece</Link></li>
              <li><Link href="/category/co-ord-2-piece">Co-Ord / 2 Piece</Link></li>
              <li><Link href="/category/saree">Saree</Link></li>
              <li><Link href="/category/lehenga">Lehenga</Link></li>
              <li><Link href="/category/jewellery">Jewellery</Link></li>
              <li><Link href="/category/ladies-parts">Ladies Parts</Link></li>
            </ul>
          </div>

          {/* Col 3: Customer Care */}
          <div>
            <div className="footer-col-title">Customer Care</div>
            <ul className="footer-links">
              <li><Link href="/account">My Account</Link></li>
              <li><Link href="/account/orders">Track Order</Link></li>
              <li><Link href="/account/invoices">My Invoices</Link></li>
              <li><Link href="/account/wishlist">My Wishlist</Link></li>
              <li><Link href="/shop">All Products</Link></li>
              <li><a href="https://wa.me/8801800033223" target="_blank" rel="noopener noreferrer">Order on WhatsApp</a></li>
            </ul>
          </div>

          {/* Col 4: Store & Delivery Info */}
          <div>
            <div className="footer-col-title">Delivery & Policies</div>
            <ul className="footer-links">
              <li><span>Cash on Delivery: Nationwide</span></li>
              <li><span>Inside Dhaka: ৳80 (1–2 days)</span></li>
              <li><span>Outside Dhaka: ৳150 (2–4 days)</span></li>
              <li><span>Store Hours: Sat–Thu, 10 AM–9 PM</span></li>
              <li><Link href="/terms-of-service">Terms of Service</Link></li>
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} <strong>Nobo Fashion</strong> &mdash; Made in Bangladesh with{' '}
            <i className="ri-heart-fill" style={{ color: 'var(--primary)' }}></i>
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: 'var(--primary)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Cash On Delivery
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Check product at doorstep before paying
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
