import React from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, all, get } from '@/lib/db';

export const revalidate = 0;

export default async function AccountOverviewPage() {
  await initDatabase();
  const session = await getServerSession(authOptions);

  const userId = session?.user?.id;
  if (!userId) {
    return <div>Please sign in to view your account.</div>;
  }

  // Get orders summary
  const orders = all('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 5', [userId]);
  const orderCountRes = get('SELECT COUNT(id) AS count, SUM(total) AS total_spent FROM orders WHERE user_id = ?', [userId]);
  const invoiceCountRes = get('SELECT COUNT(id) AS count FROM invoices WHERE user_id = ?', [userId]);

  const totalOrders = orderCountRes?.count || 0;
  const totalSpent = orderCountRes?.total_spent || 0;
  const totalInvoices = invoiceCountRes?.count || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--navy) 0%, var(--primary) 100%)',
          color: '#fff',
          borderRadius: '16px',
          padding: '28px 32px',
        }}
      >
        <h1 style={{ fontSize: '24px', color: '#fff', marginBottom: '6px' }}>
          Welcome back, {session.user.name}!
        </h1>
        <p style={{ fontSize: '13.5px', opacity: 0.9 }}>
          From your account dashboard, you can view your recent orders, manage shipping addresses, and download invoices.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Total Orders</div>
            <div className="kpi-val">{totalOrders}</div>
          </div>
          <div className="kpi-icon" style={{ background: 'var(--primary-wash)', color: 'var(--primary)' }}>
            <i className="ri-file-list-3-line"></i>
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Total Spent (COD)</div>
            <div className="kpi-val">৳{totalSpent.toLocaleString('en-BD')}</div>
          </div>
          <div className="kpi-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <i className="ri-money-dollar-circle-line"></i>
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Generated Invoices</div>
            <div className="kpi-val">{totalInvoices}</div>
          </div>
          <div className="kpi-icon" style={{ background: 'var(--accent-wash)', color: 'var(--accent)' }}>
            <i className="ri-bill-line"></i>
          </div>
        </div>
      </div>

      {/* Recent Orders Card */}
      <div className="data-card">
        <div className="data-card-header">
          <h3 style={{ fontSize: '16px', color: 'var(--navy)' }}>Recent Orders</h3>
          <Link href="/account/orders" className="btn btn-outline btn-sm">
            View All Orders &rarr;
          </Link>
        </div>

        {orders.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '14px', marginBottom: '16px' }}>You have not placed any orders yet.</p>
            <Link href="/shop" className="btn btn-primary btn-sm">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => (
                  <tr key={ord.id}>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{ord.order_number}</strong>
                    </td>
                    <td>{new Date(ord.created_at).toLocaleDateString()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                      ৳{ord.total?.toLocaleString('en-BD')}
                    </td>
                    <td>
                      <span className="status-pill status-confirmed">Cash on Delivery</span>
                    </td>
                    <td>
                      <span className={`status-pill status-${ord.order_status}`}>
                        {ord.order_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <Link href={`/account/orders/${ord.id}`} className="btn btn-secondary btn-sm">
                        Details &rarr;
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
