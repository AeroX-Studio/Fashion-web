import { NextResponse } from 'next/server';
import { initDatabase, get } from '@/lib/db';

export async function POST(req) {
  try {
    await initDatabase();
    const { code, subtotal } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Please provide a coupon code.' }, { status: 400 });
    }

    const coupon = get(
      `SELECT * FROM coupons 
       WHERE code = ? AND is_active = 1 AND (expiry_date IS NULL OR expiry_date >= date('now'))`,
      [code.toUpperCase().trim()]
    );

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon code is invalid or has expired.' }, { status: 404 });
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({ error: 'This coupon usage limit has been reached.' }, { status: 400 });
    }

    if (subtotal && subtotal < (coupon.min_order_amount || 0)) {
      return NextResponse.json(
        { error: `Minimum order amount for this coupon is ৳${coupon.min_order_amount}.` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_order_amount: coupon.min_order_amount,
        max_discount: coupon.max_discount,
      },
    });
  } catch (err) {
    console.error('Coupon error:', err);
    return NextResponse.json({ error: 'Failed to validate coupon.' }, { status: 500 });
  }
}
