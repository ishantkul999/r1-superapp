import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';

const SOS_URL = import.meta.env.VITE_SOS_SOCKET_URL || 'http://localhost:3006';

function playAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < 5; i++) {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const t    = ctx.currentTime + i * 0.42;
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.setValueAtTime(440, t + 0.15);
      gain.gain.setValueAtTime(0.55, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.start(t); osc.stop(t + 0.38);
    }
  } catch { /* silently fail on browsers without WebAudio */ }
}

const ALERT_LABELS = { GENERAL:'General Emergency', MEDICAL:'Medical Emergency', SECURITY:'Security Threat', FIRE:'Fire / Smoke', LOST_CHILD:'Lost Child' };

function fmtTime(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' }); }
  catch { return '—'; }
}

export default function RpfDashboard() {
  const navigate           = useNavigate();
  const socketRef          = useRef(null);
  const [stats,    setStats]    = useState(null);
  const [active,   setActive]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [resolving,setResolving]= useState(null);
  const [newId,    setNewId]    = useState(null);

  const loadData = useCallback(() => {
    Promise.all([api.get('/api/sos/dashboard'), api.get('/api/sos/active')])
      .then(([s, a]) => {
        setStats(s.data);
        setActive(Array.isArray(a.data) ? a.data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Socket.io — connect to sos-service
  useEffect(() => {
    let socket = null;
    (async () => {
      try {
        const { io } = await import('socket.io-client');
        socket = io(SOS_URL, { transports: ['websocket','polling'], reconnection: true, reconnectionAttempts: 10 });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('join:rpf', { role: 'RPF' });
        });

        // CORRECT event: 'sos:alert' — sos.routes.js emits this on SOS trigger
        socket.on('sos:alert', alert => {
          playAlarm();

          if (Notification.permission === 'granted') {
            new Notification('⚠ SOS ALERT — ADI', {
              body: `${ALERT_LABELS[alert.alertType] || 'Emergency'} triggered at Ahmedabad Junction`,
              icon: '/favicon.ico',
              requireInteraction: true,
            });
          } else if (Notification.permission === 'default') {
            Notification.requestPermission();
          }

          setActive(prev => {
            if (prev.find(a => a.id === alert.alertId)) return prev;
            return [{
              id: alert.alertId, alert_reference: alert.alertReference,
              user_id: alert.userId, alert_type: alert.alertType,
              status: 'ACTIVE', triggered_at: alert.triggeredAt,
              lat: alert.lat, lng: alert.lng,
              userName: alert.userName, userPhone: alert.userPhone,
            }, ...prev];
          });
          setNewId(alert.alertId);
          setTimeout(() => setNewId(null), 8000);
          setStats(s => s ? { ...s, active: (parseInt(s.active)||0) + 1 } : s);
        });

        // Live location stream from passenger
        socket.on('sos:location_update', ({ alertId, lat, lng }) => {
          setActive(prev => prev.map(a =>
            a.id === alertId ? { ...a, lat, lng, lastLocAt: new Date().toISOString() } : a
          ));
        });

        socket.on('sos:resolved', ({ alertId }) => {
          setActive(prev => prev.filter(a => a.id !== alertId));
          setStats(s => s ? { ...s, active: Math.max(0,(parseInt(s.active)||1)-1) } : s);
        });

        socket.on('disconnect', () => console.log('[RPF] socket disconnected'));
      } catch (e) { console.warn('[RPF] Socket error:', e.message); }
    })();

    if (Notification.permission === 'default') Notification.requestPermission();
    return () => { if (socket) socket.disconnect(); };
  }, []);

  const handleResolve = async (alertId) => {
    setResolving(alertId);
    try {
      await api.put(`/api/sos/${alertId}/resolve`, { notes: 'Resolved by RPF officer' });
      setActive(prev => prev.filter(a => a.id !== alertId));
      setStats(s => s ? { ...s, active: Math.max(0,(parseInt(s.active)||1)-1), resolved: (parseInt(s.resolved)||0)+1 } : s);
    } catch { alert('Could not resolve. Try again.'); }
    finally { setResolving(null); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">RPF Dashboard</h1>
        <p className="page-subtitle" style={{ display:'flex',alignItems:'center',gap:8 }}>
          Live SOS monitoring · Ahmedabad Junction
          <span style={{ display:'flex',alignItems:'center',gap:5,fontSize:'0.786rem',color:'var(--color-success)',fontWeight:600 }}>
            <span style={{ width:7,height:7,borderRadius:'50%',background:'var(--color-success)',display:'inline-block',animation:'pulse 2s infinite' }}/>
            Live
          </span>
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom:24 }}>
        {[
          { label:'Active Alerts',  value: stats?.active   ?? '—', warn: parseInt(stats?.active)>0 },
          { label:'Resolved Today', value: stats?.last24h  ?? '—' },
          { label:'Total Today',    value: stats?.today    ?? '—' },
          { label:'Total Resolved', value: stats?.resolved ?? '—' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={s.warn?{borderLeft:'3px solid #DC2626'}:{}}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={s.warn?{color:'#DC2626'}:{}}>{s.value}</div>
          </div>
        ))}
      </div>

      <h3 style={{ marginBottom:14,fontSize:'1rem',fontWeight:700 }}>
        Active SOS Alerts {active.length > 0 && <span style={{ color:'#DC2626' }}>({active.length})</span>}
      </h3>

      {loading ? (
        <div style={{ textAlign:'center',padding:48 }}><div className="spinner spinner-lg" style={{ margin:'0 auto' }}/></div>
      ) : active.length === 0 ? (
        <div className="card" style={{ textAlign:'center',padding:'40px 24px',color:'var(--color-text-muted)' }}>
          <div style={{ fontSize:'2rem',marginBottom:12 }}>✓</div>
          <div style={{ fontWeight:600,marginBottom:6 }}>No active alerts</div>
          <div style={{ fontSize:'0.857rem' }}>Alerts appear here instantly with an alarm sound when a passenger triggers SOS.</div>
        </div>
      ) : active.map(alert => {
        const isNew = newId === alert.id;
        return (
          <div key={alert.id} style={{
            background:'var(--color-white)', marginBottom:14,
            border:`2px solid ${isNew?'#DC2626':'rgba(220,38,38,0.3)'}`,
            borderRadius:'var(--radius-card)', padding:20,
            boxShadow: isNew ? '0 0 0 4px rgba(220,38,38,0.12)' : 'var(--shadow-card)',
            transition:'box-shadow 0.3s',
          }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14 }}>
              <div>
                {isNew && (
                  <div style={{ fontSize:'0.714rem',fontWeight:800,color:'#DC2626',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4 }}>
                    ⚠ NEW ALERT — ALARM TRIGGERED
                  </div>
                )}
                <div style={{ fontWeight:700,fontSize:'1rem',marginBottom:4,color:'#DC2626' }}>
                  {ALERT_LABELS[alert.alert_type] || 'Emergency'}
                </div>
                <div style={{ fontSize:'0.786rem',color:'var(--color-text-muted)' }}>
                  Ref: <span style={{ fontFamily:'monospace',fontWeight:600 }}>{alert.alert_reference}</span>
                  &nbsp;·&nbsp;{fmtTime(alert.triggered_at)}
                </div>
              </div>
              <span className="badge badge-error badge-lg" style={{ background:'#DC2626',color:'#fff' }}>ACTIVE</span>
            </div>

            {(alert.userName || alert.userPhone) && (
              <div style={{ background:'rgba(220,38,38,0.05)',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:'0.857rem' }}>
                {alert.userName  && <div><span style={{ color:'var(--color-text-muted)' }}>Passenger: </span><strong>{alert.userName}</strong></div>}
                {alert.userPhone && <div style={{ marginTop:4 }}><span style={{ color:'var(--color-text-muted)' }}>Phone: </span><a href={`tel:${alert.userPhone}`} style={{ fontWeight:700,color:'#DC2626' }}>{alert.userPhone}</a></div>}
              </div>
            )}

            {alert.lat && alert.lng && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:'0.814rem',marginBottom:6 }}>
                  <span style={{ color:'var(--color-text-muted)' }}>GPS: </span>
                  <span style={{ fontFamily:'monospace' }}>{Number(alert.lat).toFixed(5)}, {Number(alert.lng).toFixed(5)}</span>
                  {alert.lastLocAt && <span style={{ marginLeft:8,color:'var(--color-success)',fontSize:'0.771rem' }}>● Live — {fmtTime(alert.lastLocAt)}</span>}
                </div>
                <a href={`https://maps.google.com/?q=${alert.lat},${alert.lng}`} target="_blank" rel="noreferrer"
                  className="btn btn-outline btn-sm" style={{ color:'#DC2626',borderColor:'#DC2626' }}>
                  Open in Google Maps
                </a>
              </div>
            )}

            <div style={{ display:'flex',gap:10 }}>
              <button className="btn btn-primary btn-sm" style={{ background:'#DC2626',flex:1 }} onClick={() => navigate('/rpf/map')}>
                View on Map
              </button>
              <button className="btn btn-outline btn-sm" style={{ color:'var(--color-success)',borderColor:'var(--color-success)',flex:1 }}
                disabled={resolving===alert.id} onClick={() => handleResolve(alert.id)}>
                {resolving===alert.id ? <><span className="spinner" style={{ width:12,height:12 }}/> Resolving…</> : 'Mark Resolved'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
