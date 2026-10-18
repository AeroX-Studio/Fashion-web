import React from 'react';
import Link from 'next/link';
import { initDatabase, all, get } from '@/lib/db';

export const revalidate = 0;

async function getDashboardData() {
  await initDatabase();

  const totalSales = get("SELECT SUM(total) AS sum FROM orders WHERE order_status != 'cancelled'");
  const totalOrders = get('SELECT COUNT(id) AS count FROM orders');
  const pendingOrders = get("SELECT COUNT(id) AS count FROM orders WHERE order_status = 'pending'");
  const totalCustomers = get("SELECT COUNT(id) AS count FROM users WHERE user_type = 'customer'");
  const totalProducts = get('SELECT COUNT(id) AS count FROM products WHERE is_active = 1');
  const lowStock = get('SELECT COUNT(id) AS count FROM products WHERE stock <= low_stock_threshold AND is_active = 1');

  const recentOrders = all(`
    SELECT o.*, u.name AS user_name
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    ORDER BY o.id DESC
    LIMIT 8
  `);

  const topProducts = all(`
    SELECT p.*, c.name AS category_name,
           (SELECT url FROM product_images WHERE product_id = p.id LIMIT 1) AS image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
    ORDER BY p.total_sold DESC, p.id DESC
    LIMIT 5
  `);

  return {
    revenue: totalSales?.sum || 0,
    totalOrders: totalOrders?.count || 0,
    pendingOrders: pendingOrders?.count || 0,
    totalCustomers: totalCustomers?.count || 0,
    totalProducts: totalProducts?.count || 0,
    lowStock: lowStock?.count || 0,
    recentOrders,
    topProducts,
  };
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: 'var(--navy)' }}>Dashboard Overview</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Real-time business performance & order metrics for Nobo Fashion
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            <i className="ri-add-line"></i> Add New Product
          </Link>
          <Link href="/admin/orders" className="btn btn-secondary btn-sm">
            <i className="ri-shopping-cart-line"></i> View Orders
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Total Revenue (COD)</div>
            <div className="kpi-val" style={{ color: 'var(--primary)' }}>
              ৳{data.revenue.toLocaleString('en-BD')}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--success)' }}>
              <i className="ri-arrow-up-line"></i> Verified orders
            </span>
          </div>
          <div className="kpi-icon" style={{ background: 'var(--primary-wash)', color: 'var(--primary)' }}>
            <i className="ri-money-dollar-circle-line"></i>
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Total Orders</div>
            <div className="kpi-val">{data.totalOrders}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {data.pendingOrders} pending confirmation
            </span>
          </div>
          <div className="kpi-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
            <i className="ri-shopping-bag-3-line"></i>
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Active Catalog</div>
            <div className="kpi-val">{data.totalProducts}</div>
            <span style={{ fontSize: '11px', color: data.lowStock > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {data.lowStock > 0 ? `${data.lowStock} items low in stock` : 'Healthy stock levels'}
            </span>
          </div>
          <div className="kpi-icon" style={{ background: 'var(--accent-wash)', color: 'var(--accent)' }}>
            <i className="ri-t-shirt-line"></i>
          </div>
        </div>

        <div className="kpi-card">
          <div>
            <div className="kpi-label">Customers</div>
            <div className="kpi-val">{data.totalCustomers}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered accounts</span>
          </div>
          <div className="kpi-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <i className="ri-user-heart-line"></i>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Orders & Top Selling Products */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 0.8fr)', gap: '24px', alignItems: 'start' }}>
        {/* Recent Orders Table */}
        <div className="data-card">
          <div className="data-card-header">
            <h3 style={{ fontSize: '16px', color: 'var(--navy)' }}>Recent Orders</h3>
            <Link href="/admin/orders" className="btn btn-outline btn-sm">
              All Orders &rarr;
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No orders placed yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Zone</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>{ord.order_number}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div><strong>{ord.shipping_name}</strong></div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ord.shipping_phone}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px' }}>
                          {ord.shipping_zone === 'dhaka' ? 'Dhaka' : 'Outside'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                        ৳{ord.total?.toLocaleString('en-BD')}
                      </td>
                      <td>
                        <span className={`status-pill status-${ord.order_status}`}>
                          {ord.order_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <Link href={`/admin/orders/${ord.id}`} className="btn btn-secondary btn-sm">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="data-card">
          <div className="data-card-header">
            <h3 style={{ fontSize: '16px', color: 'var(--navy)' }}>Top Selling Products</h3>
          </div>

          <div style={{ padding: '16px' }}>
            {data.topProducts.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  paddingBottom: '12px',
                  marginBottom: '12px',
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                <img
                  src={p.image || '/placeholder.jpg'}
                  alt={p.name}
                  style={{ width: '44px', height: '54px', objectFit: 'cover', borderRadius: '6px' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.category_name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)', fontSize: '13px' }}>
                    ৳{(p.sale_price || p.price)?.toLocaleString('en-BD')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', background: 'var(--paper-2)', padding: '3px 8px', borderRadius: '4px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {p.stock} in stock
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
