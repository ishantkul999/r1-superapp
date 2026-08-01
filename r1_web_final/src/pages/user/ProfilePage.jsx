import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';
import useAuthStore from '../../stores/authStore.js';

const SALUTATIONS    = ['Mr.', 'Ms.', 'Mrs.', 'Dr.'];
const MARITAL_STATUS = ['Single', 'Married', 'Divorced', 'Widowed', 'Prefer not to say'];
const NATIONALITIES  = ['Indian', 'Afghan', 'Australian', 'British', 'Canadian', 'Chinese', 'French', 'German', 'Japanese', 'Singaporean', 'UAE', 'American', 'Other'];
const LANGUAGES      = [{ value: 'en', label: 'English' }, { value: 'hi', label: 'Hindi' }, { value: 'gu', label: 'Gujarati' }];

const DISABILITY_TYPES = [
  { value: '',            label: 'None' },
  { value: 'LOCOMOTOR',  label: 'Locomotor' },
  { value: 'VISUAL',     label: 'Visual' },
  { value: 'HEARING',    label: 'Hearing' },
  { value: 'COGNITIVE',  label: 'Cognitive' },
  { value: 'OTHER',      label: 'Other' },
];

const MOBILITY_AIDS = [
  { value: '',             label: 'None' },
  { value: 'CRUTCH',      label: 'Crutch / Walking stick' },
  { value: 'WHEELCHAIR',  label: 'Manual wheelchair' },
  { value: 'MOTORISED',   label: 'Motorised wheelchair' },
  { value: 'WALKER',      label: 'Walker / Rollator' },
];

const Field = ({ label, req, hint, children }) => (
    <div className="form-group">
      <label className="form-label">{label}{req && <span className="form-req"> *</span>}</label>
      {children}
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );

