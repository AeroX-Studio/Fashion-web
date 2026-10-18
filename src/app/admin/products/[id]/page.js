import React from 'react';
import { notFound } from 'next/navigation';
import { initDatabase, get, all } from '@/lib/db';
import { EditProductClient } from './EditProductClient';

export const revalidate = 0;

export default async function AdminEditProductPage({ params }) {
  await initDatabase();

  const product = get('SELECT * FROM products WHERE id = ?', [params.id]);
  if (!product) {
    notFound();
  }

  const images = all('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC', [product.id]);
  const variants = all('SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order ASC', [product.id]);
  const categories = all('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC');

  const fullProduct = {
    ...product,
    imageUrl: images[0]?.url || product.image || '',
    variants: variants.length > 0 ? variants : [{ size_name: 'Free', price: product.price, stock: product.stock, color_name: '' }],
  };

  return <EditProductClient product={fullProduct} categories={categories} />;
}
