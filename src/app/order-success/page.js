import React from 'react';
import Link from 'next/link';
import { initDatabase, get, all } from '@/lib/db';

export const revalidate = 0;

async function getOrderDetails(orderId, orderNumber) {
  await initDatabase();

  let order = null;
  if (orderId) {
    order = get('SELECT * FROM orders WHERE id = ?', [orderId]);
  } else if (orderNumber) {
    order = get('SELECT * FROM orders WHERE order_number = ?', [orderNumber]);
  }

  if (!order) return null;

  const items = all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  const invoice = get('SELECT * FROM invoices WHERE order_id = ?', [order.id]);
  const timeline = all('SELECT * FROM order_timeline WHERE order_id = ? ORDER BY id ASC', [order.id]);

  return { order, items, invoice, timeline };
}

export default async function OrderSuccessPage({ searchParams }) {
  const { orderId, orderNumber } = searchParams;
  const data = await getOrderDetails(orderId, orderNumber);

  if (!data) {
    return (
      <div className="container sec-pad" style={{ textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
        <h2 style={{ fontSize: '24px', color: 'var(--navy)', marginBottom: '12px' }}>Order Not Found</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          We could not locate this order details.
        </p>
        <Link href="/shop" className="btn btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const { order, items, invoice, timeline } = data;

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
    <div className="container sec-pad" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Success Banner */}
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          padding: '36px 24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--success-bg)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 16px',
          }}
        >
          <i className="ri-check-line"></i>
        </div>

        <h1 style={{ fontSize: '26px', color: 'var(--navy)', marginBottom: '8px' }}>
          Order Confirmed!
        </h1>
        <p style={{ fontSize: '14.5px', color: 'var(--text-muted)', maxWidth: '48ch', margin: '0 auto 20px' }}>
          Thank you for shopping with Nobo Fashion. We will call you shortly to verify your order before dispatch.
        </p>

        <div
          style={{
            display: 'inline-flex',
            gap: '24px',
            background: 'var(--paper-2)',
            padding: '12px 24px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
              Order Number
            </span>
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--navy)', fontSize: '15px' }}>
              {order.order_number}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
              Total Payable (COD)
            </span>
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontSize: '15px' }}>
              ৳{order.total?.toLocaleString('en-BD')}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
              Payment Method
            </span>
            <strong style={{ color: 'var(--navy)', fontSize: '14px' }}>Cash on Delivery</strong>
          </div>
        </div>
      </div>

      {/* Visual Delivery Status Timeline */}
      <div
        className="data-card"
        style={{ padding: '28px', marginBottom: '28px' }}
      >
        <h3 style={{ fontSize: '16px', color: 'var(--navy)', marginBottom: '20px' }}>
          <i className="ri-map-pin-time-line" style={{ color: 'var(--primary)' }}></i> Order Progress Timeline
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', paddingBottom: '10px' }}>
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
      </div>

      {/* Items & Shipping Address Details */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '28px',
        }}
      >
        {/* Shipping Address */}
        <div className="data-card" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '15px', color: 'var(--navy)', marginBottom: '12px' }}>
            <i className="ri-map-pin-line" style={{ color: 'var(--primary)' }}></i> Shipping Address
          </h4>
          <div style={{ fontSize: '13.5px', lineHeight: 1.6 }}>
            <strong>{order.shipping_name}</strong>
            <div>{order.shipping_phone}</div>
            <div style={{ color: 'var(--text-body)', marginTop: '4px' }}>{order.shipping_address}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{order.shipping_city}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="data-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
          {invoice && (
            <Link
              href={`/account/invoices/${invoice.id}`}
              className="btn btn-primary btn-block"
            >
              <i className="ri-bill-line"></i> View & Print Invoice
            </Link>
          )}

          <Link href="/account/orders" className="btn btn-secondary btn-block">
            <i className="ri-file-list-3-line"></i> View in My Orders
          </Link>

          <Link href="/shop" className="btn btn-outline btn-block">
            Continue Shopping &rarr;
          </Link>
        </div>
      </div>

      {/* Order Items List */}
      <div className="data-card">
        <div className="data-card-header">
          <strong>Order Items ({items.length})</strong>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Size</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={it.product_image || '/placeholder.jpg'}
                        alt={it.product_name}
                        style={{ width: '40px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{it.product_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SKU: {it.product_sku}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {it.size_name || 'Free'}
                    </span>
                  </td>
                  <td>{it.quantity}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>৳{it.price.toLocaleString('en-BD')}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                    ৳{it.total.toLocaleString('en-BD')}
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
