'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

export function AdminNavClient({ unreadChat, pendingOrders, lowStock }) {
  const pathname = usePathname();

  const navGroups = [
    {
      title: 'Core Business',
      items: [
        { label: 'Dashboard', href: '/admin', icon: 'ri-dashboard-3-line' },
        { label: 'Orders (COD)', href: '/admin/orders', icon: 'ri-shopping-cart-2-line', badge: pendingOrders > 0 ? pendingOrders : null },
        { label: 'Invoices', href: '/admin/invoices', icon: 'ri-bill-line' },
        { label: 'Live Chat', href: '/admin/chat', icon: 'ri-chat-3-line', badge: unreadChat > 0 ? unreadChat : null },
      ],
    },
    {
      title: 'Catalog & Stock',
      items: [
        { label: 'Products', href: '/admin/products', icon: 'ri-t-shirt-2-line' },
        { label: 'Categories & Sidebar', href: '/admin/categories', icon: 'ri-folder-3-line' },
        { label: 'Inventory / Stock', href: '/admin/inventory', icon: 'ri-archive-line', badge: lowStock > 0 ? `${lowStock} low` : null },
      ],
    },
    {
      title: 'Marketing & Customers',
      items: [
        { label: 'Customers', href: '/admin/customers', icon: 'ri-user-heart-line' },
        { label: 'Coupons & Discounts', href: '/admin/coupons', icon: 'ri-coupon-3-line' },
      ],
    },
    {
      title: 'Store Settings',
      items: [
        { label: 'Store & Delivery Config', href: '/admin/settings', icon: 'ri-settings-4-line' },
      ],
    },
  ];

  return (
    <nav className="admin-nav">
      {navGroups.map((group) => (
        <div key={group.title}>
          <div className="admin-nav-group-title">{group.title}</div>
          {group.items.map((it) => {
            const isActive = it.href === '/admin' ? pathname === '/admin' : pathname.startsWith(it.href);

            return (
              <Link
                key={it.href}
                href={it.href}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <i className={it.icon} style={{ fontSize: '18px' }}></i>
                <span>{it.label}</span>
                {it.badge && <span className="admin-nav-badge">{it.badge}</span>}
              </Link>
            );
          })}
        </div>
      ))}

      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="admin-nav-item"
          style={{ width: '100%', color: '#F87171' }}
        >
          <i className="ri-logout-box-r-line" style={{ fontSize: '18px' }}></i>
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
