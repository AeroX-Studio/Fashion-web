import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { initDatabase, get, all } from '@/lib/db';
import { AdminOrderDetailClient } from './AdminOrderDetailClient';

export const revalidate = 0;

export default async function AdminOrderDetailPage({ params }) {
  await initDatabase();

  const order = get('SELECT * FROM orders WHERE id = ?', [params.id]);
  if (!order) {
    notFound();
  }

  const items = all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  const invoice = get('SELECT * FROM invoices WHERE order_id = ?', [order.id]);
  const timeline = all('SELECT * FROM order_timeline WHERE order_id = ? ORDER BY id DESC', [order.id]);
  const customer = order.user_id ? get('SELECT * FROM users WHERE id = ?', [order.user_id]) : null;

  return (
    <AdminOrderDetailClient
      order={order}
      items={items}
      invoice={invoice}
      timeline={timeline}
      customer={customer}
    />
  );
}
