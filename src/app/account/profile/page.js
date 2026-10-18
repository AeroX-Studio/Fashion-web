import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, get } from '@/lib/db';

export const revalidate = 0;

export default async function AccountProfilePage() {
  await initDatabase();
  const session = await getServerSession(authOptions);

  const userId = session?.user?.id;
  const user = get('SELECT id, name, email, phone, created_at FROM users WHERE id = ?', [userId]);

  return (
    <div className="data-card">
      <div className="data-card-header">
        <h1 style={{ fontSize: '20px', color: 'var(--navy)' }}>Profile Information</h1>
      </div>

      <div style={{ padding: '24px', maxWidth: '500px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Full Name
            </label>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy)' }}>{user?.name}</div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Phone Number
            </label>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--navy)', fontFamily: 'var(--font-mono)' }}>
              {user?.phone || 'Not provided'}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Email Address
            </label>
            <div style={{ fontSize: '15px', color: 'var(--navy)' }}>{user?.email || 'Not provided'}</div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Member Since
            </label>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
