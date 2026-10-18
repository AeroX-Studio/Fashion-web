'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImageUploader } from '@/components/admin/ImageUploader';

export function EditProductClient({ product, categories }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: product.name || '',
    slug: product.slug || '',
    categoryId: product.category_id || (categories[0]?.id || ''),
    sku: product.sku || '',
    price: product.price || '',
    salePrice: product.sale_price || '',
    stock: product.stock || 0,
    description: product.description || '',
    imageUrl: product.imageUrl || '',
    isFeatured: product.is_featured === 1,
    isNewArrival: product.is_new_arrival === 1,
    isBestSeller: product.is_best_seller === 1,
    isActive: product.is_active === 1,
  });

  const [variants, setVariants] = useState(product.variants || []);

  const applyPreset = (presetType) => {
    const basePrice = formData.price;
    if (presetType === 'free') {
      setVariants([{ size_name: 'Free', price: basePrice, stock: 20, color_name: '' }]);
    } else if (presetType === 'standard') {
      setVariants([
        { size_name: 'S', price: basePrice, stock: 5, color_name: '' },
        { size_name: 'M', price: basePrice, stock: 10, color_name: '' },
        { size_name: 'L', price: basePrice, stock: 10, color_name: '' },
        { size_name: 'XL', price: basePrice, stock: 5, color_name: '' },
        { size_name: 'XXL', price: basePrice, stock: 5, color_name: '' },
      ]);
    } else if (presetType === 'numeric') {
      const nums = ['38', '40', '42', '44', '46', '48', '50', '52'];
      setVariants(
        nums.map((n) => ({
          size_name: n,
          price: basePrice,
          stock: 5,
          color_name: '',
        }))
      );
    }
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      { size_name: 'New Size', price: formData.price, stock: 10, color_name: '' },
    ]);
  };

  const handleRemoveVariant = (idx) => {
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleVariantChange = (idx, field, value) => {
    setVariants((prev) => {
      const updated = [...prev];
      updated[idx][field] = value;
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      setErrorMsg('Product name and price are required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSavedSuccess(false);

    try {
      const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          stock: totalStock || formData.stock,
          variants,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        router.refresh();
      } else {
        setErrorMsg(data.error || 'Failed to update product.');
      }
    } catch (err) {
      setErrorMsg('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Editing Product #{product.id}</div>
          <h1 style={{ fontSize: '24px', color: 'var(--navy)' }}>{product.name}</h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href={`/product/${product.slug}`} target="_blank" className="btn btn-secondary btn-sm">
            <i className="ri-external-link-line"></i> View on Store
          </Link>
          <Link href="/admin/products" className="btn btn-outline btn-sm">
            &larr; Back to Catalog
          </Link>
        </div>
      </div>

      {savedSuccess && (
        <div style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid #A7F3D0', padding: '12px 18px', borderRadius: '8px', fontSize: '13.5px' }}>
          <i className="ri-checkbox-circle-fill"></i> Product updated successfully!
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px 18px', borderRadius: '8px', fontSize: '13.5px' }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Basic Details */}
        <div className="data-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--navy)', marginBottom: '18px' }}>
            Product Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-dark)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-dark)',
                  fontSize: '14px',
                  background: '#fff',
                  outline: 'none',
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Regular Price (BDT) *
              </label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-dark)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Sale Price (Optional BDT)
              </label>
              <input
                type="number"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-dark)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                SKU Code
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-dark)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <ImageUploader
              currentImage={formData.imageUrl}
              onImageChange={(url) => setFormData({ ...formData, imageUrl: url })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-dark)',
                fontSize: '14px',
                outline: 'none',
              }}
            ></textarea>
          </div>
        </div>

        {/* Size & Stock Variants */}
        <div className="data-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '16px', color: 'var(--navy)' }}>Size Variants & Stock Levels</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Customize size chips and per-size stock for the storefront
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => applyPreset('free')}
              >
                Free Size
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => applyPreset('standard')}
              >
                S–XXL
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => applyPreset('numeric')}
              >
                38–52
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Size Name</th>
                  <th>Color (Optional)</th>
                  <th>Variant Price (BDT)</th>
                  <th>Stock Quantity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v, idx) => (
                  <tr key={idx}>
                    <td>
                      <input
                        type="text"
                        value={v.size_name}
                        onChange={(e) => handleVariantChange(idx, 'size_name', e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-dark)',
                          width: '100px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="e.g. Blue"
                        value={v.color_name || ''}
                        onChange={(e) => handleVariantChange(idx, 'color_name', e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-dark)',
                          width: '120px',
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={v.price || ''}
                        placeholder={formData.price}
                        onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-dark)',
                          width: '120px',
                          fontFamily: 'var(--font-mono)',
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={v.stock}
                        onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-dark)',
                          width: '80px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                        }}
                      />
                    </td>
                    <td>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          style={{ color: 'var(--danger)', fontSize: '16px' }}
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleAddVariant}
          >
            <i className="ri-add-line"></i> Add Size Variant
          </button>
        </div>

        {/* Badges & Visibility */}
        <div className="data-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--navy)', marginBottom: '14px' }}>
            Storefront Badges & Visibility
          </h3>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span><strong>Active</strong> in Storefront</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
              <input
                type="checkbox"
                checked={formData.isNewArrival}
                onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
              />
              <span>Mark as <strong>New Arrival</strong></span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              />
              <span>Mark as <strong>Featured Piece</strong></span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
              <input
                type="checkbox"
                checked={formData.isBestSeller}
                onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
              />
              <span>Mark as <strong>Best Seller</strong></span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
          <Link href="/admin/products" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Saving Changes...' : 'Save Product Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
