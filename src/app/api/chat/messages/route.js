import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, get, all, run, insert, saveImmediately } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await initDatabase();
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const guestPhone = searchParams.get('guestPhone')?.trim() || '';

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const conversation = get('SELECT id, user_id FROM conversations WHERE id = ?', [conversationId]);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isAdmin = session?.user?.userType === 'admin';
    const isOwner = session?.user?.id && String(conversation.user_id) === String(session.user.id);
    const isGuestOwner = !session && guestPhone && get(
      "SELECT id FROM users WHERE id = ? AND phone = ? AND user_type = 'customer'",
      [conversation.user_id, guestPhone]
    );
    if (!isAdmin && !isOwner && !isGuestOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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

    let { conversationId, message, guestName, guestPhone } = body;
    message = typeof message === 'string' ? message.trim() : '';
    guestPhone = typeof guestPhone === 'string' ? guestPhone.trim() : '';

    if (!message) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: 'Messages must be 4,000 characters or fewer.' }, { status: 400 });
    }

    const isAdmin = session?.user?.userType === 'admin';
    const userId = session?.user?.id ? Number(session.user.id) : 0;
    const type = isAdmin ? 'admin' : 'customer';
    let customerId = userId;

    // Create or retrieve conversation
    if (!conversationId) {
      if (isAdmin) {
        return NextResponse.json({ error: 'Select a customer conversation before replying.' }, { status: 400 });
      }

      // Find or create customer
      if (!customerId && guestPhone) {
        const existing = get("SELECT id FROM users WHERE phone = ? AND user_type = 'customer'", [guestPhone]);
        if (existing) {
          customerId = existing.id;
        } else {
          const hash = bcrypt.hashSync(randomBytes(24).toString('hex'), 10);
          customerId = insert(
            `INSERT INTO users (name, phone, password_hash, user_type, status)
             VALUES (?, ?, ?, 'customer', 'active')`,
            [String(guestName || 'Guest Customer').trim().slice(0, 120), guestPhone, hash]
          );
        }
      }

      if (!customerId) {
        return NextResponse.json({ error: 'Enter your name and phone number to start a chat.' }, { status: 400 });
      }

      conversationId = insert(
        `INSERT INTO conversations (user_id, status, last_message, last_message_at, unread_admin)
         VALUES (?, 'open', ?, datetime('now'), 1)`,
        [customerId, message]
      );
    } else {
      const existingConversation = get('SELECT id, user_id FROM conversations WHERE id = ?', [conversationId]);
      if (!existingConversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      if (!isAdmin) {
        const isOwner = userId && String(existingConversation.user_id) === String(userId);
        const isGuestOwner = !userId && guestPhone && get(
          "SELECT id FROM users WHERE id = ? AND phone = ? AND user_type = 'customer'",
          [existingConversation.user_id, guestPhone]
        );
        if (!isOwner && !isGuestOwner) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        customerId = Number(existingConversation.user_id);
      }

      // Update existing conversation
      run(
        `UPDATE conversations 
         SET last_message = ?, last_message_at = datetime('now'),
             unread_admin = CASE WHEN ? = 'customer' THEN unread_admin + 1 ELSE unread_admin END,
             unread_customer = CASE WHEN ? = 'admin' THEN unread_customer + 1 ELSE unread_customer END
         WHERE id = ?`,
        [message, type, type, conversationId]
      );
    }

    const senderId = isAdmin ? userId : customerId;
    const messageId = insert(
      `INSERT INTO messages (conversation_id, sender_id, sender_type, message)
       VALUES (?, ?, ?, ?)`,
      [conversationId, senderId, type, message]
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
