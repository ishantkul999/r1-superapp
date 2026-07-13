import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NAV_ITEMS = ['Features', 'How It Works', 'Benefits', 'FAQ', 'Contact'];

const FEATURES = [
  {
    icon: '🛄',
    title: 'Licensed Porter Service',
    desc: 'Book CRIS-regulated porters at transparent fixed rates. Track your porter live and pay securely via UPI or cash.',
    tag: 'Phase 1',
  },
  {
    icon: '🚂',
    title: 'PNR & Train Status',
    desc: 'Real-time PNR lookup and live train running status directly from NTES. No third-party aggregators.',
    tag: 'Phase 1',
  },
  {
    icon: '🏨',
    title: 'Station Retiring Rooms',
    desc: 'Check availability and reserve IRCTC retiring rooms and dormitories at Ahmedabad Junction.',
    tag: 'Phase 1',
  },
  {
    icon: '🔐',
    title: 'Digital Lockers',
    desc: 'Secure 24×7 luggage storage with QR-code access. Available across all major platforms at ADI.',
    tag: 'Phase 1',
  },
  {
    icon: '🤖',
    title: 'AI Travel Assistant',
    desc: 'Multilingual AI powered by RAG — answers in Hindi, Gujarati, and English about station services and itineraries.',
    tag: 'Phase 1',
  },
  {
    icon: '🚨',
    title: 'Emergency SOS',
    desc: 'One-tap SOS alert dispatches your GPS location to RPF officers and notifies your emergency contacts.',
    tag: 'Phase 1',
  },
];

const STEPS = [
  { num: '01', title: 'Sign in with mobile',  desc: 'Enter your mobile number and verify with a one-time password. No password to remember.' },
  { num: '02', title: 'Choose your service',  desc: 'Book a porter, check your PNR, find a room, or rent a locker — all from one home screen.' },
  { num: '03', title: 'Get instant assistance', desc: 'A licensed porter is notified and accepted within seconds. Track them live to your platform.' },
];

