import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';

export default function LivePorterMapPage() {
  const [porters, setPorters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = () => api.get('/api/maps/porter-locations').then(r => setPorters(r.data?.features || [])).catch(() => {});
    fetch(); setLoading(false);
    const t = setInterval(fetch, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><h1 className="page-title">🗺 Live Porter Map</h1><p className="page-subtitle">Real-time porter positions at ADI · Auto-refresh 10s</p></div>
      <div className="card" style={{ background: 'linear-gradient(135deg,#e0f2fe,#bfdbfe)', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: '3rem' }}>🏛</div>
        <div style={{ fontWeight: 700 }}>Ahmedabad Junction Station Map</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Full map requires Mapbox token (VITE_MAPBOX_TOKEN)</div>
      </div>
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 12 }}>📍 Active Porters ({porters.length})</div>
        {loading ? <div className="spinner" /> : porters.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🗺</div><p>No online porters right now</p></div>
        ) : porters.map((f, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--color-surface-2)', borderRadius: 8, marginBottom: 8 }}>
            <div><span style={{ fontWeight: 600 }}>Badge: {f.properties?.badgeNumber || '—'}</span><span style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}> · Platform {f.properties?.platform || '—'}</span></div>
            <span className="badge badge-success">Online</span>
          </div>
        ))}
      </div>
    </div>
  );
}
