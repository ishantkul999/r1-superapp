import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import SosFab from './SosFab.jsx';
import NotificationDropdown from './NotificationDropdown.jsx';
import useAuthStore from '../../stores/authStore.js';
import { ROLES } from '../../config/constants.js';
import BottomNav from './BottomNav.jsx';
import api from '../../lib/api.js';
import useRealtimeBookings from '../../hooks/useRealTimeBookings.js';

const PAGE_TITLES = {
  // User
  '/user':           { title: 'Home',             subtitle: 'Welcome back' },
  '/user/porter':    { title: 'Book Porter',       subtitle: 'Licensed CRIS-regulated service' },
  '/user/pnr':       { title: 'PNR / Train Status',subtitle: 'Live running status via NTES' },
  '/user/rooms':     { title: 'Station Rooms',     subtitle: 'Retiring rooms & dormitories' },
  '/user/lockers':   { title: 'Digital Lockers',   subtitle: 'Secure 24×7 luggage storage' },
  '/user/ai-chat':   { title: 'AI Assistant',      subtitle: 'Multilingual travel help' },
  '/user/bookings':  { title: 'My Bookings',       subtitle: 'All your service history' },
  '/user/profile':   { title: 'Profile',           subtitle: 'Personal & travel preferences' },
  // Porter
  '/porter':           { title: 'Home',            subtitle: 'Your porter dashboard' },
  '/porter/requests':  { title: 'Requests',        subtitle: 'Available booking requests' },
  '/porter/active':    { title: 'Active Job',      subtitle: 'Your current assignment' },
  '/porter/earnings':  { title: 'Earnings',        subtitle: 'Income summary' },
  '/porter/profile':   { title: 'Profile',         subtitle: 'Your staff profile' },
  // Supervisor
  '/supervisor':             { title: 'Overview',        subtitle: 'Porter operations' },
  '/supervisor/map':         { title: 'Live Porter Map', subtitle: 'Real-time porter locations' },
  '/supervisor/queue':       { title: 'Unassigned Queue',subtitle: 'Pending porter requests' },
  '/supervisor/porters':     { title: 'Porter Directory', subtitle: 'All registered porters' },
  '/supervisor/create-porter':{ title: 'Create Porter',  subtitle: 'Register a new porter' },
  // RPF
  '/rpf':          { title: 'Dashboard',       subtitle: 'Security operations' },
  '/rpf/map':      { title: 'Live SOS Map',   subtitle: 'Active emergency alerts' },
  '/rpf/history':  { title: 'Incident History', subtitle: 'Resolved SOS incidents' },
  '/rpf/profile':  { title: 'Profile',         subtitle: 'Officer details' },
  // Station Control
  '/station-control':            { title: 'Dashboard',         subtitle: 'Station overview' },
  '/station-control/analytics':  { title: 'Station Analytics', subtitle: 'Live station metrics' },
  '/station-control/staff':      { title: 'Manage Staff',      subtitle: 'Staff roster' },
  '/station-control/bookings':   { title: 'All Bookings',      subtitle: 'Complete booking log' },
  '/station-control/rooms':      { title: 'Station Rooms',     subtitle: 'Retiring room management' },
  '/station-control/lockers':    { title: 'Digital Lockers',   subtitle: 'Locker occupancy' },
  '/station-control/audit':      { title: 'Audit Logs',        subtitle: 'Station activity log' },
  '/station-control/broadcast':  { title: 'Broadcast',         subtitle: 'Push announcements' },
  '/station-control/onboarding': { title: 'Staff Onboarding',  subtitle: 'Create & manage staff' },
  // SuperAdmin
  '/superadmin':              { title: 'System Dashboard',    subtitle: 'Platform governance' },
  '/superadmin/users':        { title: 'User Management',     subtitle: 'All platform accounts' },
  '/superadmin/stations':     { title: 'Station Onboarding',  subtitle: 'Create & configure stations' },
  '/superadmin/knowledge-base':{ title: 'AI Knowledge Base',  subtitle: 'RAG document management' },
  '/superadmin/config':       { title: 'System Config',       subtitle: 'Global platform settings' },
  '/superadmin/audit':        { title: 'Global Audit Logs',   subtitle: 'Platform-wide activity' },
};

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const unreadCount = notifs.filter(n => !n.isRead).length;

  useEffect(() => {
    api.get('/api/notifications')
      .then(r => setNotifs(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  useRealtimeBookings({
    onNotification: (incoming) => {
      setNotifs(prev => (prev.some(n => n.id === incoming.id) ? prev : [incoming, ...prev]));
    },
  });

  const sidebarW  = sidebarCollapsed ? 64 : 248;
  const isUserRole = role === ROLES.USER;

  // Auto-collapse on small screens
  useEffect(() => {
    const handler = () => setSidebarCollapsed(window.innerWidth < 1024);
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const page = PAGE_TITLES[location.pathname] || { title: 'R1 Super App', subtitle: '' };

  return (
    <div className="page-layout" style={{ background: 'var(--c-bg)' }}>

      {/* ── Sidebar ── */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
      />

      {/* ── Main area ── */}
      <div style={{
        marginLeft: sidebarW,
        flex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'margin-left var(--t-slow)',
      }}>

        {/* ── Topbar ── */}
        <header className="topbar" style={{ left: sidebarW }}>
          {/* Page title */}
          <div>
            <div className="topbar-title">{page.title}</div>
            {page.subtitle && (
              <div className="topbar-breadcrumb">{page.subtitle}</div>
            )}
          </div>

          {/* Actions */}
          <div className="topbar-actions">
            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button
                className="topbar-icon-btn"
                onClick={() => setNotifOpen(o => !o)}
                title="Notifications"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="topbar-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              {notifOpen && (
                <NotificationDropdown
                  notifs={notifs}
                  setNotifs={setNotifs}
                  onClose={() => setNotifOpen(false)}
                />
              )}
            </div>

            {/* Help */}
            {isUserRole && (
              <button
                className="topbar-icon-btn"
                onClick={() => navigate('/user/ai-chat')}
                title="AI Assistant"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 15h.01M16 15h.01"/>
                </svg>
              </button>
            )}

            {/* Profile pill */}
            <button
              className="topbar-icon-btn"
              onClick={() => navigate(isUserRole ? '/user/profile' : `/${role?.toLowerCase?.()?.replace('_', '-')}/profile`)}
              title="Profile"
              style={{ width: 'auto', padding: '0 10px', gap: 8, borderRadius: 20, border: '1px solid var(--c-border)' }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--c-navy-light)', color: 'var(--c-navy)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.786rem',
              }}>
                {/* First letter of name/phone */}
                U
              </div>
            </button>
          </div>
        </header>

        {/* ── Page content ── */}
        <main style={{
          flex: 1,
          marginTop: 'var(--topbar-h)',
          padding: '22px',
          maxWidth: '100%',
          overflowX: 'hidden',
        }}>
          <Outlet />
        </main>
      </div>

      {/* ── SOS FAB (user role only) ── */}
      {isUserRole && <SosFab />}

      {/* ── Bottom nav (mobile, user role only) ── */}
      {isUserRole && <BottomNav />}
    </div>
  );
}