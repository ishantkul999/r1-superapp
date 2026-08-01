import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';

const SERVICE_TYPES = [
  { value: 'LUGGAGE_ONLY',           label: 'Luggage Only' },
  { value: 'LUGGAGE_BARROW',         label: 'Luggage Barrow' },
  { value: 'WHEELCHAIR_ONLY',        label: 'Wheelchair Only' },
  { value: 'WHEELCHAIR_STRETCHER',   label: 'Wheelchair Stretcher' },
  { value: 'COMBINED',               label: 'Combined (Luggage + Wheelchair)' },
];

function extractErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (typeof data.error === 'string')   return data.error;
  if (typeof data.message === 'string') return data.message;
  if (typeof data === 'string')         return data;
  if (typeof data.error === 'object' && data.error !== null) {
    return data.error.message || data.error.error || fallback;
  }
  return fallback;
}

const EMPTY_FORM = {
  name: '', phone: '', email: '',
  badgeNumber: '', licenseId: '', employeeId: '',
  serviceType: 'LUGGAGE_ONLY', zone: '',
};

export default function CreatePorterPage() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [banner,  setBanner]  = useState(null);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const flash = (type, msg) => { setBanner({ type, msg: String(msg) }); setTimeout(() => setBanner(null), 5000); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { flash('error', 'Porter name is required.'); return; }
    if (!/^\d{10}$/.test(form.phone.trim())) { flash('error', 'Enter a valid 10-digit mobile number.'); return; }
    if (!form.badgeNumber.trim()) { flash('error', 'Badge number is required.'); return; }

    setSaving(true);
    try {
      const { data } = await api.post('/api/supervisor/porters/create', {
        name:        form.name.trim(),
        phone:       `+91${form.phone.trim()}`,
        email:       form.email.trim() || undefined,
        badgeNumber: form.badgeNumber.trim(),
        licenseId:   form.licenseId.trim() || undefined,
        employeeId:  form.employeeId.trim() || undefined,
        serviceType: form.serviceType,
        zone:        form.zone.trim() || undefined,
      });

      flash('success', `Porter "${form.name}" registered successfully. Badge: ${form.badgeNumber}. They can log in with +91${form.phone} via OTP whenever they have a device.`);
      setForm(EMPTY_FORM);
      setTimeout(() => navigate('/supervisor/porters'), 2000);
    } catch (err) {
      flash('error', extractErrorMessage(err, 'Porter registration failed. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Create Porter Account</h1>
        <p className="page-subtitle">
          Register a porter using their name and mobile number. They can log in via OTP
          whenever they have access to a phone — no device needed during onboarding.
        </p>
      </div>

      {banner && <div className={`alert alert-${banner.type}`} style={{ marginBottom: 18 }}>{banner.msg}</div>}

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Identity — Name + Mobile (NEW — was missing) */}
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.829rem', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
            Porter Identity
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name <span className="form-req">*</span></label>
              <input className="form-input" value={form.name}
                onChange={e => setF('name', e.target.value)} placeholder="Porter's full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number <span className="form-req">*</span></label>
              <div className="phone-input-wrap">
                <div className="phone-cc" style={{ pointerEvents: 'none' }}>
                  <span>🇮🇳</span>
                  <span style={{ fontWeight: 600, fontSize: '0.857rem' }}>+91</span>
                </div>
                <input className="phone-number" type="tel" value={form.phone}
                  onChange={e => setF('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile" />
              </div>
              <span className="form-hint">This is how the porter logs in — OTP sent here</span>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label">Email (optional)</label>
            <input className="form-input" type="email" value={form.email}
              onChange={e => setF('email', e.target.value)} placeholder="Porter's email (optional)" />
          </div>
        </div>

        {/* Service details */}
        <div style={{ borderTop: '1px solid var(--c-border-lite)', paddingTop: 18 }}>
          <div style={{ fontWeight: 700, fontSize: '0.829rem', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
            Service Details
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Badge Number <span className="form-req">*</span></label>
              <input className="form-input" value={form.badgeNumber}
                onChange={e => setF('badgeNumber', e.target.value)} placeholder="Uniform badge number" />
            </div>
            <div className="form-group">
              <label className="form-label">License ID</label>
              <input className="form-input" value={form.licenseId}
                onChange={e => setF('licenseId', e.target.value)} placeholder="CRIS license ID" />
            </div>
          </div>
          <div className="form-row" style={{ marginTop: 14 }}>
            <div className="form-group">
              <label className="form-label">Service Type</label>
              <select className="form-select" value={form.serviceType} onChange={e => setF('serviceType', e.target.value)}>
                {SERVICE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assigned Zone</label>
              <input className="form-input" value={form.zone}
                onChange={e => setF('zone', e.target.value)} placeholder="e.g. ZONE-A, PF 1-4" />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label">Employee ID (optional)</label>
            <input className="form-input" value={form.employeeId}
              onChange={e => setF('employeeId', e.target.value)} placeholder="Railway employee ID" />
          </div>
        </div>

        <div className="alert alert-info" style={{ fontSize: '0.814rem' }}>
          A login OTP will be sent to the mobile number above whenever the porter
          opens the app for the first time. No password is needed — the porter
          can access their dashboard from any device using this number.
        </div>

        <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={saving}>
          {saving ? <><span className="spinner" style={{ borderTopColor: '#fff' }} /> Creating…</> : 'Create Porter Account'}
        </button>
      </div>
    </div>
  );
}