'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useUI } from '@/context/UIContext';

export default function AccountLayout({ children }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { setIsChatOpen } = useUI();

  const navItems = [
    { label: 'Overview', href: '/account', icon: 'ri-dashboard-line' },
    { label: 'My Orders', href: '/account/orders', icon: 'ri-file-list-3-line' },
    { label: 'My Invoices', href: '/account/invoices', icon: 'ri-bill-line' },
    { label: 'My Wishlist', href: '/account/wishlist', icon: 'ri-heart-line' },
    { label: 'Saved Addresses', href: '/account/addresses', icon: 'ri-map-pin-line' },
    { label: 'Profile Settings', href: '/account/profile', icon: 'ri-user-settings-line' },
  ];

  return (
    <div className="container sec-pad">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '32px',
          alignItems: 'start',
        }}
      >
        {/* Account Sidebar */}
        <aside className="data-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 700,
              }}
            >
              {session?.user?.name ? session.user.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--navy)' }}>
                {session?.user?.name || 'Customer'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {session?.user?.phone || session?.user?.email || 'Nobo Customer'}
              </div>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius)',
                  fontSize: '13.5px',
                  fontWeight: pathname === it.href ? 700 : 500,
                  color: pathname === it.href ? 'var(--primary)' : 'var(--text-body)',
                  background: pathname === it.href ? 'var(--primary-wash)' : 'transparent',
                }}
              >
                <i className={it.icon} style={{ fontSize: '16px' }}></i>
                <span>{it.label}</span>
              </Link>
            ))}

            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                fontSize: '13.5px',
                fontWeight: 500,
                color: 'var(--accent)',
                textAlign: 'left',
              }}
            >
              <i className="ri-customer-service-2-line" style={{ fontSize: '16px' }}></i>
              <span>Live Support Chat</span>
            </button>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                fontSize: '13.5px',
                fontWeight: 500,
                color: 'var(--danger)',
                borderTop: '1px solid var(--border-light)',
                marginTop: '10px',
                paddingTop: '14px',
                textAlign: 'left',
              }}
            >
              <i className="ri-logout-box-r-line" style={{ fontSize: '16px' }}></i>
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Account Content Area */}
        <main>{children}</main>
      </div>
    </div>
  );
}
