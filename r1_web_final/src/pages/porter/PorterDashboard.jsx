import React, { useState, useEffect } from 'react';
import api from '../../lib/api.js';
import useAuthStore from '../../stores/authStore.js';
import useRealtimeBookings from '../../hooks/useRealtimeBookings.js';

function extractErrorMessage(err, fallback = 'Something went wrong.') {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (typeof data.error === 'string')   return data.error;
  if (typeof data.message === 'string') return data.message;
  if (typeof data === 'string')         return data;
  return fallback;
}

const SERVICE_LABELS = {
  LUGGAGE_ONLY:          'Luggage Only',
  LUGGAGE_BARROW:        'Luggage Barrow',
  WHEELCHAIR_ONLY:       'Wheelchair Only',
  WHEELCHAIR_STRETCHER:  'Wheelchair Stretcher',
  COMBINED:              'Combined (Luggage + Wheelchair)',
};

export default function PorterDashboard() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [toggling,  setToggling]  = useState(false);
  const [banner,    setBanner]    = useState(null);

  const flash = (type, msg) => {
    setBanner({ type, msg: String(msg) });
    setTimeout(() => setBanner(null), 4000);
  };

  const load = () => {
    setLoading(true);
    api.get('/api/porter/dashboard')
      .then(r => setDashboard(r.data))
      .catch(err => {
        const code = err.response?.data?.code;
        if (code === 'PORTER_NOT_REGISTERED') {
          setBanner({ type: 'warning', msg: 'Your porter profile has not been set up yet. Please contact your supervisor.' });
        } else {
          flash('error', extractErrorMessage(err, 'Could not load dashboard'));
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Real-time: new job assigned to this porter via Socket.io
  // porterId comes from the dashboard response
  useRealtimeBookings({
    porterId: dashboard?.porterId,
    onJobAssigned: () => {
      flash('success', 'New job assigned! Check your Requests tab.');
      load(); // refresh dashboard stats
    },
  });

  const handleToggleOnline = async () => {
    if (!dashboard) return;
    setToggling(true);
    try {
      // FIX: send BOTH keys so backend accepts regardless of which it reads
      const newState = !dashboard.isOnline;
      await api.put('/api/porter/status', {
        online:   newState,   // original key backend reads
        isOnline: newState,   // key frontend was sending — now both sent
      });
      setDashboard(d => ({ ...d, isOnline: newState }));
      flash('success', newState ? 'You are now Online — requests will appear in your Requests tab.' : 'You are now Offline.');
    } catch (err) {
      flash('error', extractErrorMessage(err, 'Could not update status'));
    } finally {
      setToggling(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  const d = dashboard || {};

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Porter Dashboard</h1>
          <p className="page-subtitle">
            {d.badgeNumber ? `Badge: ${d.badgeNumber}` : 'Welcome back'}
            {d.zone ? ` · Zone: ${d.zone}` : ''}
          </p>
        </div>
        {/* Online toggle */}
        {dashboard && (
          <button
            onClick={handleToggleOnline}
            disabled={toggling}
            className={`btn btn-lg ${d.isOnline ? 'btn-danger' : 'btn-secondary'}`}
            style={{ minWidth: 130 }}
          >
            {toggling
              ? <><span className="spinner" style={{ borderTopColor: '#fff' }} /> Updating…</>
              : d.isOnline ? 'Go Offline' : 'Go Online'}
          </button>
        )}
      </div>

      {banner && (
        <div className={`alert alert-${banner.type}`} style={{ marginBottom: 18 }}>
          {banner.msg}
        </div>
      )}

      {!dashboard ? null : (
        <>
          {/* Online status banner */}
          <div className={`alert ${d.isOnline ? 'alert-success' : 'alert-warning'}`} style={{ marginBottom: 20 }}>
            {d.isOnline
              ? `You are Online — ${d.pendingRequestsCount > 0 ? `${d.pendingRequestsCount} request${d.pendingRequestsCount !== 1 ? 's' : ''} waiting` : 'No pending requests right now'}`
              : 'You are Offline — go Online to start receiving requests'}
          </div>

          {/* Active job card */}
          {d.activeJob && (
            <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--color-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.971rem', marginBottom: 4 }}>Active Job</div>
                  <div style={{ fontSize: '0.857rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                    Ref: <strong>{d.activeJob.bookingReference}</strong>
                  </div>
                  <div style={{ fontSize: '0.857rem', marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Service: </span>
                    {SERVICE_LABELS[d.activeJob.serviceType] || d.activeJob.serviceType}
                  </div>
                  {d.activeJob.passengerName && (
                    <div style={{ fontSize: '0.857rem', marginBottom: 2 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Passenger: </span>
                      {d.activeJob.passengerName}
                      {d.activeJob.passengerMobile && ` · ${d.activeJob.passengerMobile}`}
                    </div>
                  )}
                  {d.activeJob.platform && (
                    <div style={{ fontSize: '0.857rem', marginBottom: 2 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Platform: </span>
                      {d.activeJob.platform}
                      {d.activeJob.coachNumber && ` · Coach: ${d.activeJob.coachNumber}`}
                    </div>
                  )}
                </div>
                <span className={`badge badge-lg ${d.activeJob.status === 'IN_PROGRESS' ? 'badge-success' : 'badge-secondary'}`}>
                  {d.activeJob.status === 'IN_PROGRESS' ? 'In Progress' : 'Accepted'}
                </span>
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            {[
              { label: 'Today Completed', value: d.todayCompleted ?? 0 },
              { label: 'Today Earnings',  value: d.todayEarnings != null ? `₹${Number(d.todayEarnings).toFixed(2)}` : '₹0.00' },
              { label: 'Week Completed',  value: d.weekCompleted ?? 0 },
              { label: 'Week Earnings',   value: d.weekEarnings  != null ? `₹${Number(d.weekEarnings).toFixed(2)}`  : '₹0.00' },
              { label: 'Avg Rating',      value: d.avgRating != null ? `${Number(d.avgRating).toFixed(1)} / 5` : '5.0 / 5' },
              { label: 'Total Services',  value: d.totalServices ?? 0 },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: '1.4rem' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}