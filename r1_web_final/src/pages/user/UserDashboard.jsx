import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore.js';
import api from '../../lib/api.js';
import useRealtimeBookings from '../../hooks/useRealtimeBookings.js';

// ── SVG icon set (extracted for dashboard) ───────────────────────────────────
const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const icons = {
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></>,
    train:     <><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16M12 3v8M8 19l-2 2M16 19l2 2M8 15h.01M16 15h.01"/></>,
    bed:       <><path d="M2 4v16M2 8h18a2 2 0 012 2v6H2"/><path d="M6 8v-4"/></>,
    locker:    <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M12 14v2"/></>,
    bot:       <><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 15h.01M16 15h.01"/></>,
    map:       <><path d="M1 6l7-3 8 3 7-3v15l-7 3-8-3-7 3V6z"/><path d="M8 3v15M16 6v15"/></>,
    list:      <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>,
    wheelchair:<><circle cx="8" cy="16" r="5" /><path d="M19 19V8a3 3 0 0 0-3-3H7" /><path d="M16 19h5" /><path d="M11.5 16l3-3.5" /></>,
    phone:     <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || null}
    </svg>
  );
};

const QUICK_ACTIONS = [
  { icon:'briefcase', label:'Book Porter',    to:'/user/porter',    color:'#1B3A6B' },
  { icon:'train',     label:'PNR Status',     to:'/user/pnr',       color:'#0D9488' },
  { icon:'bed',       label:'Station Rooms',  to:'/user/rooms',     color:'#7C3AED' },
  { icon:'locker',    label:'Digital Lockers',to:'/user/lockers',   color:'#B45309' },
  { icon:'bot',       label:'AI Assistant',   to:'/user/ai-chat',   color:'#0891B2' },
  { icon:'map',       label:'Trip Planner',   to:'/user/itinerary', color:'#C2410C' },
  { icon:'list',      label:'My Bookings',    to:'/user/bookings',  color:'#15803D' },
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
      .then(r => {
        const all = Array.isArray(r.data) ? r.data : (r.data?.bookings || []);
        const active = all.filter(b => ['PENDING_ACCEPTANCE', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status));
        const rest = all.filter(b => !['PENDING_ACCEPTANCE', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status));
        setBookings([...active, ...rest].slice(0, 3));
      })
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
              <div style={{width:44,height:44,borderRadius:12,background:a.color+'15',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <Icon name={a.icon} size={24} color={a.color} />
              </div>
              <span style={{fontSize:'0.771rem',fontWeight:600,color:'var(--color-text-primary)',textAlign:'center'}}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming / recent bookings */}
      <div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <h3 style={{fontWeight:700,fontSize:'0.971rem'}}>{bookings.some(b=>['PENDING_ACCEPTANCE','ACCEPTED','IN_PROGRESS'].includes(b.status)) ? 'Upcoming Services' : 'Recent Bookings'}</h3>
          <button onClick={()=>navigate('/user/bookings')} style={{background:'none',border:'none',cursor:'pointer',color:'var(--color-primary)',fontSize:'0.829rem',fontWeight:600}}>View all →</button>
        </div>

        {loading ? (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[1,2].map(i=><div key={i} className="skeleton" style={{height:72,borderRadius:10}}/>)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="card" style={{textAlign:'center',padding:'28px 20px'}}>
            <div style={{display:'flex', justifyContent:'center', marginBottom:12}}>
              <div style={{background:'rgba(27,58,107,0.07)', width:56, height:56, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <Icon name="briefcase" size={28} color="var(--color-primary)" />
              </div>
            </div>
            <div style={{fontWeight:600,marginBottom:6}}>No bookings yet</div>
            <div style={{color:'var(--color-text-muted)',fontSize:'0.843rem',marginBottom:16}}>Book a licensed porter for your luggage at ADI station.</div>
            <button className="btn btn-primary btn-sm" onClick={()=>navigate('/user/porter')}>Book Porter Now</button>
          </div>
        ) : bookings.map(b => {
          const live     = liveStatus[b.id];
          const isActive = ['PENDING_ACCEPTANCE','ACCEPTED','IN_PROGRESS'].includes(b.status);
          const hasPorter = isActive && b.porterName;
          return (
            <div key={b.id} className="card" onClick={()=>navigate('/user/bookings')}
              style={{padding:'14px 18px',cursor:'pointer',marginBottom:10,border:isActive?'2px solid var(--color-secondary)':'1px solid var(--color-border-light)'}}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div style={{width:40,height:40,borderRadius:10,flexShrink:0,background:isActive?'rgba(13,148,136,0.1)':'rgba(27,58,107,0.07)',display:'flex',alignItems:'center',justifyContent:'center', color: isActive ? 'var(--color-secondary)' : 'var(--color-primary)'}}>
                  <Icon name={b.serviceType?.includes('WHEELCHAIR') ? 'wheelchair' : 'briefcase'} size={20} />
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
              {hasPorter && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{marginTop:10,paddingTop:10,borderTop:'1px solid var(--color-border-light)',display:'flex',justifyContent:'space-between',alignItems:'center'}}
                >
                  <div style={{fontSize:'0.786rem'}}>
                    <span style={{color:'var(--color-text-muted)'}}>Porter: </span>
                    <strong>{b.porterName}</strong>
                    {b.porterBadge && <span style={{color:'var(--color-text-muted)'}}> ({b.porterBadge})</span>}
                  </div>
                  {b.porterPhone && (
                    <a href={`tel:${b.porterPhone}`} className="btn btn-outline btn-sm" style={{whiteSpace:'nowrap', display: 'flex', alignItems: 'center', gap: '6px'}}>
                      <Icon name="phone" size={14} /> {b.porterPhone}
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}