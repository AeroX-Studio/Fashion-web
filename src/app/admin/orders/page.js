import React from 'react';
import Link from 'next/link';
import { initDatabase, all, get } from '@/lib/db';

export const revalidate = 0;

export default async function AdminOrdersPage({ searchParams }) {
  await initDatabase();

  const statusFilter = searchParams.status || '';
  const search = searchParams.q || '';

  let sql = `
    SELECT o.*, u.name AS user_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (statusFilter) {
    sql += ` AND o.order_status = ?`;
    params.push(statusFilter);
  }

  if (search) {
    sql += ` AND (o.order_number LIKE ? OR o.shipping_phone LIKE ? OR o.shipping_name LIKE ?)`;
    const p = `%${search}%`;
    params.push(p, p, p);
  }

  sql += ` ORDER BY o.id DESC`;

  const orders = all(sql, params);

  // Status counters
  const counts = {
    all: get('SELECT COUNT(id) AS count FROM orders')?.count || 0,
    pending: get("SELECT COUNT(id) AS count FROM orders WHERE order_status = 'pending'")?.count || 0,
    confirmed: get("SELECT COUNT(id) AS count FROM orders WHERE order_status = 'confirmed'")?.count || 0,
    processing: get("SELECT COUNT(id) AS count FROM orders WHERE order_status = 'processing'")?.count || 0,
    shipped: get("SELECT COUNT(id) AS count FROM orders WHERE order_status = 'shipped'")?.count || 0,
    delivered: get("SELECT COUNT(id) AS count FROM orders WHERE order_status = 'delivered'")?.count || 0,
    cancelled: get("SELECT COUNT(id) AS count FROM orders WHERE order_status = 'cancelled'")?.count || 0,
  };

  const statusTabs = [
    { key: '', label: 'All Orders', count: counts.all },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'confirmed', label: 'Confirmed', count: counts.confirmed },
    { key: 'processing', label: 'Processing', count: counts.processing },
    { key: 'shipped', label: 'Shipped', count: counts.shipped },
    { key: 'delivered', label: 'Delivered', count: counts.delivered },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', color: 'var(--navy)' }}>Orders Management (COD)</h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
          Review Cash on Delivery orders, verify by phone, and update dispatch tracking
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="data-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
          {statusTabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/admin/orders${tab.key ? `?status=${tab.key}` : ''}`}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: statusFilter === tab.key ? 700 : 500,
                background: statusFilter === tab.key ? 'var(--primary-wash)' : 'transparent',
                color: statusFilter === tab.key ? 'var(--primary)' : 'var(--text-body)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{tab.label}</span>
              <span style={{ fontSize: '11px', background: 'var(--paper-2)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                {tab.count}
              </span>
            </Link>
          ))}
        </div>

        <form method="GET" style={{ display: 'flex', gap: '10px', maxWidth: '480px' }}>
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search Order # (e.g. PC-2026-000001), phone, or customer name..."
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

      {/* Orders Table */}
      <div className="data-card">
        <div className="data-card-header">
          <strong>Orders List ({orders.length})</strong>
        </div>

        {orders.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No orders found matching this filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer Info</th>
                  <th>Delivery Address</th>
                  <th>Zone</th>
                  <th>Amount (COD)</th>
                  <th>Order Status</th>
                  <th>Payment Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => (
                  <tr key={ord.id}>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{ord.order_number}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(ord.created_at).toLocaleDateString()} {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td>
                      <strong style={{ color: 'var(--navy)' }}>{ord.shipping_name}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        <a href={`tel:${ord.shipping_phone}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                          <i className="ri-phone-line"></i> {ord.shipping_phone}
                        </a>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '12.5px', maxWidth: '240px', lineHeight: 1.4 }}>
                        {ord.shipping_address}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '12px' }}>
                        {ord.shipping_zone === 'dhaka' ? 'Inside Dhaka (৳80)' : 'Outside Dhaka (৳150)'}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)', fontSize: '14.5px' }}>
                        ৳{ord.total?.toLocaleString('en-BD')}
                      </span>
                    </td>

                    <td>
                      <span className={`status-pill status-${ord.order_status}`}>
                        {ord.order_status.replace('_', ' ')}
                      </span>
                    </td>

                    <td>
                      <span className={`status-pill ${ord.payment_status === 'collected' ? 'status-delivered' : 'status-pending'}`}>
                        {ord.payment_status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/admin/orders/${ord.id}`} className="btn btn-primary btn-sm">
                        Manage &rarr;
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
