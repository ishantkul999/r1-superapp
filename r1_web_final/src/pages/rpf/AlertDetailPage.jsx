import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';

export default function AlertDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => { api.get(`/api/sos/${id}`).then(r => setAlert(r.data)).catch(() => {}).finally(() => setLoading(false)); }, [id]);

  const handleResolve = async () => {
    if (!notes.trim()) return;
    setResolving(true);
    try { await api.put(`/api/sos/${id}/resolve`, { notes }); navigate('/rpf/history'); }
    catch {} finally { setResolving(false); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner spinner-lg" /></div>;
  if (!alert) return <div className="empty-state"><div className="empty-icon">🔍</div><p>Alert not found</p></div>;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <button className="btn btn-outline btn-sm" onClick={() => navigate('/rpf')} style={{ alignSelf: 'flex-start' }}>← Back</button>
      <div className="alert alert-error" style={{ fontWeight: 700, padding: '14px 18px' }}>🚨 {alert.status === 'ACTIVE' ? 'ACTIVE SOS — Immediate Response Required' : `Status: ${alert.status}`}</div>
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Alert Details</h3>
        <div className="grid-2" style={{ gap: 10 }}>
          {[['Reference', alert.alertReference], ['Type', alert.alertType], ['Status', alert.status], ['Location', alert.lat ? `${alert.lat}, ${alert.lng}` : 'ADI Station'], ['Triggered', alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleString('en-IN') : '—'], ['Resolved', alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString('en-IN') : '—']].map(([k, v]) => (
            <div key={k} style={{ padding: '10px 14px', background: 'var(--color-surface-2)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)', fontWeight: 600, marginBottom: 2 }}>{k}</div>
              <div style={{ fontWeight: 600 }}>{v || '—'}</div>
            </div>
          ))}
        </div>
      </div>
      {alert.status === 'ACTIVE' && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Resolution Notes</h3>
          <textarea className="form-input" rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Describe the action taken…" style={{ marginBottom: 14, resize: 'vertical', width: '100%' }} />
          <button className="btn btn-success" onClick={handleResolve} disabled={resolving || !notes.trim()}>
            {resolving ? 'Resolving…' : '✓ Mark as Resolved'}
          </button>
        </div>
      )}
    </div>
  );
}
