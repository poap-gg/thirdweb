import { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import useSWR from 'swr';
import { api, type LeaderboardEntry } from '../lib/api';
import { Layout } from '../components/Layout';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ fontSize: '20px' }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: '20px' }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: '20px' }}>🥉</span>;
  return (
    <span
      style={{
        minWidth: '28px',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontWeight: 600,
        fontSize: '14px',
      }}
    >
      {rank}
    </span>
  );
}

const LeaderboardPage: NextPage = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useSWR(
    ['leaderboard', page],
    () => api.getLeaderboard(page),
    { revalidateOnFocus: false }
  );

  return (
    <>
      <Head>
        <title>MMXP — Leaderboard</title>
      </Head>
      <Layout>
        <div className="container" style={{ padding: '40px 20px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '6px' }}>Leaderboard</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '15px' }}>
              Top community members ranked by MMXP points.
            </p>
          </div>

          {isLoading && (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '60px 0' }}>
              Loading…
            </p>
          )}

          {error && (
            <p style={{ color: 'var(--color-error)', textAlign: 'center', padding: '60px 0' }}>
              Could not load leaderboard. Please try again.
            </p>
          )}

          {data && (
            <>
              <div
                className="card"
                style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}
              >
                {data.entries.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No entries yet. Be the first to show up!
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <th style={thStyle}>Rank</th>
                        <th style={{ ...thStyle, textAlign: 'left' }}>Name</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.entries.map((entry) => (
                        <LeaderboardRow key={entry.id} entry={entry} />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '8px 20px', fontSize: '13px' }}
                >
                  Previous
                </button>
                <span style={{ alignSelf: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  Page {page}
                </span>
                <button
                  className="btn btn-ghost"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={data.entries.length < data.pageSize}
                  style={{ padding: '8px 20px', fontSize: '13px' }}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </Layout>
    </>
  );
};

const thStyle: React.CSSProperties = {
  padding: '12px 20px',
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--color-text-muted)',
};

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const isTop3 = entry.rank <= 3;
  return (
    <tr
      style={{
        borderBottom: '1px solid var(--color-border)',
        background: isTop3 ? 'rgba(108, 99, 255, 0.04)' : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      <td style={{ padding: '14px 20px', textAlign: 'center', width: '60px' }}>
        <RankBadge rank={entry.rank} />
      </td>
      <td style={{ padding: '14px 20px' }}>
        <Link
          href={`/profile/${entry.id}`}
          style={{
            fontWeight: 600,
            fontSize: '15px',
            color: isTop3 ? 'var(--color-primary)' : 'var(--color-text)',
          }}
        >
          {entry.name}
        </Link>
      </td>
      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
        <span
          style={{
            fontWeight: 700,
            fontSize: '15px',
            color: isTop3 ? 'var(--color-gold)' : 'var(--color-text)',
          }}
        >
          {entry.points}
        </span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginLeft: '4px' }}>pts</span>
      </td>
    </tr>
  );
}

export default LeaderboardPage;
