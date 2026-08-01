import React, { useState, useEffect, useRef } from 'react';
import api from '../../lib/api.js';

const COUNTDOWN_SEC = 15;

const SVC_LABELS = {
  LUGGAGE_ONLY:'Luggage Porter', LUGGAGE_BARROW:'Luggage Barrow',
  WHEELCHAIR_ONLY:'Wheelchair Assistance', WHEELCHAIR_STRETCHER:'Stretcher/Bed Chair',
  COMBINED:'Combined — Luggage + Wheelchair',
};

function extractErr(err, fb = 'Request failed') {
  const d = err?.response?.data;
  if (!d) return err?.message || fb;
  if (typeof d.error   === 'string') return d.error;
  if (typeof d.message === 'string') return d.message;
  if (typeof d === 'string') return d;
  return fb;
}

// ── Countdown ring ────────────────────────────────────────────────────────────
function CountdownRing({ seconds, total = COUNTDOWN_SEC }) {
  const r = 20, c = 2 * Math.PI * r;
  const color = seconds <= 5 ? '#B91C1C' : seconds <= 10 ? '#B45309' : '#15803D';
  return (
    <div style={{ position:'relative', width:56, height:56, flexShrink:0 }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--color-border)" strokeWidth="4"/>
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={c} strokeDashoffset={c*(1-seconds/total)} strokeLinecap="round"
          transform="rotate(-90 28 28)" style={{ transition:'stroke-dashoffset 0.9s linear,stroke 0.3s' }}/>
      </svg>
      <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'1rem',color }}>
        {seconds}
      </div>
    </div>
  );
}

