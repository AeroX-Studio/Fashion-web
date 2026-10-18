'use client';

import React, { useState } from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  if (subscribed) {
    return (
      <div
        style={{
          background: 'var(--success-bg)',
          color: 'var(--success)',
          padding: '12px 20px',
          borderRadius: 'var(--radius)',
          fontSize: '14px',
          fontWeight: 600,
          border: '1px solid #A7F3D0',
        }}
      >
        <i className="ri-checkbox-circle-fill"></i> Thank you for subscribing to Nobo Fashion newsletter!
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', gap: '10px', maxWidth: '460px', margin: '0 auto' }}
    >
      <input
        type="email"
        required
        placeholder="Enter your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          flex: 1,
          padding: '12px 18px',
          borderRadius: 'var(--radius)',
          border: '1.5px solid var(--border-dark)',
          fontSize: '14px',
          outline: 'none',
          background: '#fff',
        }}
      />
      <button type="submit" className="btn btn-primary">
        Subscribe
      </button>
    </form>
  );
}
