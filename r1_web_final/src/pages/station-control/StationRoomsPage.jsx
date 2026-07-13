import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';

export default function StationRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/api/station/rooms').then(r => setRooms(r.data || [])).catch(() => {}).finally(() => setLoading(false)); }, []);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><h1 className="page-title">🛏 Station Rooms</h1><p className="page-subtitle">CRIS room availability and management</p></div>
      {loading ? <div className="spinner" /> : rooms.length === 0 ? <div className="empty-state"><div className="empty-icon">🛏</div><p>No rooms configured</p></div>
      : <div className="card" style={{ padding: 0 }}>
          <table><thead><tr><th>Room</th><th>Type</th><th>Beds</th><th>Price/Night</th><th>CRIS ID</th><th>Status</th></tr></thead>
            <tbody>{rooms.map(r => <tr key={r.id}><td style={{ fontWeight: 700 }}>{r.roomNumber}</td><td>{r.roomType?.replace(/_/g, ' ')}</td><td>{r.totalBeds}</td><td>₹{r.pricePerNight}</td><td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.crisRoomId || '—'}</td><td><span className={`badge ${r.isActive ? 'badge-success' : 'badge-muted'}`}>{r.isActive ? 'Active' : 'Inactive'}</span></td></tr>)}</tbody>
          </table>
        </div>}
    </div>
  );
}
