import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';

export default function AllBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');
  useEffect(() => {
  api.get('/api/station/control/bookings')
    .then(r => {
      console.log("BOOKINGS RESPONSE", r.data);
      setBookings(r.data || []);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);
  const filtered = Array.isArray(bookings)
  ? (tab === 'ALL'
      ? bookings
      : bookings.filter(b => b.type === tab))
  : [];
  const TABS = ['ALL','PORTER','ROOM','LOCKER'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><h1 className="page-title">📋 All Bookings</h1><p className="page-subtitle">Every booking across porter, rooms, and lockers</p></div>
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--color-border)', paddingBottom: 0 }}>
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', fontWeight: tab === t ? 700 : 500, color: tab === t ? 'var(--color-primary)' : 'var(--color-muted)', background: 'none', borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: -2 }}>{t}</button>)}
      </div>
      {loading ? <div className="spinner" /> : (
        <div className="card" style={{ padding: 0 }}>
          <table><thead><tr><th>Reference</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)' }}>No bookings</td></tr>
              : filtered.map(b => <tr key={b.id}>
                  <td><span style={{ fontFamily: 'monospace', color: 'var(--color-primary)', fontWeight: 700 }}>{b.bookingReference || b.ref || b.id?.substring(0, 8)}</span></td>
                  <td>{b.type || '—'}</td>
                  <td>₹{b.totalAmount || '—'}</td>
                  <td><span className={`badge ${b.status === 'COMPLETED' || b.status === 'CONFIRMED' ? 'badge-success' : b.status === 'CANCELLED' ? 'badge-error' : 'badge-warning'}`}>{b.status}</span></td>
                  <td style={{ fontSize: '0.85rem' }}>{b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                </tr>)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
