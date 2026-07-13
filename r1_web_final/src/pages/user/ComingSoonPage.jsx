import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PHASE_CONFIG } from '../../config/constants.js';

const META = {
  food: { icon: '🍽', desc: 'Order from IRCTC & platform vendors, delivered to your seat or table.' },
  tourism: { icon: '🗺', desc: 'Curated day-trips and heritage walks around Ahmedabad.' },
  hotels: { icon: '🏨', desc: 'Compare and book hotels near ADI with instant confirmation.' },
  rides: { icon: '🚕', desc: 'Compare Ola, Uber, and Rapido prices from the ADI exit gate.' },
  metro: { icon: '🚇', desc: 'GMRC Metro routes, ticket booking, and live train status.' },
  bus: { icon: '🚌', desc: 'AMTS bus routes from ADI with live tracking.' },
  aiTrip: { icon: '✈️', desc: 'Let AI plan your entire Ahmedabad trip end-to-end.' },
  voiceAi: { icon: '🎙', desc: 'Speak to the AI in Hindi, Gujarati, or English.' },
};

export default function ComingSoonPage() {
  const { feature } = useParams();
  const navigate = useNavigate();
  const config = PHASE_CONFIG[feature] || { label: 'Feature', phase: 2 };
  const meta = META[feature] || { icon: '🚧', desc: 'This feature is under development.' };

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ fontSize: '4rem' }}>{meta.icon}</div>
      <h1 style={{ fontWeight: 800, fontSize: '1.5rem' }}>{config.label}</h1>
      <p style={{ color: 'var(--color-muted)', lineHeight: 1.7 }}>{meta.desc}</p>
      <div style={{ background: '#FEF3C7', color: '#92400E', padding: '6px 18px', borderRadius: 20, fontWeight: 700, fontSize: '0.85rem' }}>
        Phase {config.phase} · Coming Soon
      </div>
      <button className="btn btn-outline" onClick={() => navigate('/user')}>← Back to Home</button>
    </div>
  );
}
