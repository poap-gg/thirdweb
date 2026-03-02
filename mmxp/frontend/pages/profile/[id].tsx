import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '../../components/Layout';
import type { PublicProfile, EventHistory } from '../../lib/api';

interface Props {
  profile: PublicProfile | null;
  id: string;
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { id } = ctx.params as { id: string };
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001';

  try {
    const res = await fetch(`${apiBase}/api/users/profile/${id}`);
    const json = await res.json();
    if (!json.ok) return { props: { profile: null, id } };
    return { props: { profile: json.data as PublicProfile, id } };
  } catch {
    return { props: { profile: null, id } };
  }
};

const ProfilePage: NextPage<Props> = ({ profile, id }) => {
  if (!profile) {
    return (
      <>
        <Head>
          <title>MMXP — Profile not found</title>
        </Head>
        <Layout>
          <div
            style={{
              minHeight: '60vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
                Profile not found
              </h1>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                This profile doesn&apos;t exist or has been removed.
              </p>
              <Link href="/leaderboard" className="btn btn-primary" style={{ display: 'inline-block' }}>
                View Leaderboard
              </Link>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{profile.name} — MMXP Profile</title>
        <meta name="description" content={`${profile.name} has ${profile.points} MMXP points and is ranked #${profile.rank}.`} />
        <meta property="og:title" content={`${profile.name} — MMXP`} />
        <meta property="og:description" content={`${profile.points} points · Rank #${profile.rank}`} />
      </Head>
      <Layout>
        <div className="container" style={{ padding: '40px 20px' }}>
          {/* Profile header */}
          <div className="card" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(108, 99, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 800,
                color: 'var(--color-primary)',
                flexShrink: 0,
              }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>{profile.name}</h1>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-muted)', fontSize: '14px', flexWrap: 'wrap' }}>
                <span>
                  <strong style={{ color: 'var(--color-primary)' }}>{profile.points}</strong> points
                </span>
                <span>
                  Rank <strong style={{ color: 'var(--color-text)' }}>#{profile.rank}</strong>
                </span>
                <span>
                  <strong style={{ color: 'var(--color-text)' }}>{profile.events.length}</strong> events
                </span>
              </div>
            </div>
          </div>

          {/* Event list */}
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)' }}>
            Events attended
          </h2>
          {profile.events.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              No events yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {profile.events.map((event) => (
                <ProfileEventRow key={event.eventId} event={event} />
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

function ProfileEventRow({ event }: { event: EventHistory }) {
  const date = new Date(event.eventDate);
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      <div>
        <div style={{ fontWeight: 600 }}>{event.eventName}</div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          {date.toLocaleDateString(undefined, { dateStyle: 'medium' })}
        </div>
      </div>
      <span
        style={{
          fontWeight: 700,
          color: event.pointsAwarded > 0 ? 'var(--color-success)' : 'var(--color-text-muted)',
        }}
      >
        +{event.pointsAwarded} pts
      </span>
    </div>
  );
}

export default ProfilePage;
