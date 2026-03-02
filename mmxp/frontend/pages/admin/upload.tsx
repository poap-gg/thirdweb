import { useState, useRef, FormEvent } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Layout } from '../../components/Layout';

interface UploadResult {
  eventId: string;
  eventName: string;
  totalRows: number;
  checkedIn: number;
  newUsers: number;
  returningUsers: number;
}

const AdminUploadPage: NextPage = () => {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !eventName) return;

    setStatus('uploading');
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('eventName', eventName);
    if (eventDate) formData.append('eventDate', eventDate);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const json = await res.json();
      if (!json.ok) {
        setErrorMsg(json.error?.message ?? 'Upload failed');
        setStatus('error');
        return;
      }
      setResult(json.data as UploadResult);
      setStatus('success');
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  return (
    <>
      <Head>
        <title>MMXP Admin — Upload CSV</title>
      </Head>
      <Layout>
        <div className="container" style={{ padding: '40px 20px', maxWidth: '640px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>Upload Luma CSV</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px', fontSize: '15px' }}>
            Upload an attendee export from Luma to award MMXP points for check-ins.
          </p>

          {status === 'success' && result ? (
            <div className="card">
              <div style={{ fontSize: '36px', marginBottom: '12px', textAlign: 'center' }}>🎉</div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', textAlign: 'center' }}>
                Upload complete!
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <ResultRow label="Event" value={result.eventName} />
                <ResultRow label="Total rows" value={result.totalRows} />
                <ResultRow label="Checked in" value={result.checkedIn} highlight />
                <ResultRow label="New users" value={result.newUsers} />
                <ResultRow label="Returning users" value={result.returningUsers} />
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '20px' }}
                onClick={() => { setStatus('idle'); setResult(null); if (fileRef.current) fileRef.current.value = ''; }}
              >
                Upload another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle}>Event Name *</label>
                <input
                  type="text"
                  placeholder="e.g. March Community Meetup"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                  disabled={status === 'uploading'}
                />
              </div>
              <div>
                <label style={labelStyle}>Event Date (optional)</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  disabled={status === 'uploading'}
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text)',
                    fontSize: '15px',
                    padding: '10px 14px',
                    width: '100%',
                  }}
                />
              </div>
              <div>
                <label style={labelStyle}>Luma CSV Export *</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  required
                  disabled={status === 'uploading'}
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-text)',
                    fontSize: '14px',
                    padding: '10px 14px',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                />
                <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '6px' }}>
                  Accepts Luma guest list exports (.csv). Max 10 MB.
                </p>
              </div>

              {status === 'error' && (
                <p className="error-text">{errorMsg}</p>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={status === 'uploading'}
                style={{ width: '100%' }}
              >
                {status === 'uploading' ? 'Uploading & sending emails…' : 'Upload CSV'}
              </button>
            </form>
          )}
        </div>
      </Layout>
    </>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

function ResultRow({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <span style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{label}</span>
      <span
        style={{
          fontWeight: 700,
          fontSize: '14px',
          color: highlight ? 'var(--color-success)' : 'var(--color-text)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default AdminUploadPage;
