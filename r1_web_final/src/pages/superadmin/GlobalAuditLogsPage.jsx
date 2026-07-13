import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';

export default function GlobalAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  useEffect(() => {
  setLoading(true);

  api.get(`/api/superadmin/audit?page=${page}&size=50`)
    .then(r => {
      setLogs(Array.isArray(r.data.logs) ? r.data.logs : []);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
}, [page]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><h1 className="page-title">🔍 Global Audit Logs</h1><p className="page-subtitle">Platform-wide activity across all 12 microservices</p></div>
      {loading ? <div className="spinner" /> : (
        <div className="card" style={{ padding: 0 }}>
          <table><thead><tr><th>Time</th><th>Service</th><th>Role</th><th>Action</th><th>Entity</th><th>Status</th></tr></thead>
            <tbody>
              {logs.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>No events</td></tr>
              : logs.map(l => <tr key={l.eventId || l.id}>
                  <td style={{ fontSize: '0.8rem' }}>{l.createdAt ? new Date(l.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                  <td style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>{l.sourceService}</td>
                  <td><span className="badge badge-muted">{l.actorRole || 'SYS'}</span></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{l.action}</td>
                  <td style={{ fontSize: '0.85rem' }}>{l.entityType}</td>
                  <td><span className={`badge ${l.status === 'SUCCESS' ? 'badge-success' : 'badge-error'}`}>{l.status}</span></td>
                </tr>)}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '14px 0' }}>
            <button className="btn btn-sm btn-outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ padding: '6px 14px', fontWeight: 600 }}>Page {page + 1}</span>
            <button className="btn btn-sm btn-outline" onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
