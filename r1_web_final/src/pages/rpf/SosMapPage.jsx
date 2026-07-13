import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';

export default function SosMapPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = () => api.get('/api/sos/active').then(r => setAlerts(r.data || [])).catch(() => {}).finally(() => setLoading(false));
    fetch();
    const t = setInterval(fetch, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">🗺 Live SOS Map</h1><p className="page-subtitle">Real-time SOS alerts at ADI · Auto-refresh 10s</p></div>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }} /> Live
        </span>
      </div>
      {alerts.length > 0 && <div className="alert alert-error" style={{ fontWeight: 700 }}>🚨 {alerts.length} Active SOS — Respond Immediately!</div>}
      <div className="card" style={{ minHeight: 200, background: alerts.length > 0 ? 'linear-gradient(135deg,#FFF1F2,#FFE4E6)' : 'linear-gradient(135deg,#e0f2fe,#bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, border: alerts.length > 0 ? '2px solid var(--color-error)' : undefined }}>
        <div style={{ fontSize: '3rem' }}>{alerts.length > 0 ? '🚨' : '🗺'}</div>
        <div style={{ fontWeight: 700, color: alerts.length > 0 ? 'var(--color-error)' : 'var(--color-text)' }}>{alerts.length > 0 ? `${alerts.length} Active Alert${alerts.length > 1 ? 's' : ''}` : 'All Clear'}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Full map requires Mapbox (VITE_MAPBOX_TOKEN)</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? <div className="spinner" /> : alerts.length === 0 ? <div className="empty-state"><div className="empty-icon">✅</div><p>No active SOS alerts</p></div>
        : alerts.map(a => (
          <div key={a.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '2px solid var(--color-error)' }} onClick={() => navigate(`/rpf/alert/${a.id}`)} style={{ cursor: 'pointer', border: '2px solid var(--color-error)' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-error)', fontFamily: 'monospace' }}>🚨 {a.alertReference || a.id}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{a.alertType} · {a.lat ? `${a.lat}, ${a.lng}` : 'ADI Station'}</div>
            </div>
            <span className="badge badge-error">ACTIVE →</span>
          </div>
        ))}
      </div>
    </div>
  );
}
