import fs from 'fs';
import path from 'path';

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
    const imagesDir = path.resolve(process.cwd(), 'data', 'images');
    const filePath = path.resolve(imagesDir, safeFilename);

    // Security check: ensure path stays within data/images
    if (!filePath.startsWith(imagesDir)) {
      return new Response('Access denied', { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
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

