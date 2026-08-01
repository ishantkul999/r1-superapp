import React, { useState } from 'react';
import api from '../../lib/api.js';

// ── SVG icon set (extracted for AI Trip Planner) ────────────────────────────
const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const icons = {
    map:       <><polygon points="3 6 9 3 15 6 21 3 21 17 15 20 9 17 3 20 3 6"/><line x1="9" y1="3" x2="9" y2="17"/><line x1="15" y1="6" x2="15" y2="20"/></>,
    alert:     <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></>,
    sparkles:  <><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M19 15l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"/></>,
    lightbulb: <><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 1 0 6 8c0 1.5.8 2.8 1.5 3.5.76.76 1.23 1.52 1.41 2.5"/></>,
    building:  <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    utensils:  <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></>,
    bag:       <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>,
    tree:      <><path d="M12 22v-6M12 16a6 6 0 1 0-6-6c0 2.22 1.18 4.16 2.94 5.23M12 16a6 6 0 1 1 6-6c0 2.22-1.18 4.16-2.94 5.23"/></>,
    palette:   <><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></>,
    temple:    <><path d="M2 22h20"/><path d="M12 2l-5 5v13h10V7z"/><path d="M12 2v5"/><path d="M7 12h10"/></>,
    globe:     <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || null}
    </svg>
  );
};

const INTEREST_OPTIONS = [
  { key: 'heritage',  label: 'Heritage & History',  icon: 'building' },
  { key: 'food',      label: 'Food & Street Eats',  icon: 'utensils' },
  { key: 'shopping',  label: 'Shopping & Markets',  icon: 'bag' },
  { key: 'nature',    label: 'Nature & Riverfront', icon: 'tree' },
  { key: 'culture',   label: 'Culture & Museums',   icon: 'palette' },
  { key: 'religious', label: 'Religious Sites',     icon: 'temple' },
];

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'gu', label: 'ગુજરાતી' },
];

function extractErr(err, fb = 'Could not generate itinerary right now') {
  const d = err?.response?.data;
  if (!d) return err?.message || fb;
  if (typeof d.error === 'string')   return d.error;
  if (typeof d.message === 'string') return d.message;
  if (typeof d === 'string')         return d;
  return fb;
}

export default function ItineraryPlannerPage() {
  const [budgetMin, setBudgetMin]     = useState(1000);
  const [budgetMax, setBudgetMax]     = useState(5000);
  const [durationDays, setDuration]   = useState(2);
  const [interests, setInterests]     = useState(['heritage', 'food']);
  const [language, setLanguage]       = useState('en');
  const [loading, setLoading]         = useState(false);
  const [itinerary, setItinerary]     = useState(null);
  const [error, setError]             = useState(null);

  const toggleInterest = (key) => {
    setInterests(prev => prev.includes(key) ? prev.filter(i => i !== key) : [...prev, key]);
  };

  const generate = async () => {
    if (interests.length === 0) { setError('Pick at least one interest.'); return; }
    setLoading(true); setError(null); setItinerary(null);
    try {
      const { data } = await api.post('/api/ai/planner/itinerary', {
        budgetMin, budgetMax, durationDays, interests, language,
      });

      let raw = data.itinerary;
      if (typeof raw !== 'string') {
        setItinerary(raw);
        return;
      }

      raw = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr) {
        console.error('[ItineraryPlanner] Failed to parse itinerary JSON:', raw);
        setError('The itinerary was generated but came back in an unexpected format. Please try again.');
        return;
      }

      if (parsed.error) {
        setError(parsed.error);
        return;
      }

      setItinerary(parsed);
    } catch (err) {
      setError(extractErr(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
        }}>
          <Icon name="map" size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.929rem' }}>AI Trip Planner</div>
          <div style={{ fontSize: '0.714rem', color: 'var(--color-text-muted)' }}>Personalized Ahmedabad itinerary</div>
        </div>
      </div>

      {/* Form */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Budget Min (₹)</label>
            <input
              className="form-input" type="number" min={0} step={100}
              value={budgetMin}
              onChange={e => setBudgetMin(Math.max(0, Number(e.target.value)))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Budget Max (₹)</label>
            <input
              className="form-input" type="number" min={0} step={100}
              value={budgetMax}
              onChange={e => setBudgetMax(Math.max(0, Number(e.target.value)))}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Trip Duration</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 5, 7].map(d => (
              <button
                key={d}
                type="button"
                className={`chip ${durationDays === d ? 'active' : ''}`}
                onClick={() => setDuration(d)}
              >
                {d} {d === 1 ? 'day' : 'days'}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Interests</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {INTEREST_OPTIONS.map(opt => (
              <button
                key={opt.key}
                type="button"
                className={`chip ${interests.includes(opt.key) ? 'active' : ''}`}
                onClick={() => toggleInterest(opt.key)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Icon name={opt.icon} size={14} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Language</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {LANGS.map(l => (
              <button
                key={l.code}
                type="button"
                className={`chip ${language === l.code ? 'active' : ''}`}
                onClick={() => setLanguage(l.code)}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Icon name="globe" size={12} />
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="alert" size={16} />
            {error}
          </div>
        )}

        <button 
          className="btn btn-primary btn-lg" 
          onClick={generate} 
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          {loading ? (
            <><span className="spinner" style={{ width: 16, height: 16 }} /> Generating your itinerary…</>
          ) : (
            <><Icon name="sparkles" size={18} /> Generate Itinerary</>
          )}
        </button>
      </div>

      {/* Result */}
      {itinerary && (
        <div className="card">
          <h3 style={{ marginBottom: 4 }}>{itinerary.title || 'Your Itinerary'}</h3>
          {itinerary.summary && (
            <p style={{ fontSize: '0.857rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>{itinerary.summary}</p>
          )}

          {Array.isArray(itinerary.days) && itinerary.days.map(day => (
            <div key={day.day} style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: '0.886rem', marginBottom: 8, color: 'var(--color-primary)' }}>
                Day {day.day}{day.theme ? ` — ${day.theme}` : ''}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(day.activities || []).map((act, i) => {
                  const place = act.place || act.location || act.activity || act.title || act.name || act.spot;
                  const note  = act.note || act.description || act.details || act.info || act.cost;
                  return (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 12px', background: 'var(--color-surface)', borderRadius: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.786rem', color: 'var(--color-secondary)', minWidth: 52 }}>{act.time}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.843rem' }}>{place || 'Activity details unavailable'}</div>
                        {note && <div style={{ fontSize: '0.771rem', color: 'var(--color-text-muted)' }}>{note}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {Array.isArray(itinerary.tips) && itinerary.tips.length > 0 && (
            <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(27,58,107,0.04)', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="lightbulb" size={14} />
                Tips
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                {itinerary.tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}