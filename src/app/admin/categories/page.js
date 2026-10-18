'use client';

import React, { useState, useEffect } from 'react';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { getImageUrl } from '@/lib/imageHelper';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New category form
  const [newCat, setNewCat] = useState({
    name: '',
    slug: '',
    image: '',
    description: '',
    show_in_sidebar: true,
    show_in_header: false,
    show_on_homepage: false,
    sort_order: 0,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');


  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle single checkbox toggle
  const handleToggle = async (catId, field, currentValue) => {
    const newValue = currentValue === 1 ? 0 : 1;

    // Optimistic UI update
    setCategories((prev) =>
      prev.map((c) => (c.id === catId ? { ...c, [field]: newValue } : c))
    );

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: catId, field, value: newValue }),
      });
      if (!res.ok) {
        // Rollback
        fetchCategories();
      }
    } catch (e) {
      fetchCategories();
    }
  };

  // Handle new category submission
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;

    setCreating(true);
    setCreateError('');

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        setNewCat({
          name: '',
          slug: '',
          image: '',
          description: '',
          show_in_sidebar: true,
          show_in_header: false,
          show_on_homepage: false,
          sort_order: 0,
        });
        fetchCategories();
      } else {

        setCreateError(data.error || 'Failed to create category.');
      }
    } catch (err) {
      setCreateError('Network error occurred.');
    } finally {
      setCreating(false);
    }
  };

  // Handle delete
  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert('Failed to delete category.');
      }
    } catch (e) {
      alert('Error deleting category.');
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--navy)' }}>Category Management</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Manage product categories and toggle <strong>Sidebar ON/OFF</strong> visibility for the storefront
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <i className="ri-add-line"></i> Create New Category
        </button>
      </div>

      {/* Categories Card & Table */}
      <div className="data-card">
        <div className="data-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <strong>All Categories ({filteredCategories.length})</strong>
          </div>

          <div style={{ width: '280px' }}>
            <input
              type="search"
              placeholder="Search category name or slug..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: '6px',
                border: '1.5px solid var(--border-dark)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading categories...</div>
        ) : filteredCategories.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No categories found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Slug</th>
                  <th style={{ textAlign: 'center' }}>Products</th>
                  <th style={{ textAlign: 'center' }}>Show in Sidebar</th>
                  <th style={{ textAlign: 'center' }}>Header Menu</th>
                  <th style={{ textAlign: 'center' }}>Homepage</th>
                  <th style={{ textAlign: 'center' }}>Active</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {cat.image ? (
                          <img
                            src={getImageUrl(cat.image)}
                            alt={cat.name}
                            style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border)' }}
                          />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                            <i className="ri-folder-image-line"></i>
                          </div>
                        )}
                        <strong style={{ fontSize: '14px', color: 'var(--navy)' }}>{cat.name}</strong>
                      </div>
                    </td>

                    <td>
                      <code style={{ fontSize: '11.5px', background: 'var(--paper-2)', padding: '2px 6px', borderRadius: '4px' }}>
                        {cat.slug}
                      </code>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {cat.product_count || 0}
                      </span>
                    </td>

                    {/* Sidebar Toggle Checkbox */}
                    <td style={{ textAlign: 'center' }}>
                      <label className="switch" title="Toggle Sidebar Visibility">
                        <input
                          type="checkbox"
                          checked={cat.show_in_sidebar === 1}
                          onChange={() => handleToggle(cat.id, 'show_in_sidebar', cat.show_in_sidebar)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>

                    {/* Header Nav Toggle */}
                    <td style={{ textAlign: 'center' }}>
                      <label className="switch" title="Toggle Header Navigation">
                        <input
                          type="checkbox"
                          checked={cat.show_in_header === 1}
                          onChange={() => handleToggle(cat.id, 'show_in_header', cat.show_in_header)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>

                    {/* Homepage Grid Toggle */}
                    <td style={{ textAlign: 'center' }}>
                      <label className="switch" title="Toggle Homepage Grid">
                        <input
                          type="checkbox"
                          checked={cat.show_on_homepage === 1}
                          onChange={() => handleToggle(cat.id, 'show_on_homepage', cat.show_on_homepage)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>

                    {/* Active Status Toggle */}
                    <td style={{ textAlign: 'center' }}>
                      <label className="switch" title="Toggle Active Status">
                        <input
                          type="checkbox"
                          checked={cat.is_active === 1}
                          onChange={() => handleToggle(cat.id, 'is_active', cat.is_active)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        style={{ color: 'var(--danger)', fontSize: '15px' }}
                        title="Delete Category"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create Category Modal ── */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--paper-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="ri-close-line"></i>
            </button>

            <h3 style={{ fontSize: '20px', color: 'var(--navy)', marginBottom: '16px' }}>
              Create New Category
            </h3>

            {createError && (
              <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '14px' }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cotton Kurti, Exclusive Abaya"
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-dark)',
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Slug (Optional - auto generated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. cotton-kurti"
                  value={newCat.slug}
                  onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-dark)',
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Short description for category page"
                  value={newCat.description}
                  onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-dark)',
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                ></textarea>
              </div>

              <div>
                <ImageUploader
                  label="Category Photo / Banner (Optional)"
                  currentImage={newCat.image}
                  onImageChange={(url) => setNewCat({ ...newCat, image: url })}
                />
              </div>

              {/* Checkboxes Settings */}

              <div style={{ background: 'var(--paper-2)', padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Display Options:
                </span>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newCat.show_in_sidebar}
                    onChange={(e) => setNewCat({ ...newCat, show_in_sidebar: e.target.checked })}
                  />
                  <span>Show in Sidebar (Shop Page)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newCat.show_in_header}
                    onChange={(e) => setNewCat({ ...newCat, show_in_header: e.target.checked })}
                  />
                  <span>Show in Header Navigation</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newCat.show_on_homepage}
                    onChange={(e) => setNewCat({ ...newCat, show_on_homepage: e.target.checked })}
                  />
                  <span>Show in Homepage Featured Categories</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
