import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, get, all } from '@/lib/db';
import { InvoicePrintButton } from './InvoicePrintButton';

export const revalidate = 0;

export default async function InvoiceDetailPage({ params }) {
  await initDatabase();
  const session = await getServerSession(authOptions);

  const invoice = get('SELECT * FROM invoices WHERE id = ?', [params.id]);
  if (!invoice) {
    notFound();
  }

  // Permission check
  if (session?.user?.userType !== 'admin' && String(invoice.user_id) !== String(session?.user?.id)) {
    return <div>Unauthorized access to this invoice.</div>;
  }

  const order = get('SELECT * FROM orders WHERE id = ?', [invoice.order_id]);
  const items = all('SELECT * FROM order_items WHERE order_id = ?', [invoice.order_id]);

  let invoiceData = {};
  try {
    invoiceData = JSON.parse(invoice.invoice_data || '{}');
  } catch (e) {
    invoiceData = {};
  }

  return (
    <div>
      {/* Top Action Bar (hidden on print) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          padding: '16px 20px',
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid var(--border)',
        }}
      >
        <Link href="/account/invoices" className="btn btn-secondary btn-sm">
          &larr; Back to Invoices
        </Link>

        <div style={{ display: 'flex', gap: '10px' }}>
          <InvoicePrintButton />
        </div>
      </div>

      {/* Printable Invoice Paper */}
      <div
        className="invoice-paper"
        style={{
          background: '#fff',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          padding: '48px',
          boxShadow: 'var(--shadow-md)',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        {/* Invoice Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--primary)', paddingBottom: '24px', marginBottom: '28px' }}>
          <div>
            <Image
              src="/logo.jpg"
              alt="Nobo Fashion"
              width={100}
              height={100}
              style={{ height: '76px', width: '76px', objectFit: 'contain', marginBottom: '8px' }}
            />
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Shop # 6, Basement, Uttara Square Shopping Mall,<br />
              Sonargaon Janapath, Sector 13, Uttara, Dhaka<br />
              Phone: 09638-044440 • Email: info@nobofashion.com
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '28px', color: 'var(--primary)', letterSpacing: '0.05em', marginBottom: '4px' }}>
              INVOICE
            </h2>
            <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--navy)' }}>
              {invoice.invoice_number}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Date: {new Date(invoice.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Order Reference: <strong style={{ fontFamily: 'var(--font-mono)' }}>{order?.order_number}</strong>
            </div>
          </div>
        </div>

        {/* Bill To & Payment Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Billed To:
            </span>
            <div style={{ fontSize: '14px', lineHeight: 1.6 }}>
              <strong style={{ fontSize: '15px', color: 'var(--navy)' }}>{order?.shipping_name}</strong>
              <div>Phone: {order?.shipping_phone}</div>
              <div style={{ color: 'var(--text-body)' }}>{order?.shipping_address}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{order?.shipping_city}</div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Payment Information:
            </span>
            <div style={{ fontSize: '13.5px', lineHeight: 1.6 }}>
              <div>Method: <strong>Cash on Delivery (COD)</strong></div>
              <div>Status: <span style={{ fontWeight: 700, color: 'var(--warning)' }}>Pending Courier Handover</span></div>
              <div>Delivery Zone: <strong>{order?.shipping_zone === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}</strong></div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div style={{ marginBottom: '28px' }}>
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: 'var(--navy)', color: '#fff' }}>
                <th style={{ color: '#fff' }}>Item Description</th>
                <th style={{ color: '#fff', textAlign: 'center' }}>Size</th>
                <th style={{ color: '#fff', textAlign: 'center' }}>Qty</th>
                <th style={{ color: '#fff', textAlign: 'right' }}>Unit Price</th>
                <th style={{ color: '#fff', textAlign: 'right' }}>Total (BDT)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id || idx}>
                  <td>
                    <strong>{it.product_name}</strong>
                    {it.product_sku && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SKU: {it.product_sku}</div>}
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {it.size_name || 'Free'}
                  </td>
                  <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    ৳{it.price?.toLocaleString('en-BD')}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    ৳{it.total?.toLocaleString('en-BD')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '36px' }}>
          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>৳{invoice.subtotal?.toLocaleString('en-BD')}</span>
            </div>

            {invoice.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                <span>Discount:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>-৳{invoice.discount?.toLocaleString('en-BD')}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Delivery Fee:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>৳{invoice.delivery_charge}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '2px solid var(--primary)',
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--primary)',
              }}
            >
              <span>Amount Due (COD):</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>৳{invoice.total?.toLocaleString('en-BD')}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer / Terms */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <strong>Important Customer Notice:</strong>
          <div>1. Please hand the exact cash amount of ৳{invoice.total?.toLocaleString('en-BD')} to the delivery courier.</div>
          <div>2. For any size exchange or quality concerns, contact Nobo Fashion customer support within 7 days.</div>
          <div>3. Customer Hotline: 09638-044440 • Complaints: 01800033220</div>
        </div>
      </div>
    </div>
  );
}
