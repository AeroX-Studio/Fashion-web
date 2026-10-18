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

    if (!productId || delta === undefined) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    if (variantId) {
      const v = get('SELECT stock FROM product_variants WHERE id = ?', [variantId]);
      const prevStock = v ? v.stock : 0;
      const newStock = Math.max(0, prevStock + Number(delta));

      run('UPDATE product_variants SET stock = ? WHERE id = ?', [newStock, variantId]);
      run('UPDATE products SET stock = MAX(0, stock + ?) WHERE id = ?', [delta, productId]);

      insert(
        `INSERT INTO inventory_logs (product_id, variant_id, adjustment, previous_stock, new_stock, reason, admin_id)
         VALUES (?, ?, ?, ?, ?, 'Manual Admin Adjustment', ?)`,
        [productId, variantId, delta, prevStock, newStock, session.user.id]
      );
    } else {
      const p = get('SELECT stock FROM products WHERE id = ?', [productId]);
      const prevStock = p ? p.stock : 0;
      const newStock = Math.max(0, prevStock + Number(delta));

      run('UPDATE products SET stock = ? WHERE id = ?', [newStock, productId]);

      insert(
        `INSERT INTO inventory_logs (product_id, adjustment, previous_stock, new_stock, reason, admin_id)
         VALUES (?, ?, ?, ?, 'Manual Admin Adjustment', ?)`,
        [productId, delta, prevStock, newStock, session.user.id]
      );
    }

    saveImmediately();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 });
  }
}
