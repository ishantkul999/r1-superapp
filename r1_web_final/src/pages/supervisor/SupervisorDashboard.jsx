import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';
import useRealtimeBookings from '../../hooks/useRealtimeBookings.js';

function extractErrorMessage(err, fallback = 'Something went wrong.') {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (typeof data.error === 'string')   return data.error;
  if (typeof data.message === 'string') return data.message;
  if (typeof data === 'string')         return data;
  return fallback;
}

export default function SupervisorDashboard() {
  const [stats,   setStats]   = useState(null);
  const [queue,   setQueue]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner,  setBanner]  = useState(null);

  const flash = (type, msg) => {
    setBanner({ type, msg: String(msg) });
    setTimeout(() => setBanner(null), 5000);
  };

  const loadStats = () => {
    api.get('/api/supervisor/dashboard')
      .then(r => setStats(r.data))
      .catch(err => flash('error', extractErrorMessage(err, 'Could not load dashboard stats')));
  };

  const loadQueue = () => {
    api.get('/api/supervisor/queue/unassigned')
      .then(r => setQueue(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStats(); loadQueue(); }, []);

  // ── Real-time updates via Socket.io ────────────────────────────────────────
  useRealtimeBookings({
    // New booking created — add to unassigned queue immediately
    onNewBooking: (event) => {
      setQueue(q => {
        // Avoid duplicate if it shows up from polling too
        if (q.find(b => b.id === event.bookingId)) return q;
        return [{ ...event, id: event.bookingId }, ...q];
      });
      loadStats(); // refresh counts
      flash('info', `New booking ${event.bookingReference || ''} — assigning porter…`);
    },

    // Booking escalated (15s timer expired, no porter accepted)
    onEscalated: (event) => {
      flash('warning',
        `Booking ${event.bookingReference || event.bookingId} — no porter accepted within 15 seconds. Manual assignment required.`
      );
      loadStats();
    },

    // Booking assigned (porter accepted or supervisor assigned)
    onAssigned: (event) => {
      setQueue(q => q.filter(b => b.id !== event.bookingId && b.bookingId !== event.bookingId));
      loadStats();
    },
  });

  const s = stats || {};

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Supervisor Overview</h1>
        <p className="page-subtitle">Live porter operations — updates in real time</p>
      </div>

      {banner && (
        <div className={`alert alert-${banner.type}`} style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between' }}>
          <span>{banner.msg}</span>
          <button onClick={() => setBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}>✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Online Porters',   value: s.onlinePorters  ?? '—' },
          { label: 'Total Porters',    value: s.totalPorters   ?? '—' },
          { label: 'Unassigned',       value: s.unassigned     ?? '—', highlight: (s.unassigned > 0) },
          { label: 'Completed Today',  value: s.todayCompleted ?? '—' },
          { label: 'Pending COD',      value: s.pendingCod     ?? '—' },
        ].map(stat => (
          <div key={stat.label} className="stat-card" style={stat.highlight ? { borderLeft: '3px solid var(--color-warning)' } : {}}>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value" style={{ color: stat.highlight ? 'var(--color-warning)' : undefined }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Live unassigned queue preview */}
      {queue.length > 0 && (
        <div className="card" style={{ padding: 0, marginBottom: 20 }}>
          <div style={{
            padding: '12px 18px', borderBottom: '1px solid var(--color-border-light)',
            fontWeight: 600, fontSize: '0.914rem', display: 'flex', justifyContent: 'space-between',
          }}>
            <span>Unassigned Requests ({queue.length})</span>
            <a href="/supervisor/queue" style={{ fontSize: '0.814rem', color: 'var(--color-primary)' }}>
              View all →
            </a>
          </div>
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Service</th>
                <th>Passenger</th>
                <th>Platform</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {queue.slice(0, 5).map(b => (
                <tr key={b.id || b.bookingId}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.829rem' }}>
                    {b.bookingReference || b.booking_reference || '—'}
                  </td>
                  <td style={{ fontSize: '0.843rem' }}>
                    {b.serviceType || b.service_type || '—'}
                  </td>
                  <td style={{ fontSize: '0.843rem' }}>
                    {b.passengerName || b.passenger_name || '—'}
                  </td>
                  <td style={{ fontSize: '0.843rem' }}>
                    {b.platform || '—'}
                  </td>
                  <td style={{ fontSize: '0.843rem', fontWeight: 600 }}>
                    {b.totalAmount || b.total_amount ? `₹${Number(b.totalAmount || b.total_amount).toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
        </div>
      )}
    </div>
  );
}