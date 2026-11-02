import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getImagesDir } from '@/lib/db';
import fs from 'fs';
import path from 'path';

function determineExtension(mime, originalName) {
  const m = (mime || '').toLowerCase();
  if (m.includes('png')) return 'png';
  if (m.includes('webp')) return 'webp';
  if (m.includes('gif')) return 'gif';
  if (m.includes('svg')) return 'svg';
  if (m.includes('avif')) return 'avif';
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
  const origExt = path.extname(originalName || '').replace('.', '').toLowerCase();
  return origExt || 'jpg';
}

async function saveFileBuffer(file, uploadDir) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const mime = (file.type || '').toLowerCase();

  if (!mime.startsWith('image/')) {
    throw new Error('Only image files (JPG, PNG, WEBP, GIF, SVG, AVIF) are allowed.');
  }

  const ext = determineExtension(mime, file.name);
  const originalBase = path.basename(file.name || 'photo', path.extname(file.name || ''))
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 25);

  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const filename = `${originalBase || 'nobo-fashion'}-${uniqueSuffix}.${ext}`;
  const filePath = path.join(uploadDir, filename);

  fs.writeFileSync(filePath, buffer);
  return {
    url: `/api/images/${filename}`,
    filename,
    size: buffer.length,
  };
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    // Support both 'files' and 'file' (single or multiple)
    let files = formData.getAll('files');
    if (!files || files.length === 0) {
      files = formData.getAll('file');
    }

    if (!files || files.length === 0 || (files.length === 1 && typeof files[0] === 'string')) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const uploadDir = getImagesDir();
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const results = [];
    for (const f of files) {
      if (f && typeof f !== 'string') {
        const res = await saveFileBuffer(f, uploadDir);
        results.push(res);
      }
    }

    if (results.length === 0) {
      return NextResponse.json({ error: 'No valid image file uploaded.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      url: results[0].url,
      filename: results[0].filename,
      size: results[0].size,
      urls: results.map((r) => r.url),
      files: results,
    });
  } catch (err) {
    console.error('Image upload error:', err);
    return NextResponse.json({ error: 'Failed to upload image: ' + err.message }, { status: 500 });
  }
}
