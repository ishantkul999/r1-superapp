import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';

const INDIAN_STATES = [
  'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
];

const EMPTY_FORM = {
  stationName: '', stationCode: '', city: '', state: 'Gujarat',
  platformCount: '', zoneCount: '',
  scrName: '', scrPhone: '', scrEmail: '',
};

export default function StationOnboardingPage() {
  const [stations, setStations] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [banner,   setBanner]   = useState(null);
  const [toggling, setToggling] = useState(null);

  const flash = (type, msg) => { setBanner({ type, msg }); setTimeout(() => setBanner(null), 4500); };

  const load = () => {
    setLoading(true);
    api.get('/api/superadmin/stations')
      .then(r => setStations(r.data?.stations || []))
      .catch(() => flash('error', 'Could not load stations'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.stationName.trim() || !form.stationCode.trim() || !form.scrPhone.trim()) {
      flash('error', 'Station name, code, and Control Room mobile are required'); return;
    }
    if (!/^\d{10}$/.test(form.scrPhone.trim())) {
      flash('error', 'Enter a valid 10-digit mobile number for the Control Room'); return;
    }
    setSaving(true);
    try {
      await api.post('/api/superadmin/stations', {
        stationName:    form.stationName.trim(),
        stationCode:    form.stationCode.trim().toUpperCase(),
        city:           form.city.trim(),
        state:          form.state,
        platformCount:  parseInt(form.platformCount) || 0,
        zoneCount:      parseInt(form.zoneCount)     || 0,
        stationControl: {
          name:  form.scrName.trim()  || undefined,
          phone: `+91${form.scrPhone.trim()}`,
          email: form.scrEmail.trim() || undefined,
        },
      });
      flash('success', `Station ${form.stationCode.toUpperCase()} created. Station Control Room credentials sent to +91${form.scrPhone}.`);
      setModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      flash('error', err.response?.data?.error || 'Station creation failed. Code may already exist.');
    } finally { setSaving(false); }
  };

  const handleToggle = async (station) => {
    setToggling(station.id);
    try {
      await api.put(`/api/superadmin/stations/${station.id}`, {
        isActive: station.is_active === false,
      });
      flash('success', `Station ${station.station_code} ${station.is_active === false ? 'activated' : 'deactivated'}.`);
      load();
    } catch { flash('error', 'Could not update station status'); }
    finally { setToggling(null); }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Station Onboarding</h1>
          <p className="page-subtitle">Create and configure railway stations. Each station automatically gets a Station Control Room account.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setModal(true); }}>
          + Add Station
        </button>
      </div>

      {banner && <div className={`alert alert-${banner.type}`} style={{ marginBottom: 16 }}>{banner.msg}</div>}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Stations',  value: stations.length },
          { label: 'Active',          value: stations.filter(s => s.is_active !== false).length },
          { label: 'States Covered',  value: new Set(stations.map(s => s.state).filter(Boolean)).size },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Station</th>
              <th>Code</th>
              <th>Location</th>
              <th>Platforms</th>
              <th>Control Room</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </td></tr>
            ) : stations.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-title">No stations onboarded yet</div>
                  <div className="empty-state-desc">Click "Add Station" to configure the first station</div>
                </div>
              </td></tr>
            ) : stations.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.station_name}</td>
                <td>
                  <span style={{
                    fontFamily: 'monospace', fontWeight: 700,
                    background: 'var(--c-navy-light)', color: 'var(--c-navy)',
                    padding: '2px 8px', borderRadius: 5, fontSize: '0.857rem',
                  }}>{s.station_code}</span>
                </td>
                <td style={{ fontSize: '0.843rem' }}>{s.city}{s.state ? `, ${s.state}` : ''}</td>
                <td>{s.platform_count || '—'}</td>
                <td style={{ fontSize: '0.843rem' }}>
                  <div style={{ fontWeight: 500 }}>{s.control_room_name || '—'}</div>
                  <div style={{ color: 'var(--c-text-3)', fontSize: '0.771rem' }}>{s.control_room_phone}</div>
                </td>
                <td>
                  <span className={`badge ${s.is_active !== false ? 'badge-success' : 'badge-muted'}`}>
                    {s.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className={`btn btn-sm ${s.is_active !== false ? 'btn-outline' : 'btn-outline'}`}
                    style={{
                      color: s.is_active !== false ? 'var(--c-error)' : 'var(--c-success)',
                      borderColor: s.is_active !== false ? 'var(--c-error)' : 'var(--c-success)',
                    }}
                    disabled={toggling === s.id}
                    onClick={() => handleToggle(s)}
                  >
                    {toggling === s.id
                      ? <span className="spinner" style={{ width: 12, height: 12 }} />
                      : s.is_active !== false ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Create Modal ──────────────────────────────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={() => !saving && setModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Onboard New Station</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Station details */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.829rem', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Station Details</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Station Name <span className="form-req">*</span></label>
                    <input className="form-input" value={form.stationName}
                      onChange={e => setF('stationName', e.target.value)} placeholder="e.g. Ahmedabad Junction" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Station Code <span className="form-req">*</span></label>
                    <input className="form-input" value={form.stationCode}
                      onChange={e => setF('stationCode', e.target.value.toUpperCase())}
                      placeholder="e.g. ADI" maxLength={6}
                      style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.08em' }} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" value={form.city}
                      onChange={e => setF('city', e.target.value)} placeholder="City" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <select className="form-select" value={form.state} onChange={e => setF('state', e.target.value)}>
                      {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Number of Platforms</label>
                    <input className="form-input" type="number" min="1" value={form.platformCount}
                      onChange={e => setF('platformCount', e.target.value)} placeholder="e.g. 12" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Number of Zones</label>
                    <input className="form-input" type="number" min="1" value={form.zoneCount}
                      onChange={e => setF('zoneCount', e.target.value)} placeholder="e.g. 4" />
                  </div>
                </div>
              </div>

              {/* Station Control Room account */}
              <div style={{ borderTop: '1px solid var(--c-border-lite)', paddingTop: 18 }}>
                <div style={{ fontWeight: 700, fontSize: '0.829rem', color: 'var(--c-text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Station Control Room Account</div>
                <p style={{ fontSize: '0.829rem', color: 'var(--c-text-3)', marginBottom: 14 }}>
                  A Station Control Room login will be created. Credentials are sent to the mobile number below via OTP.
                  The SCR can then onboard Supervisors and RPF Officers for this station.
                </p>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Officer Name</label>
                    <input className="form-input" value={form.scrName}
                      onChange={e => setF('scrName', e.target.value)} placeholder="Control Room officer's name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number <span className="form-req">*</span></label>
                    <div className="phone-input-wrap">
                      <div className="phone-cc" style={{ pointerEvents: 'none' }}>
                        <span>🇮🇳</span>
                        <span style={{ fontWeight: 600, fontSize: '0.857rem' }}>+91</span>
                      </div>
                      <input className="phone-number" type="tel" value={form.scrPhone}
                        onChange={e => setF('scrPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10-digit mobile" />
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Official Email</label>
                  <input className="form-input" type="email" value={form.scrEmail}
                    onChange={e => setF('scrEmail', e.target.value)} placeholder="Official email (optional)" />
                </div>
              </div>

              <div className="alert alert-info" style={{ fontSize: '0.814rem' }}>
                Once created, the Station Control Room can log in and independently onboard Supervisors and RPF Officers for this station.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Creating…</> : 'Create Station'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
