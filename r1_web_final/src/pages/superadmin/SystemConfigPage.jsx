import React, { useState } from 'react';

export default function SystemConfigPage() {
  const [cfg, setCfg] = useState({ otpDevMode: true, crisStub: true, ntesStub: true, openAiStub: true, localKafka: true });
  const [cashfreeEnv, setCashfreeEnv] = useState('TEST');
  const [saved, setSaved] = useState(false);
  const toggle = k => setCfg(c => ({ ...c, [k]: !c[k] }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><h1 className="page-title">⚙️ System Config</h1><p className="page-subtitle">Feature flags and service configuration</p></div>
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>API Stubs</h3>
        {[['OTP Dev Mode (use 123456)', 'otpDevMode'], ['CRIS API Stub (rooms/lockers)', 'crisStub'], ['NTES API Stub (PNR/train)', 'ntesStub'], ['OpenAI Stub (AI responses)', 'openAiStub'], ['Local Kafka (vs Confluent)', 'localKafka']].map(([label, key]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border-light)' }}>
            <div><div style={{ fontWeight: 600 }}>{label}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>env: {key.toUpperCase()}</div></div>
            <button onClick={() => toggle(key)} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: cfg[key] ? 'var(--color-success)' : 'var(--color-border)', transition: 'all 0.2s', position: 'relative' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: cfg[key] ? 23 : 3, transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
        ))}
      </div>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ fontWeight: 700 }}>Operational Settings</h3>
        <div className="form-group"><label className="form-label">Cashfree Environment</label>
          <select className="form-select" value={cashfreeEnv} onChange={e => setCashfreeEnv(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="TEST">TEST (Sandbox)</option><option value="PROD">PROD (Live)</option>
          </select>
        </div>
        {saved && <div className="alert alert-success">✓ Saved (in-memory — use .env for persistence)</div>}
        <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}>Save Configuration</button>
      </div>
    </div>
  );
}
