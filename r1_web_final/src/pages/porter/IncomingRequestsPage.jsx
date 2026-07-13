import React, { useState, useEffect, useRef } from 'react';
import api from '../../lib/api.js';
import useRealtimeBookings from '../../hooks/useRealtimeBookings.js';

const COUNTDOWN = 15;
const SVC = { LUGGAGE_ONLY:'Luggage Porter', LUGGAGE_BARROW:'Luggage Barrow', WHEELCHAIR_ONLY:'Wheelchair Assistance', WHEELCHAIR_STRETCHER:'Stretcher/Bed Chair', COMBINED:'Combined — Luggage + Wheelchair' };

function CountdownRing({ s, total = COUNTDOWN }) {
  const r = 20, c = 2 * Math.PI * r, color = s <= 5 ? '#B91C1C' : s <= 10 ? '#B45309' : '#15803D';
  return (
    <div style={{ position:'relative',width:54,height:54,flexShrink:0 }}>
      <svg width="54" height="54" viewBox="0 0 54 54">
        <circle cx="27" cy="27" r={r} fill="none" stroke="var(--color-border)" strokeWidth="4"/>
        <circle cx="27" cy="27" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={c} strokeDashoffset={c*(1-s/total)} strokeLinecap="round"
          transform="rotate(-90 27 27)" style={{ transition:'stroke-dashoffset 0.9s linear,stroke 0.3s' }}/>
      </svg>
      <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'1rem',color }}>{s}</div>
    </div>
  );
}

