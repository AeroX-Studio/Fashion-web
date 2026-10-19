import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, all, run, saveImmediately } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

export async function PATCH(req) {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await req.json();
    const id = Number(conversationId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'A valid conversation ID is required.' }, { status: 400 });
    }

    const conversation = all('SELECT id FROM conversations WHERE id = ?', [id])[0];
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }

    run('UPDATE conversations SET unread_admin = 0 WHERE id = ?', [id]);
    saveImmediately();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to mark conversation as read.' }, { status: 500 });
  }
}
