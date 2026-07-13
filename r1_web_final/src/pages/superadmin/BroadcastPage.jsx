import React, { useState } from 'react';
import api from '../../lib/api.js';

export default function BroadcastPage() {
  const [form, setForm] = useState({ title: '', body: '', targetRole: 'ALL', channel: 'PUSH' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSend = async () => {
    if (!form.title || !form.body) { setError('Title and message are required.'); return; }
    setSending(true); setError('');
    try {
      await api.post('/api/superadmin/broadcast', form);
      set('title', ''); set('body', '');
      setSent(true); setTimeout(() => setSent(false), 4000);
    } catch (err) { setError(err.response?.data?.error || 'Broadcast failed'); }
    finally { setSending(false); }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><h1 className="page-title">📢 Broadcast</h1><p className="page-subtitle">Send push or SMS notifications by role</p></div>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-group"><label className="form-label">Title</label><input className="form-input" maxLength={100} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Station Announcement" /></div>
        <div className="form-group"><label className="form-label">Message</label><textarea className="form-input" rows={4} value={form.body} onChange={e => set('body', e.target.value)} placeholder="Your message…" style={{ resize: 'vertical' }} /></div>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="form-group"><label className="form-label">Target Role</label>
            <select className="form-select" value={form.targetRole} onChange={e => set('targetRole', e.target.value)}>
              {['ALL','USER','PORTER','SUPERVISOR','RPF'].map(r => <option key={r}>{r}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Channel</label>
            <select className="form-select" value={form.channel} onChange={e => set('channel', e.target.value)}>
              <option value="PUSH">Push (FCM)</option><option value="SMS">SMS</option><option value="BOTH">Both</option>
            </select></div>
        </div>
        <div style={{ padding: '12px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, fontSize: '0.85rem', color: '#92400E' }}>
          ⚠️ Sending to all <strong>{form.targetRole}</strong> users via <strong>{form.channel}</strong>. Cannot be undone.
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {sent && <div className="alert alert-success">✓ Broadcast sent successfully!</div>}
        <button className="btn btn-primary" onClick={handleSend} disabled={sending} style={{ alignSelf: 'flex-start' }}>{sending ? 'Sending…' : '📢 Send Broadcast'}</button>
      </div>
    </div>
  );
}
