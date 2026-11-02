'use client';

import React, { useState, useRef } from 'react';
import { getImageUrl } from '@/lib/imageHelper';

export function MultiImageUploader({
  images = [],
  onChange,
  label = 'Product Images & Media Gallery',
}) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'url'
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  // Normalize images to object format: { url, alt, is_primary, sort_order }
  const normalizedImages = (images || []).map((img, idx) => {
    if (typeof img === 'string') {
      return { url: img, alt: '', is_primary: idx === 0 ? 1 : 0, sort_order: idx };
    }
    return {
      url: img.url || '',
      alt: img.alt || '',
      is_primary: img.is_primary ? 1 : (idx === 0 ? 1 : 0),
      sort_order: typeof img.sort_order === 'number' ? img.sort_order : idx,
    };
  });

  const notifyChange = (newImages) => {
    // Ensure if we have images, at least one is primary
    if (newImages.length > 0 && !newImages.some((i) => i.is_primary === 1)) {
      newImages[0].is_primary = 1;
    }
    // Update sort_order based on array index
    const sorted = newImages.map((img, idx) => ({
      ...img,
      sort_order: idx,
    }));
    onChange(sorted);
  };

  const handleFilesUpload = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const validFiles = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Some files were skipped because they are not valid images.');
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        setErrorMsg('Some files were skipped because they exceed the 15MB limit.');
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    setErrorMsg('');
    setUploadProgress(`Uploading ${validFiles.length} image(s)...`);

    try {
      const formData = new FormData();
      validFiles.forEach((file) => formData.append('files', file));

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const uploadedUrls = data.urls || [data.url];
        const newAdditions = uploadedUrls.map((url, i) => ({
          url,
          alt: '',
          is_primary: normalizedImages.length === 0 && i === 0 ? 1 : 0,
          sort_order: normalizedImages.length + i,
        }));

        notifyChange([...normalizedImages, ...newAdditions]);
      } else {
        setErrorMsg(data.error || 'Failed to upload images.');
      }
    } catch (err) {
      setErrorMsg('Network error while uploading images.');
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = (e) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    const newAdditions = [
      ...normalizedImages,
      {
        url: trimmed,
        alt: '',
        is_primary: normalizedImages.length === 0 ? 1 : 0,
        sort_order: normalizedImages.length,
      },
    ];

    notifyChange(newAdditions);
    setUrlInput('');
  };

  const handleSetPrimary = (index) => {
    const updated = normalizedImages.map((img, i) => ({
      ...img,
      is_primary: i === index ? 1 : 0,
    }));
    notifyChange(updated);
  };

  const handleRemove = (index) => {
    const updated = normalizedImages.filter((_, i) => i !== index);
    notifyChange(updated);
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= normalizedImages.length) return;

    const updated = [...normalizedImages];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    notifyChange(updated);
  };

  const handleAltChange = (index, alt) => {
    const updated = [...normalizedImages];
    updated[index].alt = alt;
    notifyChange(updated);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>
            {label} *
          </label>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
            ({normalizedImages.length} attached)
          </span>
        </div>

        {/* Tab selector */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--paper-2)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'upload' ? '#fff' : 'transparent',
              color: activeTab === 'upload' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'upload' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <i className="ri-upload-cloud-line" style={{ marginRight: '4px' }}></i> Upload Photos
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            style={{
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'url' ? '#fff' : 'transparent',
              color: activeTab === 'url' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'url' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <i className="ri-link" style={{ marginRight: '4px' }}></i> Add by URL
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
          {errorMsg}
        </div>
      )}

      {/* Upload Drop Zone Tab */}
      {activeTab === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-dark)'}`,
            borderRadius: '10px',
            padding: '24px 16px',
            textAlign: 'center',
            background: isDragging ? 'var(--primary-wash)' : 'var(--paper-2)',
            cursor: uploading ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFilesUpload(e.target.files)}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
              }}
            >
              {uploading ? (
                <i className="ri-loader-4-line ri-spin"></i>
              ) : (
                <i className="ri-image-add-line"></i>
              )}
            </div>

            <div>
              <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--navy)', marginBottom: '2px' }}>
                {uploading ? uploadProgress : 'Click to select multiple photos or drag and drop'}
              </p>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Supports multiple JPG, PNG, WEBP, or AVIF files up to 15MB each
              </p>
            </div>
          </div>
        </div>
      )}

      {/* URL Tab */}
      {activeTab === 'url' && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="https://example.com/photo.jpg or /products/sample.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl(e))}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '6px',
              border: '1.5px solid var(--border-dark)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleAddUrl}
          >
            <i className="ri-add-line"></i> Add Image
          </button>
        </div>
      )}

      {/* Image Gallery Grid */}
      {normalizedImages.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Attached Photos ({normalizedImages.length}) — Click "Cover" to choose primary photo
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: '12px',
            }}
          >
            {normalizedImages.map((img, idx) => {
              const previewSrc = getImageUrl(img.url);
              const isCover = img.is_primary === 1;

              return (
                <div
                  key={`${img.url}-${idx}`}
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    border: isCover ? '2.5px solid var(--accent)' : '1px solid var(--border-dark)',
                    background: '#fff',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isCover ? '0 0 0 2px var(--accent-wash)' : 'var(--shadow-sm)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Thumbnail Image */}
                  <div
                    style={{
                      aspectRatio: '1/1',
                      width: '100%',
                      background: 'var(--paper-3)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={previewSrc}
                      alt={img.alt || `Product image ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />

                    {/* Cover badge */}
                    {isCover && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '6px',
                          left: '6px',
                          background: 'var(--accent)',
                          color: '#fff',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <i className="ri-star-fill" style={{ fontSize: '10px' }}></i> Cover
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      title="Delete this image"
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                      }}
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>

                  {/* Controls below image */}
                  <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {!isCover ? (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(idx)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            border: '1px solid var(--border-dark)',
                            background: '#fff',
                            color: 'var(--text-body)',
                            cursor: 'pointer',
                          }}
                        >
                          <i className="ri-star-line"></i> Set Cover
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)' }}>
                          Primary Cover
                        </span>
                      )}

                      {/* Reorder arrows */}
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <button
                          type="button"
                          onClick={() => handleMove(idx, -1)}
                          disabled={idx === 0}
                          title="Move Left"
                          style={{
                            padding: '2px 5px',
                            fontSize: '12px',
                            border: '1px solid var(--border)',
                            background: idx === 0 ? 'var(--paper-2)' : '#fff',
                            color: idx === 0 ? 'var(--text-light)' : 'var(--text-main)',
                            borderRadius: '3px',
                            cursor: idx === 0 ? 'default' : 'pointer',
                          }}
                        >
                          &larr;
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(idx, 1)}
                          disabled={idx === normalizedImages.length - 1}
                          title="Move Right"
                          style={{
                            padding: '2px 5px',
                            fontSize: '12px',
                            border: '1px solid var(--border)',
                            background: idx === normalizedImages.length - 1 ? 'var(--paper-2)' : '#fff',
                            color: idx === normalizedImages.length - 1 ? 'var(--text-light)' : 'var(--text-main)',
                            borderRadius: '3px',
                            cursor: idx === normalizedImages.length - 1 ? 'default' : 'pointer',
                          }}
                        >
                          &rarr;
                        </button>
                      </div>
                    </div>

                    {/* Alt label input */}
                    <input
                      type="text"
                      placeholder="Label (e.g. Back view)"
                      value={img.alt || ''}
                      onChange={(e) => handleAltChange(idx, e.target.value)}
                      style={{
                        padding: '4px 6px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

