import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { IndianRupee, CheckCircle, TrendingUp, Star, Banknote } from 'lucide-react';
import api from '../../lib/api.js';

export default function EarningsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('WEEK');

  useEffect(() => {
    api.get(`/api/porter/earnings?period=${period}`).then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [period]);

  const PERIODS = [
    { value: 'WEEK', label: '7 Days' },
    { value: 'MONTH', label: '30 Days' },
    { value: 'ALL', label: 'All Time' },
  ];

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner spinner-lg" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8 }}>
        {PERIODS.map(p => (
          <button key={p.value} className={`chip ${period === p.value ? 'active' : ''}`} onClick={() => setPeriod(p.value)}>{p.label}</button>
        ))}
      </div>

      {/* Summary stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Earnings', value: `₹${data?.totalEarnings || 0}`, icon: <IndianRupee size={24} />, variant: 'teal' },
          { label: 'Jobs Completed', value: data?.completedJobs || 0, icon: <CheckCircle size={24} />, variant: 'green' },
          { label: 'Avg per Job', value: `₹${data?.avgPerJob || 0}`, icon: <TrendingUp size={24} />, variant: 'blue' },
          { label: 'Rating', value: data?.rating || '—', icon: <Star size={24} />, variant: 'amber' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.variant}`}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Earnings chart */}
      {data?.chart && data.chart.length > 0 && (
        <div className="card">
          <h4 style={{ marginBottom: 16 }}>Earnings Overview</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={v => [`₹${v}`, 'Earnings']} contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.857rem' }} />
              <Bar dataKey="earnings" fill="var(--color-primary)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transaction history */}
      <div className="card">
        <h4 style={{ marginBottom: 14 }}>Transaction History</h4>
        {!data?.transactions?.length ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-state-icon" style={{ color: 'var(--color-text-muted)', marginBottom: 8 }}>
              <Banknote size={40} />
            </div>
            <div className="empty-state-title">No transactions yet</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Route</th>
                  <th>Payment</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map(t => (
                  <tr key={t.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{t.date}</td>
                    <td>{t.serviceType}</td>
                    <td style={{ fontSize: '0.786rem' }}>{t.from} → {t.to}</td>
                    <td><span className={`badge badge-${t.paymentMode === 'COD' ? 'warning' : 'secondary'}`}>{t.paymentMode}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{t.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}