import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api.js';

const COUNTRIES = [
  { code: '+91',  flag: '🇮🇳', name: 'India',          iso: 'IN' },
  { code: '+1',   flag: '🇺🇸', name: 'United States',   iso: 'US' },
  { code: '+44',  flag: '🇬🇧', name: 'United Kingdom',  iso: 'GB' },
  { code: '+971', flag: '🇦🇪', name: 'UAE',             iso: 'AE' },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore',       iso: 'SG' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia',       iso: 'AU' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany',         iso: 'DE' },
  { code: '+33',  flag: '🇫🇷', name: 'France',          iso: 'FR' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan',           iso: 'JP' },
  { code: '+86',  flag: '🇨🇳', name: 'China',           iso: 'CN' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [country,  setCountry]  = useState(COUNTRIES[0]);
  const [phone,    setPhone]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [ccOpen,   setCcOpen]   = useState(false);
  const [ccSearch, setCcSearch] = useState('');
  const [agreed,   setAgreed]   = useState({ terms: false, privacy: false });
  const ccRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => { if (ccRef.current && !ccRef.current.contains(e.target)) setCcOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(ccSearch.toLowerCase()) ||
    c.code.includes(ccSearch)
  );

  const allAgreed = agreed.terms && agreed.privacy;

  const handleSendOtp = async e => {
    e.preventDefault();
    setError('');
    if (!phone.trim()) { setError('Please enter your mobile number.'); return; }
    if (!allAgreed) { setError('Please accept the Terms & Conditions and Privacy Policy.'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/otp/send', { phone: `${country.code}${phone.replace(/\D/g, '')}` });
      navigate('/verify-otp', { state: { phone: `${country.code}${phone.replace(/\D/g, '')}` } });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const phoneDigits = phone.replace(/\D/g, '');

const isPhoneValid =
  country.iso === 'IN'
    ? phoneDigits.length === 10
    : phoneDigits.length >= 10;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--c-bg)' }}>

      {/* ── Left branding panel ─────────────────────────────────────────── */}
      <div className="login-brand-panel" style={{
        flex: 1,
        background: 'linear-gradient(155deg, #0a2454 0%, var(--c-navy) 50%, #1e4d94 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', justifyContent: 'center',
        padding: '64px 56px', color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        {/* Background accent */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(13,148,136,0.12)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -100, left: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)', pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--c-teal)', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1.286rem', color: '#fff',
            boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          }}>R1</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.286rem', lineHeight: 1.2 }}>R1 Super App</div>
            <div style={{ fontSize: '0.786rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              Government · ADI · Ahmedabad Junction
            </div>
          </div>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.18, marginBottom: 16, color: '#fff', maxWidth: 420 }}>
          Smart Passenger<br />Assistance Platform
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.971rem', lineHeight: 1.65, maxWidth: 380, marginBottom: 48 }}>
          Book porters, check PNR status, reserve retiring rooms, manage digital lockers,
          and get multilingual AI travel assistance — all in one place.
        </p>

        {/* Features list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 380 }}>
          {[
            { label: 'Licensed Porter Service',     desc: 'Book trained porters at fixed CRIS rates' },
            { label: 'Station Rooms & Lockers',    desc: 'Retiring rooms and secure luggage storage' },
            { label: 'AI Travel Assistant',         desc: 'Multilingual help in Hindi, Gujarati, English' },
            { label: 'Emergency SOS',              desc: 'Instant RPF alert with GPS location sharing' },
          ].map(f => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '12px 16px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ fontSize: '1.143rem', width: 28, textAlign: 'center', flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.857rem', color: '#fff' }}>{f.label}</div>
                <div style={{ fontSize: '0.771rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', bottom: 24, left: 56 }}>
          <span style={{ fontSize: '0.714rem', color: 'rgba(255,255,255,0.25)' }}>
            Ministry of Railways · Indian Railways · CRIS Integration
          </span>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div style={{
        width: 440, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px',
        background: 'var(--c-surface)',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.06)',
      }}>
        <div style={{ width: '100%', maxWidth: 340 }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.357rem', marginBottom: 6 }}>Sign in</h2>
            <p style={{ color: 'var(--c-text-3)', fontSize: '0.857rem', lineHeight: 1.6 }}>
              Enter your mobile number to receive a one-time password.
            </p>
          </div>

          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Phone input with country code */}
            <div className="form-group">
              <label className="form-label">Mobile Number <span className="form-req">*</span></label>
              <div className="phone-input-wrap" ref={ccRef} style={{ display: 'flex', position: 'relative', alignItems: 'center' }}>
  {/* Country code selector */}
  <div
    className="phone-cc"
    onClick={() => setCcOpen(o => !o)}
    style={{ 
      userSelect: 'none', 
      cursor: 'pointer', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '6px',
      padding: '0 12px'
    }}
  >
    <span className="phone-cc-flag">{country.flag}</span>
    <span style={{ fontSize: '0.857rem', fontWeight: 600 }}>{country.code}</span>
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>

    {/* Dropdown */}
    {ccOpen && (
  <div 
    className="cc-dropdown" 
    style={{
      position: 'absolute', // Critical: pulls it out of the input box
      top: 'calc(100% + 8px)', // Drops it just below the container
      left: 0,
      width: '280px', // Give it a fixed width so it's not tiny
      zIndex: 100, // Critical: ensures it covers the checkboxes below
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      border: '1px solid var(--c-border-lite, #e5e7eb)',
      maxHeight: '300px',
      overflowY: 'auto'
    }}
  >
    <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
      <input
        className="form-input"
        style={{ 
          width: '100%', 
          boxSizing: 'border-box', // Prevents padding from breaking width
          padding: '8px',
          outline: 'none'
        }}
        placeholder="Search country..."
        value={ccSearch}
        onChange={e => setCcSearch(e.target.value)}
        onClick={e => e.stopPropagation()}
        autoFocus
  
          />
        </div>
        
        <div style={{ padding: '4px' }}>
          {filteredCountries.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--c-text-3)' }}>
              No countries found
            </div>
          ) : (
            filteredCountries.map(c => (
              <div
                key={c.iso}
                className="cc-option"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                onClick={e => { 
                  e.stopPropagation(); 
                  setCountry(c); 
                  setCcOpen(false); 
                  setCcSearch(''); 
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{c.flag}</span>
                <span style={{ flex: 1, fontSize: '0.857rem', fontWeight: 500, color: 'var(--c-text-1, #000)' }}>{c.name}</span>
                <span style={{ color: 'var(--c-text-3, #666)', fontSize: '0.800rem' }}>{c.code}</span>
              </div>
            ))
          )}
        </div>
      </div>
    )}
  </div>

  {/* Number field */}
  <input
    className="phone-number"
    type="tel"
    inputMode="numeric"
    value={phone}
    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 12))}
    placeholder={country.iso === 'IN' ? '98765 43210' : 'Mobile number'}
    required
    autoFocus={!ccOpen}
    style={{ flex: 1 }}
  />
</div>
</div>
            {/* T&C + Privacy checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label className="form-checkbox-wrap">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={agreed.terms}
                  onChange={e => setAgreed(a => ({ ...a, terms: e.target.checked }))}
                />
                <span>
                  I accept the{' '}
                  <Link to="/terms" target="_blank" style={{ color: 'var(--c-navy)', fontWeight: 600, textDecoration: 'underline' }}>
                    Terms &amp; Conditions
                  </Link>
                </span>
              </label>
              <label className="form-checkbox-wrap">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={agreed.privacy}
                  onChange={e => setAgreed(a => ({ ...a, privacy: e.target.checked }))}
                />
                <span>
                  I accept the{' '}
                  <Link to="/privacy" target="_blank" style={{ color: 'var(--c-navy)', fontWeight: 600, textDecoration: 'underline' }}>
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-error" style={{ padding: '9px 12px', fontSize: '0.814rem' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
  type="submit"
  className="btn btn-primary btn-lg btn-full"
  disabled={loading || !isPhoneValid || !allAgreed}
  style={{ marginTop: 2 }}
>
              {loading ? <><span className="spinner" style={{ borderTopColor: '#fff' }} /> Sending OTP…</> : 'Send OTP'}
            </button>
          </form>

          {/* Footer note */}
          <p style={{ color: 'var(--c-text-3)', fontSize: '0.757rem', textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
            A 6-digit OTP will be sent to your mobile number via SMS.
            Standard messaging rates may apply.
          </p>

          {/* Links */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--c-border-lite)', display: 'flex', justifyContent: 'center', gap: 20 }}>
            <Link to="/landing" style={{ color: 'var(--c-text-3)', fontSize: '0.786rem' }}>About</Link>
            <Link to="/privacy" style={{ color: 'var(--c-text-3)', fontSize: '0.786rem' }}>Privacy</Link>
            <Link to="/terms"   style={{ color: 'var(--c-text-3)', fontSize: '0.786rem' }}>Terms</Link>
            <Link to="/contact" style={{ color: 'var(--c-text-3)', fontSize: '0.786rem' }}>Contact</Link>
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 768px) {
          .login-brand-panel { display: none !important; }
          div[style*="width: 440"] { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}