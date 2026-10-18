import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { initDatabase, get, insert, saveImmediately } from '@/lib/db';

export async function POST(req) {
  try {
    await initDatabase();
    const { name, phone, email, password, address } = await req.json();

    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, mobile phone number, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    // Check existing phone
    const existingPhone = get('SELECT id FROM users WHERE phone = ?', [phone.trim()]);
    if (existingPhone) {
      return NextResponse.json(
        { error: 'An account with this phone number already exists.' },
        { status: 400 }
      );
    }

    // Check existing email
    if (email && email.trim()) {
      const existingEmail = get('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
      if (existingEmail) {
        return NextResponse.json(
          { error: 'An account with this email address already exists.' },
          { status: 400 }
        );
      }
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const userId = insert(
      `INSERT INTO users (name, phone, email, password_hash, user_type, status)
       VALUES (?, ?, ?, ?, 'customer', 'active')`,
      [
        name.trim(),
        phone.trim(),
        email ? email.toLowerCase().trim() : null,
        hashedPassword,
      ]
    );

    // Save default address if provided
    if (address && address.trim()) {
      insert(
        `INSERT INTO addresses (user_id, label, name, phone, address, is_default)
         VALUES (?, 'Home', ?, ?, ?, 1)`,
        [userId, name.trim(), phone.trim(), address.trim()]
      );
    }

    saveImmediately();

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.toLowerCase().trim() : null,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
