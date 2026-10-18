import React from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, all } from '@/lib/db';

export const revalidate = 0;

export default async function AccountOrdersPage() {
  await initDatabase();
  const session = await getServerSession(authOptions);

  const userId = session?.user?.id;
  const orders = all('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [userId]);

  return (
    <div className="data-card">
      <div className="data-card-header">
        <h1 style={{ fontSize: '20px', color: 'var(--navy)' }}>My Orders ({orders.length})</h1>
      </div>

      {orders.length === 0 ? (
        <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <i className="ri-file-list-3-line" style={{ fontSize: '48px', color: 'var(--text-light)', display: 'block', marginBottom: '12px' }}></i>
          <h3 style={{ fontSize: '18px', color: 'var(--navy)', marginBottom: '8px' }}>No orders found</h3>
          <p style={{ fontSize: '13.5px', marginBottom: '20px' }}>Your placed orders will appear here.</p>
          <Link href="/shop" className="btn btn-primary btn-sm">
            Explore Collection
          </Link>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Order Date</th>
                <th>Payment</th>
                <th>Delivery Status</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => (
                <tr key={ord.id}>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{ord.order_number}</strong>
                  </td>
                  <td>{new Date(ord.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className="status-pill status-confirmed">Cash on Delivery</span>
                  </td>
                  <td>
                    <span className={`status-pill status-${ord.order_status}`}>
                      {ord.order_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                    ৳{ord.total?.toLocaleString('en-BD')}
                  </td>
                  <td>
                    <Link href={`/account/orders/${ord.id}`} className="btn btn-primary btn-sm">
                      Track & View &rarr;
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
