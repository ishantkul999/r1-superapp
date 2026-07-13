import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore.js';
import api from '../../lib/api.js';
import useRealtimeBookings from '../../hooks/useRealtimeBookings.js';

const QUICK_ACTIONS = [
  { icon:'🛄', label:'Book Porter',    to:'/user/porter',   color:'#1B3A6B' },
  { icon:'🚂', label:'PNR Status',     to:'/user/pnr',      color:'#0D9488' },
  { icon:'🛏', label:'Station Rooms',  to:'/user/rooms',    color:'#7C3AED' },
  { icon:'🔒', label:'Digital Lockers',to:'/user/lockers',  color:'#B45309' },
  { icon:'🤖', label:'AI Assistant',   to:'/user/ai-chat',  color:'#0891B2' },
  { icon:'📋', label:'My Bookings',    to:'/user/bookings', color:'#15803D' },
];

const STATUS_LABEL = { PENDING_ACCEPTANCE:'Finding porter…', ACCEPTED:'Porter on the way', IN_PROGRESS:'Service in progress', COMPLETED:'Completed', CANCELLED:'Cancelled' };
const STATUS_BADGE = { PENDING_ACCEPTANCE:'badge-warning', ACCEPTED:'badge-secondary', IN_PROGRESS:'badge-success', COMPLETED:'badge-muted', CANCELLED:'badge-muted' };

export default function UserDashboard() {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [liveStatus,  setLiveStatus]  = useState({});

  const loadBookings = () => {
    api.get('/api/porter/bookings/my')
      .then(r => setBookings((Array.isArray(r.data) ? r.data : (r.data?.bookings||[])).slice(0,3)))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  };

  useEffect(()=>{ loadBookings(); },[]);

  useRealtimeBookings({
    onBookingAssigned:  e => { setLiveStatus(s=>({...s,[e.bookingId]:'Porter assigned — on the way!'})); loadBookings(); },
    onBookingCompleted: e => { setLiveStatus(s=>({...s,[e.bookingId]:'Service completed'}));             loadBookings(); },
    onBookingStatus:    e => { if(e.bookingId) setLiveStatus(s=>({...s,[e.bookingId]:e.statusMessage})); },
  });

  const hour = new Date().getHours();
  const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Passenger';

  return (
    <div style={{display:'flex',flexDirection:'column',gap:24}}>
      {/* Hero */}
      <div style={{background:'linear-gradient(135deg,#1B3A6B 0%,#2952A3 100%)',borderRadius:'var(--radius-card)',padding:'24px 28px',color:'#fff'}}>
        <div style={{fontSize:'0.814rem',color:'rgba(255,255,255,0.6)',marginBottom:4}}>Ahmedabad Junction (ADI)</div>
        <h2 style={{fontWeight:800,fontSize:'1.286rem',marginBottom:6}}>{greeting}, {firstName}</h2>
        <p style={{color:'rgba(255,255,255,0.7)',fontSize:'0.857rem'}}>How can we help you today?</p>
      </div>

      {/* Quick actions */}
      <div>
        <h3 style={{fontWeight:700,fontSize:'0.971rem',marginBottom:14}}>Services</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {QUICK_ACTIONS.map(a=>(
            <button key={a.to} onClick={()=>navigate(a.to)}
              style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:'18px 12px',background:'var(--color-white)',border:'1px solid var(--color-border-light)',borderRadius:'var(--radius-card)',cursor:'pointer',boxShadow:'var(--shadow-card)',transition:'box-shadow 0.15s'}}
              onMouseOver={e=>e.currentTarget.style.boxShadow='var(--shadow-card-hover)'}
              onMouseOut={e=>e.currentTarget.style.boxShadow='var(--shadow-card)'}
            >
              <div style={{width:44,height:44,borderRadius:12,background:a.color+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem'}}>{a.icon}</div>
              <span style={{fontSize:'0.771rem',fontWeight:600,color:'var(--color-text-primary)',textAlign:'center'}}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent bookings */}
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <h3 style={{fontWeight:700,fontSize:'0.971rem'}}>Recent Bookings</h3>
          <button onClick={()=>navigate('/user/bookings')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--color-primary)',fontSize:'0.829rem',fontWeight:600}}>View all →</button>
        </div>

        {loading ? (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[1,2].map(i=><div key={i} className="skeleton" style={{height:72,borderRadius:10}}/>)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="card" style={{textAlign:'center',padding:'28px 20px'}}>
            <div style={{fontSize:'1.714rem',marginBottom:10}}>🛄</div>
            <div style={{fontWeight:600,marginBottom:6}}>No bookings yet</div>
            <div style={{color:'var(--color-text-muted)',fontSize:'0.843rem',marginBottom:16}}>Book a licensed porter for your luggage at ADI station.</div>
            <button className="btn btn-primary btn-sm" onClick={()=>navigate('/user/porter')}>Book Porter Now</button>
          </div>
        ) : bookings.map(b => {
          const live     = liveStatus[b.id];
          const isActive = ['PENDING_ACCEPTANCE','ACCEPTED','IN_PROGRESS'].includes(b.status);
          return (
            <div key={b.id} className="card" onClick={()=>navigate('/user/bookings')}
              style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',cursor:'pointer',marginBottom:10,border:isActive?'2px solid var(--color-secondary)':'1px solid var(--color-border-light)'}}>
              <div style={{width:40,height:40,borderRadius:10,flexShrink:0,background:isActive?'rgba(13,148,136,0.1)':'rgba(27,58,107,0.07)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.143rem'}}>
                {b.serviceType?.includes('WHEELCHAIR')?'♿':'🛄'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:'0.871rem',marginBottom:2}}>{b.serviceType?.replace(/_/g,' ')} Service</div>
                <div style={{fontSize:'0.771rem',color:live?'var(--color-secondary)':'var(--color-text-muted)'}}>
                  {live || STATUS_LABEL[b.status] || b.status}
                </div>
              </div>
              <span className={`badge ${STATUS_BADGE[b.status]||'badge-muted'}`}>
                {b.status==='PENDING_ACCEPTANCE'?'Pending':b.status==='ACCEPTED'?'Assigned':b.status==='IN_PROGRESS'?'Active':b.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