function RequestCard({ req, onAccept, onDecline }) {
  const [cd,         setCd]         = useState(COUNTDOWN);
  const [accepting,  setAccepting]  = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      setCd(c => {
        if (c <= 1) { clearInterval(timer.current); onDecline(req.id, 'TIMEOUT'); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer.current);
  }, [req.id]);

  const accept = async () => {
    clearInterval(timer.current);
    setAccepting(true);
    await onAccept(req.id);
    setAccepting(false);
  };

  return (
    <div style={{ background:'var(--color-white)',border:'2px solid var(--color-primary)',borderRadius:'var(--radius-card)',padding:20,boxShadow:'var(--shadow-card-hover)',animation:'slideUp 0.2s ease' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14 }}>
        <div>
          <div style={{ fontWeight:700,fontSize:'1rem',marginBottom:4 }}>
            {req.serviceType?.includes('WHEELCHAIR')?'♿':'🛄'} {SVC[req.serviceType]||req.serviceType}
          </div>
          <div style={{ fontSize:'0.771rem',color:'var(--color-text-muted)' }}>
            Ref: <span style={{ fontFamily:'monospace',fontWeight:600 }}>{req.bookingReference}</span>
          </div>
        </div>
        <CountdownRing s={cd} />
      </div>

      <div style={{ background:'var(--color-surface)',borderRadius:8,padding:'12px 14px',marginBottom:14,fontSize:'0.857rem' }}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
          {req.platform     && <div><span style={{ color:'var(--color-text-muted)' }}>Platform: </span><strong>{req.platform}</strong></div>}
          {req.coachNumber  && <div><span style={{ color:'var(--color-text-muted)' }}>Coach: </span><strong>{req.coachNumber}</strong></div>}
          {req.pnrNumber    && <div><span style={{ color:'var(--color-text-muted)' }}>PNR: </span><strong>{req.pnrNumber}</strong></div>}
          {req.paymentMethod && <div><span style={{ color:'var(--color-text-muted)' }}>Pay: </span><strong>{req.paymentMethod}</strong></div>}
        </div>
        {req.pickupLocation && <div style={{ marginTop:6 }}><span style={{ color:'var(--color-text-muted)' }}>From: </span>{req.pickupLocation}</div>}
        {req.destination    && <div style={{ marginTop:2 }}><span style={{ color:'var(--color-text-muted)' }}>To: </span>{req.destination}</div>}
        {req.specialInstructions && <div style={{ marginTop:6,color:'var(--color-primary)',fontStyle:'italic',fontSize:'0.814rem' }}>Note: {req.specialInstructions}</div>}
      </div>

      {req.passengerName && (
        <div style={{ fontSize:'0.857rem',marginBottom:14,display:'flex',gap:14,flexWrap:'wrap' }}>
          <span><span style={{ color:'var(--color-text-muted)' }}>Passenger: </span><strong>{req.passengerName}</strong></span>
          {req.passengerMobile && <a href={`tel:${req.passengerMobile}`} style={{ color:'var(--color-primary)',fontWeight:600 }}>{req.passengerMobile}</a>}
        </div>
      )}

      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <div style={{ fontWeight:800,fontSize:'1.143rem',color:'var(--color-primary)' }}>₹{Number(req.totalAmount||0).toFixed(2)}</div>
        <div style={{ display:'flex',gap:10 }}>
          <button className="btn btn-ghost btn-sm" disabled={accepting} onClick={() => { clearInterval(timer.current); onDecline(req.id,'DECLINED'); }}>Decline</button>
          <button className="btn btn-primary" disabled={accepting||cd===0} onClick={accept} style={{ minWidth:100 }}>
            {accepting ? <><span className="spinner" style={{ borderTopColor:'#fff' }}/> Accepting…</> : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IncomingRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [accepted, setAccepted] = useState(null);
  const [banner,   setBanner]   = useState(null);

  const flash = (type, msg) => { setBanner({ type, msg: String(msg) }); setTimeout(() => setBanner(null), 5000); };

  const load = () => {
    api.get('/api/porter/requests/pending')
      .then(r => setRequests(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Poll every 10s as fallback
  useEffect(() => { const t = setInterval(load, 10000); return () => clearInterval(t); }, []);

  // Real-time: supervisor manually assigned a job to this porter
  useRealtimeBookings({
    onJobAssigned: event => { flash('success', `New job assigned: ${event.bookingReference||''}`); load(); },
  });

  const handleAccept = async (bookingId) => {
    try {
      const { data } = await api.post(`/api/porter/bookings/${bookingId}/accept`);
      setRequests(r => r.filter(x => x.id !== bookingId));
      setAccepted(data);
      flash('success', `Accepted! Service PIN: ${data.servicePin}`);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Could not accept — may have been assigned elsewhere';
      flash('error', String(msg));
    }
  };

  const handleDecline = (bookingId, reason) => {
    setRequests(r => r.filter(x => x.id !== bookingId));
    if (reason === 'TIMEOUT') flash('info', 'Request timed out — escalated to supervisor');
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="page-header" style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
        <div>
          <h1 className="page-title">Incoming Requests</h1>
          <p className="page-subtitle">Accept within 15 seconds — requests auto-escalate after that</p>
        </div>
        {/* Online indicator — no toggle. Porter is online simply by being logged in. */}
        <span style={{ display:'flex',alignItems:'center',gap:6,fontSize:'0.814rem',color:'var(--color-success)',fontWeight:600 }}>
          <span style={{ width:8,height:8,borderRadius:'50%',background:'var(--color-success)',display:'inline-block',animation:'pulse 2s infinite' }}/>
          Online
        </span>
      </div>

      {banner && <div className={`alert alert-${banner.type}`} style={{ marginBottom:18 }}>{banner.msg}</div>}

      {/* Accepted job card */}
      {accepted && (
        <div style={{ background:'rgba(13,148,136,0.06)',border:'2px solid var(--color-secondary)',borderRadius:'var(--radius-card)',padding:20,marginBottom:20 }}>
          <div style={{ fontWeight:700,color:'var(--color-secondary)',marginBottom:10 }}>Job Accepted — {accepted.bookingReference}</div>
          <div style={{ fontSize:'0.857rem',marginBottom:8 }}>
            <span style={{ color:'var(--color-text-muted)' }}>Passenger: </span><strong>{accepted.passengerName}</strong>
            {accepted.passengerMobile && <> · <a href={`tel:${accepted.passengerMobile}`} style={{ color:'var(--color-primary)',fontWeight:600 }}>{accepted.passengerMobile}</a></>}
          </div>
          <div style={{ fontSize:'0.857rem',marginBottom:14 }}>
            {accepted.platform && <span style={{ marginRight:16 }}><span style={{ color:'var(--color-text-muted)' }}>Platform: </span><strong>{accepted.platform}</strong></span>}
            {accepted.coachNumber && <span><span style={{ color:'var(--color-text-muted)' }}>Coach: </span><strong>{accepted.coachNumber}</strong></span>}
          </div>
          <div style={{ background:'var(--color-white)',borderRadius:8,padding:'12px 16px',border:'1px dashed rgba(13,148,136,0.4)' }}>
            <div style={{ fontSize:'0.700rem',color:'var(--color-text-muted)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4 }}>Service PIN — passenger will share this</div>
            <div style={{ fontWeight:800,fontSize:'2rem',letterSpacing:'0.3em',color:'var(--color-secondary)',fontFamily:'monospace' }}>{accepted.servicePin}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center',padding:48 }}><div className="spinner spinner-lg" style={{ margin:'0 auto' }}/></div>
      ) : requests.length === 0 ? (
        <div className="card" style={{ textAlign:'center',padding:'48px 24px' }}>
          <div style={{ fontSize:'2.5rem',marginBottom:16 }}>⏳</div>
          <div style={{ fontWeight:600,marginBottom:8 }}>No pending requests</div>
          <div style={{ color:'var(--color-text-muted)',fontSize:'0.857rem' }}>New requests appear here automatically and refresh every 10 seconds.</div>
        </div>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          {requests.map(req => (
            <RequestCard key={req.id} req={req} onAccept={handleAccept} onDecline={handleDecline}/>
          ))}
        </div>
      )}
    </div>
  );
}