// ── Request card with 15s countdown ──────────────────────────────────────────
function RequestCard({ req, onAccept, onDecline, activeJob }) {
  const [countdown,  setCountdown]  = useState(COUNTDOWN_SEC);
  const [accepting,  setAccepting]  = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(c => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [req.id]);

  useEffect(() => {
    if (countdown === 0) {
      clearInterval(timerRef.current);
      onDecline(req.id, 'TIMEOUT');
    }
  }, [countdown, req.id]);

  const handleAccept = async () => {
    clearInterval(timerRef.current);
    setAccepting(true);
    await onAccept(req.id);
    setAccepting(false);
  };

  const handleDecline = () => {
    clearInterval(timerRef.current);
    onDecline(req.id, 'DECLINED');
  };

  return (
    <div style={{ background:'var(--color-white)', border:'2px solid var(--color-primary)', borderRadius:'var(--radius-card)', padding:20, boxShadow:'var(--shadow-card-hover)', animation:'slideUp 0.2s ease' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:'1rem', marginBottom:4 }}>
            {req.serviceType?.includes('WHEELCHAIR') ? '♿' : '🛄'} {SVC_LABELS[req.serviceType] || req.serviceType || 'Porter Request'}
          </div>
          <div style={{ fontSize:'0.771rem', color:'var(--color-text-muted)' }}>
            Ref: <span style={{ fontFamily:'monospace', fontWeight:600 }}>{req.bookingReference || req.id?.slice(0,8)}</span>
          </div>
        </div>
        <CountdownRing seconds={countdown} />
      </div>

      {/* Journey details */}
      <div style={{ background:'var(--color-surface)', borderRadius:8, padding:'12px 14px', marginBottom:14, fontSize:'0.857rem' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {req.platform     && <div><span style={{ color:'var(--color-text-muted)' }}>Platform: </span><strong>{req.platform}</strong></div>}
          {req.coachNumber  && <div><span style={{ color:'var(--color-text-muted)' }}>Coach: </span><strong>{req.coachNumber}</strong></div>}
          {req.pnrNumber    && <div><span style={{ color:'var(--color-text-muted)' }}>PNR: </span><strong>{req.pnrNumber}</strong></div>}
          {req.paymentMethod && <div><span style={{ color:'var(--color-text-muted)' }}>Payment: </span><strong>{req.paymentMethod}</strong></div>}
        </div>
        {req.pickupLocation && <div style={{ marginTop:6 }}><span style={{ color:'var(--color-text-muted)' }}>From: </span>{req.pickupLocation}</div>}
        {req.destination    && <div style={{ marginTop:2 }}><span style={{ color:'var(--color-text-muted)' }}>To: </span>{req.destination}</div>}
        {req.specialInstructions && (
          <div style={{ marginTop:6, color:'var(--color-primary)', fontStyle:'italic', fontSize:'0.814rem' }}>
            Note: {req.specialInstructions}
          </div>
        )}
      </div>

      {/* Passenger */}
      {req.passengerName && (
        <div style={{ fontSize:'0.857rem', marginBottom:14, display:'flex', gap:14, flexWrap:'wrap' }}>
          <span><span style={{ color:'var(--color-text-muted)' }}>Passenger: </span><strong>{req.passengerName}</strong></span>
          {req.passengerMobile && (
            <a href={`tel:${req.passengerMobile}`} style={{ color:'var(--color-primary)', fontWeight:600 }}>{req.passengerMobile}</a>
          )}
        </div>
      )}

      {/* Amount + actions */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontWeight:800, fontSize:'1.143rem', color:'var(--color-primary)' }}>
          ₹{Number(req.totalAmount || req.baseAmount || 0).toFixed(2)}
          {req.paymentMethod === 'COD' && (
            <span className="badge badge-warning" style={{ marginLeft:8, fontSize:'0.686rem' }}>COD</span>
          )}
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-ghost btn-sm" disabled={accepting} onClick={handleDecline}>
            Decline
          </button>
          <button className="btn btn-primary" disabled={accepting || countdown === 0 || !!activeJob} onClick={handleAccept} style={{ minWidth:110 }}>
            {accepting
              ? <><span className="spinner" style={{ borderTopColor:'#fff' }}/> Accepting…</>
              : 'Accept Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function IncomingRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [accepted, setAccepted] = useState(null);  
  const [banner,   setBanner]   = useState(null);
  const [activeJob, setActiveJob] = useState(null); 

  const flash = (type, msg) => {
    setBanner({ type, msg: String(msg) });
    setTimeout(() => setBanner(null), 6000);
  };

  const checkActiveJob = async () => {
    try {
      const { data, status } = await api.get('/api/porter/active-job');
      setActiveJob(status === 204 ? null : data);
    } catch {
      setActiveJob(null);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/api/porter/bookings/pending');
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('[IncomingRequests] fetch error:', err?.response?.status);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkActiveJob();
    fetchRequests();
    const poll = setInterval(() => { fetchRequests(); checkActiveJob(); }, 8000);
    return () => clearInterval(poll);
  }, []);

  const handleAccept = async (bookingId) => {
    try {
      const { data } = await api.post(`/api/porter/bookings/${bookingId}/accept`);
      setRequests(r => r.filter(x => x.id !== bookingId));
      setAccepted(data);
      flash('success', `Accepted! Service PIN: ${data.servicePin}`);
    } catch (err) {
      const status = err?.response?.status;
      const fallback = status === 404
        ? 'Your porter profile could not be found. Contact your supervisor.'
        : 'Could not accept — booking may have been assigned to another porter';
      const msg = extractErr(err, fallback);
      flash('error', msg);
      fetchRequests();
      checkActiveJob();
    }
  };

  const handleDecline = (bookingId, reason) => {
    setRequests(r => r.filter(x => x.id !== bookingId));
    if (reason === 'TIMEOUT') {
      flash('info', 'Request timed out — escalated to supervisor for manual assignment');
    }
  };

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 className="page-title">Incoming Requests</h1>
          <p className="page-subtitle">
            {requests.length > 0
              ? `${requests.length} pending request${requests.length !== 1 ? 's' : ''} — accept within 15 seconds`
              : 'Auto-refreshes every 8 seconds'}
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.814rem', color:'var(--color-success)', fontWeight:600 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--color-success)', display:'inline-block', animation:'pulse 2s infinite' }}/>
            Online
          </span>
          <button className="btn btn-outline btn-sm" onClick={fetchRequests}>↻ Refresh</button>
        </div>
      </div>

      {activeJob && (
        <div className="alert alert-warning">
          You have an active job ({activeJob.bookingReference || `#${activeJob.id?.slice(-8)}`}, status: {activeJob.status}).
          Finish or complete it from the Active Service tab before accepting a new request.
        </div>
      )}

      {/* Banner */}
      {banner && (
        <div className={`alert alert-${banner.type}`} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>{banner.msg}</span>
          <button onClick={() => setBanner(null)} style={{ background:'none', border:'none', cursor:'pointer', opacity:0.6, fontSize:'1rem' }}>✕</button>
        </div>
      )}

      {/* Accepted booking detail */}
      {accepted && (
        <div style={{ background:'rgba(13,148,136,0.06)', border:'2px solid var(--color-secondary)', borderRadius:'var(--radius-card)', padding:20 }}>
          <div style={{ fontWeight:700, color:'var(--color-secondary)', marginBottom:10 }}>
            Job Accepted — {accepted.bookingReference}
          </div>
          <div style={{ fontSize:'0.857rem', marginBottom:10 }}>
            <span style={{ color:'var(--color-text-muted)' }}>Passenger: </span>
            <strong>{accepted.passengerName}</strong>
            {accepted.passengerMobile && (
              <> · <a href={`tel:${accepted.passengerMobile}`} style={{ color:'var(--color-primary)', fontWeight:600 }}>{accepted.passengerMobile}</a></>
            )}
          </div>
          <div style={{ fontSize:'0.857rem', marginBottom:14, display:'flex', gap:16, flexWrap:'wrap' }}>
            {accepted.platform    && <span><span style={{ color:'var(--color-text-muted)' }}>Platform: </span><strong>{accepted.platform}</strong></span>}
            {accepted.coachNumber && <span><span style={{ color:'var(--color-text-muted)' }}>Coach: </span><strong>{accepted.coachNumber}</strong></span>}
          </div>
          {accepted.servicePin && (
            <div style={{ background:'var(--color-white)', borderRadius:8, padding:'12px 16px', border:'1px dashed rgba(13,148,136,0.4)' }}>
              <div style={{ fontSize:'0.700rem', color:'var(--color-text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>
                Service PIN — passenger will share this when you arrive
              </div>
              <div style={{ fontWeight:800, fontSize:'2rem', letterSpacing:'0.3em', color:'var(--color-secondary)', fontFamily:'monospace' }}>
                {accepted.servicePin}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Request list */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <div className="spinner spinner-lg" style={{ margin:'0 auto' }}/>
          <div style={{ marginTop:14, color:'var(--color-text-muted)', fontSize:'0.857rem' }}>Loading requests…</div>
        </div>
      ) : requests.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'48px 24px' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:16 }}></div>
          <div style={{ fontWeight:600, marginBottom:8 }}>No pending requests</div>
          <div style={{ color:'var(--color-text-muted)', fontSize:'0.857rem' }}>
            New requests appear here automatically. If a request is not accepted within 15 seconds,
            it escalates to your supervisor for manual porter assignment.
          </div>
        </div>
      ) : (
        requests.map(req => (
          <RequestCard
            key={req.id}
            req={req}
            onAccept={handleAccept}
            onDecline={handleDecline}
            activeJob={activeJob}
          />
        ))
      )}
    </div>
  );
}
