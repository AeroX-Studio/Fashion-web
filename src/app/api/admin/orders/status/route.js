import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, get, run, insert, saveImmediately } from '@/lib/db';

export async function PATCH(req) {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, newStatus, note, paymentStatus } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = get('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order status if provided
    if (newStatus) {
      run(
        `UPDATE orders 
         SET order_status = ?, updated_at = datetime('now'),
             delivered_at = CASE WHEN ? = 'delivered' THEN datetime('now') ELSE delivered_at END
         WHERE id = ?`,
        [newStatus, newStatus, orderId]
      );

      // Add to timeline
      insert(
        `INSERT INTO order_timeline (order_id, status, note, admin_id)
         VALUES (?, ?, ?, ?)`,
        [orderId, newStatus, note || `Status changed to ${newStatus.replace('_', ' ')} by Admin`, session.user.id]
      );

      // Update invoice status
      run('UPDATE invoices SET order_status = ? WHERE order_id = ?', [newStatus, orderId]);
    }

    // Update payment status if provided
    if (paymentStatus) {
      run('UPDATE orders SET payment_status = ? WHERE id = ?', [paymentStatus, orderId]);
      run('UPDATE invoices SET payment_status = ? WHERE order_id = ?', [paymentStatus, orderId]);
    }

    saveImmediately();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Order status update error:', err);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
