'use client';

import React, { useState, useEffect } from 'react';
import { ImageUploader } from '@/components/admin/ImageUploader';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    store_name: '',
    store_tagline: '',
    store_logo: '/logo.jpg',
    store_favicon: '/favicon.png',
    store_phone: '',
    store_phone_complaints: '',
    store_email: '',
    store_address: '',
    store_whatsapp: '',
    delivery_dhaka: '80',
    delivery_outside_dhaka: '150',
    free_delivery_threshold: '0',
    meta_title: '',
    meta_description: '',
  });


  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === 'object') {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert('Failed to save settings.');
      }
    } catch (e) {
      alert('Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading store settings...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', color: 'var(--navy)' }}>Store & Delivery Configuration</h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
          Manage Nobo Fashion store details, phone numbers, and Cash on Delivery charges
        </p>
      </div>

      {savedSuccess && (
        <div style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid #A7F3D0', padding: '12px 18px', borderRadius: '8px', fontSize: '13.5px' }}>
          <i className="ri-checkbox-circle-fill"></i> Store settings updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Card 1: Store Information */}
        <div className="data-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--navy)', marginBottom: '16px' }}>
            Store Profile & Contact Numbers
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Store Name
              </label>
              <input
                type="text"
                name="store_name"
                value={settings.store_name}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-dark)', fontSize: '13.5px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Tagline
              </label>
              <input
                type="text"
                name="store_tagline"
                value={settings.store_tagline}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-dark)', fontSize: '13.5px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Customer Hotline Phones
              </label>
              <input
                type="text"
                name="store_phone"
                value={settings.store_phone}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-dark)', fontSize: '13.5px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                WhatsApp Number
              </label>
              <input
                type="text"
                name="store_whatsapp"
                value={settings.store_whatsapp}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-dark)', fontSize: '13.5px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              Physical Store Address
            </label>
            <input
              type="text"
              name="store_address"
              value={settings.store_address}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-dark)', fontSize: '13.5px', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              Support Email
            </label>
            <input
              type="email"
              name="store_email"
              value={settings.store_email}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-dark)', fontSize: '13.5px', outline: 'none' }}
            />
          </div>

          <div>
            <ImageUploader
              label="Store Logo (Saved to data/images)"
              currentImage={settings.store_logo}
              onImageChange={(url) => setSettings((prev) => ({ ...prev, store_logo: url }))}
            />
          </div>
        </div>


        {/* Card 2: Cash On Delivery Charges */}
        <div className="data-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--navy)', marginBottom: '16px' }}>
            Cash On Delivery Charges (BDT)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Inside Dhaka Charge (৳)
              </label>
              <input
                type="number"
                name="delivery_dhaka"
                value={settings.delivery_dhaka}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-dark)', fontSize: '14px', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Outside Dhaka Charge (৳)
              </label>
              <input
                type="number"
                name="delivery_outside_dhaka"
                value={settings.delivery_outside_dhaka}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-dark)', fontSize: '14px', fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: SEO Meta Defaults */}
        <div className="data-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--navy)', marginBottom: '16px' }}>
            SEO Defaults
          </h3>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              Meta Title
            </label>
            <input
              type="text"
              name="meta_title"
              value={settings.meta_title}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-dark)', fontSize: '13.5px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              Meta Description
            </label>
            <textarea
              rows="3"
              name="meta_description"
              value={settings.meta_description}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-dark)', fontSize: '13.5px', outline: 'none' }}
            ></textarea>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
