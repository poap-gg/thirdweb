import { useState, FormEvent } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { api, ApiError } from '../lib/api';

const Home: NextPage = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      await api.requestMagicLink(email.trim());
      setStatus('sent');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      setErrorMsg(msg);
      setStatus('error');
    }
  }

  return (
    <>
      <Head>
        <title>MMXP — Loyalty Points</title>
      </Head>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          background: 'var(--color-bg)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              background: 'rgba(108, 99, 255, 0.15)',
              borderRadius: '18px',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '36px' }}>⚡</span>
          </div>
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 800,
              letterSpacing: '-1.5px',
              color: 'var(--color-text)',
              marginBottom: '12px',
            }}
          >
            MMXP
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '18px', maxWidth: '400px' }}>
            Your loyalty points for showing up. Check your score, rank, and event history.
          </p>
        </div>

        <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
          {status === 'sent' ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📬</div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                Check your inbox!
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>
                If an account exists for <strong>{email}</strong>, we&apos;ve sent you a sign-in link.
              </p>
              <button
                className="btn btn-ghost"
                style={{ marginTop: '20px', width: '100%' }}
                onClick={() => { setStatus('idle'); setEmail(''); }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Sign in</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                Enter your email to receive a magic sign-in link.
              </p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={status === 'loading'}
                    autoFocus
                  />
                  {status === 'error' && <p className="error-text">{errorMsg}</p>}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={status === 'loading' || !email}
                  style={{ width: '100%' }}
                >
                  {status === 'loading' ? 'Sending…' : 'Send sign-in link'}
                </button>
              </form>
            </>
          )}
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '24px' }}>
          <Link href="/leaderboard" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Leaderboard
          </Link>
        </div>
      </div>
    </>
  );
};

export default Home;
