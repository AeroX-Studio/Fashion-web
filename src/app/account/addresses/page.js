import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, all } from '@/lib/db';

export const revalidate = 0;

export default async function AccountAddressesPage() {
  await initDatabase();
  const session = await getServerSession(authOptions);

  const userId = session?.user?.id;
  const addresses = all('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC', [userId]);

  return (
    <div className="data-card">
      <div className="data-card-header">
        <h1 style={{ fontSize: '20px', color: 'var(--navy)' }}>Saved Delivery Addresses</h1>
      </div>

      <div style={{ padding: '24px' }}>
        {addresses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <i className="ri-map-pin-line" style={{ fontSize: '48px', color: 'var(--text-light)', display: 'block', marginBottom: '12px' }}></i>
            <h3 style={{ fontSize: '16px', color: 'var(--navy)', marginBottom: '6px' }}>No saved addresses</h3>
            <p style={{ fontSize: '13px' }}>Your address will be automatically saved when you place an order.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {addresses.map((addr) => (
              <div
                key={addr.id}
                style={{
                  border: addr.is_default ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '18px',
                  background: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '14px', color: 'var(--navy)' }}>{addr.label || 'Home'}</strong>
                  {addr.is_default === 1 && (
                    <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      Default
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13.5px', lineHeight: 1.6 }}>
                  <div>Name: <strong>{addr.name}</strong></div>
                  <div>Phone: {addr.phone}</div>
                  <div style={{ color: 'var(--text-body)', marginTop: '4px' }}>{addr.address}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{addr.city || 'Dhaka'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
