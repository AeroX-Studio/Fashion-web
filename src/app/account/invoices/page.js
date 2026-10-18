import React from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, all } from '@/lib/db';

export const revalidate = 0;

export default async function AccountInvoicesPage() {
  await initDatabase();
  const session = await getServerSession(authOptions);

  const userId = session?.user?.id;
  const invoices = all('SELECT * FROM invoices WHERE user_id = ? ORDER BY id DESC', [userId]);

  return (
    <div className="data-card">
      <div className="data-card-header">
        <h1 style={{ fontSize: '20px', color: 'var(--navy)' }}>My Invoices ({invoices.length})</h1>
      </div>

      {invoices.length === 0 ? (
        <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <i className="ri-bill-line" style={{ fontSize: '48px', color: 'var(--text-light)', display: 'block', marginBottom: '12px' }}></i>
          <h3 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '8px' }}>No invoices generated yet</h3>
          <p style={{ fontSize: '13.5px', marginBottom: '20px' }}>Invoices are automatically generated when you place orders.</p>
          <Link href="/shop" className="btn btn-primary btn-sm">
            Browse Store
          </Link>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Created Date</th>
                <th>Payment Mode</th>
                <th>Total Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{inv.invoice_number}</strong>
                  </td>
                  <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className="status-pill status-confirmed">Cash on Delivery</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                    ৳{inv.total?.toLocaleString('en-BD')}
                  </td>
                  <td>
                    <Link href={`/account/invoices/${inv.id}`} className="btn btn-primary btn-sm">
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
  );
}
