import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';

// ── Active Service ────────────────────────────────────────────────────────────
export default function ActiveServicePage() {
  const [activeJob, setActiveJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    api.get('/api/porter/active-job').then(r => setActiveJob(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const STATE_STEPS = ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
  const currentIdx = STATE_STEPS.indexOf(activeJob?.status);

  const verifyPin = async () => {
    if (pin.length !== 4) { setPinError('Enter 4-digit PIN'); return; }
    setVerifying(true); setPinError('');
    try {
      await api.post(`/api/porter/jobs/${activeJob.id}/verify-pin`, { pin });
      setActiveJob(j => ({ ...j, pinVerified: true }));
    } catch { setPinError('Incorrect PIN. Ask the passenger again.'); } finally { setVerifying(false); }
  };

  const updateStatus = async (status) => {
    setUpdatingStatus(true);
    try {
      const { data } = await api.put(`/api/porter/jobs/${activeJob.id}/status`, { status });
      setActiveJob(data);
    } catch {} finally { setUpdatingStatus(false); }
  };

  const collectCod = async () => {
    try {
      await api.post(`/api/porter/jobs/${activeJob.id}/cod-collected`);
      setActiveJob(j => ({ ...j, codCollected: true }));
    } catch {}
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner spinner-lg" /></div>;

  if (!activeJob) return (
    <div className="empty-state" style={{ padding: 80 }}>
      <div className="empty-state-icon">🏁</div>
      <div className="empty-state-title">No Active Job</div>
      <div className="empty-state-desc">You don't have any ongoing service right now.</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 580, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Status progress */}
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Job Progress</h3>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {STATE_STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: i < STATE_STEPS.length - 1 ? 0 : 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: i <= currentIdx ? 'var(--color-primary)' : 'var(--color-border)',
                  color: i <= currentIdx ? '#fff' : 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.857rem',
                  transition: 'all 0.3s',
                }}>
                  {i < currentIdx ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: '0.643rem', color: i === currentIdx ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: i === currentIdx ? 700 : 400, whiteSpace: 'nowrap' }}>
                  {s.replace('_', ' ')}
                </span>
              </div>
              {i < STATE_STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, background: i < currentIdx ? 'var(--color-primary)' : 'var(--color-border)', margin: '0 6px', marginBottom: 20, transition: 'background 0.3s' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Job details */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h4>{activeJob.serviceType || 'Porter Service'}</h4>
            <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)' }}>#{activeJob.bookingId?.slice(-8)}</div>
          </div>
          <span className="badge badge-primary badge-lg">{activeJob.status}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.857rem' }}>
          <div style={{ background: 'var(--color-surface)', padding: '10px 12px', borderRadius: 8 }}>
            <div style={{ fontSize: '0.714rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>FROM</div>
            <div style={{ fontWeight: 600 }}>📍 {activeJob.fromLocation}</div>
          </div>
          <div style={{ background: 'var(--color-surface)', padding: '10px 12px', borderRadius: 8 }}>
            <div style={{ fontSize: '0.714rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>TO</div>
            <div style={{ fontWeight: 600 }}>🏁 {activeJob.toLocation}</div>
          </div>
        </div>
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(27,58,107,0.04)', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.857rem', color: 'var(--color-text-muted)' }}>Earning</span>
          <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.143rem' }}>₹{activeJob.amount}</span>
        </div>
      </div>

      {/* PIN verification */}
      {activeJob.status === 'ACCEPTED' && !activeJob.pinVerified && (
        <div className="card" style={{ border: '2px solid var(--color-warning-light)' }}>
          <h4 style={{ marginBottom: 6 }}>🔐 Verify Passenger PIN</h4>
          <p style={{ fontSize: '0.857rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>
            Ask the passenger for their 4-digit booking PIN to start the service.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="form-input"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="4-digit PIN"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/,'').slice(0,4))}
              style={{ flex: 1, fontFamily: 'monospace', fontSize: '1.286rem', letterSpacing: '0.3em', textAlign: 'center' }}
            />
            <button className="btn btn-primary" onClick={verifyPin} disabled={verifying || pin.length !== 4}>
              {verifying ? <span className="spinner" /> : 'Verify'}
            </button>
          </div>
          {pinError && <div className="alert alert-error" style={{ marginTop: 10 }}>⚠️ {pinError}</div>}
        </div>
      )}

      {/* COD collection */}
      {activeJob.paymentMode === 'COD' && !activeJob.codCollected && activeJob.status === 'IN_PROGRESS' && (
        <div className="alert alert-warning">
          <div>
            <strong>💵 COD Collection Required</strong>
            <div style={{ marginTop: 4, fontSize: '0.857rem' }}>
              Collect ₹{activeJob.amount} in cash from the passenger before completing the job.
            </div>
            <button className="btn btn-primary btn-sm" onClick={collectCod} style={{ marginTop: 10 }}>
              ✓ Cash Collected — ₹{activeJob.amount}
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div>
        {activeJob.status === 'ACCEPTED' && activeJob.pinVerified && (
          <button className="btn btn-primary btn-lg" onClick={() => updateStatus('IN_PROGRESS')} disabled={updatingStatus} style={{ width: '100%' }}>
            {updatingStatus ? <><span className="spinner" /> Updating…</> : '▶ Start Service'}
          </button>
        )}
        {activeJob.status === 'IN_PROGRESS' && (
          <button
            className="btn btn-secondary btn-lg"
            onClick={() => updateStatus('COMPLETED')}
            disabled={updatingStatus || (activeJob.paymentMode === 'COD' && !activeJob.codCollected)}
            style={{ width: '100%' }}
          >
            {updatingStatus ? <><span className="spinner" /> Updating…</> : '✓ Mark as Completed'}
          </button>
        )}
      </div>
    </div>
  );
}
