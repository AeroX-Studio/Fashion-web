'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Auto login
        const loginRes = await signIn('credentials', {
          redirect: false,
          identifier: formData.phone,
          password: formData.password,
        });

        if (loginRes?.ok) {
          router.push(callbackUrl);
          router.refresh();
        } else {
          router.push('/login');
        }
      } else {
        setErrorMsg(data.error || 'Registration failed.');
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMsg('Failed to register. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="container sec-pad" style={{ maxWidth: '480px', margin: '20px auto' }}>
      <div className="data-card" style={{ padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Image
            src="/logo.jpg"
            alt="Nobo Fashion"
            width={160}
            height={44}
            style={{ height: '38px', width: 'auto', margin: '0 auto 12px', objectFit: 'contain' }}
          />
          <h1 style={{ fontSize: '22px', color: 'var(--navy)' }}>Create an Account</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Join Nobo Fashion for easy Cash on Delivery orders & tracking.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              border: '1px solid #FECACA',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '18px',
              fontSize: '13px',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Sadia Rahman"
              value={formData.name}
              onChange={handleChange}
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
              Mobile Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              required
              placeholder="01XXXXXXXXX"
              value={formData.phone}
              onChange={handleChange}
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
              Email Address (Optional)
            </label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
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
              Delivery Address (Optional)
            </label>
            <input
              type="text"
              name="address"
              placeholder="House, Road, Area, City"
              value={formData.address}
              onChange={handleChange}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                Password *
              </label>
              <input
                type="password"
                name="password"
                required
                placeholder="Min 6 chars"
                value={formData.password}
                onChange={handleChange}
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
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                placeholder="Repeat password"
                value={formData.confirmPassword}
                onChange={handleChange}
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
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isLoading}
            style={{ marginTop: '10px' }}
          >
            {isLoading ? 'Creating Account...' : 'Create Account & Continue'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-light)', fontSize: '13px' }}>
          Already have an account?{' '}
          <Link href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Sign in &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="container sec-pad text-center">Loading registration...</div>}>
      <RegisterFormContent />
    </Suspense>
  );
}
