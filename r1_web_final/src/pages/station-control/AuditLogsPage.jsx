import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
  api.get('/api/station/control/audit')
    .then(r => {
      console.log("AUDIT RESPONSE", r.data);

      setLogs(
        Array.isArray(r.data.logs)
          ? r.data.logs
          : Array.isArray(r.data)
          ? r.data
          : []
      );
    })
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><h1 className="page-title">🔍 Audit Logs</h1><p className="page-subtitle">Complete activity trail for this station</p></div>
      {loading ? <div className="spinner" /> : (
        <div className="card" style={{ padding: 0 }}>
          <table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Status</th></tr></thead>
            <tbody>
              {logs.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>No events</td></tr>
              : logs.map(l => <tr key={l.id || l.eventId}>
                  <td style={{ fontSize: '0.8rem' }}>{l.createdAt ? new Date(l.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{l.actorRole || 'SYSTEM'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-primary)' }}>{l.action}</td>
                  <td style={{ fontSize: '0.85rem' }}>{l.entityType}</td>
                  <td><span className={`badge ${l.status === 'SUCCESS' ? 'badge-success' : 'badge-error'}`}>{l.status}</span></td>
                </tr>)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
