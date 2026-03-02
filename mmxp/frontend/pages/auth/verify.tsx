import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { api, ApiError } from '../../lib/api';

const VerifyPage: NextPage = () => {
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const { token } = router.query;
    if (!token || typeof token !== 'string') return;

    api
      .verifyToken(token)
      .then(() => {
        setStatus('success');
        setTimeout(() => router.replace('/dashboard'), 1200);
      })
      .catch((err) => {
        const msg =
          err instanceof ApiError
            ? err.code === 'SESSION_EXPIRED'
              ? 'This sign-in link has expired or already been used. Please request a new one.'
              : err.message
            : 'Verification failed. Please try again.';
        setErrorMsg(msg);
        setStatus('error');
      });
  }, [router.query]);

  return (
    <>
      <Head>
        <title>MMXP — Verifying</title>
      </Head>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          {status === 'verifying' && (
            <>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔑</div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                Verifying your link…
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                Hang tight, this only takes a moment.
              </p>
            </>
          )}
          {status === 'success' && (
            <>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                Signed in!
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                Redirecting to your dashboard…
              </p>
            </>
          )}
          {status === 'error' && (
            <>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>❌</div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-error)' }}>
                Sign-in failed
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                {errorMsg}
              </p>
              <a href="/" className="btn btn-primary" style={{ display: 'inline-block' }}>
                Back to sign in
              </a>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default VerifyPage;
