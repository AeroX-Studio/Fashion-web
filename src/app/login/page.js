'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        identifier: identifier.trim(),
        password: password,
      });

      if (res?.ok) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setErrorMsg('Invalid email/phone or password. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMsg('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="container sec-pad" style={{ maxWidth: '440px', margin: '20px auto' }}>
      <div className="data-card" style={{ padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Image
            src="/logo.jpg"
            alt="Nobo Fashion"
            width={160}
            height={44}
            style={{ height: '38px', width: 'auto', margin: '0 auto 12px', objectFit: 'contain' }}
          />
          <h1 style={{ fontSize: '22px', color: 'var(--navy)' }}>Sign In to Your Account</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Track your orders, view invoices and manage your wishlist.
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

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
              Mobile Phone or Email
            </label>
            <input
              type="text"
              required
              placeholder="01XXXXXXXXX or email@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-dark)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-dark)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isLoading}
            style={{ marginTop: '8px' }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-light)', fontSize: '13px' }}>
          Don&apos;t have an account?{' '}
          <Link href={`/register${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Create one &rarr;
          </Link>
        </div>

        {/* Demo Admin Quick Login Helper */}
        <div style={{ marginTop: '20px', padding: '12px', background: 'var(--paper-2)', borderRadius: '8px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
          <strong>Demo Admin Login:</strong>
          <div>Email: <code>admin@priyocollection.com</code></div>
          <div>Password: <code>admin123456</code></div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container sec-pad text-center">Loading login...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
