import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)' }}>

      {/* Nav */}
      <div style={{
        background: 'var(--c-navy)', padding: '0 32px', height: 56,
        display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ width: 30, height: 30, background: 'var(--c-teal)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#fff' }}>R1</div>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>R1 Super App</span>
        <Link to="/login" style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.7)', fontSize: '0.857rem' }}>← Back to login</Link>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontWeight: 800, marginBottom: 6 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--c-text-3)', fontSize: '0.857rem', marginBottom: 36 }}>
          Last updated: June 2026 · Compliant with the Digital Personal Data Protection Act 2023 (India)
        </p>

        {[
          {
            title: '1. Data Controller',
            body: 'The R1 Super App is operated under the Ministry of Railways, Government of India, for the Ahmedabad Junction (ADI) smart station pilot. Questions about your data can be directed to r1support@indianrailways.gov.in.',
          },
          {
            title: '2. Data We Collect',
            body: 'We collect: (a) Identity data — your mobile number, name, email, date of birth, salutation, marital status, nationality; (b) Travel data — PNR numbers, train details, platform/coach information; (c) Usage data — app interactions, booking history, AI chat queries; (d) Location data — GPS coordinates collected only during active SOS alerts or live porter tracking, with your consent; (e) Device data — FCM token for push notifications.',
          },
          {
            title: '3. How We Use Your Data',
            body: 'Your data is used to: provide porter booking, room, and locker services; verify your identity for OTP-based login; enable the AI assistant to personalise responses; dispatch emergency services during SOS events; send service notifications; improve the platform through anonymised analytics. We do not use your data for advertising.',
          },
          {
            title: '4. Data Sharing',
            body: 'We share your data only with: (a) Licensed porters — your name, mobile, and journey details are shared with the assigned porter to fulfil your booking; (b) RPF officers — your GPS coordinates and contact details are shared during SOS activations; (c) Cashfree Payments — payment processing only; (d) Government authorities — when required by law. We never sell your data to third parties.',
          },
          {
            title: '5. Emergency Contact Data',
            body: 'Emergency contacts you register are stored securely and contacted via SMS only during SOS alerts. They are not used for any other purpose and can be deleted by you at any time from the Profile section.',
          },
          {
            title: '6. AI Assistant Data',
            body: 'Queries sent to the AI Assistant are processed by Groq API (USA) for inference. Conversation history is stored in Redis for 30 minutes to enable follow-up queries, then permanently deleted. We do not use your AI conversations for model training.',
          },
          {
            title: '7. Data Retention',
            body: 'Booking records are retained for 7 years as required by Indian financial regulations. Profile data is retained until you delete your account. SOS alert records are retained for 3 years. AI conversation history is deleted after 30 minutes.',
          },
          {
            title: '8. Your Rights',
            body: 'Under the DPDPA 2023, you have the right to: access your personal data; correct inaccurate data (via the Profile section); request erasure of your account and data; nominate a person to manage your data in case of incapacity. To exercise these rights, contact r1support@indianrailways.gov.in.',
          },
          {
            title: '9. Data Security',
            body: 'Your data is encrypted in transit (TLS 1.3) and at rest (AES-256). Passwords are not used — authentication is OTP-only. API access is protected by JWT tokens with 15-minute expiry. We conduct regular security audits.',
          },
          {
            title: '10. Cookies',
            body: 'The web application uses only essential cookies for session management. No tracking or advertising cookies are used.',
          },
          {
            title: '11. Children\'s Privacy',
            body: 'The Platform is not intended for users under 18 years of age. We do not knowingly collect data from minors.',
          },
          {
            title: '12. Changes to this Policy',
            body: 'We will notify you of material changes to this policy via in-app notification before they take effect.',
          },
          {
            title: '13. Grievance Officer',
            body: 'For privacy grievances: r1privacy@indianrailways.gov.in. We will respond within 30 days as required by the DPDPA 2023.',
          },
        ].map(s => (
          <div key={s.title} style={{ marginBottom: 28 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 8, color: 'var(--c-navy)', fontSize: '0.971rem' }}>{s.title}</h3>
            <p style={{ color: 'var(--c-text-2)', lineHeight: 1.75, fontSize: '0.9rem' }}>{s.body}</p>
          </div>
        ))}

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--c-border-lite)', display: 'flex', gap: 16 }}>
          <Link to="/terms" style={{ color: 'var(--c-navy)', fontWeight: 600, fontSize: '0.857rem' }}>Terms &amp; Conditions</Link>
          <Link to="/login" style={{ color: 'var(--c-text-3)', fontSize: '0.857rem' }}>Back to App</Link>
        </div>
      </div>
    </div>
  );
}
