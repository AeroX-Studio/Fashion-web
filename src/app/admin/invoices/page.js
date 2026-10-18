import React from 'react';
import Link from 'next/link';
import { initDatabase, all } from '@/lib/db';

export const revalidate = 0;

export default async function AdminInvoicesPage({ searchParams }) {
  await initDatabase();

  const q = searchParams.q || '';
  let sql = `
    SELECT i.*, o.order_number, o.shipping_name, o.shipping_phone
    FROM invoices i
    JOIN orders o ON i.order_id = o.id
    WHERE 1=1
  `;
  const params = [];

  if (q) {
    sql += ` AND (i.invoice_number LIKE ? OR o.order_number LIKE ? OR o.shipping_phone LIKE ? OR o.shipping_name LIKE ?)`;
    const p = `%${q}%`;
    params.push(p, p, p, p);
  }

  sql += ` ORDER BY i.id DESC`;

  const invoices = all(sql, params);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', color: 'var(--navy)' }}>Invoices Management</h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
          Browse, print, and export automatically generated order invoices
        </p>
      </div>

      <div className="data-card" style={{ padding: '16px 20px' }}>
        <form method="GET" style={{ display: 'flex', gap: '10px', maxWidth: '440px' }}>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search Invoice # (e.g. INV-PC-2026-000001), phone, or name..."
            style={{
              flex: 1,
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1.5px solid var(--border-dark)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            Search
          </button>
        </form>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <strong>Invoices ({invoices.length})</strong>
        </div>

        {invoices.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No invoices found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Order Ref</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                  <th>Payment Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{inv.invoice_number}</strong>
                    </td>
                    <td>
                      <Link href={`/admin/orders/${inv.order_id}`} style={{ color: 'var(--primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {inv.order_number}
                      </Link>
                    </td>
                    <td>
                      <div><strong>{inv.shipping_name}</strong></div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{inv.shipping_phone}</div>
                    </td>
                    <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                      ৳{inv.total?.toLocaleString('en-BD')}
                    </td>
                    <td>
                      <span className={`status-pill ${inv.payment_status === 'collected' ? 'status-delivered' : 'status-pending'}`}>
                        {inv.payment_status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/account/invoices/${inv.id}`}
                        target="_blank"
                        className="btn btn-primary btn-sm"
                      >
                        <i className="ri-printer-line"></i> View & Print
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
