import fs from 'fs';
import path from 'path';
import { getImagesDir } from '@/lib/db';

const MIME_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
};

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const rawFilename = params?.filename || '';
    if (!rawFilename) {
      return new Response('File name required', { status: 400 });
    }

    // Decode URL-encoded filename (e.g. spaces or special chars)
    const decodedFilename = decodeURIComponent(rawFilename);

    // Prevent path traversal
    const safeFilename = path.basename(decodedFilename);
    const candidateDirs = [
      path.resolve(getImagesDir()),
      path.resolve(process.cwd(), 'public', 'images'),
      path.resolve(process.cwd(), 'public', 'products'),
      path.resolve(process.cwd(), 'public'),
      path.resolve(process.cwd(), 'data', 'images'),
    ];

    let filePath = null;
    for (const dir of candidateDirs) {
      const candidate = path.resolve(dir, safeFilename);
      if (candidate.startsWith(dir) && fs.existsSync(candidate)) {
        try {
          if (!fs.statSync(candidate).isDirectory()) {
            filePath = candidate;
            break;
          }
        } catch (_) {}
      }
    }

    if (!filePath) {
      return new Response('Image not found', { status: 404 });
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      return new Response('Invalid request', { status: 400 });
    }

    const ext = path.extname(safeFilename).toLowerCase();
    const contentType = MIME_MAP[ext] || 'image/jpeg';
    const fileBuffer = fs.readFileSync(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err) {
    console.error('[Image Serve Error]:', err);
    return new Response('Error loading image', { status: 500 });
  }
}

