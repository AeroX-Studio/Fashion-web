import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, get, all } from '@/lib/db';

export const revalidate = 0;

export default async function OrderDetailPage({ params }) {
  await initDatabase();
  const session = await getServerSession(authOptions);

  const orderId = params.id;
  const order = get('SELECT * FROM orders WHERE id = ?', [orderId]);

  if (!order) {
    notFound();
  }

  // Security check: ensure user owns order unless admin
  if (session?.user?.userType !== 'admin' && String(order.user_id) !== String(session?.user?.id)) {
    return <div>Unauthorized access to this order.</div>;
  }

  const items = all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  const invoice = get('SELECT * FROM invoices WHERE order_id = ?', [order.id]);
  const timeline = all('SELECT * FROM order_timeline WHERE order_id = ? ORDER BY id ASC', [order.id]);

  const statuses = [
    { key: 'pending', label: 'Order Placed', icon: 'ri-file-list-3-line' },
    { key: 'confirmed', label: 'Confirmed', icon: 'ri-checkbox-circle-line' },
    { key: 'processing', label: 'Processing', icon: 'ri-loader-2-line' },
    { key: 'packed', label: 'Packed', icon: 'ri-archive-line' },
    { key: 'shipped', label: 'Shipped', icon: 'ri-truck-line' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'ri-e-bike-2-line' },
    { key: 'delivered', label: 'Delivered', icon: 'ri-home-smile-line' },
  ];

  const currentIdx = statuses.findIndex((s) => s.key === order.order_status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar */}
      <div className="data-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Order ID</div>
          <h1 style={{ fontSize: '22px', color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>
            {order.order_number}
          </h1>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Placed on {new Date(order.created_at).toLocaleString()}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {invoice && (
            <Link href={`/account/invoices/${invoice.id}`} className="btn btn-primary btn-sm">
              <i className="ri-bill-line"></i> View Invoice
            </Link>
          )}
          <Link href="/account/orders" className="btn btn-secondary btn-sm">
            &larr; Back to Orders
          </Link>
        </div>
      </div>

      {/* Interactive Delivery Status Timeline */}
      <div className="data-card" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '16px', color: 'var(--navy)', marginBottom: '20px' }}>
          <i className="ri-map-pin-time-line" style={{ color: 'var(--primary)' }}></i> Order Status & Delivery Progress
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', paddingBottom: '12px' }}>
          {statuses.map((st, idx) => {
            const isCompleted = idx <= (currentIdx >= 0 ? currentIdx : 0);
            const isCurrent = idx === currentIdx;

            return (
              <div
                key={st.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '90px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: isCompleted ? 'var(--primary)' : 'var(--border)',
                    color: isCompleted ? '#fff' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    marginBottom: '8px',
                    boxShadow: isCurrent ? '0 0 0 4px var(--primary-wash)' : 'none',
                  }}
                >
                  <i className={st.icon}></i>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: isCompleted ? 700 : 500,
                    color: isCompleted ? 'var(--navy)' : 'var(--text-muted)',
                  }}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Timeline Log Notes */}
        {timeline.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
              Activity Log
            </span>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {timeline.map((t) => (
                <li key={t.id} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-body)' }}>
                  <i className="ri-checkbox-circle-fill" style={{ color: 'var(--success)', fontSize: '14px' }}></i>
                  <span>{t.note || `Status updated to ${t.status}`}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Shipping Details */}
        <div className="data-card" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '15px', color: 'var(--navy)', marginBottom: '12px' }}>
            <i className="ri-map-pin-line" style={{ color: 'var(--primary)' }}></i> Shipping Address
          </h4>
          <div style={{ fontSize: '13.5px', lineHeight: 1.6 }}>
            <strong>{order.shipping_name}</strong>
            <div>Phone: {order.shipping_phone}</div>
            <div style={{ marginTop: '4px' }}>{order.shipping_address}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Zone: {order.shipping_zone === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}
            </div>
          </div>
        </div>

        {/* Payment & Summary */}
        <div className="data-card" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '15px', color: 'var(--navy)', marginBottom: '12px' }}>
            <i className="ri-wallet-3-line" style={{ color: 'var(--primary)' }}></i> Payment Summary
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
              <strong>Cash on Delivery (COD)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Payment Status:</span>
              <span className={`status-pill status-${order.payment_status}`}>{order.payment_status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>৳{order.subtotal?.toLocaleString('en-BD')}</span>
            </div>
            {order.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                <span>Discount:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>-৳{order.discount?.toLocaleString('en-BD')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Delivery Charge:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>৳{order.delivery_charge}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid var(--border)',
                fontWeight: 800,
                fontSize: '16px',
                color: 'var(--primary)',
              }}
            >
              <span>Total Payable:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>৳{order.total?.toLocaleString('en-BD')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="data-card">
        <div className="data-card-header">
          <strong>Items in this Order ({items.length})</strong>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Size</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={it.product_image || '/placeholder.jpg'}
                        alt={it.product_name}
                        style={{ width: '44px', height: '54px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <div>
                        <strong style={{ color: 'var(--navy)' }}>{it.product_name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SKU: {it.product_sku}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{it.size_name || 'Free'}</span>
                  </td>
                  <td>{it.quantity}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>৳{it.price?.toLocaleString('en-BD')}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                    ৳{it.total?.toLocaleString('en-BD')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
