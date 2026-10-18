import React from 'react';
import { notFound } from 'next/navigation';
import { initDatabase, get, all } from '@/lib/db';
import { ProductDetailClient } from './ProductDetailClient';

export const revalidate = 0;

export async function generateMetadata({ params }) {
  await initDatabase();
  const product = get('SELECT * FROM products WHERE slug = ? AND is_active = 1', [params.slug]);
  if (!product) return { title: 'Product Not Found | Nobo Fashion' };

  return {
    title: `${product.name} — Nobo Fashion`,
    description: product.description || `Buy authentic ${product.name} at Nobo Fashion with Cash on Delivery in Bangladesh.`,
    openGraph: {
      title: `${product.name} — Nobo Fashion`,
      description: product.description,
      images: [{ url: product.image || '/logo.jpg' }],
    },
  };
}

export default async function ProductPage({ params }) {
  await initDatabase();

  const product = get(`
    SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ? AND p.is_active = 1
  `, [params.slug]);

  if (!product) {
    notFound();
  }

  // Get images
  const images = all('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC', [product.id]);

  // Get size/color variants
  const variants = all('SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY sort_order ASC', [product.id]);

  // Get reviews
  const reviews = all(`
    SELECT r.*, u.name AS user_name
    FROM reviews r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ? AND r.is_approved = 1
    ORDER BY r.id DESC
  `, [product.id]);

  // Get related products
  const related = all(`
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
    LIMIT 4
  `, [product.category_id, product.id]).map((p) => {
    const pImages = all('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC', [p.id]);
    const pVariants = all('SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1', [p.id]);
    return {
      ...p,
      image: pImages[0]?.url || p.image || '/placeholder.jpg',
      variants: pVariants,
    };
  });

  const fullProduct = {
    ...product,
    images: images.length > 0 ? images : [{ url: product.image || '/placeholder.jpg', alt: product.name }],
    variants,
    reviews,
  };

  return <ProductDetailClient product={fullProduct} relatedProducts={related} />;
}
