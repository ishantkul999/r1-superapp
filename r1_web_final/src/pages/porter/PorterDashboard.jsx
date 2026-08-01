import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import useAuthStore from '../../stores/authStore.js';
import useRealtimeBookings from '../../hooks/useRealtimeBookings.js';

function extractErr(err, fb = 'Something went wrong') {
  const d = err?.response?.data;
  if (!d) return err?.message || fb;
  if (typeof d.error === 'string')   return d.error;
  if (typeof d.message === 'string') return d.message;
  if (typeof d === 'string')         return d;
  return fb;
}

const SERVICE_LABELS = {
  LUGGAGE_ONLY:'Luggage Only', LUGGAGE_BARROW:'Luggage Barrow',
  WHEELCHAIR_ONLY:'Wheelchair', WHEELCHAIR_STRETCHER:'Stretcher',
  COMBINED:'Combined',
};

export default function PorterDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [banner,    setBanner]    = useState(null);

  const flash = (type, msg) => { setBanner({ type, msg: String(msg) }); setTimeout(() => setBanner(null), 5000); };

  const load = () => {
    setLoading(true);
    api.get('/api/porter/dashboard')
      .then(r => setDashboard(r.data))
      .catch(err => {
        const code = err?.response?.data?.code;
        if (code === 'PORTER_NOT_REGISTERED') {
          setBanner({ type: 'warning', msg: 'Your porter profile is not set up yet. Contact your supervisor.' });
        } else {
          flash('error', extractErr(err, 'Could not load dashboard'));
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useRealtimeBookings({
    porterId: dashboard?.porterId,
    onJobAssigned: () => {
      flash('success', 'New job assigned by supervisor! Check your Requests tab.');
      load();
    },
  });

  const d = dashboard || {};

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="page-title">Porter Dashboard</h1>
          <p className="page-subtitle">
            {d.badgeNumber ? `Badge: ${d.badgeNumber}` : 'Welcome back'}
            {d.zone ? ` · Zone: ${d.zone}` : ''}
          </p>
        </div>
        {!loading && dashboard && (
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(21,128,61,0.1)', padding:'8px 16px', borderRadius:20 }}>
            <span style={{ width:9, height:9, borderRadius:'50%', background:'#15803D', display:'inline-block', animation:'pulse 2s infinite' }} />
            <span style={{ fontWeight:600, fontSize:'0.843rem', color:'#15803D' }}>Online</span>
          </div>
        )}
      </div>

      {banner && (
        <div className={`alert alert-${banner.type}`}>{banner.msg}</div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <div className="spinner spinner-lg" style={{ margin:'0 auto' }} />
          <div style={{ marginTop:14, color:'var(--color-text-muted)', fontSize:'0.857rem' }}>Loading your dashboard…</div>
        </div>
      ) : !dashboard ? null : (
        <>
          {/* Online banner */}
          <div className="alert alert-success">
            You are <strong>Online</strong> and ready to receive requests.
            {d.pendingRequestsCount > 0
              ? ` ${d.pendingRequestsCount} request${d.pendingRequestsCount !== 1 ? 's' : ''} waiting.`
              : ' No pending requests right now.'}
          </div>

          {/* Active job card */}
          {d.activeJob && (
            <div className="card" style={{ borderLeft:'4px solid var(--color-secondary)', padding:'18px 20px' }}>
              <div style={{ fontWeight:700, fontSize:'0.971rem', marginBottom:8, color:'var(--color-secondary)' }}>Active Job</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:'0.857rem' }}>
                <div><span style={{ color:'var(--color-text-muted)' }}>Ref: </span><strong>{d.activeJob.bookingReference}</strong></div>
                <div><span style={{ color:'var(--color-text-muted)' }}>Service: </span>{SERVICE_LABELS[d.activeJob.serviceType] || d.activeJob.serviceType}</div>
                {d.activeJob.passengerName   && <div><span style={{ color:'var(--color-text-muted)' }}>Passenger: </span><strong>{d.activeJob.passengerName}</strong></div>}
                {d.activeJob.passengerMobile && <div><a href={`tel:${d.activeJob.passengerMobile}`} style={{ color:'var(--color-primary)', fontWeight:600 }}>{d.activeJob.passengerMobile}</a></div>}
                {d.activeJob.platform        && <div><span style={{ color:'var(--color-text-muted)' }}>Platform: </span><strong>{d.activeJob.platform}</strong></div>}
                {d.activeJob.coachNumber     && <div><span style={{ color:'var(--color-text-muted)' }}>Coach: </span><strong>{d.activeJob.coachNumber}</strong></div>}
              </div>
              <div style={{ marginTop:14 }}>
                <button className="btn btn-secondary" onClick={() => navigate('/porter/active')}>
                  View Active Job
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="stats-grid">
            {[
              { label:'Today Completed', value: d.todayCompleted ?? 0 },
              { label:'Today Earnings',  value: d.todayEarnings != null ? `₹${Number(d.todayEarnings).toFixed(2)}` : '₹0.00' },
              { label:'Week Completed',  value: d.weekCompleted ?? 0 },
              { label:'Week Earnings',   value: d.weekEarnings  != null ? `₹${Number(d.weekEarnings).toFixed(2)}`  : '₹0.00' },
              { label:'Avg Rating',      value: d.avgRating != null ? `${Number(d.avgRating).toFixed(1)} / 5` : '5.0 / 5' },
              { label:'Total Services',  value: d.totalServices ?? 0 },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize:'1.4rem' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Quick nav */}
          <div className="grid-2">
            {[
              { title:'Incoming Requests', desc:'View & accept pending requests', to:'/porter/requests', color:'#1B3A6B' },
              { title:'Active Job',        desc:'Track your current assignment',  to:'/porter/active',   color:'#15803D' },
              { title:'Earnings',          desc:'View your earnings summary',     to:'/porter/earnings', color:'#0D9488' },
              { title:'My Profile',        desc:'View your staff profile',        to:'/porter/profile',  color:'#7C3AED' },
            ].map(n => (
              <button key={n.to} onClick={() => navigate(n.to)}
                style={{ padding:'18px 20px', background:'var(--color-white)', border:'1px solid var(--color-border-light)', borderRadius:'var(--radius-card)', cursor:'pointer', textAlign:'left', boxShadow:'var(--shadow-card)', transition:'all 0.15s' }}
                onMouseOver={e => e.currentTarget.style.borderColor = n.color}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
              >
                <div style={{ fontWeight:600, marginBottom:4 }}>{n.title}</div>
                <div style={{ fontSize:'0.786rem', color:'var(--color-text-muted)' }}>{n.desc}</div>
              </button>
            ))}
          </div>

          <div className="alert alert-info" style={{ fontSize:'0.829rem' }}>
            Your porter license is registered under CRIS. Ensure your badge number is updated in your profile.
          </div>
        </>
      )}
    </div>
  );
}