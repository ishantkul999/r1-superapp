import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../lib/api.js';
import useAuthStore from '../../stores/authStore.js';
import { ROLES } from '../../config/constants.js';

const ROLE_HOME = {
  [ROLES.USER]: '/user',
  [ROLES.PORTER]: '/porter',
  [ROLES.SUPERVISOR]: '/supervisor',
  [ROLES.RPF]: '/rpf',
  [ROLES.STATION_CONTROL_ROOM]: '/station-control',
  [ROLES.SUPERADMIN]: '/superadmin',
};

export default function OtpVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const phone = location.state?.phone;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const inputs = useRef([]);
  // Guard flag — prevents double-submit when all 6 digits auto-trigger verify
  const verifyInProgress = useRef(false);

  useEffect(() => {
    if (!phone) { navigate('/login'); return; }
    inputs.current[0]?.focus();
    const t = setInterval(() => setResendCooldown(c => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [phone, navigate]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
    // Auto-submit only when last digit is filled and not already submitting
    if (next.every(d => d !== '') && val && !verifyInProgress.current) {
      handleVerify(next.join(''));
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split('');
      setOtp(digits);
      inputs.current[5]?.focus();
      if (!verifyInProgress.current) handleVerify(pasted);
    }
  };

  const handleVerify = async (code) => {
    // Prevent double-submit
    if (verifyInProgress.current || loading) return;
    if (!code || code.length !== 6) return;

    verifyInProgress.current = true;
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/api/auth/otp/verify', { phone, otp: code });

      // Backend returns flat response — handle both shapes:
      // Shape 1: { accessToken, refreshToken, userId, phone, name, role, isNewUser }
      // Shape 2: { user: {...}, accessToken, refreshToken }
      const user = data.user || {
        id: data.userId,
        phone: data.phone,
        name: data.name,
        role: data.role,
      };
      const accessToken = data.accessToken;
      const refreshToken = data.refreshToken;

      setAuth(user, accessToken, refreshToken);
      navigate(ROLE_HOME[user.role] || '/user', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error
        || err.response?.data?.message
        || 'Invalid OTP. Please try again.';

      setError(msg);
      // Clear OTP boxes and refocus only on actual OTP error (not network error)
      if (err.response?.status === 401 || err.response?.status === 400) {
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => inputs.current[0]?.focus(), 50);
      }
    } finally {
      setLoading(false);
      verifyInProgress.current = false;
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError('');
    try {
      await api.post('/api/auth/otp/send', { phone });
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const otpComplete = otp.every(d => d !== '');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-surface)',
      padding: 24,
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 40, textAlign: 'center' }}>
        <div style={{
          width: 60, height: 60,
          background: 'var(--color-primary)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem',
          margin: '0 auto 20px',
        }}>📱</div>

        <h2 style={{ marginBottom: 8 }}>Verify OTP</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.857rem', marginBottom: 32 }}>
          Enter the 6-digit code sent to<br />
          <strong style={{ color: 'var(--color-text-primary)' }}>{phone}</strong>
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }} onPaste={handlePaste}>
          {otp.map((d, i) => (
            <input
              key={i}
              ref={el => inputs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              disabled={loading}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              style={{
                width: 46, height: 52,
                textAlign: 'center',
                fontSize: '1.286rem',
                fontWeight: 700,
                border: `2px solid ${d ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 8,
                outline: 'none',
                transition: 'border-color 0.15s',
                background: d ? 'rgba(27,58,107,0.04)' : 'var(--color-white)',
                opacity: loading ? 0.6 : 1,
              }}
            />
          ))}
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16, textAlign: 'left' }}>
            ⚠️ {error}
          </div>
        )}

        <button
          className="btn btn-primary btn-lg"
          onClick={() => handleVerify(otp.join(''))}
          disabled={loading || !otpComplete}
          style={{ width: '100%', marginBottom: 16 }}
        >
          {loading
            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                Verifying…
              </span>
            : 'Verify & Continue →'}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            style={{
              background: 'none', border: 'none',
              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
              color: resendCooldown > 0 ? 'var(--color-text-muted)' : 'var(--color-primary)',
              fontSize: '0.857rem', fontWeight: 500,
            }}
          >
            {resendLoading ? 'Sending…' : resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
          </button>

          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)', fontSize: '0.857rem',
            }}
          >
            ← Change number
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
