import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';

const ROOM_TYPES = ['All', 'AC', 'Non-AC', 'Dormitory', 'Suite'];

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [booking, setBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ checkIn: '', checkOut: '', passengers: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/station/rooms');
      setRooms(data.rooms || []);
    } catch { setRooms([]); } finally { setLoading(false); }
  };

  const filtered = filter === 'All' ? rooms : rooms.filter(r => r.type === filter);

  const openBooking = (room) => {
    setBooking(room);
    setShowModal(true);
    setError('');
    setSuccess(null);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    setForm({ checkIn: today, checkOut: tomorrow, passengers: 1 });
  };

  const handleBook = async () => {
    if (!form.checkIn || !form.checkOut) { setError('Select check-in and check-out dates.'); return; }
    setSubmitting(true); setError('');
    try {
      const { data } = await api.post('/api/station/rooms/book', {
        roomId: booking.id,
        ...form,
      });
      setSuccess(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please retry.');
    } finally { setSubmitting(false); }
  };

  const RoomCard = ({ room }) => (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        height: 120, background: `linear-gradient(135deg, #${Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,'0')}22, var(--color-surface-2))`,
        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem',
      }}>
        {room.type === 'AC' ? '❄️' : room.type === 'Suite' ? '🏨' : room.type === 'Dormitory' ? '🛌' : '🛏'}
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <h4 style={{ fontSize: '0.929rem' }}>{room.name}</h4>
          <span className={`badge badge-${room.available ? 'success' : 'error'}`}>
            {room.available ? 'Available' : 'Full'}
          </span>
        </div>
        <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>
          Room #{room.number} · {room.floor} · {room.type}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {(room.amenities || []).map(a => (
            <span key={a} style={{
              padding: '2px 8px', background: 'var(--color-surface-2)',
              borderRadius: 4, fontSize: '0.714rem', color: 'var(--color-text-secondary)',
            }}>{a}</span>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: '1.143rem', color: 'var(--color-primary)' }}>₹{room.pricePerNight}</span>
            <span style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)' }}>/night</span>
          </div>
          <button
            className="btn btn-primary btn-sm"
            disabled={!room.available}
            onClick={() => openBooking(room)}
          >
            {room.available ? 'Book Now' : 'Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div className="alert alert-info" style={{ flex: 1, padding: '10px 14px', fontSize: '0.814rem' }}>
          🔗 Powered by CRIS (Centre for Railway Information Systems) — Real-time room data via stub API.
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchRooms}>↻ Refresh</button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {ROOM_TYPES.map(t => (
          <button key={t} className={`chip ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid-3">
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 12 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛏</div>
          <div className="empty-state-title">No rooms found</div>
          <div className="empty-state-desc">No {filter !== 'All' ? filter : ''} rooms available at Ahmedabad Junction right now.</div>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(room => <RoomCard key={room.id} room={room} />)}
        </div>
      )}

      {showModal && booking && (
        <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Book — {booking.name}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {success ? (
              <div className="modal-body" style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
                <h3 style={{ marginBottom: 8 }}>Room Booked!</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>Your room has been reserved via CRIS.</p>
                <div style={{ background: 'var(--color-surface)', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>BOOKING REFERENCE</div>
                  <div style={{ fontWeight: 700, fontSize: '1.143rem', fontFamily: 'monospace', color: 'var(--color-primary)' }}>
                    {success.bookingRef || 'CRIS-' + Date.now()}
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(false)} style={{ width: '100%' }}>Done</button>
              </div>
            ) : (
              <>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">Check-in Date</label>
                      <input type="date" className="form-input" value={form.checkIn} onChange={e => setForm(f => ({...f, checkIn: e.target.value}))} min={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Check-out Date</label>
                      <input type="date" className="form-input" value={form.checkOut} onChange={e => setForm(f => ({...f, checkOut: e.target.value}))} min={form.checkIn || new Date().toISOString().split('T')[0]} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Passengers</label>
                    <select className="form-select" value={form.passengers} onChange={e => setForm(f => ({...f, passengers: +e.target.value}))}>
                      {[1,2,3,4].map(n => <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>
                  <div style={{ background: 'var(--color-surface)', borderRadius: 8, padding: 14, fontSize: '0.857rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Room</span>
                      <span style={{ fontWeight: 500 }}>{booking.name} (#{booking.number})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Rate</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{booking.pricePerNight}/night</span>
                    </div>
                  </div>
                  {error && <div className="alert alert-error">⚠️ {error}</div>}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleBook} disabled={submitting}>
                    {submitting ? <><span className="spinner" /> Booking…</> : 'Confirm Booking'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
