import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore.js';
import { ROLES } from '../../config/constants.js';
import api from '../../lib/api.js';

// ── Page title map ─────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  '/user': 'Home', '/user/porter': 'Book a Porter', '/user/rooms': 'Station Rooms',
  '/user/lockers': 'Digital Lockers', '/user/pnr': 'PNR / Train Status',
  '/user/bookings': 'My Bookings', '/user/profile': 'Profile', '/user/ai-chat': 'AI Assistant',
  '/porter': 'Dashboard', '/porter/requests': 'Incoming Requests',
  '/porter/active': 'Active Service', '/porter/earnings': 'Earnings', '/porter/profile': 'Profile',
  '/supervisor': 'Overview', '/supervisor/map': 'Live Porter Map',
  '/supervisor/queue': 'Unassigned Queue', '/supervisor/porters': 'Porter Directory',
  '/supervisor/create-porter': 'Create Porter',
  '/rpf': 'Dashboard', '/rpf/map': 'Live SOS Map',
  '/rpf/history': 'Incident History', '/rpf/profile': 'Profile',
  '/station-control': 'Dashboard', '/station-control/analytics': 'Analytics',
  '/station-control/bookings': 'All Bookings', '/station-control/rooms': 'Station Rooms',
  '/station-control/lockers': 'Digital Lockers', '/station-control/staff': 'Manage Staff',
  '/station-control/audit': 'Audit Logs', '/station-control/broadcast': 'Broadcast',
  '/station-control/onboarding': 'Staff Onboarding',
  '/superadmin': 'Platform Overview', '/superadmin/users': 'User Management',
  '/superadmin/stations': 'Station Onboarding', '/superadmin/knowledge-base': 'AI Knowledge Base',
  '/superadmin/config': 'System Configuration', '/superadmin/audit': 'Global Audit Logs',
};

