import React, { useEffect, useRef, useState } from 'react';
import api from '../../lib/api.js';

export default function NotificationDropdown({ onClose }) {
  const ref = useRef(null);
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/notifications/my?limit=15')
      .then(r => setNotifs(r.data?.notifications || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Close on outside click
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const markAllRead = () => {
    api.put('/api/notifications/mark-all-read').catch(() => {});
    setNotifs(n => n.map(x => ({ ...x, is_read: true })));
  };

  const unreadCount = notifs.filter(n => !n.is_read).length;

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
        width: 340, background: 'var(--c-surface)',
        border: '1px solid var(--c-border-lite)', borderRadius: 10,
        boxShadow: 'var(--sh-modal)', zIndex: 500, overflow: 'hidden',
        animation: 'slideUp 0.14s ease',
      }}
    >
      {/* Header */}
      <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--c-border-lite)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ background: 'var(--c-sos)', color: '#fff', fontSize: '0.643rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-navy)', fontSize: '0.786rem', fontWeight: 600 }}>
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 28, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : notifs.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--c-text-3)', fontSize: '0.857rem' }}>
            No notifications yet
          </div>
        ) : notifs.map(n => (
          <div
            key={n.id}
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--c-border-lite)',
              background: n.is_read ? 'transparent' : 'var(--c-navy-light)',
              cursor: 'pointer', transition: 'background 0.12s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--c-bg)'}
            onMouseOut={e => e.currentTarget.style.background = n.is_read ? 'transparent' : 'var(--c-navy-light)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div>
                <div style={{ fontWeight: n.is_read ? 500 : 600, fontSize: '0.843rem', marginBottom: 3 }}>
                  {n.title}
                </div>
                <div style={{ fontSize: '0.786rem', color: 'var(--c-text-2)', lineHeight: 1.5 }}>
                  {n.body}
                </div>
              </div>
              {!n.is_read && (
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--c-navy)', flexShrink: 0, marginTop: 4 }} />
              )}
            </div>
            <div style={{ fontSize: '0.729rem', color: 'var(--c-text-3)', marginTop: 5 }}>
              {n.created_at ? new Date(n.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
            </div>
          </div>
        ))}
      </div>

      {notifs.length > 0 && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--c-border-lite)', textAlign: 'center' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-navy)', fontSize: '0.814rem', fontWeight: 600 }}>
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
