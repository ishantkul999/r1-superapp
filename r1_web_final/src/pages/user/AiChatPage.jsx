import React, { useState, useRef, useEffect } from 'react';
import api from '../../lib/api.js';

// ── SVG icon set (extracted for AI Chat) ─────────────────────────────────────
const Icon = ({ name, size = 16, color = "currentColor" }) => {
  const icons = {
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></>,
    locker:    <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M12 14v2"/></>,
    bed:       <><path d="M2 4v16M2 8h18a2 2 0 012 2v6H2"/><path d="M6 8v-4"/></>,
    alert:     <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></>,
    building:  <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    train:     <><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16M12 3v8M8 19l-2 2M16 19l2 2M8 15h.01M16 15h.01"/></>,
    message:   <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
    bot:       <><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 15h.01M16 15h.01"/></>,
    globe:     <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
    book:      <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    send:      <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || null}
    </svg>
  );
};

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'gu', label: 'ગુજરાતી' },
];

const SUGGESTIONS = [
  'Where is the porter service counter?',
  'How do I book a digital locker?',
  'What are the retiring room facilities at ADI?',
  'Which platforms have escalators?',
  'Is there a cloak room at Ahmedabad Junction?',
  'What is the food court timing?',
];

export default function AiChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: "Namaste! I'm your R1 AI Assistant for Ahmedabad Junction. I can help you with station facilities, porter services, locker bookings, PNR queries, and travel guidance. How can I assist you today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('en');
  const [sessionId] = useState(() => 'sess_' + Date.now());
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');
    const userMsg = { id: Date.now(), role: 'user', text: userText, timestamp: new Date() };
    setMessages(m => [...m, userMsg]);
    setLoading(true);
    try {
      const { data } = await api.post('/api/ai/assistant/chat', {
        message: userText,
        language: lang,
      });
      const botMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: data.response || data.message,
        timestamp: new Date(),
        intent: data.intent,
        // Backend returns a single "source" string (e.g. "FAQ" / "AI"),
        // not a "sources" array.
        source: data.source,
      };
      setMessages(m => [...m, botMsg]);
    } catch (err) {
      const errMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: "I'm having trouble connecting right now. Please try again in a moment, or call our helpline at 139.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages(m => [...m, errMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const INTENT_LABELS = {
    PORTER:   { icon: 'briefcase', label: 'Porter',    color: '#1B3A6B' },
    LOCKER:   { icon: 'locker',    label: 'Locker',    color: '#B45309' },
    ROOM:     { icon: 'bed',       label: 'Rooms',     color: '#7C3AED' },
    SOS:      { icon: 'alert',     label: 'Emergency', color: '#B91C1C' },
    FACILITY: { icon: 'building',  label: 'Facility',  color: '#0D9488' },
    TRAIN:    { icon: 'train',     label: 'Train',     color: '#15803D' },
    GENERAL:  { icon: 'message',   label: 'General',   color: '#475569' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-height) - 48px)', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff'
          }}>
            <Icon name="bot" size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.929rem' }}>R1 AI Assistant</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`chip ${lang === l.code ? 'active' : ''}`}
              style={{ fontSize: '0.714rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Icon name="globe" size={12} /> {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14,
        padding: '4px 0', minHeight: 0,
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            gap: 10, alignItems: 'flex-end',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
              }}>
                <Icon name="bot" size={16} />
              </div>
            )}
            <div style={{ maxWidth: '72%' }}>
              {msg.intent && INTENT_LABELS[msg.intent] && (
                <div style={{ display: 'flex', gap: 4, marginBottom: 4, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <span style={{
                    fontSize: '0.643rem', fontWeight: 600, padding: '4px 8px',
                    background: INTENT_LABELS[msg.intent].color + '18',
                    color: INTENT_LABELS[msg.intent].color,
                    borderRadius: 4,
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    <Icon name={INTENT_LABELS[msg.intent].icon} size={12} color={INTENT_LABELS[msg.intent].color} /> 
                    {INTENT_LABELS[msg.intent].label}
                  </span>
                </div>
              )}
              <div style={{
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user'
                  ? 'var(--color-primary)'
                  : msg.isError ? 'var(--color-error-light)' : 'var(--color-white)',
                color: msg.role === 'user' ? '#fff' : msg.isError ? 'var(--color-error)' : 'var(--color-text-primary)',
                fontSize: '0.857rem',
                lineHeight: 1.6,
                boxShadow: 'var(--shadow-card)',
                border: msg.role === 'assistant' ? '1px solid var(--color-border-light)' : 'none',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.text}
              </div>
              {msg.source && (
                <div style={{ marginTop: 4, fontSize: '0.714rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Icon name="book" size={12} /> Source: {msg.source}
                </div>
              )}
              <div style={{ fontSize: '0.643rem', color: 'var(--color-text-muted)', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <Icon name="bot" size={16} />
            </div>
            <div style={{
              padding: '12px 16px',
              background: 'var(--color-white)',
              border: '1px solid var(--color-border-light)',
              borderRadius: '16px 16px 16px 4px',
              boxShadow: 'var(--shadow-card)',
              display: 'flex', gap: 5, alignItems: 'center',
            }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--color-primary)',
                  animation: `pulse 1.2s ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div style={{ padding: '10px 0', flexShrink: 0 }}>
          <div style={{ fontSize: '0.786rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>Suggested questions:</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SUGGESTIONS.slice(0, 4).map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                style={{
                  padding: '6px 12px', background: 'var(--color-white)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 16, fontSize: '0.786rem',
                  color: 'var(--color-text-secondary)', cursor: 'pointer',
                  transition: 'all var(--transition)',
                }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.color = 'var(--color-primary)'; }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.color = 'var(--color-text-secondary)'; }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="card" style={{ padding: '12px 14px', marginTop: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything about Ahmedabad Junction… (Enter to send)"
            rows={1}
            style={{
              flex: 1, resize: 'none', border: 'none', outline: 'none',
              fontSize: '0.857rem', lineHeight: 1.5, fontFamily: 'inherit',
              background: 'transparent', color: 'var(--color-text-primary)',
              maxHeight: 100, overflowY: 'auto',
              padding: '6px 0'
            }}
          />
          <button
            className="btn btn-primary"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{ borderRadius: '50%', width: 38, height: 38, padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {loading ? <span className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> : <Icon name="send" size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}