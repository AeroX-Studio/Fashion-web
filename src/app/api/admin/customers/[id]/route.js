import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, all, get } from '@/lib/db';

export async function GET(req, { params }) {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const user = get('SELECT id, name, email, phone, created_at FROM users WHERE id = ?', [userId]);
    if (!user) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const orders = all('SELECT id, order_number, total, order_status, created_at FROM orders WHERE user_id = ? ORDER BY id DESC', [userId]);
    const totalSpent = get('SELECT SUM(total) AS sum FROM orders WHERE user_id = ?', [userId]);

    return NextResponse.json({
      ...user,
      total_spent: totalSpent?.sum || 0,
      orders,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch customer profile' }, { status: 500 });
  }
}
