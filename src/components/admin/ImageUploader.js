'use client';

import React, { useState, useRef } from 'react';

export function ImageUploader({ currentImage, onImageChange, label = 'Product Featured Image' }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'url'
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WEBP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onImageChange(data.url);
      } else {
        setUploadError(data.error || 'Failed to upload image.');
      }
    } catch (err) {
      setUploadError('Network error during image upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
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

  const handleRemoveImage = () => {
    onImageChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)' }}>
          {label} *
        </label>

        {/* Tab selector */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--paper-2)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              background: activeTab === 'upload' ? '#fff' : 'transparent',
              color: activeTab === 'upload' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'upload' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <i className="ri-upload-cloud-line"></i> Upload from Device
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              background: activeTab === 'url' ? '#fff' : 'transparent',
              color: activeTab === 'url' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'url' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            <i className="ri-link"></i> Web URL
          </button>
        </div>
      </div>

      {uploadError && (
        <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '8px 12px', borderRadius: '6px', fontSize: '12.5px' }}>
          <i className="ri-error-warning-line"></i> {uploadError}
        </div>
      )}

      {/* Mode 1: File Drag & Drop Upload */}
      {activeTab === 'upload' && (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          {!currentImage ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{
                border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border-dark)',
                background: isDragging ? 'var(--primary-wash)' : 'var(--paper-2)',
                borderRadius: '12px',
                padding: '36px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {uploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <i className="ri-loader-4-line" style={{ fontSize: '32px', color: 'var(--primary)', animation: 'spin 1s linear infinite' }}></i>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>
                    Saving image to data/images...
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      color: 'var(--primary)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <i className="ri-upload-2-line"></i>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)' }}>
                    Click to browse or drag & drop photo here
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    PNG, JPG, WEBP or GIF up to 10MB &bull; Saved to <code style={{ background: '#fff', padding: '1px 4px', borderRadius: '3px' }}>data/images</code>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Live Image Preview Card */
            <div
              style={{
                border: '1.5px solid var(--border)',
                borderRadius: '12px',
                padding: '16px',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '100px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: 'var(--paper-3)',
                  border: '1px solid var(--border)',
                  flexShrink: 0,
                }}
              >
                <img
                  src={currentImage}
                  alt="Product preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', background: 'var(--success-bg)', color: 'var(--success)', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                    READY
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentImage}
                  </span>
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Image is ready for display in catalog and product pages.
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <i className="ri-refresh-line"></i> Replace Photo
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleRemoveImage}
                    style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                  >
                    <i className="ri-delete-bin-line"></i> Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Direct URL Input */}
      {activeTab === 'url' && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="https://example.com/images/product.jpg or /placeholder.jpg"
            value={currentImage}
            onChange={(e) => onImageChange(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1.5px solid var(--border-dark)',
              fontSize: '13.5px',
              outline: 'none',
            }}
          />

          {currentImage && (
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                flexShrink: 0,
              }}
            >
              <img src={currentImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
