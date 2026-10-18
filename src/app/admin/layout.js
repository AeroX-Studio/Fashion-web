import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { initDatabase, get, all } from '@/lib/db';
import { AdminNavClient } from './AdminNavClient';

export const revalidate = 0;

export default async function AdminLayout({ children }) {
  await initDatabase();
  const session = await getServerSession(authOptions);

  if (!session || session?.user?.userType !== 'admin') {
    redirect('/login?callbackUrl=/admin');
  }

  // Get unread counts
  const unreadChat = get('SELECT SUM(unread_admin) AS count FROM conversations');
  const pendingOrders = get("SELECT COUNT(id) AS count FROM orders WHERE order_status = 'pending'");
  const lowStock = get('SELECT COUNT(id) AS count FROM products WHERE stock <= low_stock_threshold AND is_active = 1');

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <Link href="/admin" className="ox-logo" style={{ textDecoration: 'none' }}>
            <div className="ox-logo-brand">
              <span className="ox-logo-mark">
                <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                  <rect width="40" height="40" rx="8" fill="#791A2C" />
                  <path d="M12 28V12H16.5L23.5 23.5V12H28V28H23.5L16.5 16.5V28H12Z" fill="#FFF" />
                </svg>
              </span>
              <div className="ox-logo-text-group">
                <span className="ox-logo-title" style={{ fontSize: '15px' }}>NOBO</span>
                <span className="ox-logo-sub" style={{ fontSize: '11px' }}>Fashion</span>
              </div>
            </div>
          </Link>
          <span style={{ fontSize: '10px', background: 'var(--primary)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
            ADMIN
          </span>
        </div>

        <AdminNavClient
          unreadChat={unreadChat?.count || 0}
          pendingOrders={pendingOrders?.count || 0}
          lowStock={lowStock?.count || 0}
        />
      </aside>

      {/* Main Admin Section */}
      <div className="admin-main">
        {/* Top bar */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link href="/" target="_blank" className="btn btn-secondary btn-sm">
              <i className="ri-external-link-line"></i> View Live Store
            </Link>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Nobo Fashion Management Console
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/admin/chat" style={{ position: 'relative', fontSize: '20px', color: 'var(--navy)' }}>
              <i className="ri-chat-3-line"></i>
              {(unreadChat?.count || 0) > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -6,
                    background: 'var(--primary)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadChat.count}
                </span>
              )}
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--navy)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                {session?.user?.name ? session.user.name[0].toUpperCase() : 'A'}
              </div>
              <div style={{ fontSize: '13px' }}>
                <strong>{session?.user?.name}</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{session?.user?.roleName || 'Super Admin'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
