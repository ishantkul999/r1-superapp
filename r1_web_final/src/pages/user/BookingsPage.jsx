import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';

function fmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
  catch { return '—'; }
}

const STATUS_BADGE  = { PENDING_ACCEPTANCE:'badge-warning', AWAITING_PAYMENT:'badge-warning', ACCEPTED:'badge-secondary', IN_PROGRESS:'badge-success', COMPLETED:'badge-success', CANCELLED:'badge-muted' };
const STATUS_LABEL  = { PENDING_ACCEPTANCE:'Finding Porter', AWAITING_PAYMENT:'Awaiting Payment', ACCEPTED:'Porter Assigned', IN_PROGRESS:'In Progress', COMPLETED:'Completed', CANCELLED:'Cancelled' };
const SVC_LABEL     = { LUGGAGE_ONLY:'Luggage Porter', LUGGAGE_BARROW:'Luggage Barrow', WHEELCHAIR_ONLY:'Wheelchair Assistance', WHEELCHAIR_STRETCHER:'Stretcher / Bed Chair', COMBINED:'Combined — Luggage + Wheelchair' };

export default function BookingsPage() {
  const navigate = useNavigate();
  const [bookings,  setBookings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('ALL');
  const [expanded,  setExpanded]  = useState(null);

  useEffect(() => {
    // CORRECT: GET /api/porter/bookings/my — returns List<PorterBookingDetailDto>
    // with porterName, porterPhone, porterBadge, porterZone joined in
    api.get('/api/porter/bookings/my')
      .then(r => setBookings(Array.isArray(r.data) ? r.data : (r.data?.bookings || [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const TABS = ['ALL','ACTIVE','COMPLETED','CANCELLED'];
  const filtered = bookings.filter(b => {
    if (tab === 'ALL')       return true;
    if (tab === 'ACTIVE')    return ['PENDING_ACCEPTANCE','AWAITING_PAYMENT','ACCEPTED','IN_PROGRESS'].includes(b.status);
    if (tab === 'COMPLETED') return b.status === 'COMPLETED';
    if (tab === 'CANCELLED') return b.status === 'CANCELLED';
    return true;
  });

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display:'flex', flexDirection:'column', gap: 20 }}>
      <div className="page-header">
        <h1 className="page-title">My Bookings</h1>
        <p className="page-subtitle">All your porter service bookings at ADI</p>
      </div>

      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t} className={`tab-item${tab===t?' active':''}`} onClick={() => setTab(t)}>
            {t==='ALL'?'All':t==='ACTIVE'?'Active':t==='COMPLETED'?'Completed':'Cancelled'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{height:88,borderRadius:10}}/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div style={{fontSize:'2rem',marginBottom:12}}>📋</div>
          <div className="empty-state-title">No bookings found</div>
          <div className="empty-state-desc" style={{display:'flex',gap:8,justifyContent:'center',marginTop:12}}>
            {tab==='ALL' && <button className="btn btn-primary btn-sm" onClick={()=>navigate('/user/porter')}>Book a Porter</button>}
          </div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {filtered.map(b => {
            const isOpen   = expanded === b.id;
            const isActive = ['ACCEPTED','IN_PROGRESS'].includes(b.status);
            return (
              <div key={b.id} className="card" style={{padding:0,overflow:'hidden',border:isActive?'2px solid var(--color-secondary)':'1px solid var(--color-border-light)'}}>

                {/* Summary row */}
                <div style={{display:'flex',alignItems:'center',gap:14,padding:'16px 20px',cursor:'pointer'}} onClick={() => setExpanded(isOpen ? null : b.id)}>
                  <div style={{width:44,height:44,borderRadius:10,flexShrink:0,background:isActive?'rgba(13,148,136,0.1)':'rgba(27,58,107,0.07)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem'}}>
                    {b.serviceType?.includes('WHEELCHAIR') ? '♿' : '🛄'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:'0.914rem'}}>{SVC_LABEL[b.serviceType] || b.serviceType}</div>
                        <div style={{fontSize:'0.771rem',color:'var(--color-text-muted)',marginTop:2}}>
                          {fmtDate(b.createdAt || b.created_at)}
                          {b.bookingReference && ` · ${b.bookingReference}`}
                        </div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <span className={`badge badge-lg ${STATUS_BADGE[b.status]||'badge-muted'}`}>{STATUS_LABEL[b.status]||b.status}</span>
                        <div style={{fontSize:'0.786rem',fontWeight:700,color:'var(--c-navy)',marginTop:4}}>₹{Number(b.totalAmount||b.total_amount||0).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  <span style={{color:'var(--color-text-muted)',flexShrink:0}}>{isOpen?'▲':'▼'}</span>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{borderTop:'1px solid var(--color-border-light)',padding:'16px 20px',background:'var(--color-surface)',display:'flex',flexDirection:'column',gap:14}}>

                    {/* Journey */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:'0.857rem'}}>
                      {b.pnrNumber    && <div><span style={{color:'var(--color-text-muted)'}}>PNR: </span><strong>{b.pnrNumber}</strong></div>}
                      {b.platform     && <div><span style={{color:'var(--color-text-muted)'}}>Platform: </span><strong>{b.platform}</strong></div>}
                      {b.coachNumber  && <div><span style={{color:'var(--color-text-muted)'}}>Coach: </span><strong>{b.coachNumber}</strong></div>}
                      {b.seatBerth    && <div><span style={{color:'var(--color-text-muted)'}}>Seat/Berth: </span><strong>{b.seatBerth}</strong></div>}
                      {b.pickupLocation && <div style={{gridColumn:'1/-1'}}><span style={{color:'var(--color-text-muted)'}}>From: </span>{b.pickupLocation}</div>}
                      {b.destination   && <div style={{gridColumn:'1/-1'}}><span style={{color:'var(--color-text-muted)'}}>To: </span>{b.destination}</div>}
                    </div>

                    {/* Porter contact — shown when porter is assigned */}
                    {(b.porterId || b.porter_id) && isActive && (
                      <div style={{background:'rgba(13,148,136,0.06)',border:'1px solid rgba(13,148,136,0.2)',borderRadius:10,padding:'14px 16px'}}>
                        <div style={{fontWeight:700,fontSize:'0.871rem',color:'var(--color-secondary)',marginBottom:10}}>Your Porter</div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:'0.857rem'}}>
                          {b.porterName  && <div><span style={{color:'var(--color-text-muted)'}}>Name: </span><strong>{b.porterName}</strong></div>}
                          {b.porterBadge && <div><span style={{color:'var(--color-text-muted)'}}>Badge: </span><strong>{b.porterBadge}</strong></div>}
                          {b.porterPhone && (
                            <div style={{gridColumn:'1/-1'}}>
                              <span style={{color:'var(--color-text-muted)'}}>Contact: </span>
                              <a href={`tel:${b.porterPhone}`} style={{fontWeight:700,color:'var(--color-primary)'}}>{b.porterPhone}</a>
                            </div>
                          )}
                          {b.porterZone  && <div><span style={{color:'var(--color-text-muted)'}}>Zone: </span>{b.porterZone}</div>}
                        </div>
                        {/* Service PIN — shown when ACCEPTED so passenger can give it to porter */}
                        {b.status === 'ACCEPTED' && b.servicePin && (
                          <div style={{marginTop:12,padding:'12px 16px',background:'var(--color-white)',borderRadius:8,border:'1px dashed rgba(13,148,136,0.4)'}}>
                            <div style={{fontSize:'0.700rem',color:'var(--color-text-muted)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>
                              Service PIN — share with your porter to start
                            </div>
                            <div style={{fontWeight:800,fontSize:'2rem',letterSpacing:'0.3em',color:'var(--color-secondary)',fontFamily:'monospace'}}>
                              {b.servicePin}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Payment summary */}
                    <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8,fontSize:'0.857rem',color:'var(--color-text-muted)'}}>
                      <span>Payment: <strong style={{color:'var(--color-text-primary)'}}>{b.paymentMethod || b.payment_method || '—'}</strong></span>
                      <span>Total: <strong style={{color:'var(--color-primary)',fontSize:'1rem'}}>₹{Number(b.totalAmount||b.total_amount||0).toFixed(2)}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}