import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';

export default function IncidentHistoryPage() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/api/sos/active').then(r => setIncidents(r.data || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><h1 className="page-title">📜 Incident History</h1><p className="page-subtitle">All SOS events at Ahmedabad Junction</p></div>
      {loading ? <div className="spinner" /> : incidents.length === 0
        ? <div className="empty-state"><div className="empty-icon">✅</div><p>No incidents recorded</p></div>
        : <div className="card" style={{ padding: 0 }}>
            <table><thead><tr><th>Reference</th><th>Type</th><th>Triggered</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{incidents.map(i => (
                <tr key={i.id}>
                  <td><span style={{ fontFamily: 'monospace', color: 'var(--color-primary)', fontWeight: 700 }}>{i.alertReference || i.id?.substring(0, 8)}</span></td>
                  <td>{i.alertType}</td>
                  <td style={{ fontSize: '0.85rem' }}>{i.triggeredAt ? new Date(i.triggeredAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                  <td><span className={`badge ${i.status === 'RESOLVED' ? 'badge-success' : 'badge-error'}`}>{i.status}</span></td>
                  <td><button className="btn btn-sm btn-outline" onClick={() => navigate(`/rpf/alert/${i.id}`)}>View</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>}
    </div>
  );
}
