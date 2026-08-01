import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { 
  Zap, Users, Brain, Settings, Search, HardHat, Package, 
  IndianRupee, Activity, Siren, X, Plus, AlertTriangle, 
  Check, RefreshCw 
} from 'lucide-react';
import api from '../../lib/api.js';

// ── SuperAdmin Dashboard ──────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/superadmin/platform-overview').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const COLORS = ['#1B3A6B', '#0D9488', '#7C3AED', '#B45309'];

  const NAV = [
    { icon: <Users size={28} strokeWidth={1.5} />, title: 'User Management', desc: 'All users across all roles', to: '/superadmin/users', color: '#1B3A6B' },
    { icon: <Brain size={28} strokeWidth={1.5} />, title: 'AI Knowledge Base', desc: 'Manage RAG documents', to: '/superadmin/knowledge-base', color: '#0D9488' },
    { icon: <Settings size={28} strokeWidth={1.5} />, title: 'System Config', desc: 'API keys, feature flags', to: '/superadmin/config', color: '#7C3AED' },
    { icon: <Search size={28} strokeWidth={1.5} />, title: 'Global Audit Logs', desc: 'Platform-wide activity', to: '/superadmin/audit', color: '#B45309' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Platform header */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, var(--color-primary) 100%)',
        borderRadius: 'var(--radius-card)',
        padding: '24px 28px',
        color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h2 style={{ color: '#fff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={24} fill="currentColor" /> Application Overview
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.857rem' }}>
            R1 Super App · Central Railways
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.786rem', marginBottom: 4 }}>Application Status</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ADE80', fontWeight: 700 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', animation: 'pulse 2s infinite' }} />
            All Systems Operational
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: <Users size={24} />, variant: 'blue' },
          { label: 'Total Porters', value: stats?.totalPorters ?? '—', icon: <HardHat size={24} />, variant: 'teal' },
          { label: 'Bookings (All Time)', value: stats?.totalBookings ?? '—', icon: <Package size={24} />, variant: 'green' },
          { label: 'Revenue (All Time)', value: stats?.totalRevenue ? `₹${stats.totalRevenue.toLocaleString('en-IN')}` : '—', icon: <IndianRupee size={24} />, variant: 'amber' },
          { label: 'Active Sessions', value: stats?.activeSessions ?? '—', icon: <Activity size={24} />, variant: 'blue' },
          { label: 'SOS Incidents', value: stats?.totalSos ?? '—', icon: <Siren size={24} />, variant: 'red' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.variant}`}>{s.icon}</div>
            <div className="stat-value">{loading ? '—' : s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      {stats?.revenueChart && (
        <div className="grid-2">
          <div className="card">
            <h4 style={{ marginBottom: 14 }}>Monthly Revenue</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                <Tooltip formatter={v => [`₹${v}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="var(--color-primary)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h4 style={{ marginBottom: 14 }}>Booking Mix</h4>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={stats.bookingMix || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {(stats.bookingMix || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid-3">
        {NAV.map(n => (
          <button key={n.to} onClick={() => navigate(n.to)} style={{
            padding: '18px 20px', background: 'var(--color-white)', border: '1px solid var(--color-border-light)',
            borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition)', boxShadow: 'var(--shadow-card)',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = n.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-light)'}
          >
            <div style={{ marginBottom: 12, color: n.color }}>{n.icon}</div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
            <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)' }}>{n.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── User Management ────────────────────────────────────────────────────────────
export function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    api.get('/api/superadmin/users').then(r => setUsers(r.data?.users || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const ROLES = ['ALL', 'USER', 'PORTER', 'SUPERVISOR', 'RPF', 'STATION_CONTROL_ROOM', 'SUPERADMIN'];
  const filtered = users.filter(u =>
    (roleFilter === 'ALL' || u.role === roleFilter) &&
    (!search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search))
  );

  const toggleBlock = async (id, isBlocked) => {
    try {
      await api.put(`/api/superadmin/users/${id}/${isBlocked ? 'unblock' : 'block'}`);
      setUsers(u => u.map(x => x.id === id ? {...x, isBlocked: !isBlocked} : x));
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', display: 'flex' }}>
          <Search size={18} />
        </div>
        <input 
          className="form-input" 
          placeholder="Search by name or phone…" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ flex: 1, paddingLeft: 38 }} 
        />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {ROLES.map(r => <button key={r} className={`chip ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)} style={{ fontSize: '0.714rem' }}>{r}</button>)}
      </div>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div className="spinner spinner-lg" /></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>Role</th><th>Phone</th><th>Registered</th><th>Last Active</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: '0.714rem', color: 'var(--color-text-muted)' }}>{u.email || '—'}</div>
                  </td>
                  <td><span className="badge badge-primary">{u.role}</span></td>
                  <td style={{ fontFamily: 'monospace' }}>{u.phone}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.786rem' }}>{u.registeredAt}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.786rem' }}>{u.lastActiveAt || '—'}</td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.isBlocked ? 'btn-outline' : 'btn-danger'}`}
                      onClick={() => toggleBlock(u.id, u.isBlocked)}
                    >
                      {u.isBlocked ? 'Unblock' : 'Block'}
                    </button>
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

// ── AI Knowledge Base ──────────────────────────────────────────────────────────
export function AiKnowledgeBasePage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'GENERAL' });
  const [showForm, setShowForm] = useState(false);
  const [ingesting, setIngesting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/ai/knowledge-base').then(r => setDocs(r.data?.documents || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!form.title || !form.content) { setError('Title and content required.'); return; }
    setUploading(true); setError('');
    try {
      const { data } = await api.post('/api/ai/knowledge-base/ingest', form);
      setDocs(d => [data, ...d]);
      setForm({ title: '', content: '', category: 'GENERAL' });
      setShowForm(false);
    } catch (err) { setError(err.response?.data?.message || 'Failed to add document.'); } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/ai/knowledge-base/${id}`);
      setDocs(d => d.filter(x => x.id !== id));
    } catch {}
  };

  const handleReIngest = async (id) => {
    setIngesting(id);
    try {
      await api.post(`/api/ai/knowledge-base/${id}/re-ingest`);
    } catch {} finally { setIngesting(null); }
  };

  const CATEGORIES = ['GENERAL', 'PORTER', 'ROOMS', 'LOCKERS', 'FACILITIES', 'EMERGENCY', 'TRAIN', 'FAQ'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="alert alert-info" style={{ fontSize: '0.814rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Brain size={18} /> Documents here are embedded via Spring AI + pgvector and served as RAG context to the AI Assistant.
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Document</>}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ border: '2px solid var(--color-primary)' }}>
          <h4 style={{ marginBottom: 14 }}>New Knowledge Document</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Porter Service FAQs" />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Content *</label>
              <textarea className="form-input" rows={5} value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} placeholder="Paste the full content here…" style={{ resize: 'vertical' }} />
            </div>
            {error && <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={16} /> {error}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={uploading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {uploading ? <><span className="spinner" /> Ingesting…</> : <><Brain size={16} /> Ingest into RAG</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 8 }} />)}</div>
      ) : docs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ color: 'var(--color-text-muted)' }}><Brain size={48} strokeWidth={1} /></div>
          <div className="empty-state-title">No documents yet</div>
          <div className="empty-state-desc">Add knowledge documents to power the AI Assistant.</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Category</th><th>Chunks</th><th>Ingested At</th><th>Actions</th></tr></thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.title}</td>
                  <td><span className="badge badge-secondary">{d.category}</span></td>
                  <td>{d.chunkCount ?? '—'}</td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.786rem' }}>{d.ingestedAt}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => handleReIngest(d.id)} disabled={ingesting === d.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {ingesting === d.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <><RefreshCw size={12} /> Re-ingest</>}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}>Delete</button>
                    </div>
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

// ── System Config ──────────────────────────────────────────────────────────────
export function SystemConfigPage() {
  const [config, setConfig] = useState({
    crisMockMode: true,
    ntesMockMode: true,
    aiMockMode: false,
    cashfreeMockMode: true,
    fast2smsMockMode: true,
    fcmMockMode: true,
    sosRateLimitEnabled: false,
    porterAutoAssignEnabled: true,
    porterTimeoutSeconds: 15,
    otpTtlSeconds: 300,
    jwtAccessTtlMinutes: 15,
    jwtRefreshTtlDays: 7,
    maxEmergencyContacts: 5,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/superadmin/config', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {} finally { setSaving(false); }
  };

  const Toggle = ({ label, desc, configKey }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border-light)' }}>
      <div>
        <div style={{ fontWeight: 500, fontSize: '0.857rem' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      <button
        onClick={() => setConfig(c => ({...c, [configKey]: !c[configKey]}))}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: config[configKey] ? 'var(--color-primary)' : 'var(--color-border)',
          border: 'none', cursor: 'pointer',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 3,
          left: config[configKey] ? 23 : 3,
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="alert alert-warning" style={{ fontSize: '0.814rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={18} /> Mock mode uses stub APIs that simulate realistic responses without live integrations.
      </div>

      <div className="card">
        <h4 style={{ marginBottom: 4 }}>External API Modes</h4>
        <p style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', marginBottom: 14 }}>Toggle between mock stubs and live APIs.</p>
        <Toggle label="CRIS Mock Mode" desc="Station rooms & lockers via stub" configKey="crisMockMode" />
        <Toggle label="NTES Mock Mode" desc="PNR & train status via stub" configKey="ntesMockMode" />
        <Toggle label="AI Mock Mode" desc="Stub responses instead of Spring AI" configKey="aiMockMode" />
        <Toggle label="Cashfree Mock Mode" desc="Payment processing via stub" configKey="cashfreeMockMode" />
        <Toggle label="Fast2SMS Mock Mode" desc="OTP SMS via stub" configKey="fast2smsMockMode" />
        <Toggle label="FCM Mock Mode" desc="Push notifications via stub" configKey="fcmMockMode" />
      </div>

      <div className="card">
        <h4 style={{ marginBottom: 14 }}>System Settings</h4>
        <Toggle label="SOS Rate Limiting" desc="Apply rate limiting to SOS endpoint (default: OFF)" configKey="sosRateLimitEnabled" />
        <Toggle label="Porter Auto-Assign" desc="Auto-assign supervisor after 15s timeout" configKey="porterAutoAssignEnabled" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
          {[
            { label: 'Porter Timeout (seconds)', key: 'porterTimeoutSeconds' },
            { label: 'OTP TTL (seconds)', key: 'otpTtlSeconds' },
            { label: 'JWT Access TTL (minutes)', key: 'jwtAccessTtlMinutes' },
            { label: 'JWT Refresh TTL (days)', key: 'jwtRefreshTtlDays' },
            { label: 'Max Emergency Contacts', key: 'maxEmergencyContacts' },
          ].map(f => (
            <div key={f.key} className="form-group">
              <label className="form-label">{f.label}</label>
              <input type="number" className="form-input" value={config[f.key]} onChange={e => setConfig(c => ({...c, [f.key]: +e.target.value}))} />
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving} style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 6 }}>
        {saving ? <><span className="spinner" /> Saving…</> : saved ? <><Check size={18} /> Saved!</> : 'Save Configuration'}
      </button>
    </div>
  );
}

// ── Global Audit Logs ──────────────────────────────────────────────────────────
export function GlobalAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState('ALL');

  const SERVICES = ['ALL', 'auth-service', 'porter-service', 'payment-service', 'station-dashboard', 'ai-planner', 'ai-assistant', 'notification-service', 'sos-service', 'user-service'];

  useEffect(() => {
    api.get(`/api/superadmin/audit?service=${service}`).then(r => setLogs(r.data?.logs || [])).catch(() => {}).finally(() => setLoading(false));
  }, [service]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <select className="form-select" value={service} onChange={e => setService(e.target.value)} style={{ width: 220 }}>
        {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div className="spinner spinner-lg" /></div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Timestamp</th><th>Service</th><th>Actor</th><th>Role</th><th>Action</th><th>Outcome</th></tr></thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>No logs found</td></tr>
              ) : logs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.714rem', whiteSpace: 'nowrap' }}>{l.timestamp}</td>
                  <td><span className="badge badge-muted" style={{ fontSize: '0.643rem' }}>{l.service}</span></td>
                  <td style={{ fontSize: '0.857rem' }}>{l.actorName || l.actorId?.slice(-8)}</td>
                  <td><span className="badge badge-primary" style={{ fontSize: '0.643rem' }}>{l.role}</span></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.786rem', color: 'var(--color-primary)' }}>{l.action}</td>
                  <td><span className={`badge badge-${l.outcome === 'SUCCESS' ? 'success' : 'error'}`} style={{ fontSize: '0.643rem' }}>{l.outcome}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}