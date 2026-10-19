import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { initDatabase, all, get, run, insert, saveImmediately } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDatabase();
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const cleanName = typeof name === 'string' ? name.trim() : '';

    if (!cleanName) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const generatedSlug = (typeof slug === 'string' && slug.trim() ? slug : cleanName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `category-${Date.now()}`;

    const cleanSortOrder = Number(sort_order || 0);
    if (!Number.isFinite(cleanSortOrder)) {
      return NextResponse.json({ error: 'Sort order must be a number.' }, { status: 400 });
    }

    const existing = get('SELECT id FROM categories WHERE slug = ?', [generatedSlug]);
    if (existing) {
      return NextResponse.json({ error: 'A category with this slug already exists.' }, { status: 400 });
    }

    const id = insert(
      `INSERT INTO categories (name, slug, image, description, show_in_sidebar, show_in_header, show_on_homepage, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        cleanName,
        generatedSlug,
        image || null,
        description || null,
        show_in_sidebar ? 1 : 0,
        show_in_header ? 1 : 0,
        show_on_homepage ? 1 : 0,
        cleanSortOrder,
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
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId) || categoryId <= 0 || !field) {
      return NextResponse.json({ error: 'Missing id or field' }, { status: 400 });
    }

    // Validate allowed toggle fields
    const allowedFields = ['show_in_sidebar', 'show_in_header', 'show_on_homepage', 'is_active', 'sort_order', 'image', 'description'];
    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: 'Field not editable' }, { status: 400 });
    }


    const category = get('SELECT id FROM categories WHERE id = ?', [categoryId]);
    if (!category) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }
    const cleanValue = ['show_in_sidebar', 'show_in_header', 'show_on_homepage', 'is_active'].includes(field)
      ? (value ? 1 : 0)
      : field === 'sort_order'
        ? Number(value)
        : typeof value === 'string' ? value.trim() : null;
    if (field === 'sort_order' && !Number.isFinite(cleanValue)) {
      return NextResponse.json({ error: 'Sort order must be a number.' }, { status: 400 });
    }

    run(`UPDATE categories SET ${field} = ? WHERE id = ?`, [cleanValue, categoryId]);
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
    const id = Number(searchParams.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    if (!get('SELECT id FROM categories WHERE id = ?', [id])) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    run('DELETE FROM categories WHERE id = ?', [id]);
    saveImmediately();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
