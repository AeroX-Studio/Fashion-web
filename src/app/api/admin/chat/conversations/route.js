import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, all } from '@/lib/db';

export async function GET() {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = all(`
      SELECT c.*, u.name AS customer_name, u.phone AS customer_phone
      FROM conversations c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
    `);

    return NextResponse.json(conversations);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
