import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';

const STAFF_ROLES = [
  { value: 'SUPERVISOR', label: 'Supervisor', desc: 'Manages porter assignments and unassigned queue' },
  { value: 'RPF',        label: 'RPF Officer', desc: 'Emergency response and security operations' },
];

const EMPTY_FORM = { phone: '', name: '', email: '', role: 'SUPERVISOR', badgeNumber: '', employeeId: '', zone: '' };
const ModalForm = ({ isEdit, form, setF }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Role selector — only for create */}
      {!isEdit && (
        <div className="form-group">
          <label className="form-label">Role <span className="form-req">*</span></label>
          <div style={{ display: 'flex', gap: 10 }}>
            {STAFF_ROLES.map(r => (
              <button key={r.value} type="button"
                onClick={() => setF('role', r.value)}
                style={{
                  flex: 1, padding: '12px 14px', borderRadius: 8, textAlign: 'left',
                  border: `2px solid ${form.role === r.value ? 'var(--c-navy)' : 'var(--c-border)'}`,
                  background: form.role === r.value ? 'var(--c-navy-light)' : 'var(--c-surface)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.857rem' }}>{r.label}</div>
                <div style={{ fontSize: '0.757rem', color: 'var(--c-text-3)', marginTop: 2 }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Name + Phone */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Full Name <span className="form-req">*</span></label>
          <input className="form-input" value={form.name}
            onChange={e => setF('name', e.target.value)} placeholder="Full name"
            disabled={isEdit} />
        </div>
        <div className="form-group">
          <label className="form-label">Mobile Number{!isEdit && <span className="form-req"> *</span>}</label>
          {isEdit ? (
            <input className="form-input" value={form.phone} disabled
              style={{ background: 'var(--c-bg)', color: 'var(--c-text-3)', cursor: 'not-allowed' }} />
          ) : (
            <div className="phone-input-wrap">
              <div className="phone-cc" style={{ pointerEvents: 'none' }}>
                <span>🇮🇳</span>
                <span style={{ fontWeight: 600, fontSize: '0.857rem' }}>+91</span>
              </div>
              <input className="phone-number" type="tel" value={form.phone}
                onChange={e => setF('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile" />
            </div>
          )}
          {isEdit && <span className="form-hint">Mobile cannot be changed after account creation</span>}
        </div>
      </div>

      {/* Email */}
      <div className="form-group">
        <label className="form-label">Official Email</label>
        <input className="form-input" type="email" value={form.email}
          onChange={e => setF('email', e.target.value)} placeholder="Official email (optional)" />
      </div>

      {/* Badge + Employee ID + Zone */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Badge Number</label>
          <input className="form-input" value={form.badgeNumber}
            onChange={e => setF('badgeNumber', e.target.value)} placeholder="Uniform badge no." />
        </div>
        <div className="form-group">
          <label className="form-label">Employee ID</label>
          <input className="form-input" value={form.employeeId}
            onChange={e => setF('employeeId', e.target.value)} placeholder="Railway employee ID" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Assigned Zone / Platform</label>
        <input className="form-input" value={form.zone}
          onChange={e => setF('zone', e.target.value)} placeholder="e.g. ZONE-A, PF 1-4" />
      </div>

      {!isEdit && (
        <div className="alert alert-info" style={{ fontSize: '0.814rem' }}>
          A one-time password will be sent to the mobile number via SMS. The staff member uses OTP login — no password is set.
        </div>
      )}
    </div>
  );
export default function StaffOnboardingPage() {
  const [staff,    setStaff]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editModal, setEditModal] = useState(null);   // entry being edited
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [banner,   setBanner]   = useState(null);
  const [filter,   setFilter]   = useState('ALL');
  const [acting,   setActing]   = useState(null);    // id of row being enabled/disabled

  const flash = (type, msg) => { setBanner({ type, msg }); setTimeout(() => setBanner(null), 4500); };

  const load = () => {
    setLoading(true);
    api.get('/api/station/control/staff')
      .then(r => setStaff(r.data?.staff || []))
      .catch(() => flash('error', 'Could not load staff list'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.phone.trim() || !form.name.trim()) {
      flash('error', 'Mobile number and name are required'); return;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      flash('error', 'Enter a valid 10-digit mobile number'); return;
    }
    setSaving(true);
    try {
      await api.post('/api/station/control/staff/onboard', {
        phone: `+91${form.phone.trim()}`,
        name:        form.name.trim(),
        email:       form.email.trim() || undefined,
        role:        form.role,
        badgeNumber: form.badgeNumber.trim() || undefined,
        employeeId:  form.employeeId.trim() || undefined,
        zone:        form.zone.trim() || undefined,
      });
      flash('success', `${form.role === 'SUPERVISOR' ? 'Supervisor' : 'RPF Officer'} "${form.name}" created. Login OTP sent to +91${form.phone}.`);
      setModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      flash('error', err.response?.data?.error || 'Failed to create account. Please try again.');
    } finally { setSaving(false); }
  };

  // ── Edit (zone / badge update only — phone/role immutable) ────────────────
  const handleEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      await api.put(`/api/station/control/staff/${editModal.id}`, {
        badgeNumber: form.badgeNumber || undefined,
        employeeId:  form.employeeId  || undefined,
        zone:        form.zone        || undefined,
        email:       form.email       || undefined,
      });
      flash('success', `${editModal.name || 'Staff member'} updated successfully.`);
      setEditModal(null);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      flash('error', err.response?.data?.error || 'Update failed');
    } finally { setSaving(false); }
  };

  const openEdit = (member) => {
    setForm({
      phone: member.phone || '',
      name:  member.name  || '',
      email: member.email || '',
      role:  member.role  || 'SUPERVISOR',
      badgeNumber: member.badge_number || '',
      employeeId:  member.employee_id  || '',
      zone:        member.zone         || '',
    });
    setEditModal(member);
  };

  // ── Disable / Enable ──────────────────────────────────────────────────────
  const handleToggle = async (member) => {
    setActing(member.id);
    const endpoint = member.is_active !== false
      ? `/api/station/control/staff/${member.id}/disable`
      : `/api/station/control/staff/${member.id}/enable`;
    try {
      await api.put(endpoint);
      flash('success', `${member.name || 'Staff member'} ${member.is_active !== false ? 'disabled' : 'enabled'}.`);
      load();
    } catch {
      flash('error', 'Could not update status');
    } finally { setActing(null); }
  };

  const filtered = filter === 'ALL' ? staff : staff.filter(s => s.role === filter);

  const ROLE_BADGE = { SUPERVISOR: 'badge-primary', RPF: 'badge-error' };

  // ── Shared modal body ─────────────────────────────────────────────────────
  

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Staff Onboarding</h1>
          <p className="page-subtitle">Create and manage Supervisor and RPF Officer accounts for this station</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setModal(true); }}>
          + Onboard Staff
        </button>
      </div>

      {banner && <div className={`alert alert-${banner.type}`} style={{ marginBottom: 16 }}>{banner.msg}</div>}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Staff',   value: staff.length },
          { label: 'Supervisors',   value: staff.filter(s => s.role === 'SUPERVISOR').length },
          { label: 'RPF Officers',  value: staff.filter(s => s.role === 'RPF').length },
          { label: 'Active',        value: staff.filter(s => s.is_active !== false).length },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['ALL', 'SUPERVISOR', 'RPF'].map(f => (
          <button key={f} className={`chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'ALL' ? 'All Staff' : f === 'SUPERVISOR' ? 'Supervisors' : 'RPF Officers'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Mobile</th>
              <th>Badge / Emp ID</th>
              <th>Zone</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-title">No staff members found</div>
                  <div className="empty-state-desc">Click "Onboard Staff" to create the first account</div>
                </div>
              </td></tr>
            ) : filtered.map(member => (
              <tr key={member.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{member.name}</div>
                  {member.email && <div style={{ fontSize: '0.771rem', color: 'var(--c-text-3)' }}>{member.email}</div>}
                </td>
                <td><span className={`badge ${ROLE_BADGE[member.role] || 'badge-muted'}`}>{member.role}</span></td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.857rem' }}>{member.phone}</td>
                <td style={{ fontSize: '0.843rem' }}>
                  {member.badge_number || '—'}
                  {member.employee_id && <span style={{ color: 'var(--c-text-3)', fontSize: '0.771rem' }}> / {member.employee_id}</span>}
                </td>
                <td style={{ fontSize: '0.843rem' }}>{member.zone || '—'}</td>
                <td>
                  <span className={`badge ${member.is_active !== false ? 'badge-success' : 'badge-muted'}`}>
                    {member.is_active !== false ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(member)}>Edit</button>
                    <button
                      className={`btn btn-sm ${member.is_active !== false ? 'btn-danger' : 'btn-outline'}`}
                      style={member.is_active !== false ? {} : { color: 'var(--c-success)', borderColor: 'var(--c-success)' }}
                      disabled={acting === member.id}
                      onClick={() => handleToggle(member)}
                    >
                      {acting === member.id
                        ? <span className="spinner" style={{ width: 12, height: 12, borderTopColor: member.is_active !== false ? '#fff' : 'var(--c-success)' }} />
                        : member.is_active !== false ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Create Modal ─────────────────────────────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={() => !saving && setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Onboard New Staff Member</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body"><ModalForm isEdit={false} form={form} setF={setF} /></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Creating…</> : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────────── */}
      {editModal && (
        <div className="modal-overlay" onClick={() => !saving && setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Edit Staff Member</h3>
                <div style={{ fontSize: '0.814rem', color: 'var(--c-text-3)', marginTop: 2 }}>{editModal.name}</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <div className="modal-body"><ModalForm isEdit={true} form={form} setF={setF} /></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditModal(null)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEdit} disabled={saving}>
                {saving ? <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Saving…</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

