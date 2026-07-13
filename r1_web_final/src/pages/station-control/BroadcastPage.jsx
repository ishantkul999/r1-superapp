import React, { useState } from 'react';
import api from '../../lib/api.js';

const BROADCAST_TYPES = [
  { value: 'PLATFORM_CHANGE',    label: 'Platform Change',     desc: 'Train platform reassignment notice' },
  { value: 'DELAY',              label: 'Train Delay',         desc: 'Delay or schedule change alert' },
  { value: 'EMERGENCY',          label: 'Emergency Notice',    desc: 'Critical safety or security alert' },
  { value: 'ANNOUNCEMENT',       label: 'Station Announcement',desc: 'General passenger information' },
  { value: 'SERVICE_DISRUPTION', label: 'Service Disruption',  desc: 'Locker, room, or porter service notice' },
];

const TARGET_ROLES = [
  { value: 'ALL',        label: 'All Users' },
  { value: 'USER',       label: 'Passengers Only' },
  { value: 'PORTER',     label: 'Porters Only' },
  { value: 'SUPERVISOR', label: 'Supervisors Only' },
  { value: 'RPF',        label: 'RPF Officers Only' },
];

const CHANNELS = [
  { value: 'PUSH', label: 'Push Notification', desc: 'In-app push to mobile devices' },
  { value: 'IN_APP', label: 'In-App Banner',   desc: 'Shows as a banner inside the app' },
];

const EMPTY = { title: '', body: '', type: 'ANNOUNCEMENT', targetRole: 'ALL', channel: 'PUSH' };

export default function BroadcastPage() {
  const [form,    setForm]    = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [banner,  setBanner]  = useState(null);
  const [history, setHistory] = useState([]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const flash = (type, msg) => { setBanner({ type, msg }); setTimeout(() => setBanner(null), 5000); };

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      flash('error', 'Title and message body are required.'); return;
    }
    setSending(true);
    try {
      await api.post('/api/station/control/broadcast', form);
      setHistory(h => [{
        ...form,
        sentAt: new Date().toISOString(),
        id: Date.now(),
      }, ...h].slice(0, 20));
      setForm(EMPTY);
      flash('success', `Broadcast sent successfully to ${form.targetRole === 'ALL' ? 'all users' : form.targetRole.toLowerCase() + 's'}.`);
    } catch (err) {
      flash('error', err.response?.data?.error || 'Broadcast failed. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const selectedType = BROADCAST_TYPES.find(t => t.value === form.type);

  const TYPE_BADGE = {
    PLATFORM_CHANGE:    'badge-warning',
    DELAY:              'badge-warning',
    EMERGENCY:          'badge-error',
    ANNOUNCEMENT:       'badge-primary',
    SERVICE_DISRUPTION: 'badge-muted',
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>

      <div className="page-header">
        <h1 className="page-title">Broadcast Notifications</h1>
        <p className="page-subtitle">Send announcements to passengers and staff at this station</p>
      </div>

      {banner && (
        <div className={`alert alert-${banner.type}`} style={{ marginBottom: 18 }}>
          {banner.msg}
        </div>
      )}

      {/* Compose form */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 20 }}>
        <h3 style={{ fontSize: '0.971rem' }}>Compose Broadcast</h3>

        {/* Type */}
        <div className="form-group">
          <label className="form-label">Notice Type <span className="form-req">*</span></label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {BROADCAST_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => set('type', t.value)}
                style={{
                  padding: '10px 14px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                  border: `2px solid ${form.type === t.value ? 'var(--c-navy)' : 'var(--c-border)'}`,
                  background: form.type === t.value ? 'var(--c-navy-light)' : 'var(--c-surface)',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.843rem', marginBottom: 2 }}>{t.label}</div>
                <div style={{ fontSize: '0.757rem', color: 'var(--c-text-3)' }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="form-label">Title <span className="form-req">*</span></label>
          <input
            className="form-input"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder={selectedType ? `e.g. ${selectedType.label} — Platform 4` : 'Broadcast title'}
            maxLength={100}
          />
          <span className="form-hint">{form.title.length}/100 characters</span>
        </div>

        {/* Body */}
        <div className="form-group">
          <label className="form-label">Message <span className="form-req">*</span></label>
          <textarea
            className="form-input"
            rows={4}
            value={form.body}
            onChange={e => set('body', e.target.value)}
            placeholder="Enter the full broadcast message visible to recipients…"
            maxLength={500}
            style={{ resize: 'vertical' }}
          />
          <span className="form-hint">{form.body.length}/500 characters</span>
        </div>

        {/* Target + Channel */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Target Audience</label>
            <select className="form-select" value={form.targetRole} onChange={e => set('targetRole', e.target.value)}>
              {TARGET_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Delivery Channel</label>
            <select className="form-select" value={form.channel} onChange={e => set('channel', e.target.value)}>
              {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Preview */}
        {(form.title || form.body) && (
          <div style={{
            background: 'var(--c-bg)', border: '1px solid var(--c-border-lite)',
            borderRadius: 8, padding: 14,
          }}>
            <div style={{ fontSize: '0.743rem', fontWeight: 700, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Preview</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span className={`badge ${TYPE_BADGE[form.type] || 'badge-muted'}`}>{selectedType?.label}</span>
              <span style={{ fontSize: '0.786rem', color: 'var(--c-text-3)' }}>
                → {TARGET_ROLES.find(r => r.value === form.targetRole)?.label}
              </span>
            </div>
            {form.title && <div style={{ fontWeight: 700, marginTop: 8, fontSize: '0.929rem' }}>{form.title}</div>}
            {form.body  && <div style={{ color: 'var(--c-text-2)', fontSize: '0.857rem', marginTop: 4, lineHeight: 1.6 }}>{form.body}</div>}
          </div>
        )}

        {form.type === 'EMERGENCY' && (
          <div className="alert alert-error" style={{ fontSize: '0.814rem' }}>
            Emergency broadcasts are delivered immediately and cannot be recalled. Confirm the details carefully before sending.
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleSend}
            disabled={sending || !form.title.trim() || !form.body.trim()}
          >
            {sending
              ? <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Sending…</>
              : 'Send Broadcast'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setForm(EMPTY)}
            disabled={sending}
          >Clear</button>
        </div>
      </div>

      {/* Sent history */}
      {history.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--c-border-lite)', fontWeight: 600, fontSize: '0.9rem' }}>
            Recent Broadcasts (this session)
          </div>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Target</th>
                <th>Channel</th>
                <th>Sent</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td><span className={`badge ${TYPE_BADGE[h.type] || 'badge-muted'}`}>{BROADCAST_TYPES.find(t => t.value === h.type)?.label}</span></td>
                  <td style={{ fontWeight: 500 }}>{h.title}</td>
                  <td>{TARGET_ROLES.find(r => r.value === h.targetRole)?.label}</td>
                  <td><span className="badge badge-muted">{h.channel}</span></td>
                  <td style={{ fontSize: '0.786rem', color: 'var(--c-text-3)', whiteSpace: 'nowrap' }}>
                    {new Date(h.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
