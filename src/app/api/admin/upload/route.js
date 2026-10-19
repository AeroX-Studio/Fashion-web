import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getImagesDir } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate mime type
    const mime = (file.type || '').toLowerCase();
    if (!mime.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files (JPG, PNG, WEBP, GIF, SVG, AVIF) are allowed.' }, { status: 400 });
    }

    // Determine extension
    let ext = 'jpg';
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('gif')) ext = 'gif';
    else if (mime.includes('svg')) ext = 'svg';
    else if (mime.includes('avif')) ext = 'avif';
    else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
    else {
      const origExt = path.extname(file.name || '').replace('.', '').toLowerCase();
      if (origExt) ext = origExt;
    }

    // Ensure upload directory exists
    const uploadDir = getImagesDir();
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate sanitized unique filename
    const originalBase = path.basename(file.name || 'photo', path.extname(file.name || ''))
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 25);
    
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const filename = `${originalBase || 'nobo-fashion'}-${uniqueSuffix}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Save to disk in data/images
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/api/images/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: buffer.length,
    });
  } catch (err) {
    console.error('Image upload error:', err);
    return NextResponse.json({ error: 'Failed to upload image: ' + err.message }, { status: 500 });
  }
}

