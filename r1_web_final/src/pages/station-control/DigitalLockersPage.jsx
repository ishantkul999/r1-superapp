import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';

export default function DigitalLockersPage() {
  const [lockers, setLockers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/api/station/lockers').then(r => setLockers(r.data || [])).catch(() => {}).finally(() => setLoading(false)); }, []);
  const bySize = {};
  lockers.forEach(l => { bySize[l.size] = bySize[l.size] || []; bySize[l.size].push(l); });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><h1 className="page-title">🔒 Digital Lockers</h1><p className="page-subtitle">CRIS locker status and availability</p></div>
      {loading ? <div className="spinner" /> : Object.entries(bySize).map(([size, items]) => (
        <div key={size} className="card">
          <div style={{ fontWeight: 700, marginBottom: 12 }}>{size} Lockers ({items.length})</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px,1fr))', gap: 8 }}>
            {items.map(l => (
              <div key={l.id} style={{ padding: 10, background: l.isActive ? '#f0fdf4' : 'var(--color-surface-2)', border: `1px solid ${l.isActive ? '#86efac' : 'var(--color-border)'}`, borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>#{l.lockerNumber}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>PF {l.platform}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: l.isActive ? '#15803D' : '#94a3b8' }}>{l.isActive ? '● Open' : '○ Off'}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
