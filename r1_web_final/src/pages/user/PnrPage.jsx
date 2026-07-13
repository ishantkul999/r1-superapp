import React, { useState } from 'react';
import api from '../../lib/api.js';

const TABS = ['PNR Status', 'Live Train', 'Station Board'];

export default function PnrPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [pnr, setPnr] = useState('');
  const [trainNo, setTrainNo] = useState('');
  const [pnrData, setPnrData] = useState(null);
  const [trainData, setTrainData] = useState(null);
  const [stationBoard, setStationBoard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPnr = async () => {
    if (!/^\d{10}$/.test(pnr)) { setError('Enter a valid 10-digit PNR.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.get(`/api/train/pnr/${pnr}`);
      setPnrData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'PNR not found. Check the number and retry.');
    } finally { setLoading(false); }
  };

  const fetchTrain = async () => {
    if (!trainNo.trim()) { setError('Enter a train number.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.get(`/api/train/track/${trainNo}`);
      setTrainData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Train not found.');
    } finally { setLoading(false); }
  };

  const fetchStationBoard = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/api/train/station-board/ADI');
      setStationBoard(data.trains || []);
    } catch (err) {
      setError('Failed to load station board.');
    } finally { setLoading(false); }
  };

  React.useEffect(() => {
    if (activeTab === 2 && stationBoard.length === 0) fetchStationBoard();
  }, [activeTab]);

  const StatusBadge = ({ status }) => {
    const map = { CNF: ['Confirmed', 'success'], WL: ['Waitlisted', 'warning'], CAN: ['Cancelled', 'error'], RAC: ['RAC', 'warning'], PQWL: ['PQWL', 'warning'] };
    const [label, variant] = map[status] || [status, 'muted'];
    return <span className={`badge badge-${variant}`}>{label}</span>;
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="tab-bar">
        {TABS.map((t, i) => (
          <button key={t} className={`tab-item ${activeTab === i ? 'active' : ''}`} onClick={() => { setActiveTab(i); setError(''); }}>
            {t}
          </button>
        ))}
      </div>

      {/* PNR Status */}
      {activeTab === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">PNR Number</label>
                <input className="form-input" placeholder="10-digit PNR" value={pnr} onChange={e => setPnr(e.target.value.replace(/\D/g,'').slice(0,10))} maxLength={10} onKeyDown={e => e.key === 'Enter' && fetchPnr()} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-primary" onClick={fetchPnr} disabled={loading} style={{ height: 42 }}>
                  {loading ? <span className="spinner" /> : '🔍 Check'}
                </button>
              </div>
            </div>
            {error && <div className="alert alert-error" style={{ marginTop: 12 }}>⚠️ {error}</div>}
          </div>

          {pnrData && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>PNR NUMBER</div>
                  <div style={{ fontWeight: 700, fontSize: '1.143rem', fontFamily: 'monospace' }}>{pnrData.pnrNumber}</div>
                </div>
                <StatusBadge status={pnrData.overallStatus} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20, padding: '14px', background: 'var(--color-surface)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: '0.714rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>TRAIN</div>
                  <div style={{ fontWeight: 600, fontSize: '0.857rem' }}>{pnrData.trainName}</div>
                  <div style={{ fontSize: '0.786rem', color: 'var(--color-text-secondary)' }}>{pnrData.trainNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.714rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>JOURNEY</div>
                  <div style={{ fontWeight: 600, fontSize: '0.857rem' }}>{pnrData.from} → {pnrData.to}</div>
                  <div style={{ fontSize: '0.786rem', color: 'var(--color-text-secondary)' }}>{pnrData.dateOfJourney}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.714rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>CLASS</div>
                  <div style={{ fontWeight: 600, fontSize: '0.857rem' }}>{pnrData.journeyClass}</div>
                  <div style={{ fontSize: '0.786rem', color: 'var(--color-text-secondary)' }}>Coach: {pnrData.coach || '—'}</div>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 600, fontSize: '0.857rem', marginBottom: 10, color: 'var(--color-text-secondary)' }}>PASSENGERS</div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Booking Status</th>
                        <th>Current Status</th>
                        <th>Coach / Seat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(pnrData.passengers || []).map((p, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td><StatusBadge status={p.bookingStatus} /></td>
                          <td><StatusBadge status={p.currentStatus} /></td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.coach || '—'} / {p.seatNumber || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Train */}
      {activeTab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Train Number</label>
                <input className="form-input" placeholder="e.g. 12009" value={trainNo} onChange={e => setTrainNo(e.target.value.replace(/\D/,''))} onKeyDown={e => e.key === 'Enter' && fetchTrain()} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-primary" onClick={fetchTrain} disabled={loading} style={{ height: 42 }}>
                  {loading ? <span className="spinner" /> : '🚂 Track'}
                </button>
              </div>
            </div>
            {error && <div className="alert alert-error" style={{ marginTop: 12 }}>⚠️ {error}</div>}
          </div>

          {trainData && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3>{trainData.trainName}</h3>
                  <div style={{ fontSize: '0.857rem', color: 'var(--color-text-muted)' }}>#{trainData.trainNumber}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>DELAY</div>
                  <div style={{ fontWeight: 700, color: trainData.delayMinutes > 0 ? 'var(--color-error)' : 'var(--color-success)', fontSize: '1.143rem' }}>
                    {trainData.delayMinutes > 0 ? `+${trainData.delayMinutes} min` : 'On Time'}
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px 14px', background: 'var(--color-surface)', borderRadius: 8, marginBottom: 16, fontSize: '0.857rem' }}>
                <strong>Current Location:</strong> {trainData.currentStation || 'En Route'} ({trainData.lastUpdated})
              </div>

              <div style={{ fontSize: '0.857rem', fontWeight: 600, marginBottom: 10, color: 'var(--color-text-secondary)' }}>UPCOMING STOPS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {(trainData.upcomingStops || []).map((stop, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--color-border-light)', alignItems: 'center' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: stop.isPassed ? 'var(--color-border)' : 'var(--color-primary)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.857rem' }}>{stop.stationName}</div>
                      <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)' }}>{stop.stationCode}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.857rem' }}>
                      <div style={{ fontWeight: 600 }}>{stop.scheduledArrival}</div>
                      {stop.delayMinutes > 0 && <div style={{ color: 'var(--color-error)', fontSize: '0.786rem' }}>+{stop.delayMinutes}m</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Station Board */}
      {activeTab === 2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3>Ahmedabad Junction — Station Board</h3>
              <p style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Next 4 hours • Live from NTES</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={fetchStationBoard} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '↻ Refresh'}
            </button>
          </div>
          {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>⚠️ {error}</div>}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />)}
            </div>
          ) : stationBoard.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚂</div>
              <div className="empty-state-title">No trains scheduled</div>
              <div className="empty-state-desc">No arrivals in the next 4 hours.</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Train</th>
                    <th>From</th>
                    <th>Arrival</th>
                    <th>Platform</th>
                    <th>Status</th>
                    <th>Delay</th>
                  </tr>
                </thead>
                <tbody>
                  {stationBoard.map(t => (
                    <tr key={t.trainNumber}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.trainName}</div>
                        <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)' }}>{t.trainNumber}</div>
                      </td>
                      <td>{t.origin}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.scheduledArrival}</td>
                      <td><span className="badge badge-primary">PF {t.platform}</span></td>
                      <td><span className={`badge badge-${t.status === 'ON_TIME' ? 'success' : t.status === 'LATE' ? 'error' : 'muted'}`}>{t.status}</span></td>
                      <td style={{ color: t.delayMinutes > 0 ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 600 }}>
                        {t.delayMinutes > 0 ? `+${t.delayMinutes}m` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
