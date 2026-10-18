'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImageUploader } from '@/components/admin/ImageUploader';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [productData, setProductData] = useState({
    name: '',
    slug: '',
    categoryId: '',
    sku: '',
    price: '',
    salePrice: '',
    stock: 20,
    description: '',
    imageUrl: '',
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: false,
  });

  // Size Variants State
  const [variants, setVariants] = useState([
    { size_name: 'Free', price: '', stock: 20, color_name: '' },
  ]);

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0) {
            setProductData((prev) => ({ ...prev, categoryId: data[0].id }));
          }
        }
      })
      .catch(console.error);
  }, []);

  // Quick Size Presets
  const applyPreset = (presetType) => {
    const basePrice = productData.price;
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
      { size_name: 'New Size', price: productData.price, stock: 10, color_name: '' },
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
    if (!productData.name.trim() || !productData.price) {
      setErrorMsg('Product name and price are required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productData,
          stock: totalStock || productData.stock,
          variants,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/admin/products');
      } else {
        setErrorMsg(data.error || 'Failed to create product.');
        setLoading(false);
      }
    } catch (err) {
      setErrorMsg('Network error occurred.');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--navy)' }}>Add New Product</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Create a piece with customizable size variants and stock
          </p>
        </div>

        <Link href="/admin/products" className="btn btn-secondary btn-sm">
          &larr; Back to Catalog
        </Link>
      </div>

      {errorMsg && (
        <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px 18px', borderRadius: '8px', fontSize: '13.5px' }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Card 1: Basic Details */}
        <div className="data-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--navy)', marginBottom: '18px' }}>
            Basic Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Pakistani Bin Hameed Inspired"
                value={productData.name}
                onChange={(e) => setProductData({ ...productData, name: e.target.value })}
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
                value={productData.categoryId}
                onChange={(e) => setProductData({ ...productData, categoryId: e.target.value })}
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
                placeholder="e.g. 4200"
                value={productData.price}
                onChange={(e) => setProductData({ ...productData, price: e.target.value })}
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
                placeholder="e.g. 3900"
                value={productData.salePrice}
                onChange={(e) => setProductData({ ...productData, salePrice: e.target.value })}
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
                SKU Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. PRY-PAK04"
                value={productData.sku}
                onChange={(e) => setProductData({ ...productData, sku: e.target.value })}
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
              currentImage={productData.imageUrl}
              onImageChange={(url) => setProductData({ ...productData, imageUrl: url })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              Description & Fabric Details
            </label>
            <textarea
              rows="4"
              placeholder="Describe embroidery, fabric, matching dupatta and trouser specifications..."
              value={productData.description}
              onChange={(e) => setProductData({ ...productData, description: e.target.value })}
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

        {/* Card 2: Size & Variant Generator */}
        <div className="data-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '16px', color: 'var(--navy)' }}>Size & Stock Variants</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Set up specific sizes that will show as interactive chips on the storefront
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
                        placeholder="e.g. Maroon"
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
                        placeholder={productData.price || 'Price'}
                        value={v.price || ''}
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
            <i className="ri-add-line"></i> Add Another Size Variant
          </button>
        </div>

        {/* Card 3: Flags */}
        <div className="data-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--navy)', marginBottom: '14px' }}>
            Storefront Badges & Visibility
          </h3>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
              <input
                type="checkbox"
                checked={productData.isNewArrival}
                onChange={(e) => setProductData({ ...productData, isNewArrival: e.target.checked })}
              />
              <span>Mark as <strong>New Arrival</strong></span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
              <input
                type="checkbox"
                checked={productData.isFeatured}
                onChange={(e) => setProductData({ ...productData, isFeatured: e.target.checked })}
              />
              <span>Mark as <strong>Featured Piece</strong></span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
              <input
                type="checkbox"
                checked={productData.isBestSeller}
                onChange={(e) => setProductData({ ...productData, isBestSeller: e.target.checked })}
              />
              <span>Mark as <strong>Best Seller</strong></span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
          <Link href="/admin/products" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Saving Piece...' : 'Publish Product to Store'}
          </button>
        </div>
      </form>
    </div>
  );
}
