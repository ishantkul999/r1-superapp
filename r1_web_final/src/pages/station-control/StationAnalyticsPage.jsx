import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';

const WEEK = [
  { day: 'Mon', revenue: 8400, porter: 42, room: 8, locker: 15 },
  { day: 'Tue', revenue: 9200, porter: 55, room: 10, locker: 18 },
  { day: 'Wed', revenue: 7800, porter: 38, room: 6, locker: 12 },
  { day: 'Thu', revenue: 11200, porter: 60, room: 12, locker: 22 },
  { day: 'Fri', revenue: 13400, porter: 70, room: 14, locker: 25 },
  { day: 'Sat', revenue: 15600, porter: 82, room: 18, locker: 30 },
  { day: 'Sun', revenue: 12100, porter: 65, room: 15, locker: 22 },
];
const MAX_REV = Math.max(...WEEK.map(d => d.revenue));

export default function StationAnalyticsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><h1 className="page-title">📈 Analytics</h1><p className="page-subtitle">ADI station performance — this week</p></div>
      <div className="stats-grid">
        {[{ icon: '💰', label: 'Week Revenue', value: '₹77,700' }, { icon: '📦', label: 'Total Bookings', value: '412' }, { icon: '🛄', label: 'Porter Jobs', value: '312' }, { icon: '🛏', label: 'Room Nights', value: '83' }].map(s => (
          <div key={s.label} className="stat-card"><div className="stat-icon">{s.icon}</div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
        ))}
      </div>
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 16 }}>Revenue (₹) — Last 7 Days</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
          {WEEK.map(d => (
            <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>₹{(d.revenue/1000).toFixed(1)}k</div>
              <div style={{ width: '100%', background: 'var(--color-primary)', borderRadius: '4px 4px 0 0', height: `${(d.revenue / MAX_REV) * 110}px` }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{d.day}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 14 }}>Bookings by Service</div>
        {[['🛄 Porter', 312, 0.76], ['🛏 Rooms', 83, 0.20], ['🔒 Lockers', 32, 0.08]].map(([label, count, pct]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: 6 }}><span>{label}</span><span style={{ fontWeight: 700 }}>{count}</span></div>
            <div style={{ background: 'var(--color-border)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{ width: `${pct * 100}%`, height: '100%', background: 'var(--color-primary)', borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