const FAQS = [
  { q: 'Is this app official?', a: 'Yes. R1 Super App is a government-grade platform developed for Ahmedabad Junction (ADI) under Indian Railways\' digitalisation initiative.' },
  { q: 'How is the porter rate decided?', a: 'All porter tariffs are fixed by CRIS (Centre for Railway Information Systems) and are non-negotiable. Rates include 18% GST and are displayed upfront before booking.' },
  { q: 'Can I cancel a porter booking?', a: 'Yes. You can cancel a booking before the porter starts the service. Cancellations after service commencement are not permitted.' },
  { q: 'Is my payment secure?', a: 'Online payments are processed via Cashfree PG, a PCI-DSS compliant payment gateway. R1 does not store your card details.' },
  { q: 'What languages does the AI assistant support?', a: 'The AI assistant supports English, Hindi, and Gujarati. Simply type or speak in your preferred language.' },
  { q: 'How does the SOS button work?', a: 'Pressing SOS sends your GPS coordinates to the nearest RPF post and simultaneously notifies your registered emergency contacts via SMS.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [contact, setContact] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  // Active nav section on scroll
  useEffect(() => {
    const handler = () => {
      const sections = ['features', 'how-it-works', 'benefits', 'faq', 'contact'];
      for (const id of sections.reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 80) { setActiveSection(id); break; }
      }
    };
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = id => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleContact = e => {
    e.preventDefault();
    setSent(true);
    setContact({ name: '', email: '', message: '' });
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div style={{ background: 'var(--c-bg)', minHeight: '100vh' }}>

      {/* ── Fixed navbar ──────────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <Link
  to="/"
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
    color: 'inherit',
  }}
>
  <div
    style={{
      width: 32,
      height: 32,
      background: 'var(--c-teal)',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: '0.857rem',
      color: '#fff',
      transition: 'transform 0.2s ease',
    }}
  >
    R1
  </div>

  <span
    style={{
      fontWeight: 700,
      fontSize: '0.929rem',
      color: '#fff',
    }}
  >
    R1 Super App
  </span>
</Link>
        <div className="landing-nav-links">
          {[
            { label: 'Features',     id: 'features' },
            { label: 'How It Works', id: 'how-it-works' },
            { label: 'FAQ',          id: 'faq' },
            { label: 'Contact',      id: 'contact' },
          ].map(item => (
            <a
              key={item.id}
              className="landing-nav-link"
              href={`#${item.id}`}
              onClick={e => { e.preventDefault(); scrollTo(item.id); }}
              style={{ color: activeSection === item.id ? '#fff' : 'rgba(255,255,255,0.65)' }}
            >{item.label}</a>
          ))}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/login')}
            style={{ marginLeft: 8 }}
          >Sign in</button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="landing-hero" style={{ paddingTop: 120 }}>
        <div
  style={{
    position: 'relative',
    zIndex: 1,
    maxWidth: 700,
    margin: '0 auto',
    textAlign: 'center',
  }}
>
          <div style={{
            display: 'inline-flex', margin: '0 auto 24px', alignItems: 'center', gap: 8,
            background: 'rgba(13,148,136,0.2)', border: '1px solid rgba(13,148,136,0.35)',
            borderRadius: 20, padding: '5px 14px', fontSize: '0.771rem', fontWeight: 600,
            color: '#5EEAD4', letterSpacing: '0.04em',
          }}>
            GOVERNMENT PILOT · AHMEDABAD JUNCTION
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.857rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, color: '#fff' }}>
            Every passenger deserves a<br />
            <span style={{ color: '#5EEAD4' }}>seamless station experience</span>
          </h1>
          <p
  style={{
    fontSize: '1.071rem',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.7,
    margin: '0 auto 40px',
    maxWidth: 560,
  }}
>
            Book licensed porters, check train status, reserve retiring rooms, store luggage securely,
            and get multilingual AI assistance — all from a single platform built for Indian Railways.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/login')}
            >Get Started</button>
            <button
              className="btn btn-lg"
              onClick={() => scrollTo('how-it-works')}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            >See how it works</button>
          </div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 40, marginTop: 64, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { num: '600+', label: 'Daily passengers served' },
              { num: '48',   label: 'Licensed porters on platform' },
              { num: '3',    label: 'Languages supported by AI' },
              { num: '24×7', label: 'Locker & SOS availability' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.714rem', fontWeight: 800, color: '#5EEAD4', lineHeight: 1 }}>{s.num}</div>
                <div style={{ fontSize: '0.771rem', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="landing-section" style={{ background: 'var(--c-surface)' }}>
        <div className="landing-container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: '0.786rem', fontWeight: 700, color: 'var(--c-teal)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>SERVICES</p>
            <h2 style={{ fontSize: '1.857rem', fontWeight: 800, marginBottom: 14 }}>Everything you need at ADI</h2>
            <p style={{ color: 'var(--c-text-2)', fontSize: '0.971rem', maxWidth: 520, margin: '0 auto' }}>
              Phase 1 services are live now. Phase 2 brings food ordering, hotel booking, and city mobility.
            </p>
          </div>
          <div className="landing-feature-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="landing-feature-card">
                <div className="landing-feature-icon" style={{ fontSize: '1.4rem' }}>{f.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <h3 style={{ fontSize: '0.971rem', fontWeight: 700 }}>{f.title}</h3>
                  <span style={{ fontSize: '0.643rem', fontWeight: 700, background: 'var(--c-teal-light)', color: '#0F766E', padding: '1px 7px', borderRadius: 10 }}>{f.tag}</span>
                </div>
                <p style={{ color: 'var(--c-text-2)', fontSize: '0.857rem', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="landing-section">
        <div className="landing-container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: '0.786rem', fontWeight: 700, color: 'var(--c-teal)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>PROCESS</p>
            <h2 style={{ fontSize: '1.857rem', fontWeight: 800 }}>Book a porter in under 60 seconds</h2>
          </div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            {STEPS.map((step, i) => (
              <div key={step.num} style={{ flex: '1 1 260px', maxWidth: 320, display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <div className="landing-step-number">{step.num}</div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                  <p style={{ color: 'var(--c-text-2)', fontSize: '0.871rem', lineHeight: 1.65 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ──────────────────────────────────────────────────────── */}
      <section id="benefits" className="landing-section" style={{ background: 'linear-gradient(155deg, var(--c-navy) 0%, #1e4d94 100%)', color: '#fff' }}>
        <div className="landing-container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: '0.786rem', fontWeight: 700, color: '#5EEAD4', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>WHY R1</p>
            <h2 style={{ fontSize: '1.857rem', fontWeight: 800, color: '#fff' }}>Built for reliability</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { title: 'CRIS-regulated pricing',  desc: 'All tariffs fixed by the Centre for Railway Information Systems. No hidden charges.' },
              { title: 'GPS-tracked porters',     desc: 'Real-time tracking from acceptance to service completion with live ETA.' },
              { title: 'Cashfree PG integration', desc: 'PCI-DSS certified payments. UPI, card, net banking, and cash-on-delivery.' },
              { title: 'Offline-ready',           desc: 'Core features work on 2G networks. No large downloads required.' },
              { title: 'Multilingual AI',         desc: 'AI assistant responds in English, Hindi, and Gujarati using RAG + pgvector.' },
              { title: 'Accessible by design',    desc: 'Wheelchair-specific services, disability assistance, and accessibility flags built in.' },
            ].map(b => (
              <div key={b.title} style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12, padding: '22px 20px',
              }}>
                <div style={{ width: 28, height: 3, background: '#5EEAD4', borderRadius: 2, marginBottom: 14 }} />
                <h4 style={{ fontWeight: 700, marginBottom: 8, color: '#fff', fontSize: '0.929rem' }}>{b.title}</h4>
                <p style={{ fontSize: '0.843rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.65 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Download CTA ──────────────────────────────────────────────────── */}
      <section className="landing-section" style={{ background: 'var(--c-surface)' }}>
        <div className="landing-container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.714rem', fontWeight: 800, marginBottom: 14 }}>Available on all platforms</h2>
          <p style={{ color: 'var(--c-text-2)', fontSize: '0.971rem', marginBottom: 36 }}>
            Use R1 in your browser or download the mobile app for a faster experience.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
              Open Web App
            </button>
            <button className="btn btn-outline btn-lg" disabled style={{ cursor: 'default' }}>
              Android App (Coming Soon)
            </button>
            <button className="btn btn-outline btn-lg" disabled style={{ cursor: 'default' }}>
              iOS App (Coming Soon)
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="landing-section">
        <div className="landing-container" style={{ maxWidth: 760 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: '0.786rem', fontWeight: 700, color: 'var(--c-teal)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>FAQ</p>
            <h2 style={{ fontSize: '1.857rem', fontWeight: 800 }}>Common questions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{
                border: '1px solid var(--c-border-lite)', borderRadius: 10,
                background: 'var(--c-surface)', overflow: 'hidden',
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '16px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'none', border: 'none', cursor: 'pointer',
                    text: 'left', fontWeight: 600, fontSize: '0.929rem', color: 'var(--c-text)',
                    textAlign: 'left', gap: 12,
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ color: 'var(--c-text-3)', fontSize: '1.2rem', flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 16px', color: 'var(--c-text-2)', fontSize: '0.871rem', lineHeight: 1.7 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────────────────── */}
      <section id="contact" className="landing-section" style={{ background: 'var(--c-surface)' }}>
        <div className="landing-container" style={{ maxWidth: 680 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: '0.786rem', fontWeight: 700, color: 'var(--c-teal)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>CONTACT</p>
            <h2 style={{ fontSize: '1.857rem', fontWeight: 800 }}>Get in touch</h2>
            <p style={{ color: 'var(--c-text-2)', fontSize: '0.929rem', marginTop: 10 }}>
              For support, feedback, or partnership enquiries about the R1 pilot programme.
            </p>
          </div>
          {sent ? (
            <div className="alert alert-success" style={{ textAlign: 'center', padding: 20 }}>
              Your message has been sent. We'll respond within 2 working days.
            </div>
          ) : (
            <form onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name <span className="form-req">*</span></label>
                  <input className="form-input" required value={contact.name}
                    onChange={e => setContact(c => ({ ...c, name: e.target.value }))} placeholder="Your full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email <span className="form-req">*</span></label>
                  <input className="form-input" type="email" required value={contact.email}
                    onChange={e => setContact(c => ({ ...c, email: e.target.value }))} placeholder="you@example.com" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Message <span className="form-req">*</span></label>
                <textarea className="form-input form-textarea" rows={5} required value={contact.message}
                  onChange={e => setContact(c => ({ ...c, message: e.target.value }))}
                  placeholder="Describe your query or feedback…" style={{ resize: 'vertical' }} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ alignSelf: 'flex-start' }}>
                Send Message
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── About ─────────────────────────────────────────────────────────── */}
      <section id="about" className="landing-section" style={{ background: 'var(--c-bg)' }}>
        <div className="landing-container" style={{ maxWidth: 760, textAlign: 'center' }}>
          <p style={{ fontSize: '0.786rem', fontWeight: 700, color: 'var(--c-teal)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>ABOUT</p>
          <h2 style={{ fontSize: '1.857rem', fontWeight: 800, marginBottom: 20 }}>About R1 Super App</h2>
          <p style={{ color: 'var(--c-text-2)', fontSize: '0.971rem', lineHeight: 1.8, maxWidth: 640, margin: '0 auto' }}>
            R1 Super App is a government-grade smart passenger assistance platform built for
            Ahmedabad Junction (ADI), one of India's busiest railway stations.
            The platform integrates with CRIS, NTES, and IRCTC to provide real-time,
            authenticated services to passengers, station staff, and security personnel.
            Developed under the Indian Railways digitalisation initiative, R1 is currently
            operating as a Phase 1 pilot with planned national rollout in subsequent phases.
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40, marginBottom: 40 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, background: 'var(--c-teal)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.857rem', color: '#fff' }}>R1</div>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.929rem' }}>R1 Super App</span>
              </div>
              <p style={{ fontSize: '0.814rem', lineHeight: 1.7, maxWidth: 220 }}>
                Smart passenger assistance for Ahmedabad Junction. Part of the Indian Railways digital pilot.
              </p>
            </div>
            {/* Links */}
            <div>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 14, fontSize: '0.857rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Platform</div>
              {['About Us', 'Features', 'How It Works', 'Download App'].map(l => (
                <div key={l} style={{ marginBottom: 8 }}>
                  <a href="#" style={{ fontSize: '0.857rem', color: 'rgba(255,255,255,0.55)', transition: 'color 0.15s' }}
                    onMouseOver={e => e.target.style.color = '#fff'}
                    onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.55)'}>{l}</a>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 14, fontSize: '0.857rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Legal</div>
              {[['Privacy Policy', '/privacy'], ['Terms & Conditions', '/terms'], ['Grievance Policy', '/grievance']].map(([l, href]) => (
                <div key={l} style={{ marginBottom: 8 }}>
                  <Link to={href} style={{ fontSize: '0.857rem', color: 'rgba(255,255,255,0.55)' }}>{l}</Link>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 14, fontSize: '0.857rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Connect</div>
              <div style={{ marginBottom: 8 }}><a href="mailto:r1support@indianrailways.gov.in" style={{ fontSize: '0.857rem', color: 'rgba(255,255,255,0.55)' }}>r1support@indianrailways.gov.in</a></div>
              <div style={{ marginBottom: 8 }}><a href="tel:+918000000000" style={{ fontSize: '0.857rem', color: 'rgba(255,255,255,0.55)' }}>1800-xxx-xxxx (Toll free)</a></div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                {['𝕏', 'in', 'f'].map(icon => (
                  <a key={icon} href="#" style={{
                    width: 34, height: 34, borderRadius: 8,
                    background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.857rem', fontWeight: 700,
                    transition: 'background 0.15s',
                  }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  >{icon}</a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: '0.786rem' }}>
              &copy; {new Date().getFullYear()} R1 Super App. Government of India · Ministry of Railways.
            </span>
            <span style={{ fontSize: '0.786rem' }}>
              CRIS Integration · ADI Ahmedabad Junction · Phase 1 Pilot
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
