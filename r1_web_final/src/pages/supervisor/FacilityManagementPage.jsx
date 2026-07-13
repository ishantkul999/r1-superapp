import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';
import { FACILITY_STATUS } from '../../config/constants.js';

export default function FacilityManagementPage() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ status: 'OPEN', reason: '', estimatedMins: '' });

  useEffect(() => { api.get('/api/station/facilities').then(r => setFacilities(r.data || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  const handleUpdate = async () => {
    try {
      const r = await api.put(`/api/station/facilities/${editing.id}/status`, form);
      setFacilities(f => f.map(x => x.id === editing.id ? r.data : x));
      setEditing(null);
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><h1 className="page-title">🏥 Facility Management</h1><p className="page-subtitle">Update live status of ADI station facilities</p></div>
      {loading ? <div className="spinner" /> : facilities.map(f => {
        const meta = FACILITY_STATUS[f.status] || { label: f.status, color: '#64748b' };
        return (
          <div key={f.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{f.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{f.type} · Platform {f.platform || 'Main'}</div>
              {f.reason && <div style={{ fontSize: '0.8rem', color: 'var(--color-warning)' }}>{f.reason}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: meta.color, fontWeight: 700, fontSize: '0.85rem' }}>● {meta.label}</span>
              <button className="btn btn-sm btn-outline" onClick={() => { setEditing(f); setForm({ status: f.status, reason: f.reason || '', estimatedMins: '' }); }}>Update</button>
            </div>
          </div>
        );
      })}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 400, padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Update: {editing.name}</h3>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {Object.keys(FACILITY_STATUS).map(k => <option key={k} value={k}>{FACILITY_STATUS[k].label}</option>)}
              </select></div>
            <div className="form-group"><label className="form-label">Reason</label><input className="form-input" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Under repair" /></div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdate}>Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
