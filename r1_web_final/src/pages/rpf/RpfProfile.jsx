import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';
import useAuthStore from '../../stores/authStore.js';

export default function RpfProfile() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/api/staff/profile/me')
      .then(r => setProfile(r.data))
      .catch(() => setError('Could not load profile. Please contact your Station Control Room.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  if (error) return (
    <div className="alert alert-error" style={{ maxWidth: 520, margin: '40px auto' }}>{error}</div>
  );

  const p  = profile || {};
  const ob = p.onboarding || {};

  const Field = ({ label, value }) => (
    <div style={{ padding: '10px 0', borderBottom: '1px solid var(--c-border-lite)', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ fontSize: '0.829rem', color: 'var(--c-text-3)', fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.871rem', color: 'var(--c-text)', fontWeight: 500, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">RPF Officer details registered by Station Control Room</p>
      </div>

      {/* Officer card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
        <div style={{
          width: 68, height: 68, borderRadius: '50%',
          background: 'var(--c-error-bg)', color: 'var(--c-error)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '1.571rem', flexShrink: 0,
        }}>
          {(p.fullName || p.firstName || 'R')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1.071rem' }}>
            {p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'RPF Officer'}
          </div>
          <div style={{ color: 'var(--c-text-3)', fontSize: '0.843rem', marginTop: 2 }}>
            {p.phone}
            {ob.badgeNumber && ` · Badge: ${ob.badgeNumber}`}
          </div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <span className="badge badge-error">RPF Officer</span>
            {ob.zone && <span className="badge badge-muted">{ob.zone}</span>}
            <span className={`badge ${p.isActive !== false ? 'badge-success' : 'badge-muted'}`}>
              {p.isActive !== false ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Read-only notice */}
      <div className="alert alert-info" style={{ marginBottom: 20, fontSize: '0.829rem' }}>
        Your profile is managed by the Station Control Room. Contact your SCR to update any details.
      </div>

      {/* Personal details */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 16, fontSize: '0.914rem' }}>Personal Details</h3>
        <Field label="Full Name"       value={p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim()} />
        <Field label="Mobile Number"   value={p.phone} />
        <Field label="Email"           value={p.email} />
        <Field label="Date of Birth"   value={p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-IN') : null} />
      </div>

      {/* Service details */}
      <div className="card">
        <h3 style={{ marginBottom: 16, fontSize: '0.914rem' }}>Service Details</h3>
        <Field label="Badge Number"   value={ob.badgeNumber} />
        <Field label="Employee ID"    value={ob.employeeId} />
        <Field label="Assigned Zone"  value={ob.zone} />
        <Field label="Station"        value={ob.stationName ? `${ob.stationName} (${ob.stationCode})` : null} />
        <Field label="Onboarded"      value={ob.onboardedAt ? new Date(ob.onboardedAt).toLocaleDateString('en-IN') : null} />
      </div>
    </div>
  );
}
