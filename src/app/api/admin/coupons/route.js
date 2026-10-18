import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, all, get, run, insert, saveImmediately } from '@/lib/db';

export async function GET() {
  try {
    await initDatabase();
    const coupons = all('SELECT * FROM coupons ORDER BY id DESC');
    return NextResponse.json(coupons);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, discountType, discountValue, minOrderAmount, maxDiscount, expiryDate } = await req.json();

    if (!code || !discountValue) {
      return NextResponse.json({ error: 'Coupon code and discount value are required' }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = get('SELECT id FROM coupons WHERE code = ?', [cleanCode]);
    if (existing) {
      return NextResponse.json({ error: 'A coupon with this code already exists.' }, { status: 400 });
    }

    insert(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount, expiry_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        cleanCode,
        discountType || 'percentage',
        Number(discountValue),
        minOrderAmount ? Number(minOrderAmount) : 0,
        maxDiscount ? Number(maxDiscount) : null,
        expiryDate || null,
      ]
    );

    saveImmediately();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    run('DELETE FROM coupons WHERE id = ?', [id]);
    saveImmediately();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
