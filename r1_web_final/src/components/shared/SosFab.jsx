import React, { useState } from 'react';
import api from '../../lib/api.js';

export default function SosFab() {
  const [open,    setOpen]    = useState(false);
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const handleTrigger = async () => {
    setSending(true); setError('');
    const payload = { alertType: 'GENERAL', source: 'APP' };

    // Get GPS non-blocking — SOS fires even if location unavailable
    if (navigator.geolocation) {
      await new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(
          pos => { payload.lat = pos.coords.latitude; payload.lng = pos.coords.longitude; resolve(); },
          () => resolve(),
          { timeout: 3000, maximumAge: 10000 }
        );
      });
    }

    try {
      await api.post('/api/sos/trigger', payload);
      setSent(true);
    } catch {
      setError('Could not send SOS. Please call 182 directly.');
    } finally { setSending(false); }
  };

  const handleClose = () => { setOpen(false); setSent(false); setError(''); };

  return (
    <>
      <button className="sos-fab" style={{ bottom: 24, right: 22 }}
        onClick={() => { setOpen(true); setSent(false); setError(''); }}
        aria-label="Emergency SOS"
      >
        <span className="sos-fab-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </span>
        <span style={{ fontSize: '0.571rem', fontWeight: 800, letterSpacing: '0.04em' }}>SOS</span>
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => !sending && handleClose()}>
          <div className="modal" style={{ maxWidth: 380, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            {sent ? (
              <div style={{ padding: '40px 28px' }}>
                <div style={{ width:64,height:64,borderRadius:'50%',background:'var(--color-success-bg)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',fontSize:'1.714rem' }}>✓</div>
                <h3 style={{ marginBottom: 10 }}>SOS Alert Sent</h3>
                <p style={{ color:'var(--color-text-secondary)',fontSize:'0.871rem',lineHeight:1.65,marginBottom:16 }}>
                  RPF officers at Ahmedabad Junction have been alerted with an alarm sound.
                  Your emergency contacts have been notified via SMS with your location.
                </p>
                <div className="alert alert-sos" style={{ textAlign:'left',marginBottom:20 }}>
                  Stay where you are. Help is on the way.<br/>
                  Also call <strong>182</strong> (Railway) or <strong>112</strong> (Emergency).
                </div>
                <button className="btn btn-primary btn-full" onClick={handleClose}>Close</button>
              </div>
            ) : (
              <div style={{ padding: '32px 28px' }}>
                <div style={{ width:64,height:64,borderRadius:'50%',background:'var(--color-sos-bg)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px' }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--color-sos)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <h3 style={{ marginBottom: 10 }}>Send Emergency Alert?</h3>
                <p style={{ color:'var(--color-text-secondary)',fontSize:'0.871rem',lineHeight:1.65,marginBottom:20 }}>
                  This will immediately:<br/>
                  • Alert <strong>RPF officers</strong> at ADI with an alarm sound<br/>
                  • Share your <strong>live GPS location</strong> with RPF<br/>
                  • Send <strong>SMS with location link</strong> to your emergency contacts
                </p>
                {error && <div className="alert alert-error" style={{ marginBottom:14,textAlign:'left' }}>{error}</div>}
                <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                  <button className="btn btn-danger btn-lg btn-full" style={{ background:'var(--color-sos)',fontSize:'1rem',fontWeight:700 }} onClick={handleTrigger} disabled={sending}>
                    {sending ? <><span className="spinner" style={{ borderTopColor:'#fff' }}/> Sending…</> : 'Send SOS Alert'}
                  </button>
                  <button className="btn btn-ghost btn-full" onClick={handleClose}>Cancel — Not an Emergency</button>
                </div>
                <p style={{ marginTop:16,fontSize:'0.757rem',color:'var(--color-text-muted)' }}>
                  Railway helpline: <strong>182</strong> · General: <strong>112</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
