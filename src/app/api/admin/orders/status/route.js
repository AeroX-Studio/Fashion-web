import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, get, all, getDb, run, insert, saveImmediately } from '@/lib/db';

export async function PATCH(req) {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, newStatus, note, paymentStatus } = await req.json();
    const cleanOrderId = Number(orderId);
    const validOrderStatuses = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'];
    const validPaymentStatuses = ['pending', 'cod_confirmed', 'collected', 'failed', 'cancelled'];

    if (!Number.isInteger(cleanOrderId) || cleanOrderId <= 0) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    if (!newStatus && !paymentStatus) {
      return NextResponse.json({ error: 'Choose an order status or payment status to update.' }, { status: 400 });
    }
    if (newStatus && !validOrderStatuses.includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 });
    }
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
    }

    const order = get('SELECT * FROM orders WHERE id = ?', [cleanOrderId]);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const statusChanged = newStatus && newStatus !== order.order_status;
    const nonCancellableStatuses = ['shipped', 'out_for_delivery', 'delivered', 'returned', 'refunded'];
    if (statusChanged && newStatus === 'cancelled' && nonCancellableStatuses.includes(order.order_status)) {
      return NextResponse.json({ error: 'This order has already entered delivery. Use Returned after the item is received back.' }, { status: 409 });
    }
    const releasingStock = statusChanged && newStatus === 'cancelled' && order.order_status !== 'cancelled';
    const reservingStock = statusChanged && order.order_status === 'cancelled' &&
      ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'].includes(newStatus);
    const items = releasingStock || reservingStock
      ? all('SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?', [cleanOrderId])
      : [];

    if (reservingStock) {
      const productTotals = new Map();
      const variantTotals = new Map();
      for (const item of items) {
        productTotals.set(item.product_id, (productTotals.get(item.product_id) || 0) + Number(item.quantity));
        if (item.variant_id) {
          variantTotals.set(item.variant_id, (variantTotals.get(item.variant_id) || 0) + Number(item.quantity));
        }
      }
      for (const [productId, quantity] of productTotals) {
        const product = get('SELECT stock FROM products WHERE id = ?', [productId]);
        if (!product || Number(product.stock) < quantity) {
          return NextResponse.json({ error: 'This order cannot be reopened because one or more products are out of stock.' }, { status: 409 });
        }
      }
      for (const [variantId, quantity] of variantTotals) {
        const variant = get('SELECT stock FROM product_variants WHERE id = ?', [variantId]);
        if (!variant || Number(variant.stock) < quantity) {
          return NextResponse.json({ error: 'This order cannot be reopened because one or more sizes are out of stock.' }, { status: 409 });
        }
      }
    }

    const database = getDb();
    database.run('BEGIN TRANSACTION');
    try {
      if (releasingStock || reservingStock) {
        const direction = releasingStock ? 1 : -1;
        for (const item of items) {
          const itemQuantity = Number(item.quantity);
          const quantity = itemQuantity * direction;
          run('UPDATE products SET stock = MAX(0, stock + ?), total_sold = MAX(0, total_sold + ?) WHERE id = ?', [quantity, releasingStock ? -itemQuantity : itemQuantity, item.product_id]);
          if (item.variant_id) {
            run('UPDATE product_variants SET stock = MAX(0, stock + ?), sold_count = MAX(0, sold_count + ?) WHERE id = ?', [quantity, releasingStock ? -itemQuantity : itemQuantity, item.variant_id]);
          }
        }
      }

      if (statusChanged) {
        run(
          `UPDATE orders
           SET order_status = ?, updated_at = datetime('now'),
               delivered_at = CASE WHEN ? = 'delivered' THEN datetime('now') ELSE delivered_at END
           WHERE id = ?`,
          [newStatus, newStatus, cleanOrderId]
        );
        insert(
          `INSERT INTO order_timeline (order_id, status, note, admin_id)
           VALUES (?, ?, ?, ?)`,
          [cleanOrderId, newStatus, String(note || `Status changed to ${newStatus.replaceAll('_', ' ')} by Admin`).slice(0, 500), session.user.id]
        );
        run('UPDATE invoices SET order_status = ? WHERE order_id = ?', [newStatus, cleanOrderId]);
      }

      if (paymentStatus && paymentStatus !== order.payment_status) {
        run('UPDATE orders SET payment_status = ?, updated_at = datetime(\'now\') WHERE id = ?', [paymentStatus, cleanOrderId]);
        run('UPDATE invoices SET payment_status = ? WHERE order_id = ?', [paymentStatus, cleanOrderId]);
      }

      database.run('COMMIT');
      saveImmediately();
    } catch (error) {
      database.run('ROLLBACK');
      throw error;
    }

    return NextResponse.json({ success: true, orderStatus: newStatus || order.order_status, paymentStatus: paymentStatus || order.payment_status });
  } catch (err) {
    console.error('Order status update error:', err);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
