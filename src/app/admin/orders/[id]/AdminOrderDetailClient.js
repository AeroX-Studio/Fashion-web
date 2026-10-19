'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '@/lib/imageHelper';

export function AdminOrderDetailClient({ order, items, invoice, timeline, customer }) {
  const router = useRouter();

  const [currentStatus, setCurrentStatus] = useState(order.order_status);
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const statuses = [
    { key: 'pending', label: '1. Pending Confirmation' },
    { key: 'confirmed', label: '2. Confirmed via Phone' },
    { key: 'processing', label: '3. Processing / Sourcing' },
    { key: 'packed', label: '4. Packed & Ready' },
    { key: 'shipped', label: '5. Handed over to Courier' },
    { key: 'out_for_delivery', label: '6. Out for Delivery' },
    { key: 'delivered', label: '7. Delivered Successfully' },
    { key: 'cancelled', label: 'X. Cancelled' },
    { key: 'returned', label: 'R. Returned' },
    { key: 'refunded', label: 'Refunded' },
  ];

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/orders/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          newStatus: currentStatus,
          paymentStatus: paymentStatus,
          note: statusNote.trim() || `Status updated to ${currentStatus.replace('_', ' ')}`,
        }),
      });

      if (res.ok) {
        setSuccessMsg('Order status updated successfully!');
        setStatusNote('');
        router.refresh();
      } else {
        alert('Failed to update status.');
      }
    } catch (e) {
      alert('Error updating order.');
    } finally {
      setUpdating(false);
    }
  };

  const waUrl = `https://wa.me/${order.shipping_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hello ${order.shipping_name}! This is Nobo Fashion regarding your Cash on Delivery order #${order.order_number}.`
  )}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div className="data-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Managing Order</div>
          <h1 style={{ fontSize: '24px', color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>
            {order.order_number}
          </h1>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Placed on {new Date(order.created_at).toLocaleString()}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {invoice && (
            <Link
              href={`/account/invoices/${invoice.id}`}
              target="_blank"
              className="btn btn-primary btn-sm"
            >
              <i className="ri-printer-line"></i> View Invoice
            </Link>
          )}

          <Link href="/admin/orders" className="btn btn-secondary btn-sm">
            &larr; Back to Orders
          </Link>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid #A7F3D0', padding: '12px 18px', borderRadius: '8px', fontSize: '13.5px' }}>
          <i className="ri-checkbox-circle-fill"></i> {successMsg}
        </div>
      )}

      {/* Main Grid: Status Manager & Customer Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 0.7fr)', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Status Updater & Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Status Progression Manager Card */}
          <div className="data-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', color: 'var(--navy)', marginBottom: '16px' }}>
              <i className="ri-edit-2-line" style={{ color: 'var(--primary)' }}></i> Update Order & Payment Status
            </h3>

            <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    Order Dispatch Status *
                  </label>
                  <select
                    value={currentStatus}
                    onChange={(e) => setCurrentStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-dark)',
                      fontSize: '13.5px',
                      background: '#fff',
                      outline: 'none',
                    }}
                  >
                    {statuses.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    COD Payment Status *
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-dark)',
                      fontSize: '13.5px',
                      background: '#fff',
                      outline: 'none',
                    }}
                  >
                    <option value="pending">Pending Handover</option>
                    <option value="cod_confirmed">COD Phone Verified</option>
                    <option value="collected">Collected (Cash Handed Over)</option>
                    <option value="failed">Delivery / Payment Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Timeline Activity Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Called customer at 2 PM, confirmed delivery for tomorrow"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-dark)',
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={updating}>
                  {updating ? 'Saving Status...' : 'Update Order Status'}
                </button>
              </div>
            </form>
          </div>

          {/* Items Breakdown */}
          <div className="data-card">
            <div className="data-card-header">
              <strong>Order Items ({items.length})</strong>
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
                            src={getImageUrl(it.product_image)}
                            alt={it.product_name}
                            style={{ width: '44px', height: '54px', objectFit: 'cover', borderRadius: '4px' }}
                          />

                          <div>
                            <strong style={{ color: 'var(--navy)', fontSize: '13.5px' }}>{it.product_name}</strong>
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
                      <td style={{ fontFamily: 'var(--font-mono)' }}>৳{it.price?.toLocaleString('en-BD')}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                        ৳{it.total?.toLocaleString('en-BD')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Footer */}
            <div style={{ padding: '18px 24px', background: 'var(--paper-2)', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>৳{order.subtotal?.toLocaleString('en-BD')}</span>
                </div>
                {order.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                    <span>Discount:</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>-৳{order.discount?.toLocaleString('en-BD')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Delivery ({order.shipping_zone === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}):</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>৳{order.delivery_charge}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1.5px solid var(--border)',
                    fontSize: '16px',
                    fontWeight: 800,
                    color: 'var(--primary)',
                  }}
                >
                  <span>Total Payable:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>৳{order.total?.toLocaleString('en-BD')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Customer Card */}
          <div className="data-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '15px', color: 'var(--navy)', marginBottom: '14px' }}>
              <i className="ri-user-line" style={{ color: 'var(--primary)' }}></i> Customer Information
            </h4>

            <div style={{ fontSize: '13.5px', lineHeight: 1.6 }}>
              <strong style={{ fontSize: '15px', color: 'var(--navy)' }}>{order.shipping_name}</strong>
              <div>
                Phone:{' '}
                <a href={`tel:${order.shipping_phone}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>
                  {order.shipping_phone}
                </a>
              </div>
              <div style={{ color: 'var(--text-body)', marginTop: '6px' }}>{order.shipping_address}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{order.shipping_city}</div>

              {order.notes && (
                <div style={{ marginTop: '10px', padding: '8px 12px', background: 'var(--paper-2)', borderRadius: '6px', fontSize: '12px' }}>
                  <strong>Notes:</strong> {order.notes}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <a
                  href={`tel:${order.shipping_phone}`}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                >
                  <i className="ri-phone-line"></i> Call Customer
                </a>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm"
                  style={{ background: '#25D366', color: '#fff' }}
                >
                  <i className="ri-whatsapp-line"></i> WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="data-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '15px', color: 'var(--navy)', marginBottom: '14px' }}>
              <i className="ri-history-line" style={{ color: 'var(--primary)' }}></i> Order History Timeline
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {timeline.map((t) => (
                <div key={t.id} style={{ display: 'flex', gap: '10px', fontSize: '12.5px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      marginTop: '6px',
                      flexShrink: 0,
                    }}
                  ></div>
                  <div>
                    <strong style={{ color: 'var(--navy)', textTransform: 'capitalize' }}>
                      {t.status.replace('_', ' ')}
                    </strong>
                    <div style={{ color: 'var(--text-body)' }}>{t.note}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {new Date(t.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
