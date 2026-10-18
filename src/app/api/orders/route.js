import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, get, all, run, insert, saveImmediately } from '@/lib/db';

export async function POST(req) {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      name,
      phone,
      email,
      address,
      city,
      zone, // 'dhaka' | 'outside_dhaka'
      notes,
      items,
      couponCode,
    } = body;

    // Validation
    if (!name || !phone || !address || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Please provide full name, phone number, delivery address, and at least one item.' },
        { status: 400 }
      );
    }

    // 1. Calculate and validate items against DB
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = get('SELECT * FROM products WHERE id = ? AND is_active = 1', [item.productId]);
      if (!product) {
        return NextResponse.json(
          { error: `Product "${item.name}" is currently unavailable.` },
          { status: 400 }
        );
      }

      let price = product.sale_price || product.price;
      let variant = null;

      if (item.variantId) {
        variant = get('SELECT * FROM product_variants WHERE id = ? AND product_id = ?', [
          item.variantId,
          product.id,
        ]);
        if (variant && variant.price) {
          price = variant.price;
        }
      }

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        productId: product.id,
        variantId: variant ? variant.id : null,
        productName: product.name,
        productSku: product.sku,
        sizeName: item.size || 'Free',
        colorName: item.color || null,
        quantity: item.quantity,
        price: price,
        total: itemTotal,
        image: item.image || product.image || '/placeholder.jpg',
      });
    }

    // 2. Delivery charge
    const deliveryCharge = zone === 'outside_dhaka' ? 150 : 80;

    // 3. Discount & Coupon
    let discount = 0;
    let couponId = null;

    if (couponCode) {
      const coupon = get(
        "SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (expiry_date IS NULL OR expiry_date >= date('now'))",
        [couponCode.toUpperCase().trim()]
      );

      if (coupon && subtotal >= (coupon.min_order_amount || 0)) {
        couponId = coupon.id;
        if (coupon.discount_type === 'percentage') {
          discount = (subtotal * coupon.discount_value) / 100;
          if (coupon.max_discount && discount > coupon.max_discount) {
            discount = coupon.max_discount;
          }
        } else {
          discount = coupon.discount_value;
        }
        // Increment coupon used count
        run('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [coupon.id]);
      }
    }

    const grandTotal = Math.max(0, subtotal - discount + deliveryCharge);

    // 4. Generate unique sequential order number PC-2026-XXXXXX
    const countRes = get('SELECT COUNT(id) AS count FROM orders');
    const orderIndex = (countRes ? countRes.count : 0) + 1;
    const orderNumber = `PC-2026-${String(orderIndex).padStart(6, '0')}`;
    const invoiceNumber = `INV-PC-2026-${String(orderIndex).padStart(6, '0')}`;

    // 5. Customer / User ID
    let userId = session?.user?.id ? Number(session.user.id) : null;
    if (!userId) {
      // Find or create customer account by phone
      const existingUser = get('SELECT id FROM users WHERE phone = ?', [phone.trim()]);
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const bcrypt = require('bcryptjs');
        const defaultHash = bcrypt.hashSync('priyo123456', 10);
        userId = insert(
          `INSERT INTO users (name, email, phone, password_hash, user_type, status)
           VALUES (?, ?, ?, ?, 'customer', 'active')`,
          [name.trim(), email ? email.toLowerCase().trim() : null, phone.trim(), defaultHash]
        );
      }
    }

    // 6. Save Order
    const orderId = insert(
      `INSERT INTO orders (
        order_number, user_id, shipping_name, shipping_phone, shipping_address, shipping_city,
        shipping_zone, subtotal, discount, delivery_charge, total, payment_method, payment_status,
        order_status, coupon_id, coupon_code, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'cod', 'pending', 'pending', ?, ?, ?)`,
      [
        orderNumber,
        userId,
        name.trim(),
        phone.trim(),
        address.trim(),
        city ? city.trim() : 'Dhaka',
        zone || 'dhaka',
        subtotal,
        discount,
        deliveryCharge,
        grandTotal,
        couponId,
        couponCode || null,
        notes || null,
      ]
    );

    // 7. Save Order Items & Reduce Stock
    for (const it of validatedItems) {
      insert(
        `INSERT INTO order_items (
          order_id, product_id, variant_id, product_name, product_sku, size_name, color_name,
          quantity, price, total, product_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          it.productId,
          it.variantId,
          it.productName,
          it.productSku,
          it.sizeName,
          it.colorName,
          it.quantity,
          it.price,
          it.total,
          it.image,
        ]
      );

      // Reduce product stock & increment sold count
      run('UPDATE products SET stock = MAX(0, stock - ?), total_sold = total_sold + ? WHERE id = ?', [
        it.quantity,
        it.quantity,
        it.productId,
      ]);

      if (it.variantId) {
        run('UPDATE product_variants SET stock = MAX(0, stock - ?), sold_count = sold_count + ? WHERE id = ?', [
          it.quantity,
          it.quantity,
          it.variantId,
        ]);
      }
    }

    // 8. Order Initial Timeline
    insert(
      `INSERT INTO order_timeline (order_id, status, note)
       VALUES (?, 'pending', 'Order placed successfully by customer via Cash on Delivery.')`,
      [orderId]
    );

    // 9. Automatic Invoice Generation
    const invoiceData = JSON.stringify({
      invoiceNumber,
      orderNumber,
      orderDate: new Date().toISOString(),
      customer: {
        name: name.trim(),
        phone: phone.trim(),
        email: email || null,
        address: address.trim(),
        city: city || 'Dhaka',
        zone: zone || 'dhaka',
      },
      items: validatedItems,
      subtotal,
      discount,
      deliveryCharge,
      grandTotal,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
    });

    const invoiceId = insert(
      `INSERT INTO invoices (
        invoice_number, order_id, user_id, invoice_data, subtotal, discount, delivery_charge,
        total, payment_method, payment_status, order_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'cod', 'pending', 'pending')`,
      [
        invoiceNumber,
        orderId,
        userId,
        invoiceData,
        subtotal,
        discount,
        deliveryCharge,
        grandTotal,
      ]
    );

    // 10. Create Notification for Admin
    insert(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES (1, 'new_order', ?, ?, ?)`,
      [
        `New Order #${orderNumber}`,
        `Customer ${name} placed a COD order of ৳${grandTotal.toLocaleString('en-BD')}`,
        JSON.stringify({ orderId, orderNumber, total: grandTotal }),
      ]
    );

    // Save to disk immediately
    saveImmediately();

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      invoiceNumber,
      invoiceId,
      total: grandTotal,
    });
  } catch (err) {
    console.error('Order creation error:', err);
    return NextResponse.json({ error: 'Failed to place order. Please try again.' }, { status: 500 });
  }
}
