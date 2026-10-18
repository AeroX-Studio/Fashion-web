import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, get, all, run, insert, saveImmediately } from '@/lib/db';

export async function GET(req) {
  try {
    await initDatabase();
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
    }

    const messages = all(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC LIMIT 100',
      [conversationId]
    );

    return NextResponse.json(messages);
  } catch (err) {
    console.error('Chat GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    const body = await req.json();

    let { conversationId, message, guestName, guestPhone, senderType } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const userId = session?.user?.id ? Number(session.user.id) : 0;
    const type = senderType || (session?.user?.userType === 'admin' ? 'admin' : 'customer');

    // Create or retrieve conversation
    if (!conversationId) {
      // Find or create customer
      let customerId = userId;
      if (!customerId && guestPhone) {
        const existing = get('SELECT id FROM users WHERE phone = ?', [guestPhone.trim()]);
        if (existing) {
          customerId = existing.id;
        } else {
          const bcrypt = require('bcryptjs');
          const hash = bcrypt.hashSync('priyo123456', 10);
          customerId = insert(
            `INSERT INTO users (name, phone, password_hash, user_type, status)
             VALUES (?, ?, ?, 'customer', 'active')`,
            [guestName || 'Guest Customer', guestPhone.trim(), hash]
          );
        }
      }

      conversationId = insert(
        `INSERT INTO conversations (user_id, status, last_message, last_message_at, unread_admin)
         VALUES (?, 'open', ?, datetime('now'), 1)`,
        [customerId || 1, message.trim()]
      );
    } else {
      // Update existing conversation
      run(
        `UPDATE conversations 
         SET last_message = ?, last_message_at = datetime('now'),
             unread_admin = CASE WHEN ? = 'customer' THEN unread_admin + 1 ELSE unread_admin END,
             unread_customer = CASE WHEN ? = 'admin' THEN unread_customer + 1 ELSE unread_customer END
         WHERE id = ?`,
        [message.trim(), type, type, conversationId]
      );
    }

    const messageId = insert(
      `INSERT INTO messages (conversation_id, sender_id, sender_type, message)
       VALUES (?, ?, ?, ?)`,
      [conversationId, userId || 0, type, message.trim()]
    );

    const savedMessage = get('SELECT * FROM messages WHERE id = ?', [messageId]);

    saveImmediately();

    return NextResponse.json({
      success: true,
      conversationId,
      message: savedMessage,
    });
  } catch (err) {
    console.error('Chat POST error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
