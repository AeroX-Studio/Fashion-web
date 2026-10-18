'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function ShopSortSelect({ currentSort }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e) => {
    const newSort = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (newSort) {
      params.set('sort', newSort);
    } else {
      params.delete('sort');
    }
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <select
      id="sort-select"
      value={currentSort || 'newest'}
      onChange={handleChange}
      style={{
        padding: '6px 12px',
        borderRadius: '6px',
        border: '1.5px solid var(--border-dark)',
        fontSize: '13px',
        background: '#fff',
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      <option value="newest">Newest Arrivals</option>
      <option value="best_seller">Best Selling</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
    </select>
  );
}
