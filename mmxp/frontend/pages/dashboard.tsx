import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import useSWR from 'swr';
import { api, ApiError, type UserProfile, type EventHistory } from '../lib/api';
import { Layout } from '../components/Layout';

function OrdinalRank({ rank }: { rank: number }) {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = rank % 100;
  const s = suffix[(v - 20) % 10] ?? suffix[v] ?? suffix[0];
  return <>{rank}{s}</>;
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: '140px', textAlign: 'center' }}>
      <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
    </div>
  );
}

const DashboardPage: NextPage = () => {
  const router = useRouter();

  const { data, error, isLoading } = useSWR('me', () => api.getMe(), {
    revalidateOnFocus: false,
    onError: (err) => {
      if (err instanceof ApiError && (err.code === 'UNAUTHORIZED' || err.status === 401)) {
        router.replace('/');
      }
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Loading your dashboard…</p>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--color-error)', marginBottom: '16px' }}>
              Could not load your dashboard.
            </p>
            <a href="/" className="btn btn-primary">Sign in again</a>
          </div>
        </div>
      </Layout>
    );
  }

  const { user, events } = data;

  return (
    <>
      <Head>
        <title>MMXP — Dashboard</title>
      </Head>
      <Layout>
        <div className="container" style={{ padding: '40px 20px' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>
                Hey, {user.name.split(' ')[0]}!
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{user.email}</p>
            </div>
            <Link
              href={`/profile/${user.id}`}
              style={{
                fontSize: '13px',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
              }}
            >
              View public profile
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '40px', flexWrap: 'wrap' }}>
            <StatCard label="Points" value={user.points} />
            <StatCard label="Rank" value={<OrdinalRank rank={user.rank} />} />
            <StatCard label="Events" value={events.filter((e) => e.checkedIn).length} />
          </div>

          {/* Event History */}
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Event History</h2>
          {events.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              No events yet. Show up and earn points!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {events.map((event) => (
                <EventRow key={event.eventId} event={event} />
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

function EventRow({ event }: { event: EventHistory }) {
  const date = new Date(event.eventDate);
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      <div>
        <div style={{ fontWeight: 600, marginBottom: '2px' }}>{event.eventName}</div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          {date.toLocaleDateString(undefined, { dateStyle: 'medium' })}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {event.checkedIn ? (
          <span className="badge badge-primary">Checked in</span>
        ) : (
          <span className="badge" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
            Not checked in
          </span>
        )}
        <span
          style={{
            fontWeight: 700,
            fontSize: '16px',
            color: event.pointsAwarded > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
          }}
        >
          +{event.pointsAwarded} pts
        </span>
      </div>
    </div>
  );
}

export default DashboardPage;
