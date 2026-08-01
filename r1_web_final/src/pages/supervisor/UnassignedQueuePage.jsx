import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';

const SVC_LABEL = {
  LUGGAGE_ONLY: 'Luggage Porter', LUGGAGE_BARROW: 'Luggage Barrow',
  WHEELCHAIR_ONLY: 'Wheelchair Assistance', WHEELCHAIR_STRETCHER: 'Stretcher/Bed Chair',
  COMBINED: 'Combined — Luggage + Wheelchair',
};

function extractErr(err, fb = 'Assignment failed') {
  const d = err?.response?.data;
  if (!d) return err?.message || fb;
  if (typeof d.error === 'string') return d.error;
  if (typeof d.message === 'string') return d.message;
  if (typeof d === 'string') return d;
  return fb;
}

function timeAgo(iso) {
  if (!iso) return '';
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
}

// ── Unassigned Queue ──────────────────────────────────────────────────────────
export function UnassignedQueuePage() {
  const [queue, setQueue] = useState([]);
  const [porters, setPorters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [error, setError] = useState(null);
  const fetch = async () => {
    const [q, p] = await Promise.allSettled([
      api.get('/api/supervisor/queue/unassigned'),
      api.get('/api/supervisor/porters/available'),
    ]);
    setQueue(q.status === 'fulfilled' ? (Array.isArray(q.value.data) ? q.value.data : []) : []);
    setPorters(p.status === 'fulfilled' ? (Array.isArray(p.value.data) ? p.value.data : []) : []);
    setLoading(false);
  };

  useEffect(() => { fetch(); const t = setInterval(fetch, 15000); return () => clearInterval(t); }, []);

  const assign = async (requestId, porterId) => {
    setAssigning(requestId);
    setError(null);
    try {
      await api.post(`/api/supervisor/assignments`, { requestId, porterId });
      setQueue(q => q.filter(r => r.id !== requestId));
      // The assigned porter is no longer "available" — refresh the list.
      fetch();
    } catch (err) {
      setError(extractErr(err));
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>Unassigned Queue</h3>
          <p style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{queue.length} requests waiting · Auto-refresh 15s</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetch}>↻ Refresh</button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1,2].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 10 }} />)}</div>
      ) : queue.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-title">Queue is clear</div>
          <div className="empty-state-desc">All requests have been assigned to porters.</div>
        </div>
      ) : (
        queue.map(req => (
          <div key={req.id} className="card" style={{ border: '2px solid var(--color-error-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <h4>{SVC_LABEL[req.serviceType] || req.serviceType || 'Porter Request'}</h4>
                <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {req.bookingReference || `#${req.id?.slice(-8)}`}
                  {req.pickupLocation && ` · ${req.pickupLocation}`}
                  {req.destination && ` → ${req.destination}`}
                </div>
                {req.passengerName && (
                  <div style={{ fontSize: '0.786rem', marginTop: 4 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Passenger: </span>
                    <strong>{req.passengerName}</strong>
                    {req.passengerMobile && <> · <a href={`tel:${req.passengerMobile}`}>{req.passengerMobile}</a></>}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-error">Unassigned</span>
                <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{timeAgo(req.bookingTime || req.createdAt)}</div>
                {req.paymentMethod === 'COD' && <span className="badge badge-warning" style={{ marginTop: 4 }}>COD</span>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Assign to Porter</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <select className="form-select" id={`porter-${req.id}`} defaultValue="">
                  <option value="">
                    {porters.length === 0 ? 'No offline porters available to dispatch' : 'Select offline porter to dispatch…'}
                  </option>
                  {porters.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.fullName || p.badgeNumber} — {p.zone || 'no zone'} ({p.badgeNumber}) · phone: {p.phone}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-primary"
                  disabled={assigning === req.id || porters.length === 0}
                  onClick={() => {
                    const sel = document.getElementById(`porter-${req.id}`);
                    if (sel?.value) assign(req.id, sel.value);
                  }}
                >
                  {assigning === req.id ? <span className="spinner" /> : 'Assign'}
                </button>
              </div>
              <div className="form-hint">📞 Call the porter on the number shown after assigning — they aren't logged into the app and won't get a push notification.</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default UnassignedQueuePage;