// ── Notification dropdown ─────────────────────────────────────────────────────
function NotificationDropdown({ onClose }) {
  const ref = useRef(null);
  const [notifs,    setNotifs]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [markingAll,setMarkingAll] = useState(false);

  useEffect(() => {
    // CORRECT endpoint: GET /api/notifications
    // Backend controller: @GetMapping on /api/notifications — no suffix, no params
    // Returns: plain JSON array [ {id, title, body, type, isRead, createdAt, userId} ]
    api.get('/api/notifications')
      .then(r => setNotifs(Array.isArray(r.data) ? r.data : []))
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, []);

  // Close on outside click
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  // Mark one as read — CORRECT: PUT /api/notifications/{id}/read
  const markOne = async (n) => {
    if (n.isRead) return;
    try {
      await api.put(`/api/notifications/${n.id}/read`);
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
    } catch { /* non-fatal */ }
  };

  // Mark all as read — no bulk endpoint exists in backend.
  // Fire individual PUT /{id}/read calls using Promise.allSettled (non-blocking).
  const markAllRead = async () => {
    const unread = notifs.filter(n => !n.isRead);
    if (!unread.length) return;
    setMarkingAll(true);
    // Optimistic update first
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await Promise.allSettled(unread.map(n => api.put(`/api/notifications/${n.id}/read`)));
    } catch { /* non-fatal */ }
    setMarkingAll(false);
  };

  // CORRECT field names: isRead and createdAt (camelCase from Jackson)
  const unread = notifs.filter(n => !n.isRead).length;

  const fmtDate = iso => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      });
    } catch { return ''; }
  };

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
      width: 340, background: 'var(--color-white)',
      border: '1px solid var(--color-border-light)',
      borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-modal)',
      zIndex: 400, overflow: 'hidden', animation: 'slideUp 0.14s ease',
    }}>

      {/* Header */}
      <div style={{
        padding: '11px 16px', borderBottom: '1px solid var(--color-border-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: '0.871rem' }}>Notifications</span>
          {unread > 0 && (
            <span style={{
              background: '#DC2626', color: '#fff',
              fontSize: '0.629rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10,
            }}>{unread}</span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-primary)', fontSize: '0.771rem', fontWeight: 600,
              opacity: markingAll ? 0.5 : 1,
            }}
          >
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : notifs.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.843rem' }}>
            No notifications yet
          </div>
        ) : notifs.map(n => (
          <div
            key={n.id}
            onClick={() => markOne(n)}
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--color-border-light)',
              // CORRECT: n.isRead (camelCase) — NOT n.is_read
              background: n.isRead ? 'transparent' : 'rgba(27,58,107,0.04)',
              cursor: n.isRead ? 'default' : 'pointer',
              transition: 'background 0.12s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1 }}>
                {/* CORRECT: n.isRead for font weight */}
                <div style={{ fontWeight: n.isRead ? 500 : 700, fontSize: '0.843rem', marginBottom: 3 }}>
                  {n.title}
                </div>
                <div style={{ fontSize: '0.786rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {n.body}
                </div>
                {/* CORRECT: n.createdAt (camelCase) — NOT n.created_at */}
                <div style={{ fontSize: '0.714rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {fmtDate(n.createdAt)}
                </div>
              </div>
              {/* CORRECT: !n.isRead */}
              {!n.isRead && (
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--color-primary)', flexShrink: 0, marginTop: 3,
                }} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {notifs.length > 0 && (
        <div style={{
          padding: '9px 16px', borderTop: '1px solid var(--color-border-light)',
          display: 'flex', justifyContent: 'space-between',
          fontSize: '0.771rem', color: 'var(--color-text-muted)',
        }}>
          <span>{notifs.length} notification{notifs.length !== 1 ? 's' : ''}</span>
          <span>{unread} unread</span>
        </div>
      )}
    </div>
  );
}

// ── Main Topbar ───────────────────────────────────────────────────────────────
export default function Topbar({ sidebarWidth }) {
  const { user, role, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotif,   setShowNotif]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  const title = PAGE_TITLES[location.pathname] || 'R1 Super App';

  useEffect(() => {
    const h = e => { if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => { setShowProfile(false); logout(); navigate('/login'); };

  const profilePath = {
    [ROLES.USER]:   '/user/profile',
    [ROLES.PORTER]: '/porter/profile',
    [ROLES.RPF]:    '/rpf/profile',
  }[role] || null;

  const initial = (user?.name || user?.phone || 'U')[0].toUpperCase();

  return (
    <header style={{
      position: 'fixed', top: 0, left: sidebarWidth, right: 0,
      height: 'var(--topbar-height)',
      background: 'var(--color-white)',
      borderBottom: '1px solid var(--color-border-light)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      transition: 'left var(--transition-slow)',
    }}>

      {/* Left — Page title */}
      <div>
        <div style={{ fontSize: '0.971rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {title}
        </div>
        <div style={{ fontSize: '0.686rem', color: 'var(--color-text-muted)' }}>
          Ahmedabad Junction (ADI) · Indian Railways
        </div>
      </div>

      {/* Right — Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

        {/* Notification bell */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => { setShowNotif(v => !v); setShowProfile(false); }}
            title="Notifications"
            style={{ position: 'relative', width: 36, height: 36 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <span style={{
              position: 'absolute', top: 7, right: 7,
              width: 7, height: 7, background: '#DC2626',
              borderRadius: '50%', border: '1.5px solid #fff',
            }} />
          </button>
          {showNotif && <NotificationDropdown onClose={() => setShowNotif(false)} />}
        </div>

        {/* Avatar / profile dropdown — ALL roles get logout */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotif(false); }}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--color-primary)', color: '#fff',
              fontWeight: 700, fontSize: '0.857rem', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title={user?.name || user?.phone}
          >
            {initial}
          </button>

          {showProfile && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              minWidth: 210, background: 'var(--color-white)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-modal)',
              zIndex: 300, overflow: 'hidden', animation: 'slideUp 0.14s ease',
            }}>
              {/* User info */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-light)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.871rem' }}>{user?.name || 'User'}</div>
                <div style={{ fontSize: '0.771rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{user?.phone}</div>
                <div style={{ marginTop: 6 }}>
                  <span style={{
                    fontSize: '0.643rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.05em', background: 'var(--color-primary)',
                    color: '#fff', padding: '1px 7px', borderRadius: 10,
                  }}>{role}</span>
                </div>
              </div>

              {/* View profile — only roles that have a profile page */}
              {profilePath && (
                <button
                  onClick={() => { navigate(profilePath); setShowProfile(false); }}
                  style={{
                    width: '100%', padding: '10px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left', fontSize: '0.857rem',
                    color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 10,
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--color-surface)'}
                  onMouseOut={e => e.currentTarget.style.background = 'none'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  View Profile
                </button>
              )}

              {/* Sign out — ALL roles including USER */}
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', padding: '10px 16px', background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left', fontSize: '0.857rem',
                  color: '#DC2626', display: 'flex', alignItems: 'center', gap: 10,
                  borderTop: '1px solid var(--color-border-light)',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#fff1f2'}
                onMouseOut={e => e.currentTarget.style.background = 'none'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
