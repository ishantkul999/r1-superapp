import React, { useState } from 'react';
import api from '../../lib/api.js';

const INTEREST_OPTIONS = [
  { key: 'heritage',  label: '🏛 Heritage & History' },
  { key: 'food',      label: '🍛 Food & Street Eats' },
  { key: 'shopping',  label: '🛍 Shopping & Markets' },
  { key: 'nature',    label: '🌳 Nature & Riverfront' },
  { key: 'culture',   label: '🎭 Culture & Museums' },
  { key: 'religious', label: '🛕 Religious Sites' },
];

const LANGS = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'hi', label: '🇮🇳 हिंदी' },
  { code: 'gu', label: '🟠 ગુજરાતી' },
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
      // POST /api/ai/planner/itinerary — RAG-grounded, generated from
      // whatever has been ingested into ai_svc.knowledge_base.
      //
      // IMPORTANT: the backend returns { itinerary: "<JSON string>",
      // language, model } — the "itinerary" field is the raw text the LLM
      // produced, NOT a parsed object. It has to be JSON.parse()'d here.
      // Reading data.title / data.days directly (the previous version)
      // always returned undefined, which is why nothing rendered below
      // the "Your Itinerary" heading.
      const { data } = await api.post('/api/ai/planner/itinerary', {
        budgetMin, budgetMax, durationDays, interests, language,
      });

      let raw = data.itinerary;
      if (typeof raw !== 'string') {
        // In case a future backend version parses it server-side already.
        setItinerary(raw);
        return;
      }

      // The LLM sometimes wraps JSON in ```json ... ``` code fences —
      // strip those before parsing.
      raw = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr) {
        console.error('[ItineraryPlanner] Failed to parse itinerary JSON:', raw);
        setError('The itinerary was generated but came back in an unexpected format. Please try again.');
        return;
      }

      // GroqChatClient returns {"error":"AI service temporarily unavailable"}
      // (still valid JSON) when the Groq call itself fails — surface that
      // as an error rather than silently rendering an empty itinerary card.
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
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.143rem',
        }}>🗺️</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.929rem' }}>AI Trip Planner</div>
          <div style={{ fontSize: '0.714rem', color: 'var(--color-text-muted)' }}>Personalized Ahmedabad itinerary · Spring AI + RAG</div>
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
              >
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
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <button className="btn btn-primary btn-lg" onClick={generate} disabled={loading}>
          {loading ? <><span className="spinner" /> Generating your itinerary…</> : '✨ Generate Itinerary'}
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
                  // The LLM doesn't always use exactly "place"/"note" —
                  // fall back across the field names it commonly produces
                  // instead of rendering blank text.
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
              <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 6 }}>💡 Tips</div>
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
