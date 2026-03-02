import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { api } from '../lib/api';

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export function Layout({ children, showNav = true }: LayoutProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    router.push('/');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {showNav && (
        <nav
          style={{
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            padding: '14px 0',
          }}
        >
          <div
            className="container"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Link
              href="/"
              style={{
                fontWeight: 800,
                fontSize: '20px',
                color: 'var(--color-primary)',
                letterSpacing: '-0.5px',
              }}
            >
              MMXP
            </Link>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Link href="/leaderboard" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                Leaderboard
              </Link>
              <Link href="/dashboard" style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                Dashboard
              </Link>
              <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: '6px 14px', fontSize: '13px' }}>
                Sign out
              </button>
            </div>
          </div>
        </nav>
      )}
      <main style={{ flex: 1 }}>{children}</main>
      <footer
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: '20px 0',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '13px',
        }}
      >
        MMXP &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
