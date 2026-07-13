import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';

export default function ManageStaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
   useEffect(() => {
  api.get('/api/station/control/staff')
    .then(r => {
      console.log("STAFF RESPONSE", r.data);
      setStaff(Array.isArray(r.data) ? r.data : []);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><h1 className="page-title">👥 Manage Staff</h1><p className="page-subtitle">All staff accounts under this station</p></div>
      {loading ? <div className="spinner" /> : (
        <div className="card" style={{ padding: 0 }}>
          <table><thead><tr><th>Name</th><th>Phone</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {staff.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>No staff accounts</td></tr>
              : staff.map(s => <tr key={s.id}><td>{s.name || '—'}</td><td>{s.phone}</td><td><span className="badge badge-primary">{s.role}</span></td><td><span className={`badge ${s.isActive ? 'badge-success' : 'badge-muted'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td></tr>)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
