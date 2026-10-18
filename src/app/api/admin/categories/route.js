import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, all, get, run, insert, saveImmediately } from '@/lib/db';

export async function GET() {
  try {
    await initDatabase();
    const categories = all(`
      SELECT c.*, COUNT(p.id) AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `);

    return NextResponse.json(categories);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, slug, image, description, show_in_sidebar, show_in_header, show_on_homepage, sort_order } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const generatedSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = get('SELECT id FROM categories WHERE slug = ?', [generatedSlug]);
    if (existing) {
      return NextResponse.json({ error: 'A category with this slug already exists.' }, { status: 400 });
    }

    const id = insert(
      `INSERT INTO categories (name, slug, image, description, show_in_sidebar, show_in_header, show_on_homepage, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        name.trim(),
        generatedSlug,
        image || null,
        description || null,
        show_in_sidebar ? 1 : 0,
        show_in_header ? 1 : 0,
        show_on_homepage ? 1 : 0,
        sort_order || 0,
      ]
    );

    saveImmediately();

    const created = get('SELECT * FROM categories WHERE id = ?', [id]);
    return NextResponse.json({ success: true, category: created });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, field, value } = await req.json();

    if (!id || !field) {
      return NextResponse.json({ error: 'Missing id or field' }, { status: 400 });
    }

    // Validate allowed toggle fields
    const allowedFields = ['show_in_sidebar', 'show_in_header', 'show_on_homepage', 'is_active', 'sort_order', 'image', 'description'];
    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: 'Field not editable' }, { status: 400 });
    }


    run(`UPDATE categories SET ${field} = ? WHERE id = ?`, [value, id]);
    saveImmediately();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
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

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    run('DELETE FROM categories WHERE id = ?', [id]);
    saveImmediately();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
