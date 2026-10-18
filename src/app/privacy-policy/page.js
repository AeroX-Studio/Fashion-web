import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Nobo Fashion',
  description: 'Privacy policy and data protection practices of Nobo Fashion Bangladesh.',
};

export default function PrivacyPage() {
  return (
    <div className="container sec-pad" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <span className="sec-eyebrow">Customer Trust</span>
        <h1 style={{ fontSize: '32px', color: 'var(--navy)', marginTop: '4px' }}>Privacy Policy</h1>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Last updated: 2026</span>
      </div>

      <div
        className="data-card"
        style={{ padding: '36px', fontSize: '14.5px', color: 'var(--text-body)', lineHeight: 1.8 }}
      >
        <p style={{ marginBottom: '20px' }}>
          Nobo Fashion values and respects the privacy of our customers. We only collect the minimal personal
          information necessary to process and deliver your Cash on Delivery orders (such as Name, Mobile Phone Number,
          and Delivery Address).
        </p>

        <h3 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '10px' }}>1. Information We Collect</h3>
        <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
          <li>Name and phone number for delivery verification and courier dispatch.</li>
          <li>Delivery address for shipment via courier services.</li>
          <li>Chat history to provide continuous support and order updates.</li>
        </ul>

        <h3 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '10px' }}>2. Data Security</h3>
        <p style={{ marginBottom: '24px' }}>
          We never sell, trade, or share your personal contact numbers or delivery addresses with unauthorized third
          parties. Your data is strictly used for order processing by Nobo Fashion staff and courier logistics.
        </p>

        <Link href="/shop" className="btn btn-primary">
          Back to Store &rarr;
        </Link>
      </div>
    </div>
  );
}
