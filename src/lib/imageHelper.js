/**
 * Universal Image URL Helper for Nobo Fashion
 * Resolves local filenames, uploaded photos in data/images, and external URLs.
 */

export function getImageUrl(src, fallback = '/logo.jpg') {
  if (!src || typeof src !== 'string') {
    return fallback;
  }

  const trimmed = src.trim();
  if (!trimmed) {
    return fallback;
  }

  // External URLs or Base64 / Blob
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Already prefixed with /api/images/
  if (trimmed.startsWith('/api/images/')) {
    return trimmed;
  }

  // Prefixed with data/images/ or /data/images/
  if (trimmed.startsWith('/data/images/')) {
    return `/api/images/${trimmed.replace(/^\/data\/images\//, '')}`;
  }
  if (trimmed.startsWith('data/images/')) {
    return `/api/images/${trimmed.replace(/^data\/images\//, '')}`;
  }

  // Absolute path in public folder (e.g., /logo.jpg, /placeholder.jpg)
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Bare filename stored in database (e.g., "priyo-1724345.jpg" or "test-logo.jpg")
  return `/api/images/${trimmed}`;
}
