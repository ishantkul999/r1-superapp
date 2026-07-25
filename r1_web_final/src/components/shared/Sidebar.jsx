import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore.js';
import { ROLES } from '../../config/constants.js';

// ── SVG icon set (no emojis) ──────────────────────────────────────────────────
const Icon = ({ name, size = 16 }) => {
  const icons = {
    home:      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></>,
    train:     <><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16M12 3v8M8 19l-2 2M16 19l2 2M8 15h.01M16 15h.01"/></>,
    bed:       <><path d="M2 4v16M2 8h18a2 2 0 012 2v6H2"/><path d="M6 8v-4"/></>,
    lock:      <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    bot:       <><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 15h.01M16 15h.01"/></>,
    list:      <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>,
    user:      <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    chart:     <><path d="M18 20V10M12 20V4M6 20v-6"/></>,
    map:       <><path d="M1 6l7-3 8 3 7-3v15l-7 3-8-3-7 3V6z"/><path d="M8 3v15M16 6v15"/></>,
    alert:     <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></>,
    users:     <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    plus:      <path d="M12 5v14M5 12h14"/>,
    settings:  <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    brain:     <path d="M9.5 2A2.5 2.5 0 017 4.5v.5H5a3 3 0 00-3 3v.5C2 10 4 11 4 11s-1 1-1 2.5A2.5 2.5 0 005.5 16H6v.5a3 3 0 003 3h6a3 3 0 003-3V16h.5a2.5 2.5 0 002.5-2.5c0-1.5-1-2.5-1-2.5s2-1 2-2.5V8a3 3 0 00-3-3H17v-.5A2.5 2.5 0 0014.5 2h-5z"/>,
    search:    <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
    shield:    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    clipboard: <><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></>,
    building:  <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    admin:     <><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0112 0v2"/><path d="M18 14l2 2 4-4"/></>,
    globe:     <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
    logout:    <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    chevron:   <polyline points="9 18 15 12 9 6"/>,
    menu:      <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    bell:      <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    history:   <><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 0 .5-4.5"/><polyline points="3 3 3 7 7 7"/></>,
    dollar:    <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    activity:  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
    broadcast: <><path d="M18 8.5A6.5 6.5 0 005 12a6.5 6.5 0 0013 0"/><path d="M21 5.5A10.5 10.5 0 002 12a10.5 10.5 0 0019 0"/><circle cx="12" cy="12" r="1"/></>,
    staff:     <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/><path d="M19 8l2 2 4-4"/></>,
    locker:    <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M12 14v2"/></>,
    analytics: <><path d="M3 3v18h18"/><path d="M18 9l-5 5-4-4-3 3"/></>,
    audit:     <><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></>,
    onboard:   <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></>,
    phone:     <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[name] || null}
    </svg>
  );
};

// ── Nav configuration ────────────────────────────────────────────────────────
const NAV_CONFIG = {
  [ROLES.USER]: {
    section: null,
    items: [
      { to: '/user',           icon: 'home',      label: 'Home',           exact: true },
      { to: '/user/porter',    icon: 'briefcase', label: 'Book Porter' },
      { to: '/user/pnr',       icon: 'train',     label: 'PNR / Train' },
      { to: '/user/rooms',     icon: 'bed',       label: 'Station Rooms' },
      { to: '/user/lockers',   icon: 'locker',    label: 'Digital Lockers' },
      { to: '/user/ai-chat',   icon: 'bot',       label: 'AI Assistant' },
      { to: '/user/itinerary', icon: 'map',       label: 'Trip Planner' },
      { to: '/user/bookings',  icon: 'list',      label: 'My Bookings' },
      { to: '/user/profile',   icon: 'user',      label: 'Profile' },
    ],
  },
  [ROLES.PORTER]: {
    section: null,
    items: [
      { to: '/porter',          icon: 'home',     label: 'Home',     exact: true },
      { to: '/porter/requests', icon: 'bell',     label: 'Requests' },
      { to: '/porter/active',   icon: 'activity', label: 'Active Job' },
      { to: '/porter/earnings', icon: 'dollar',   label: 'Earnings' },
      { to: '/porter/profile',  icon: 'user',     label: 'Profile' },
    ],
  },
  [ROLES.SUPERVISOR]: {
    section: 'Operations',
    items: [
      { to: '/supervisor',              icon: 'chart',   label: 'Overview',       exact: true },
      { to: '/supervisor/map',          icon: 'map',     label: 'Live Porter Map' },
      { to: '/supervisor/queue',        icon: 'alert',   label: 'Unassigned Queue' },
      { to: '/supervisor/manual-assignments', icon: 'phone', label: 'Manually Assigned Jobs' },
      { to: '/supervisor/porters',      icon: 'users',   label: 'Porter Directory' },
      { to: '/supervisor/create-porter',icon: 'plus',    label: 'Create Porter' },
    ],
  },
  [ROLES.RPF]: {
    section: 'Security',
    items: [
      { to: '/rpf',         icon: 'shield',  label: 'Dashboard',      exact: true },
      { to: '/rpf/map',     icon: 'map',     label: 'Live SOS Map' },
      { to: '/rpf/history', icon: 'history', label: 'Incident History' },
      { to: '/rpf/profile', icon: 'user',    label: 'Profile' },
    ],
  },
  [ROLES.STATION_CONTROL_ROOM]: {
    section: 'Station Control',
    items: [
      { to: '/station-control',            icon: 'building',  label: 'Dashboard',         exact: true },
      { to: '/station-control/analytics',  icon: 'analytics', label: 'Station Analytics' },
      { to: '/station-control/staff',      icon: 'staff',     label: 'Manage Staff' },
      { to: '/station-control/bookings',   icon: 'clipboard', label: 'All Bookings' },
      { to: '/station-control/rooms',      icon: 'bed',       label: 'Station Rooms' },
      { to: '/station-control/lockers',    icon: 'locker',    label: 'Digital Lockers' },
      { to: '/station-control/audit',      icon: 'audit',     label: 'Audit Logs' },
      { to: '/station-control/broadcast',  icon: 'broadcast', label: 'Broadcast' },
      { to: '/station-control/onboarding', icon: 'onboard',   label: 'Staff Onboarding' },
    ],
  },
  [ROLES.SUPERADMIN]: {
    section: 'System Admin',
    items: [
      { to: '/superadmin',              icon: 'admin',   label: 'Dashboard',       exact: true },
      { to: '/superadmin/users',        icon: 'users',   label: 'User Management' },
      { to: '/superadmin/stations',     icon: 'building',label: 'Station Onboarding' },
      { to: '/superadmin/knowledge-base', icon: 'brain', label: 'AI Knowledge Base' },
      { to: '/superadmin/config',       icon: 'settings',label: 'System Config' },
      { to: '/superadmin/audit',        icon: 'audit',   label: 'Global Audit Logs' },
    ],
  },
};

