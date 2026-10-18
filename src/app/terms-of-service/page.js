import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service & Exchange Policy — Nobo Fashion',
  description: 'Terms of service, Cash on Delivery policies, and exchange rules for Nobo Fashion Bangladesh.',
};

export default function TermsPage() {
  return (
    <div className="container sec-pad" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <span className="sec-eyebrow">Customer Policies</span>
        <h1 style={{ fontSize: '32px', color: 'var(--navy)', marginTop: '4px' }}>Terms of Service</h1>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Last updated: 2026</span>
      </div>

      <div
        className="data-card"
        style={{ padding: '36px', fontSize: '14.5px', color: 'var(--text-body)', lineHeight: 1.8 }}
      >
        <h3 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '10px' }}>1. Cash on Delivery (COD) Policy</h3>
        <p style={{ marginBottom: '20px' }}>
          Nobo Fashion offers Cash on Delivery (COD) across all 64 districts in Bangladesh. Customers are invited
          to inspect the package at the time of delivery before handing the payment to the courier rider.
        </p>

        <h3 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '10px' }} id="returns">
          2. 7-Day Size Exchange Policy
        </h3>
        <p style={{ marginBottom: '20px' }}>
          If a size does not fit, you can exchange the item within 7 days of receiving the order. The piece must be
          unworn, unwashed, and in its original packaging with all tags attached. Delivery charges for exchanges apply.
        </p>

        <h3 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '10px' }}>3. Order Verification</h3>
        <p style={{ marginBottom: '20px' }}>
          All Cash on Delivery orders placed on the website may be subject to a quick phone confirmation from our Uttara
          counter staff (09638-044440) prior to dispatch.
        </p>

        <h3 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '10px' }}>4. Physical Store Visits</h3>
        <p style={{ marginBottom: '24px' }}>
          You are always welcome to exchange or purchase directly at our counter:
          <br />
          <strong>Shop # 6, Basement, Uttara Square Shopping Mall, Sector 13, Uttara, Dhaka</strong>
        </p>

        <Link href="/shop" className="btn btn-primary">
          Continue Shopping &rarr;
        </Link>
      </div>
    </div>
  );
}
