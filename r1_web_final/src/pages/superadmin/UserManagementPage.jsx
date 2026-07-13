import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');

  useEffect(() => {
  api.get('/api/superadmin/users')
    .then(r => {
      setUsers(Array.isArray(r.data.users) ? r.data.users : []);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);

  const filtered = Array.isArray(users)
  ? users.filter(u => {
      const matchRole = role === 'ALL' || u.role === role;
      const matchSearch =
        !search ||
        u.phone?.includes(search) ||
        u.name?.toLowerCase().includes(search.toLowerCase());

      return matchRole && matchSearch;
    })
  : [];
  

  const toggle = async (id, active) => {
    try { await api.put(`/api/superadmin/users/${id}`, { isActive: !active }); setUsers(u => u.map(x => x.id === id ? { ...x, isActive: !active } : x)); } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><h1 className="page-title">👥 User Management</h1><p className="page-subtitle">Search, filter, and manage all platform users</p></div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input className="form-input" placeholder="Search phone or name…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL','USER','PORTER','SUPERVISOR','RPF','STATION_CONTROL_ROOM'].map(r => (
            <button key={r} onClick={() => setRole(r)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${role === r ? 'var(--color-primary)' : 'var(--color-border)'}`, background: role === r ? 'var(--color-primary)' : '#fff', color: role === r ? '#fff' : 'var(--color-text)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
              {r === 'STATION_CONTROL_ROOM' ? 'STATION' : r}
            </button>
          ))}
        </div>
      </div>
      {loading ? <div className="spinner" /> : (
        <div className="card" style={{ padding: 0 }}>
          <table><thead><tr><th>Phone</th><th>Name</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>No users</td></tr>
              : filtered.map(u => <tr key={u.id}>
                  <td style={{ fontFamily: 'monospace' }}>{u.phone}</td>
                  <td>{u.name || '—'}</td>
                  <td><span className="badge badge-primary">{u.role}</span></td>
                  <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-error'}`}>{u.isActive ? 'Active' : 'Blocked'}</span></td>
                  <td style={{ fontSize: '0.85rem' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td><button className={`btn btn-sm ${u.isActive ? 'btn-outline' : 'btn-primary'}`} onClick={() => toggle(u.id, u.isActive)}>{u.isActive ? 'Block' : 'Unblock'}</button></td>
                </tr>)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