const ROLE_LABELS = {
  [ROLES.USER]:                { label: 'Passenger',       color: '#0D9488' },
  [ROLES.PORTER]:              { label: 'Porter',          color: '#B45309' },
  [ROLES.SUPERVISOR]:          { label: 'Supervisor',      color: '#1B3A6B' },
  [ROLES.RPF]:                 { label: 'RPF Officer',     color: '#B91C1C' },
  [ROLES.STATION_CONTROL_ROOM]:{ label: 'Station Control', color: '#7C3AED' },
  [ROLES.SUPERADMIN]:          { label: 'Super Admin',     color: '#1B3A6B' },
};

// ── Sidebar component ─────────────────────────────────────────────────────────
export default function Sidebar({ collapsed, onToggle }) {
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const config   = NAV_CONFIG[role] || { section: null, items: [] };
  const roleInfo = ROLE_LABELS[role] || {};

const handleLogout = () => {
  logout();
  navigate('/login');
};

const handleLogoClick = () => {
  const homeRoutes = {
    [ROLES.USER]: '/user',
    [ROLES.PORTER]: '/porter',
    [ROLES.SUPERVISOR]: '/supervisor',
    [ROLES.RPF]: '/rpf',
    [ROLES.STATION_CONTROL_ROOM]: '/station-control',
    [ROLES.SUPERADMIN]: '/superadmin',
  };

  navigate(homeRoutes[role] || '/');

  requestAnimationFrame(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });
};

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: collapsed ? 'var(--sidebar-coll)' : 'var(--sidebar-w)',
      display: 'flex', flexDirection: 'column',
      background: 'var(--c-navy)', zIndex: 200,
      transition: 'width var(--t-slow)',
      overflow: 'hidden',
      boxShadow: '2px 0 12px rgba(0,0,0,0.12)',
    }}>
      {/* Logo */}
      {/* Logo */}
<div
  className="sidebar-logo"
  onClick={handleLogoClick}
  style={{ cursor: 'pointer' }}
>
  <div className="sidebar-logo-mark">R1</div>

  {!collapsed && (
    <div style={{ overflow: 'hidden' }}>
      <div className="sidebar-logo-text">R1 Super App</div>
      <div className="sidebar-logo-sub">ADI · Ahmedabad Junction</div>
    </div>
  )}

  <button
    className="sidebar-toggle"
    onClick={(e) => {
      e.stopPropagation(); // prevent logo click
      onToggle();
    }}
    style={{ marginLeft: 'auto', flexShrink: 0 }}
    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
  >
    <Icon name={collapsed ? 'chevron' : 'menu'} size={14} />
  </button>
</div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
        {!collapsed && config.section && (
          <div className="sidebar-section-label">{config.section}</div>
        )}
        {config.items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-item-icon">
              <Icon name={item.icon} size={16} />
            </span>
            {!collapsed && (
              <span className="sidebar-item-label">{item.label}</span>
            )}
            {!collapsed && item.badge && (
              <span className="sidebar-item-badge">{item.badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User card + logout */}
      <div>
        <div className="sidebar-divider" />
        {!collapsed ? (
          <div className="sidebar-user-card" onClick={handleLogout} title="Log out">
            <div className="sidebar-avatar">
              {(user?.name || user?.phone || 'U')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name truncate">
                {user?.name || user?.phone || 'User'}
              </div>
              <div className="sidebar-user-role">{roleInfo.label}</div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.786rem' }}>
              <Icon name="logout" size={14} />
            </span>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="sidebar-item"
            title="Log out"
            style={{ width: '100%', margin: '4px 8px', justifyContent: 'center' }}
          >
            <span className="sidebar-item-icon">
              <Icon name="logout" size={16} />
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}

