'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/CartContext';

export function CheckoutPageClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, subtotal, discount, deliveryCharge, deliveryZone, setDeliveryZone, grandTotal, coupon, clearCart } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Dhaka',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-fill from session
  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: session.user.name || prev.name,
        phone: session.user.phone || prev.phone,
        email: session.user.email || prev.email,
      }));
    }
  }, [session]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 11) {
      setErrorMessage('Please enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMessage('Please enter your complete delivery address.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          zone: deliveryZone,
          notes: formData.notes,
          items: items,
          couponCode: coupon?.code || null,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Clear cart
        clearCart();
        // Redirect to success page
        router.push(`/order-success?orderId=${data.orderId}&orderNumber=${data.orderNumber}`);
      } else {
        setErrorMessage(data.error || 'Failed to place order. Please check your information and try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorMessage('Network error occurred. Please check your internet connection.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container sec-pad" style={{ textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
        <h2 style={{ fontSize: '24px', color: 'var(--navy)', marginBottom: '12px' }}>Your bag is empty</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Please add items to your cart before proceeding to checkout.
        </p>
        <Link href="/shop" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container sec-pad">
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <span className="sec-eyebrow">Cash On Delivery</span>
          <h1 style={{ fontSize: '32px', color: 'var(--navy)', marginTop: '4px' }}>Checkout</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Pay cash to the delivery rider after inspecting your piece at your door.
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              border: '1px solid #FECACA',
              padding: '12px 18px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <i className="ri-error-warning-line"></i> {errorMessage}
          </div>
        )}

        <form onSubmit={handlePlaceOrder}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
              gap: '32px',
              alignItems: 'start',
            }}
          >
            {/* Left Column: Customer & Delivery Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Customer Info Card */}
              <div className="data-card" style={{ padding: '24px' }}>
                <h3
                  style={{
                    fontSize: '17px',
                    color: 'var(--navy)',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <i className="ri-user-line" style={{ color: 'var(--primary)' }}></i> Customer Information
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Nusrat Jahan"
                      value={formData.name}
                      onChange={handleChange}
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

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                      Mobile Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="01XXXXXXXXX"
                      value={formData.phone}
                      onChange={handleChange}
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
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="For order & invoice copy"
                    value={formData.email}
                    onChange={handleChange}
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
              </div>

              {/* Delivery Address Card */}
              <div className="data-card" style={{ padding: '24px' }}>
                <h3
                  style={{
                    fontSize: '17px',
                    color: 'var(--navy)',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <i className="ri-map-pin-line" style={{ color: 'var(--primary)' }}></i> Delivery Address
                </h3>

                {/* Delivery Zone Selection */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px' }}>
                    Select Delivery Zone *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div
                      onClick={() => setDeliveryZone('dhaka')}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: deliveryZone === 'dhaka' ? '2px solid var(--primary)' : '1.5px solid var(--border-dark)',
                        background: deliveryZone === 'dhaka' ? 'var(--primary-wash)' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <strong style={{ color: deliveryZone === 'dhaka' ? 'var(--primary)' : 'var(--navy)', display: 'block', fontSize: '13.5px' }}>
                        Inside Dhaka
                      </strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>৳80 • 1–2 business days</span>
                    </div>

                    <div
                      onClick={() => setDeliveryZone('outside_dhaka')}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: deliveryZone === 'outside_dhaka' ? '2px solid var(--primary)' : '1.5px solid var(--border-dark)',
                        background: deliveryZone === 'outside_dhaka' ? 'var(--primary-wash)' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <strong style={{ color: deliveryZone === 'outside_dhaka' ? 'var(--primary)' : 'var(--navy)', display: 'block', fontSize: '13.5px' }}>
                        Outside Dhaka
                      </strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>৳150 • 2–4 business days</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    Full Delivery Address *
                  </label>
                  <textarea
                    name="address"
                    required
                    rows="3"
                    placeholder="House/Apartment #, Road #, Sector/Area, Landmark"
                    value={formData.address}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-dark)',
                      fontSize: '13.5px',
                      outline: 'none',
                    }}
                  ></textarea>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                    Special Delivery Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    name="notes"
                    placeholder="e.g. Call before delivery, deliver in afternoon"
                    value={formData.notes}
                    onChange={handleChange}
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
              </div>

              {/* Payment Method Card */}
              <div className="data-card" style={{ padding: '24px' }}>
                <h3
                  style={{
                    fontSize: '17px',
                    color: 'var(--navy)',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <i className="ri-hand-coin-line" style={{ color: 'var(--primary)' }}></i> Payment Method
                </h3>

                <div
                  style={{
                    background: 'var(--primary-wash)',
                    border: '1.5px solid var(--primary)',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    >
                      ✓
                    </div>
                    <div>
                      <strong style={{ color: 'var(--navy)', fontSize: '14px', display: 'block' }}>
                        Cash on Delivery (COD)
                      </strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Pay when courier delivers the package at your address
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      background: 'var(--primary)',
                      color: '#fff',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}
                  >
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Confirm */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '90px' }}>
              <div className="data-card" style={{ padding: '24px' }}>
                <h3
                  style={{
                    fontSize: '17px',
                    color: 'var(--navy)',
                    marginBottom: '16px',
                    paddingBottom: '10px',
                    borderBottom: '1.5px solid var(--border)',
                  }}
                >
                  Order Summary ({items.length} items)
                </h3>

                {/* Items List Preview */}
                <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '16px' }}>
                  {items.map((it) => (
                    <div
                      key={it.key}
                      style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                        paddingBottom: '10px',
                        marginBottom: '10px',
                        borderBottom: '1px solid var(--border-light)',
                      }}
                    >
                      <img
                        src={it.image}
                        alt={it.name}
                        style={{ width: '40px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {it.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Size: {it.size} &bull; Qty: {it.quantity}
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        ৳{(it.price * it.quantity).toLocaleString('en-BD')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>৳{subtotal.toLocaleString('en-BD')}</span>
                  </div>

                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                      <span>Discount ({coupon?.code})</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>-৳{discount.toLocaleString('en-BD')}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Delivery ({deliveryZone === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>৳{deliveryCharge}</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '1.5px solid var(--border)',
                      fontSize: '18px',
                      fontWeight: 800,
                      color: 'var(--navy)',
                    }}
                  >
                    <span>Grand Total</span>
                    <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                      ৳{grandTotal.toLocaleString('en-BD')}
                    </span>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={isSubmitting}
                  style={{ height: '52px', fontSize: '15px' }}
                >
                  {isSubmitting ? (
                    <>Placing Order...</>
                  ) : (
                    <>
                      <i className="ri-shield-check-fill"></i> PLACE CASH ON DELIVERY ORDER
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  By placing order you agree to our Terms of Service & Exchange policy.
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
