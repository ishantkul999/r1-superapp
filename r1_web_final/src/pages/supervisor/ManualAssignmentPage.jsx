import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';

const SVC_LABEL = {
  LUGGAGE_ONLY: 'Luggage Porter', LUGGAGE_BARROW: 'Luggage Barrow',
  WHEELCHAIR_ONLY: 'Wheelchair Assistance', WHEELCHAIR_STRETCHER: 'Stretcher/Bed Chair',
  COMBINED: 'Combined — Luggage + Wheelchair',
};

function extractErr(err, fb = 'Could not complete this job') {
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

/**
 * Manually Assigned Jobs — supervisor view.
 *
 * WHY THIS EXISTS: when a booking is escalated (no online porter accepted
 * within 15s), the supervisor dispatches it to an OFFLINE porter by phone —
 * someone without app access, by design (that's the whole point of the
 * offline-dispatch pool). But that also means that porter has no way to
 * call POST /bookings/{id}/complete themselves once the job is actually
 * done. Without this page, the booking would sit at ACCEPTED/IN_PROGRESS
 * forever, and that porter would be permanently excluded from the
 * available-for-dispatch pool (since the pool filters out anyone with an
 * active job).
 *
 * This page lists exactly those jobs (GET /api/supervisor/manual-assignments/active)
 * and lets the supervisor mark one complete once confirmed by phone
 * (POST /api/supervisor/bookings/{id}/complete). The backend rejects this
 * if the assigned porter is actually online — they should complete their
 * own job through the normal PIN-verified app flow instead.
 */
export default function ManualAssignmentsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const [banner, setBanner] = useState(null);

  const flash = (type, msg) => { setBanner({ type, msg: String(msg) }); setTimeout(() => setBanner(null), 6000); };

  const load = () => {
    api.get('/api/supervisor/manual-assignments/active')
      .then(r => setJobs(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const complete = async (bookingId) => {
    setCompleting(bookingId);
    try {
      await api.post(`/api/supervisor/bookings/${bookingId}/complete`);
      setJobs(j => j.filter(x => x.id !== bookingId));
      flash('success', 'Job marked complete. Porter is now available for dispatch again.');
    } catch (err) {
      flash('error', extractErr(err));
      load(); // refresh — status may have already changed
    } finally {
      setCompleting(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header">
        <h1 className="page-title">📴 Manually Assigned Jobs</h1>
        <p className="page-subtitle">
          Jobs dispatched by phone to offline porters. Mark complete here once confirmed —
          these porters have no app access to do it themselves.
        </p>
      </div>

      {banner && (
        <div className={`alert alert-${banner.type}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{banner.msg}</span>
          <button onClick={() => setBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}>✕</button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 10 }} />)}</div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-title">No manually assigned jobs in progress</div>
          <div className="empty-state-desc">Everything dispatched to offline porters has been completed.</div>
        </div>
      ) : (
        jobs.map(job => (
          <div key={job.id} className="card" style={{ border: '2px solid var(--color-warning-light, #f0c36d)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <h4>{SVC_LABEL[job.serviceType] || job.serviceType || 'Porter Service'}</h4>
                <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {job.bookingReference || `#${job.id?.slice(-8)}`}
                  {job.pickupLocation && ` · ${job.pickupLocation}`}
                  {job.destination && ` → ${job.destination}`}
                </div>
                {job.passengerName && (
                  <div style={{ fontSize: '0.786rem', marginTop: 4 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Passenger: </span>
                    <strong>{job.passengerName}</strong>
                    {job.passengerMobile && <> · <a href={`tel:${job.passengerMobile}`}>{job.passengerMobile}</a></>}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge ${job.status === 'IN_PROGRESS' ? 'badge-primary' : 'badge-warning'}`}>
                  {job.status === 'IN_PROGRESS' ? 'In Progress' : 'Assigned'}
                </span>
                <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {timeAgo(job.acceptanceTime)}
                </div>
              </div>
            </div>

            <div style={{ padding: '10px 12px', background: 'var(--color-surface)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: '0.857rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Porter: </span>
                <strong>{job.porterName || job.porterBadge}</strong>
                {job.porterBadge && <span style={{ color: 'var(--color-text-muted)' }}> ({job.porterBadge})</span>}
              </div>
              {job.porterPhone && (
                <a href={`tel:${job.porterPhone}`} className="btn btn-outline btn-sm">📞 {job.porterPhone}</a>
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={completing === job.id}
              onClick={() => complete(job.id)}
            >
              {completing === job.id ? <span className="spinner" /> : '✓ Confirm Job Complete'}
            </button>
            <div className="form-hint" style={{ marginTop: 6 }}>
              Only mark this after confirming by phone with the porter that the job is actually finished.
            </div>
          </div>
        ))
      )}
    </div>
  );
}
