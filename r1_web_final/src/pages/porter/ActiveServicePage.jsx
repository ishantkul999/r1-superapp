import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';

function extractErr(err, fb = 'Something went wrong') {
  const d = err?.response?.data;
  if (!d) return err?.message || fb;
  if (typeof d.error === 'string')   return d.error;
  if (typeof d.message === 'string') return d.message;
  if (typeof d === 'string')         return d;
  return fb;
}

const SVC_LABEL = {
  LUGGAGE_ONLY: 'Luggage Porter', LUGGAGE_BARROW: 'Luggage Barrow',
  WHEELCHAIR_ONLY: 'Wheelchair Assistance', WHEELCHAIR_STRETCHER: 'Stretcher/Bed Chair',
  COMBINED: 'Combined — Luggage + Wheelchair',
};

export default function ActiveServicePage() {
  const [activeJob, setActiveJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [codCollected, setCodCollected] = useState(false);
  const [banner, setBanner] = useState(null);

  const flash = (type, msg) => { setBanner({ type, msg: String(msg) }); setTimeout(() => setBanner(null), 6000); };

  const load = () => {
    setLoading(true);
    api.get('/api/porter/active-job')
      .then(r => setActiveJob(r.data && Object.keys(r.data).length ? r.data : null))
      .catch(() => setActiveJob(null))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startService = async () => {
    if (pin.length !== 4) { setPinError('Enter 4-digit PIN'); return; }
    setStarting(true); setPinError('');
    try {
      const { data } = await api.post(`/api/porter/bookings/${activeJob.id}/start`, { pin });
      setActiveJob(data);
      setPin('');
    } catch (err) {
      setPinError(extractErr(err, 'Incorrect PIN — ask the passenger again'));
    } finally {
      setStarting(false);
    }
  };

  const completeService = async () => {
    setCompleting(true);
    try {
      const { data } = await api.post(`/api/porter/bookings/${activeJob.id}/complete`);
      setActiveJob(data);
      flash('success', 'Job completed! Great work.');
      setTimeout(load, 1500); // refresh -> should show "No Active Job" once completed
    } catch (err) {
      flash('error', extractErr(err, 'Could not mark job as completed'));
    } finally {
      setCompleting(false);
    }
  };

  const STATE_STEPS = ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
  const currentIdx = STATE_STEPS.indexOf(activeJob?.status);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner spinner-lg" /></div>;

  if (!activeJob) return (
    <div className="empty-state" style={{ padding: 80 }}>
      <div className="empty-state-title">No Active Job</div>
      <div className="empty-state-desc">You don't have any ongoing service right now.</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {banner && (
        <div className={`alert alert-${banner.type}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{banner.msg}</span>
          <button onClick={() => setBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}>✕</button>
        </div>
      )}

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
            <h4>{SVC_LABEL[activeJob.serviceType] || activeJob.serviceType || 'Porter Service'}</h4>
            <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)' }}>
              {activeJob.bookingReference || `#${activeJob.id?.slice(-8)}`}
            </div>
          </div>
          <span className="badge badge-primary badge-lg">{activeJob.status}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.857rem' }}>
          <div style={{ background: 'var(--color-surface)', padding: '10px 12px', borderRadius: 8 }}>
            <div style={{ fontSize: '0.714rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>FROM</div>
            <div style={{ fontWeight: 600 }}>{activeJob.pickupLocation || '—'}</div>
          </div>
          <div style={{ background: 'var(--color-surface)', padding: '10px 12px', borderRadius: 8 }}>
            <div style={{ fontSize: '0.714rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>TO</div>
            <div style={{ fontWeight: 600 }}>{activeJob.destination || '—'}</div>
          </div>
        </div>
        {activeJob.passengerName && (
          <div style={{ marginTop: 10, fontSize: '0.857rem', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <span><span style={{ color: 'var(--color-text-muted)' }}>Passenger: </span><strong>{activeJob.passengerName}</strong></span>
            {activeJob.passengerMobile && <a href={`tel:${activeJob.passengerMobile}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{activeJob.passengerMobile}</a>}
          </div>
        )}
        <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(27,58,107,0.04)', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.857rem', color: 'var(--color-text-muted)' }}>Earning</span>
          <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.143rem' }}>
            ₹{Number(activeJob.totalAmount || activeJob.baseAmount || 0).toFixed(2)}
            {activeJob.paymentMethod === 'COD' && <span className="badge badge-warning" style={{ marginLeft: 8, fontSize: '0.686rem' }}>COD</span>}
          </span>
        </div>
      </div>

      {activeJob.status === 'ACCEPTED' && (
        <div className="card" style={{ border: '2px solid var(--color-warning-light)' }}>
          <h4 style={{ marginBottom: 6 }}>Start Service</h4>
          <p style={{ fontSize: '0.857rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>
            Ask the passenger for their 4-digit service PIN to begin.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="form-input"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="4-digit PIN"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/, '').slice(0, 4))}
              style={{ flex: 1, fontFamily: 'monospace', fontSize: '1.286rem', letterSpacing: '0.3em', textAlign: 'center' }}
            />
            <button className="btn btn-primary" onClick={startService} disabled={starting || pin.length !== 4}>
              {starting ? <span className="spinner" /> : '▶ Start'}
            </button>
          </div>
          {pinError && <div className="alert alert-error" style={{ marginTop: 10 }}>⚠️ {pinError}</div>}
        </div>
      )}

      {activeJob.paymentMethod === 'COD' && !codCollected && activeJob.status === 'IN_PROGRESS' && (
        <div className="alert alert-warning">
          <div>
            <strong>COD Collection Required</strong>
            <div style={{ marginTop: 4, fontSize: '0.857rem' }}>
              Collect ₹{Number(activeJob.totalAmount || 0).toFixed(2)} in cash from the passenger before completing the job.
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setCodCollected(true)} style={{ marginTop: 10 }}>
              ✓ Cash Collected — ₹{Number(activeJob.totalAmount || 0).toFixed(2)}
            </button>
          </div>
        </div>
      )}

      {/* Complete */}
      {activeJob.status === 'IN_PROGRESS' && (
        <button
          className="btn btn-secondary btn-lg"
          onClick={completeService}
          disabled={completing || (activeJob.paymentMethod === 'COD' && !codCollected)}
          style={{ width: '100%' }}
        >
          {completing ? <><span className="spinner" /> Updating…</> : '✓ Mark as Completed'}
        </button>
      )}
    </div>
  );
}