export default function UserProfilePage() {
  const { user } = useAuthStore();
  const [tab, setTab]         = useState('personal');
  const [saving, setSaving]   = useState(false);
  const [banner, setBanner]   = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    salutation: 'Mr.',
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    maritalStatus: '',
    nationality: 'Indian',
    preferredLanguage: 'en',
    disabilityType: '',
    mobilityAid: '',
    requiresWheelchair: false,
    medicalNotes: '',
  });

  const [contacts, setContacts]     = useState([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relation: '', isPrimary: false });
  const [addingContact, setAddingContact] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Load profile
  useEffect(() => {
    setLoading(true);
    api.get('/api/users/me').then(r => {
      const d = r.data || {};
      const fullName = (d.full_name || d.fullName || '').trim();
      const parts    = fullName.split(' ');
      setForm(f => ({
        ...f,
        firstName:         parts[0] || '',
        lastName:          parts.slice(1).join(' ') || '',
        email:             d.email || '',
        dob:               d.date_of_birth || d.dob || '',
        maritalStatus:     d.marital_status || d.maritalStatus || '',
        nationality:       d.nationality || 'Indian',
        preferredLanguage: d.preferred_language || d.preferredLanguage || 'en',
        disabilityType:    d.disability_type || d.disabilityType || '',
        mobilityAid:       d.mobility_aid || d.mobilityAid || '',
        requiresWheelchair:d.requires_wheelchair || d.requiresWheelchair || false,
        medicalNotes:      d.medical_notes || d.medicalNotes || '',
        salutation:        d.salutation || 'Mr.',
      }));
    }).catch(() => {}).finally(() => setLoading(false));

    api.get('/api/users/emergency-contacts').then(r => setContacts(r.data || [])).catch(() => {});
  }, []);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Show banner for 3 s
  const flash = (type, msg) => {
    setBanner({ type, msg });
    setTimeout(() => setBanner(null), 3500);
  };

  // Compute profile completeness
  const REQUIRED_FIELDS = ['firstName', 'lastName', 'email', 'dob', 'nationality'];
  const filled  = REQUIRED_FIELDS.filter(k => form[k]?.toString().trim()).length;
  const pct     = Math.round((filled / REQUIRED_FIELDS.length) * 100);

  const handleSaveProfile = async () => {
    if (!form.firstName.trim()) { flash('error', 'First name is required'); return; }
    if (!form.email.trim())     { flash('error', 'Email is required'); return; }
    setSaving(true);
    try {
      await api.put('/api/users/me', {
        fullName:          `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        salutation:        form.salutation,
        email:             form.email,
        dob:               form.dob,
        maritalStatus:     form.maritalStatus,
        nationality:       form.nationality,
        preferredLanguage: form.preferredLanguage,
        disabilityType:    form.disabilityType,
        mobilityAid:       form.mobilityAid,
        requiresWheelchair:form.requiresWheelchair,
        medicalNotes:      form.medicalNotes,
      });
      flash('success', 'Profile updated successfully');
    } catch (err) {
      flash('error', err.response?.data?.message || 'Update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone || !newContact.relation) {
      flash('error', 'Name, phone, and relation are required'); return;
    }
    setAddingContact(true);
    try {
      const { data } = await api.post('/api/users/emergency-contacts', newContact);
      setContacts(c => [...c, data]);
      setNewContact({ name: '', phone: '', relation: '', isPrimary: false });
      flash('success', 'Emergency contact added');
    } catch (err) {
      flash('error', err.response?.data?.message || 'Could not add contact');
    } finally {
      setAddingContact(false);
    }
  };

  const handleDeleteContact = async id => {
    setDeletingId(id);
    try {
      await api.delete(`/api/users/emergency-contacts/${id}`);
      setContacts(c => c.filter(x => x.id !== id));
    } catch {
      flash('error', 'Could not delete contact');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your personal details and emergency contacts</p>
      </div>

      {/* Banner */}
      {banner && (
        <div className={`alert alert-${banner.type}`} style={{ marginBottom: 16 }}>
          {banner.msg}
        </div>
      )}

      {/* Profile card header */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--c-navy-light)', color: 'var(--c-navy)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '1.5rem', flexShrink: 0,
        }}>
          {(form.firstName || user?.phone || 'U')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1.071rem' }}>
            {form.firstName ? `${form.salutation} ${form.firstName} ${form.lastName}`.trim() : 'Complete your profile'}
          </div>
          <div style={{ color: 'var(--c-text-3)', fontSize: '0.843rem', marginTop: 2 }}>
            {user?.phone || ''}
            {form.email && ` · ${form.email}`}
          </div>
          {/* Completeness */}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.757rem', color: 'var(--c-text-3)', marginBottom: 4 }}>
              <span>Profile completeness</span>
              <span style={{ fontWeight: 600, color: pct === 100 ? 'var(--c-success)' : 'var(--c-navy)' }}>{pct}%</span>
            </div>
            <div className="profile-progress-bar">
              <div className="profile-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {[
          { id: 'personal',   label: 'Personal Info' },
          { id: 'travel',     label: 'Travel Preferences' },
          { id: 'emergency',  label: 'Emergency Contacts' },
        ].map(t => (
          <div
            key={t.id}
            className={`tab-item${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >{t.label}</div>
        ))}
      </div>

      {/* ── Personal Info tab ──────────────────────────────────────────── */}
      {tab === 'personal' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: 12 }}>
            <Field label="Title">
              <select className="form-select" value={form.salutation} onChange={e => setF('salutation', e.target.value)}>
                {SALUTATIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="First Name" req>
              <input className="form-input" value={form.firstName} onChange={e => setF('firstName', e.target.value)} placeholder="First name" />
            </Field>
            <Field label="Last Name" req>
              <input className="form-input" value={form.lastName} onChange={e => setF('lastName', e.target.value)} placeholder="Last name" />
            </Field>
          </div>

          <div className="form-row">
            <Field label="Mobile Number" hint="Linked to your account — cannot be changed">
              <input className="form-input" value={user?.phone || ''} disabled style={{ background: 'var(--c-bg)', color: 'var(--c-text-3)', cursor: 'not-allowed' }} />
            </Field>
            <Field label="Email Address" req>
              <input className="form-input" type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="you@example.com" />
            </Field>
          </div>

          <div className="form-row">
            <Field label="Date of Birth">
              <input className="form-input" type="date" value={form.dob} onChange={e => setF('dob', e.target.value)} max={new Date().toISOString().split('T')[0]} />
            </Field>
            <Field label="Marital Status">
              <select className="form-select" value={form.maritalStatus} onChange={e => setF('maritalStatus', e.target.value)}>
                <option value="">Select…</option>
                {MARITAL_STATUS.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div className="form-row">
            <Field label="Nationality">
              <select className="form-select" value={form.nationality} onChange={e => setF('nationality', e.target.value)}>
                {NATIONALITIES.map(n => <option key={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Preferred Language" hint="Used by AI Assistant and notifications">
              <select className="form-select" value={form.preferredLanguage} onChange={e => setF('preferredLanguage', e.target.value)}>
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
              {saving ? <><span className="spinner" style={{ borderTopColor: '#fff' }} /> Saving…</> : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ── Travel Preferences tab ─────────────────────────────────────── */}
      {tab === 'travel' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <h3 style={{ marginBottom: 4 }}>Accessibility & Mobility</h3>
            <p style={{ fontSize: '0.829rem', color: 'var(--c-text-3)' }}>
              This information helps us assign the right porter and prepare the right equipment for you.
            </p>
          </div>

          <div className="form-row">
            <Field label="Disability Type">
              <select className="form-select" value={form.disabilityType} onChange={e => setF('disabilityType', e.target.value)}>
                {DISABILITY_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </Field>
            <Field label="Mobility Aid Used">
              <select className="form-select" value={form.mobilityAid} onChange={e => setF('mobilityAid', e.target.value)}>
                {MOBILITY_AIDS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Field>
          </div>

          <label className="form-checkbox-wrap">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={form.requiresWheelchair}
              onChange={e => setF('requiresWheelchair', e.target.checked)}
            />
            <span>I require wheelchair assistance for all porter bookings</span>
          </label>

          <Field label="Medical Notes" hint="Any information that helps our porters assist you better (optional)">
            <textarea
              className="form-input"
              rows={3}
              value={form.medicalNotes}
              onChange={e => setF('medicalNotes', e.target.value)}
              placeholder="E.g. Pacemaker fitted — avoid stairs. Diabetic — may need to stop frequently."
              style={{ resize: 'vertical' }}
            />
          </Field>

          <div style={{ padding: '12px 16px', background: 'var(--c-navy-light)', borderRadius: 8, fontSize: '0.829rem', color: 'var(--c-navy)' }}>
            All accessibility information is kept strictly confidential and used only to improve your experience.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
              {saving ? <><span className="spinner" style={{ borderTopColor: '#fff' }} /> Saving…</> : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ── Emergency Contacts tab ─────────────────────────────────────── */}
      {tab === 'emergency' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h3 style={{ marginBottom: 4 }}>Add Emergency Contact</h3>
              <p style={{ fontSize: '0.829rem', color: 'var(--c-text-3)' }}>
                Up to 5 contacts. They will be notified via SMS if you trigger the SOS alert.
              </p>
            </div>
            <div className="form-row">
              <Field label="Full Name" req>
                <input className="form-input" value={newContact.name} onChange={e => setNewContact(c => ({ ...c, name: e.target.value }))} placeholder="Contact's full name" />
              </Field>
              <Field label="Mobile Number" req>
                <input className="form-input" type="tel" value={newContact.phone} onChange={e => setNewContact(c => ({ ...c, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="10-digit mobile" />
              </Field>
            </div>
            <div className="form-row">
              <Field label="Relation" req>
                <input className="form-input" value={newContact.relation} onChange={e => setNewContact(c => ({ ...c, relation: e.target.value }))} placeholder="e.g. Spouse, Parent, Friend" />
              </Field>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <label className="form-checkbox-wrap" style={{ marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={newContact.isPrimary}
                    onChange={e => setNewContact(c => ({ ...c, isPrimary: e.target.checked }))}
                  />
                  <span>Primary contact</span>
                </label>
              </div>
            </div>
            <div>
              <button
                className="btn btn-primary"
                onClick={handleAddContact}
                disabled={addingContact || !newContact.name || !newContact.phone || !newContact.relation}
              >
                {addingContact ? <><span className="spinner" style={{ borderTopColor: '#fff' }} /> Adding…</> : '+ Add Contact'}
              </button>
            </div>
          </div>

          {/* Contact list */}
          {contacts.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon" style={{ fontSize: '1.5rem' }}>👥</div>
                <div className="empty-state-title">No emergency contacts yet</div>
                <div className="empty-state-desc">Add at least one contact who will be notified in an emergency.</div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Relation</th>
                    <th>Primary</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td>{c.phone}</td>
                      <td>{c.relation}</td>
                      <td>{c.is_primary ? <span className="badge badge-primary">Primary</span> : '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          disabled={deletingId === c.id}
                          onClick={() => handleDeleteContact(c.id)}
                        >
                          {deletingId === c.id
                            ? <span className="spinner" style={{ width: 12, height: 12, borderTopColor: '#fff' }} />
                            : '✕'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}