import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';

export default function PorterDirectoryPage() {
  const navigate = useNavigate();
  const [porters, setPorters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { api.get('/api/porter/directory').then(r => setPorters(r.data || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  const filtered = porters.filter(p => !search || p.badgeNumber?.includes(search) || p.fullName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1 className="page-title">Porter Directory</h1><p className="page-subtitle">All registered porters at ADI</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/supervisor/create-porter')}>+ Register Porter</button>
      </div>
      <input className="form-input" placeholder="Search by name or badge…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
      {loading ? <div className="spinner" /> : (
        <div className="card" style={{ padding: 0 }}>
          <table><thead><tr><th>Badge</th><th>Name</th><th>Service</th><th>Zone</th><th>Rating</th><th>Status</th><th>Phone</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>No porters found</td></tr>
              : filtered.map(p => <tr key={p.id}>
                  <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>{p.badgeNumber}</span></td>
                  <td>{p.fullName || '—'}</td><td>{p.serviceType}</td><td>{p.zone || '—'}</td>
                  <td>⭐ {p.avgRating || '5.0'}</td>
                  <td><span className={`badge ${p.isOnline ? 'badge-success' : 'badge-muted'}`}>{p.isOnline ? 'Online' : 'Offline'}</span></td>
                  <td>{p.phone || '—'}</td>
                </tr>)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}