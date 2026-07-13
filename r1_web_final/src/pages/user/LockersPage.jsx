import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../lib/api.js';

const SIZES = ['All', 'SMALL', 'MEDIUM', 'LARGE'];

export default function LockersPage() {
  const [lockers, setLockers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sizeFilter, setSizeFilter] = useState('All');
  const [selectedLocker, setSelectedLocker] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [hours, setHours] = useState(6);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);

  useEffect(() => { fetchLockers(); }, []);

  const fetchLockers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/station/lockers');
      setLockers(data.lockers || []);
    } catch { setLockers([]); } finally { setLoading(false); }
  };

  const filtered = sizeFilter === 'All' ? lockers : lockers.filter(l => l.size === sizeFilter);

  const PRICING = { SMALL: 30, MEDIUM: 50, LARGE: 80 };
  const totalCost = (PRICING[selectedLocker?.size] || 30) * hours;

  const handleBook = async () => {
    setSubmitting(true); setError('');
    try {
      const { data } = await api.post('/api/station/lockers/book', {
        lockerId: selectedLocker.id,
        durationHours: hours,
      });
      setBooking(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Retry.');
    } finally { setSubmitting(false); }
  };

  const SizeLabel = ({ size }) => {
    const map = { SMALL: ['S', '#0D9488'], MEDIUM: ['M', '#1B3A6B'], LARGE: ['L', '#7C3AED'] };
    const [l, c] = map[size] || ['?', '#999'];
    return (
      <div style={{ width: 32, height: 32, borderRadius: 6, background: c + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.857rem', color: c }}>
        {l}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="alert alert-info" style={{ fontSize: '0.814rem' }}>
        🔗 Powered by CRIS Digital Locker System — Ahmedabad Junction. Available 24×7.
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Lockers', value: lockers.length, icon: '🔒' },
          { label: 'Available', value: lockers.filter(l => l.status === 'AVAILABLE').length, icon: '✅' },
          { label: 'Occupied', value: lockers.filter(l => l.status === 'OCCUPIED').length, icon: '🔴' },
          { label: 'Maintenance', value: lockers.filter(l => l.status === 'MAINTENANCE').length, icon: '🔧' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{s.icon}</div>
            <div className="stat-value">{loading ? '—' : s.value}</div>
            <div className="stat-label" style={{ marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {SIZES.map(s => (
          <button key={s} className={`chip ${sizeFilter === s ? 'active' : ''}`} onClick={() => setSizeFilter(s)}>
            {s === 'All' ? 'All Sizes' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
        <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={fetchLockers}>↻ Refresh</button>
      </div>

      {loading ? (
        <div className="grid-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {Array(12).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 10 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <div className="empty-state-title">No lockers found</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {filtered.map(locker => (
            <div
              key={locker.id}
              onClick={() => { if (locker.status === 'AVAILABLE') { setSelectedLocker(locker); setShowModal(true); setBooking(null); setError(''); setHours(6); } }}
              style={{
                padding: '14px 12px',
                background: 'var(--color-white)',
                border: `2px solid ${locker.status === 'AVAILABLE' ? 'var(--color-border-light)' : locker.status === 'MAINTENANCE' ? 'var(--color-warning-light)' : 'var(--color-error-light)'}`,
                borderRadius: 10,
                cursor: locker.status === 'AVAILABLE' ? 'pointer' : 'default',
                transition: 'all var(--transition)',
                boxShadow: 'var(--shadow-card)',
                textAlign: 'center',
              }}
              onMouseEnter={e => locker.status === 'AVAILABLE' && (e.currentTarget.style.borderColor = 'var(--color-primary)')}
              onMouseLeave={e => locker.status === 'AVAILABLE' && (e.currentTarget.style.borderColor = 'var(--color-border-light)')}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>
                {locker.status === 'AVAILABLE' ? '🔓' : locker.status === 'MAINTENANCE' ? '🔧' : '🔒'}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.857rem', marginBottom: 4 }}>#{locker.number}</div>
              <div style={{ fontSize: '0.714rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>
                {locker.size} · {locker.location}
              </div>
              <span className={`badge badge-${locker.status === 'AVAILABLE' ? 'success' : locker.status === 'MAINTENANCE' ? 'warning' : 'error'}`} style={{ fontSize: '0.643rem' }}>
                {locker.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Pricing info */}
      <div className="card card-flat" style={{ background: 'var(--color-surface-2)' }}>
        <h4 style={{ marginBottom: 12, fontSize: '0.857rem' }}>Pricing (per hour)</h4>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {Object.entries(PRICING).map(([size, rate]) => (
            <div key={size} style={{ display: 'flex', align: 'center', gap: 8, fontSize: '0.857rem' }}>
              <SizeLabel size={size} />
              <div>
                <div style={{ fontWeight: 600 }}>{size.charAt(0) + size.slice(1).toLowerCase()}</div>
                <div style={{ color: 'var(--color-primary)', fontWeight: 700 }}>₹{rate}/hr</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking modal */}
      {showModal && selectedLocker && (
        <div className="modal-overlay" onClick={() => !submitting && setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Locker #{selectedLocker.number}</h3>
                <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{selectedLocker.size} · {selectedLocker.location}</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {booking ? (
              <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>✅</div>
                <h3 style={{ marginBottom: 8 }}>Locker Reserved!</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.857rem', marginBottom: 20 }}>
                  Scan the QR code at the locker terminal to unlock.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <div style={{ padding: 16, background: 'var(--color-white)', border: '2px solid var(--color-border)', borderRadius: 12 }}>
                    <QRCodeSVG value={booking.qrCode || booking.bookingRef || 'LOCKER-QR'} size={140} />
                  </div>
                </div>
                <div style={{ background: 'var(--color-surface)', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: '0.857rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Reference</span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{booking.bookingRef || 'LKR-' + Date.now()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Duration</span>
                    <span style={{ fontWeight: 600 }}>{hours} hours</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Expires at</span>
                    <span style={{ fontWeight: 600 }}>{new Date(Date.now() + hours * 3600000).toLocaleTimeString()}</span>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(false)} style={{ width: '100%' }}>Done</button>
              </div>
            ) : (
              <>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[3, 6, 12, 24, 48].map(h => (
                        <button key={h} type="button"
                          className={`chip ${hours === h ? 'active' : ''}`}
                          onClick={() => setHours(h)}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: 'var(--color-surface)', borderRadius: 8, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.857rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Rate</span>
                      <span>₹{PRICING[selectedLocker.size]}/hr × {hours}hr</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>Total</span>
                      <span style={{ color: 'var(--color-primary)', fontSize: '1.143rem' }}>₹{totalCost}</span>
                    </div>
                  </div>
                  {error && <div className="alert alert-error">⚠️ {error}</div>}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleBook} disabled={submitting}>
                    {submitting ? <><span className="spinner" /> Booking…</> : `Book for ₹${totalCost}`}
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
