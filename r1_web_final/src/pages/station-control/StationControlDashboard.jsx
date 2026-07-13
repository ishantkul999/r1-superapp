import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import api from '../../lib/api.js';

// ── Station Control Dashboard ─────────────────────────────────────────────────
export default function StationControlDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/station/control/dashboard').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const NAV_ITEMS = [
    { icon: '📈', title: 'Analytics', to: '/station-control/analytics', color: '#1B3A6B' },
    { icon: '👥', title: 'Manage Staff', to: '/station-control/staff', color: '#0D9488' },
    { icon: '📋', title: 'All Bookings', to: '/station-control/bookings', color: '#7C3AED' },
    { icon: '🛏', title: 'Station Rooms', to: '/station-control/rooms', color: '#B45309' },
    { icon: '🔒', title: 'Digital Lockers', to: '/station-control/lockers', color: '#15803D' },
    { icon: '🔍', title: 'Audit Logs', to: '/station-control/audit', color: '#475569' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="stats-grid">
        {[
          { label: "Today's Revenue", value: loading ? '—' : `₹${(stats?.todayRevenue || 0).toLocaleString('en-IN')}`, icon: '💰', variant: 'teal' },
          { label: 'Total Bookings', value: stats?.todayBookings ?? '—', icon: '📦', variant: 'blue' },
          { label: 'Active Porters', value: stats?.activePorters ?? '—', icon: '👷', variant: 'green' },
          { label: 'Rooms Occupied', value: stats?.roomsOccupied ?? '—', icon: '🛏', variant: 'amber' },
          { label: 'Lockers In Use', value: stats?.lockersInUse ?? '—', icon: '🔒', variant: 'blue' },
          { label: 'SOS Today', value: stats?.sosToday ?? '—', icon: '🚨', variant: 'red' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.variant}`}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid-3">
        {NAV_ITEMS.map(n => (
          <button key={n.to} onClick={() => navigate(n.to)} style={{
            padding: '18px 20px', background: 'var(--color-white)', border: '1px solid var(--color-border-light)',
            borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition)', boxShadow: 'var(--shadow-card)',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = n.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{n.icon}</div>
            <div style={{ fontWeight: 600 }}>{n.title}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Analytics Page ─────────────────────────────────────────────────────────────
export function StationAnalyticsPage() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('WEEK');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/station/control/analytics?period=${period}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [period]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {['WEEK', 'MONTH', 'YEAR'].map(p => <button key={p} className={`chip ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>{p}</button>)}
      </div>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner spinner-lg" /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h4 style={{ marginBottom: 16 }}>Revenue by Day</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.revenue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                <Tooltip formatter={v => [`₹${v}`, 'Revenue']} />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h4 style={{ marginBottom: 16 }}>Bookings Trend</h4>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data?.bookings || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="porter" stroke="var(--color-primary)" strokeWidth={2} dot={false} name="Porter" />
                <Line type="monotone" dataKey="room" stroke="var(--color-secondary)" strokeWidth={2} dot={false} name="Rooms" />
                <Line type="monotone" dataKey="locker" stroke="#7C3AED" strokeWidth={2} dot={false} name="Lockers" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ── All Bookings ───────────────────────────────────────────────────────────────
export function AllBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    api.get(`/api/station/control/bookings?type=${filter}`).then(r => setBookings(r.data?.bookings || [])).catch(() => {}).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {['ALL', 'PORTER', 'ROOM', 'LOCKER'].map(t => <button key={t} className={`chip ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>{t}</button>)}
      </div>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div className="spinner spinner-lg" /></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Booking ID</th><th>Passenger</th><th>Type</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>No bookings found</td></tr>
              ) : bookings.map(b => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.786rem' }}>{b.id?.slice(-10)}</td>
                  <td>{b.passengerName}</td>
                  <td><span className="badge badge-primary">{b.type}</span></td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{b.date}</td>
                  <td style={{ fontWeight: 600 }}>₹{b.amount}</td>
                  <td><span className={`badge badge-${b.statusVariant || 'muted'}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Audit Logs ─────────────────────────────────────────────────────────────────
export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/station/control/audit').then(r => setLogs(r.data?.logs || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="alert alert-info" style={{ marginBottom: 16, fontSize: '0.814rem' }}>
        🔍 Complete audit trail of all user actions, API calls, and system events with tamper-proof logging.
      </div>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div className="spinner spinner-lg" /></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Timestamp</th><th>Actor</th><th>Role</th><th>Action</th><th>Resource</th><th>IP</th></tr></thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>No audit logs available</td></tr>
              ) : logs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.786rem', whiteSpace: 'nowrap' }}>{l.timestamp}</td>
                  <td>{l.actorName}</td>
                  <td><span className="badge badge-muted">{l.role}</span></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.786rem', color: 'var(--color-primary)' }}>{l.action}</td>
                  <td style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)' }}>{l.resource}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.786rem' }}>{l.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Station Rooms (Control View) ───────────────────────────────────────────────
export function StationRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/station/rooms').then(r => setRooms(r.data?.rooms || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 14, display: 'flex', gap: 12 }}>
        <div className="stat-card" style={{ flex: 1, padding: 14 }}>
          <div className="stat-label">Total Rooms</div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{rooms.length}</div>
        </div>
        <div className="stat-card" style={{ flex: 1, padding: 14 }}>
          <div className="stat-label">Available</div>
          <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--color-success)' }}>{rooms.filter(r => r.available).length}</div>
        </div>
        <div className="stat-card" style={{ flex: 1, padding: 14 }}>
          <div className="stat-label">Occupied</div>
          <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--color-error)' }}>{rooms.filter(r => !r.available).length}</div>
        </div>
      </div>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div className="spinner spinner-lg" /></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Room</th><th>Type</th><th>Floor</th><th>Amenities</th><th>Rate</th><th>Status</th></tr></thead>
            <tbody>
              {rooms.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>#{r.number}</td>
                  <td><span className="badge badge-primary">{r.type}</span></td>
                  <td>{r.floor}</td>
                  <td style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)' }}>{(r.amenities || []).join(', ')}</td>
                  <td style={{ fontWeight: 600 }}>₹{r.pricePerNight}/night</td>
                  <td><span className={`badge badge-${r.available ? 'success' : 'error'}`}>{r.available ? 'Available' : 'Occupied'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Digital Lockers (Control View) ─────────────────────────────────────────────
export function DigitalLockersPage() {
  const [lockers, setLockers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/station/lockers').then(r => setLockers(r.data?.lockers || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 14, display: 'flex', gap: 12 }}>
        {['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'].map(s => (
          <div key={s} className="stat-card" style={{ flex: 1, padding: 14 }}>
            <div className="stat-label">{s}</div>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{lockers.filter(l => l.status === s).length}</div>
          </div>
        ))}
      </div>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div className="spinner spinner-lg" /></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Size</th><th>Location</th><th>Status</th><th>Rented By</th><th>Expires At</th></tr></thead>
            <tbody>
              {lockers.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 700 }}>{l.number}</td>
                  <td><span className="badge badge-muted">{l.size}</span></td>
                  <td>{l.location}</td>
                  <td><span className={`badge badge-${l.status === 'AVAILABLE' ? 'success' : l.status === 'MAINTENANCE' ? 'warning' : 'error'}`}>{l.status}</span></td>
                  <td>{l.currentRenter || '—'}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{l.expiresAt || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Manage Staff ───────────────────────────────────────────────────────────────
export function ManageStaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/station/control/staff').then(r => setStaff(r.data?.staff || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="table-wrap">
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div className="spinner spinner-lg" /></div> : (
        <table>
          <thead><tr><th>Name</th><th>Phone</th><th>Role</th><th>Created At</th><th>Status</th></tr></thead>
          <tbody>
            {staff.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>No staff records found</td></tr>
            ) : staff.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td>{s.phone}</td>
                <td><span className="badge badge-primary">{s.role}</span></td>
                <td style={{ color: 'var(--color-text-muted)' }}>{s.createdAt}</td>
                <td><span className={`badge badge-${s.isActive ? 'success' : 'muted'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
