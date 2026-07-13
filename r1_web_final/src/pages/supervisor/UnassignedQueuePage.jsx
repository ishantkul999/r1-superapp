import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';

// ── Unassigned Queue ──────────────────────────────────────────────────────────
export function UnassignedQueuePage() {
  const [queue, setQueue] = useState([]);
  const [porters, setPorters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);

  const fetch = async () => {
    const [q, p] = await Promise.allSettled([
      api.get('/api/supervisor/queue/unassigned'),
      api.get('/api/supervisor/porters/available'),
    ]);
    setQueue(q.status === 'fulfilled' ? q.value.data.requests || [] : []);
    setPorters(p.status === 'fulfilled' ? p.value.data.porters || [] : []);
    setLoading(false);
  };

  useEffect(() => { fetch(); const t = setInterval(fetch, 15000); return () => clearInterval(t); }, []);

  const assign = async (requestId, porterId) => {
    setAssigning(requestId);
    try {
      await api.post(`/api/supervisor/assignments`, { requestId, porterId });
      setQueue(q => q.filter(r => r.id !== requestId));
    } catch {} finally { setAssigning(null); }
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
                <h4>{req.serviceType || 'Porter Request'}</h4>
                <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', marginTop: 2 }}>#{req.bookingId?.slice(-8)} · {req.fromLocation} → {req.toLocation}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-error">Unassigned</span>
                <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{req.waitTime}</div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Assign to Porter</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <select className="form-select" id={`porter-${req.id}`} defaultValue="">
                  <option value="">Select available porter…</option>
                  {porters.map(p => <option key={p.id} value={p.id}>{p.name} — {p.location}</option>)}
                </select>
                <button
                  className="btn btn-primary"
                  disabled={assigning === req.id}
                  onClick={() => {
                    const sel = document.getElementById(`porter-${req.id}`);
                    if (sel?.value) assign(req.id, sel.value);
                  }}
                >
                  {assigning === req.id ? <span className="spinner" /> : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Porter Directory ──────────────────────────────────────────────────────────
export function PorterDirectoryPage() {
  const [porters, setPorters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/api/supervisor/porters').then(r => setPorters(r.data?.porters || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = porters.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input className="form-input" placeholder="🔍 Search porter by name or phone…" value={search} onChange={e => setSearch(e.target.value)} />
      {loading ? (
        <div className="grid-2">{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 10 }} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">👷</div><div className="empty-state-title">No porters found</div></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Porter</th><th>License</th><th>Status</th><th>Today</th><th>Rating</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)' }}>{p.phone}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{p.licenseNumber || '—'}</td>
                  <td>
                    <span className={`badge badge-${p.isOnline ? 'success' : 'muted'}`}>
                      {p.isOnline ? '🟢 Online' : '⚪ Offline'}
                    </span>
                  </td>
                  <td>{p.todayJobs || 0} jobs</td>
                  <td>{p.rating ? `${p.rating} ⭐` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Create Porter ──────────────────────────────────────────────────────────────
export function CreatePorterPage() {
  const [form, setForm] = useState({ name: '', phone: '', licenseNumber: '', aadharNumber: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const setField = (k, v) => setForm(f => ({...f, [k]: v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { setError('Name and phone are required.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/api/supervisor/porters/create', form);
      setSuccess(true);
    } catch (err) { setError(err.response?.data?.message || 'Failed to create porter.'); } finally { setLoading(false); }
  };

  if (success) return (
    <div className="card" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: 48 }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
      <h3 style={{ marginBottom: 8 }}>Porter Created!</h3>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>The porter account has been created. They can now login with their phone number.</p>
      <button className="btn btn-primary" onClick={() => { setSuccess(false); setForm({ name: '', phone: '', licenseNumber: '', aadharNumber: '' }); }}>Create Another</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <form className="card" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3>Create Porter Account</h3>
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input className="form-input" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. Rajesh Kumar" required />
        </div>
        <div className="form-group">
          <label className="form-label">Mobile Number *</label>
          <input className="form-input" value={form.phone} onChange={e => setField('phone', e.target.value.replace(/\D/,'').slice(0,10))} placeholder="9876543210" required />
        </div>
        <div className="form-group">
          <label className="form-label">CRIS License Number</label>
          <input className="form-input" value={form.licenseNumber} onChange={e => setField('licenseNumber', e.target.value)} placeholder="ADI-PORTER-XXXX" />
        </div>
        <div className="form-group">
          <label className="form-label">Aadhaar Number</label>
          <input className="form-input" value={form.aadharNumber} onChange={e => setField('aadharNumber', e.target.value.replace(/\D/,'').slice(0,12))} placeholder="XXXX XXXX XXXX" maxLength={12} />
          <div className="form-hint">For identity verification. Stored encrypted.</div>
        </div>
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
          {loading ? <><span className="spinner" /> Creating…</> : 'Create Porter Account'}
        </button>
      </form>
    </div>
  );
}

// ── Facility Management ────────────────────────────────────────────────────────
export function FacilityManagementPage() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api.get('/api/station/facilities').then(r => setFacilities(r.data?.facilities || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const STATUS_OPTIONS = ['OPEN', 'CLOSED', 'CLEANING', 'MAINTENANCE', 'FULL', 'AFTER_HOURS'];
  const STATUS_COLORS = { OPEN: 'success', CLOSED: 'error', CLEANING: 'warning', MAINTENANCE: 'warning', FULL: 'error', AFTER_HOURS: 'muted' };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.put(`/api/station/facilities/${id}/status`, { status });
      setFacilities(f => f.map(x => x.id === id ? {...x, status} : x));
    } catch {} finally { setUpdating(null); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner spinner-lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="alert alert-info" style={{ fontSize: '0.814rem' }}>
        ⚡ Status updates are broadcast via Redis pub/sub and reflected on all passenger-facing dashboards in real-time.
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Facility</th><th>Location</th><th>Type</th><th>Current Status</th><th>Update</th></tr></thead>
          <tbody>
            {facilities.map(f => (
              <tr key={f.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{f.name}</div>
                </td>
                <td style={{ color: 'var(--color-text-muted)' }}>{f.location}</td>
                <td><span className="badge badge-muted">{f.type}</span></td>
                <td><span className={`badge badge-${STATUS_COLORS[f.status] || 'muted'}`}>{f.status}</span></td>
                <td>
                  <select
                    className="form-select"
                    value={f.status}
                    onChange={e => updateStatus(f.id, e.target.value)}
                    disabled={updating === f.id}
                    style={{ width: 'auto', fontSize: '0.786rem', padding: '5px 30px 5px 8px' }}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Live Porter Map (stub) ────────────────────────────────────────────────────
export function LivePorterMapPage() {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 48 }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>🗺</div>
      <h3 style={{ marginBottom: 8 }}>Live Porter Map</h3>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: 400, margin: '0 auto 20px' }}>
        Real-time ADI station map with porter GPS locations. Integrates with Socket.io porter location events and the map-service GeoJSON API.
      </p>
      <div style={{ background: 'var(--color-surface-2)', borderRadius: 12, height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--color-border)', color: 'var(--color-text-muted)' }}>
        Station map canvas loads here (map-service :3010)
      </div>
    </div>
  );
}

export default UnassignedQueuePage;
