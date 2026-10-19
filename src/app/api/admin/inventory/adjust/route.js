import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, run, insert, get, saveImmediately } from '@/lib/db';

export async function POST(req) {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, variantId, delta } = await req.json();

    const cleanProductId = Number(productId);
    const adjustment = Number(delta);
    if (!Number.isInteger(cleanProductId) || cleanProductId <= 0 || !Number.isInteger(adjustment) || adjustment === 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const product = get('SELECT id, stock FROM products WHERE id = ?', [cleanProductId]);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (variantId) {
      const variant = get('SELECT id, stock FROM product_variants WHERE id = ? AND product_id = ? AND is_active = 1', [variantId, cleanProductId]);
      if (!variant) {
        return NextResponse.json({ error: 'Product size was not found' }, { status: 404 });
      }

      const prevStock = Number(variant.stock) || 0;
      const newStock = Math.max(0, prevStock + adjustment);
      const appliedAdjustment = newStock - prevStock;
      if (appliedAdjustment === 0) {
        return NextResponse.json({ error: 'Stock is already zero.' }, { status: 409 });
      }

      run('UPDATE product_variants SET stock = ? WHERE id = ?', [newStock, variantId]);
      run('UPDATE products SET stock = MAX(0, stock + ?) WHERE id = ?', [appliedAdjustment, cleanProductId]);

      insert(
        `INSERT INTO inventory_logs (product_id, variant_id, adjustment, previous_stock, new_stock, reason, admin_id)
         VALUES (?, ?, ?, ?, ?, 'Manual Admin Adjustment', ?)`,
        [cleanProductId, variantId, appliedAdjustment, prevStock, newStock, session.user.id]
      );
    } else {
      const prevStock = Number(product.stock) || 0;
      const newStock = Math.max(0, prevStock + adjustment);
      const appliedAdjustment = newStock - prevStock;
      if (appliedAdjustment === 0) {
        return NextResponse.json({ error: 'Stock is already zero.' }, { status: 409 });
      }

      run('UPDATE products SET stock = ? WHERE id = ?', [newStock, cleanProductId]);

      insert(
        `INSERT INTO inventory_logs (product_id, adjustment, previous_stock, new_stock, reason, admin_id)
         VALUES (?, ?, ?, ?, 'Manual Admin Adjustment', ?)`,
        [cleanProductId, appliedAdjustment, prevStock, newStock, session.user.id]
      );
    }

    saveImmediately();

    return NextResponse.json({ success: true, productId: cleanProductId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 });
  }
}
