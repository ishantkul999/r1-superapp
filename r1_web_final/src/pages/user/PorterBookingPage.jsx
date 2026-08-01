import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import useAuthStore from '../../stores/authStore.js';

const Field = ({ label, req, error, children }) => (
  <div className="form-group">
    <label className="form-label">
      {label}{req && <span className="form-req"> *</span>}
    </label>
    {children}
    {error && <span className="form-error">{error}</span>}
  </div>
);

const STEPS = ['Passenger Details', 'Service & Route', 'Review & Pay', 'Confirmation'];

const SERVICES = [
  {
    type: 'LUGGAGE_ONLY',
    label: 'Luggage Porter',
    desc: 'Up to 40 kg — standard carry',
    price: 85, gst: 15.30, total: 100.30,
  },
  {
    type: 'LUGGAGE_BARROW',
    label: 'Luggage Barrow',
    desc: '40–160 kg — hand trolley',
    price: 135, gst: 24.30, total: 159.30,
  },
  {
    type: 'WHEELCHAIR_ONLY',
    label: 'Wheelchair Assistance',
    desc: '2-person standard wheelchair',
    price: 135, gst: 24.30, total: 159.30,
  },
  {
    type: 'WHEELCHAIR_STRETCHER',
    label: 'Stretcher / Bed Wheelchair',
    desc: '4-person stretcher or bed chair',
    price: 205, gst: 36.90, total: 241.90,
  },
  {
    type: 'COMBINED',
    label: 'Combined — Luggage + Wheelchair',
    desc: 'Luggage porter and wheelchair assistance together',
    price: 220, gst: 39.60, total: 259.60,
  },
];

const PAYMENT_MODES = [
  { value: 'ONLINE', label: 'Online Payment',    desc: 'UPI / Card / Net Banking via Cashfree' },
  { value: 'COD',    label: 'Cash on Delivery',  desc: 'Pay porter in cash after service completion' },
];

const SALUTATION_OPTIONS = ['Mr.', 'Ms.', 'Mrs.', 'Dr.'];

export default function PorterBookingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Step 0 — Passenger details
  const [passenger, setPassenger] = useState({
    salutation: 'Mr.',
    firstName: '',
    lastName: '',
    mobile: user?.phone?.replace(/^\+91/, '') || '',
    email: '',
    pnr: '',
    trainNumber: '',
    platform: '',
    coach: '',
    seat: '',
    specialInstructions: '',
  });

  // Step 1 — Service details
  const [service, setService] = useState({
    type: '',
    fromLocation: '',
    toLocation: '',
    paymentMode: 'ONLINE',
  });

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const selectedService = SERVICES.find(s => s.type === service.type);

  // Autofill from profile
  useEffect(() => {
    setLoadingProfile(true);
    api.get('/api/users/me')
      .then(r => {
        const d = r.data || {};
        const fullName = d.full_name || d.fullName || '';
        const parts = fullName.trim().split(' ');
        setPassenger(p => ({
          ...p,
          firstName: parts[0] || p.firstName,
          lastName:  parts.slice(1).join(' ') || p.lastName,
          email:     d.email || p.email,
          mobile:    (user?.phone || '').replace(/^\+91/, '') || p.mobile,
        }));
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, []);

  const setP = (k, v) => setPassenger(p => ({ ...p, [k]: v }));
  const setS = (k, v) => setService(s => ({ ...s, [k]: v }));

  // ── Validation ────────────────────────────────────────────────────────────
  const validateStep0 = () => {
    const e = {};
    if (!passenger.firstName.trim())  e.firstName = 'First name is required';
    if (!passenger.lastName.trim())   e.lastName  = 'Last name is required';
    if (!passenger.mobile.trim() || !/^\d{10}$/.test(passenger.mobile.trim()))
      e.mobile = 'Enter a valid 10-digit mobile number';
    if (!passenger.email.trim() || !/\S+@\S+\.\S+/.test(passenger.email))
      e.email = 'Enter a valid email address';
    if (!passenger.pnr.trim())        e.pnr = 'PNR number is required';
    if (!passenger.platform.trim())   e.platform = 'Platform number is required';
    if (!passenger.coach.trim())      e.coach = 'Coach number is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep1 = () => {
    const e = {};
    if (!service.type)               e.type = 'Please select a service';
    if (!service.fromLocation.trim()) e.fromLocation = 'Pickup location is required';
    if (!service.toLocation.trim())   e.toLocation = 'Drop location is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    setErrors({});
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});
    try {
      const payload = {
        serviceType: service.type,
        pickupLocation: service.fromLocation,
        destination: service.toLocation,
        paymentMethod: service.paymentMode,
        pnrNumber: passenger.pnr,
        trainNumber: passenger.trainNumber,
        platform: passenger.platform,
        coachNumber: passenger.coach,
        seatBerth: passenger.seat,
        passengerName: `${passenger.salutation} ${passenger.firstName} ${passenger.lastName}`.trim(),
        passengerMobile: `+91${passenger.mobile}`,
        passengerEmail: passenger.email,
        specialInstructions: passenger.specialInstructions,
        baseAmount: selectedService?.price,
        gstAmount: selectedService?.gst,
        totalAmount: selectedService?.total,
      };
      const { data } = await api.post('/api/porter/bookings', payload);
      setBooking(data);
      setStep(3);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Booking failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(0);
    setBooking(null);
    setService({ type: '', fromLocation: '', toLocation: '', paymentMode: 'ONLINE' });
    setErrors({});
  };

  // ── UI helpers ────────────────────────────────────────────────────────────
  

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>

      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Book Porter</h1>
        <p className="page-subtitle">Licensed CRIS-regulated porters at fixed tariffs</p>
      </div>

      {/* Step bar */}
      <div className="steps-bar" style={{ marginBottom: 28 }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div className={`step-dot${i < step ? ' done' : i === step ? ' active' : ''}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`step-label${i === step ? ' active' : ''}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-line${i < step ? ' done' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── STEP 0: Passenger Details ───────────────────────────────────── */}
      {step === 0 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <h3 style={{ marginBottom: 4 }}>Passenger Information</h3>
            <p style={{ fontSize: '0.829rem', color: 'var(--c-text-3)' }}>
              {loadingProfile ? 'Loading your profile…' : 'Pre-filled from your profile. You can edit before confirming.'}
            </p>
          </div>

          {/* Salutation + Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: 12 }}>
            <Field label="Title" req>
              <select className="form-select" value={passenger.salutation} onChange={e => setP('salutation', e.target.value)}>
                {SALUTATION_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="First Name" req error={errors.firstName}>
              <input className="form-input" value={passenger.firstName} onChange={e => setP('firstName', e.target.value)} placeholder="First name" />
            </Field>
            <Field label="Last Name" req error={errors.lastName}>
              <input className="form-input" value={passenger.lastName} onChange={e => setP('lastName', e.target.value)} placeholder="Last name" />
            </Field>
          </div>

          {/* Contact */}
          <div className="form-row">
            <Field label="Mobile Number" req error={errors.mobile}>
              <div className="phone-input-wrap" style={{ border: errors.mobile ? '1.5px solid var(--c-error)' : undefined }}>
                <div className="phone-cc" style={{ pointerEvents: 'none' }}>
                  <span>🇮🇳</span>
                  <span style={{ fontSize: '0.857rem', fontWeight: 600 }}>+91</span>
                </div>
                <input
                  className="phone-number"
                  type="tel"
                  inputMode="numeric"
                  value={passenger.mobile}
                  onChange={e => setP('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit number"
                />
              </div>
            </Field>
            <Field label="Email Address" req error={errors.email}>
              <input className="form-input" type="email" value={passenger.email} onChange={e => setP('email', e.target.value)} placeholder="you@example.com" style={{ borderColor: errors.email ? 'var(--c-error)' : undefined }} />
            </Field>
          </div>

          {/* Journey details */}
          <div style={{ borderTop: '1px solid var(--c-border-lite)', paddingTop: 16 }}>
            <h4 style={{ marginBottom: 14, color: 'var(--c-text-2)', fontSize: '0.857rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Journey Details</h4>
            <div className="form-row">
              <Field label="PNR Number" req error={errors.pnr}>
                <input className="form-input" value={passenger.pnr} onChange={e => setP('pnr', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit PNR" maxLength={10} style={{ fontFamily: 'monospace', letterSpacing: '0.05em', borderColor: errors.pnr ? 'var(--c-error)' : undefined }} />
              </Field>
              <Field label="Train Number" >
                <input className="form-input" value={passenger.trainNumber} onChange={e => setP('trainNumber', e.target.value)} placeholder="e.g. 12009 (optional)" />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Field label="Platform No." req error={errors.platform}>
                <input className="form-input" value={passenger.platform} onChange={e => setP('platform', e.target.value)} placeholder="e.g. PF 3" style={{ borderColor: errors.platform ? 'var(--c-error)' : undefined }} />
              </Field>
              <Field label="Coach No." req error={errors.coach}>
                <input className="form-input" value={passenger.coach} onChange={e => setP('coach', e.target.value)} placeholder="e.g. S4" style={{ borderColor: errors.coach ? 'var(--c-error)' : undefined }} />
              </Field>
              <Field label="Seat / Berth">
                <input className="form-input" value={passenger.seat} onChange={e => setP('seat', e.target.value)} placeholder="e.g. 42 (optional)" />
              </Field>
            </div>
          </div>

          <button className="btn btn-primary btn-lg btn-full" onClick={handleNext}>
            Continue to Service Selection
          </button>
        </div>
      )}

      {/* ── STEP 1: Service & Route ─────────────────────────────────────── */}
      {step === 1 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3>Select Service</h3>

          {/* Service cards */}
          <div className="form-group">
            {errors.type && <span className="form-error">{errors.type}</span>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {SERVICES.map(svc => (
                <button
                  key={svc.type}
                  type="button"
                  className={`service-card${service.type === svc.type ? ' selected' : ''}`}
                  onClick={() => setS('type', svc.type)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="service-card-name">{svc.label}</div>
                      <div className="service-card-desc">{svc.desc}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                      <div className="service-card-price">₹{svc.total.toFixed(2)}</div>
                      <div style={{ fontSize: '0.729rem', color: 'var(--c-text-3)' }}>incl. 18% GST</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Free-text locations */}
          <div style={{ borderTop: '1px solid var(--c-border-lite)', paddingTop: 16 }}>
            <h4 style={{ marginBottom: 14, color: 'var(--c-text-2)', fontSize: '0.857rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Route</h4>
            <div className="form-row">
              <Field label="Pickup Location" req error={errors.fromLocation}>
                <input
                  className="form-input"
                  value={service.fromLocation}
                  onChange={e => setS('fromLocation', e.target.value)}
                  placeholder="e.g. Platform 3, Gate A, Waiting Hall"
                  style={{ borderColor: errors.fromLocation ? 'var(--c-error)' : undefined }}
                />
                <span className="form-hint">Describe exactly where you are</span>
              </Field>
              <Field label="Drop Location" req error={errors.toLocation}>
                <input
                  className="form-input"
                  value={service.toLocation}
                  onChange={e => setS('toLocation', e.target.value)}
                  placeholder="e.g. Exit Gate B, Parking, Coach S4"
                  style={{ borderColor: errors.toLocation ? 'var(--c-error)' : undefined }}
                />
                <span className="form-hint">Describe the destination</span>
              </Field>
            </div>
          </div>

          {/* Special instructions */}
          <Field label="Special Instructions">
            <textarea
              className="form-input"
              rows={2}
              value={passenger.specialInstructions}
              onChange={e => setP('specialInstructions', e.target.value)}
              placeholder="Fragile items, elderly passenger, extra care needed…"
              style={{ resize: 'vertical' }}
            />
          </Field>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setStep(0)}>Back</button>
            <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleNext}>
              Review Booking
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Review & Pay ────────────────────────────────────────── */}
      {step === 2 && selectedService && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h3>Review & Pay</h3>

          {/* Passenger summary */}
          <div style={{ background: 'var(--c-bg)', borderRadius: 8, padding: 16, border: '1px solid var(--c-border-lite)' }}>
            <div style={{ fontSize: '0.743rem', fontWeight: 700, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Passenger</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.857rem' }}>
              {[
                ['Name',     `${passenger.salutation} ${passenger.firstName} ${passenger.lastName}`],
                ['Mobile',   `+91 ${passenger.mobile}`],
                ['Email',    passenger.email],
                ['PNR',      passenger.pnr],
                ['Platform', passenger.platform],
                ['Coach',    passenger.coach + (passenger.seat ? ` · Seat ${passenger.seat}` : '')],
                passenger.trainNumber ? ['Train', passenger.trainNumber] : null,
              ].filter(Boolean).map(([k, v]) => (
                <div key={k}><span style={{ color: 'var(--c-text-3)' }}>{k}: </span><span style={{ fontWeight: 500 }}>{v}</span></div>
              ))}
            </div>
          </div>

          {/* Service summary */}
          <div style={{ background: 'var(--c-bg)', borderRadius: 8, padding: 16, border: '1px solid var(--c-border-lite)' }}>
            <div style={{ fontSize: '0.743rem', fontWeight: 700, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Service</div>
            <div style={{ fontSize: '0.857rem', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--c-text-3)' }}>Type</span>
                <span style={{ fontWeight: 600 }}>{selectedService.label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--c-text-3)' }}>From</span>
                <span style={{ fontWeight: 500 }}>{service.fromLocation}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--c-text-3)' }}>To</span>
                <span style={{ fontWeight: 500 }}>{service.toLocation}</span>
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--c-text-3)' }}>Base Fare</span>
                <span>₹{selectedService.price.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--c-text-3)' }}>GST (18%)</span>
                <span>₹{selectedService.gst.toFixed(2)}</span>
              </div>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.071rem' }}>
                <span>Total</span>
                <span style={{ color: 'var(--c-navy)' }}>₹{selectedService.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment mode */}
          <Field label="Payment Mode">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PAYMENT_MODES.map(m => (
                <button
                  key={m.value}
                  type="button"
                  className={`service-card${service.paymentMode === m.value ? ' selected' : ''}`}
                  style={{ padding: '12px 14px' }}
                  onClick={() => setS('paymentMode', m.value)}
                >
                  <div className="service-card-name" style={{ fontSize: '0.871rem' }}>{m.label}</div>
                  <div className="service-card-desc">{m.desc}</div>
                </button>
              ))}
            </div>
          </Field>

          {errors.submit && <div className="alert alert-error">{errors.submit}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
            <button
              className="btn btn-primary btn-lg"
              style={{ flex: 1 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <><span className="spinner" style={{ borderTopColor: '#fff' }} /> Processing…</>
                : `Confirm Booking · ₹${selectedService.total.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Confirmation ────────────────────────────────────────── */}
      {step === 3 && (
        <div className="card" style={{ textAlign: 'center', padding: '44px 32px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--c-success-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.857rem', margin: '0 auto 20px',
          }}>✓</div>
          <h2 style={{ marginBottom: 8 }}>Booking Confirmed</h2>
          <p style={{ color: 'var(--c-text-2)', fontSize: '0.929rem', marginBottom: 28 }}>
            Your porter request has been placed. A licensed porter will accept shortly.
          </p>

          {booking && (
            <div style={{
              background: 'var(--c-bg)', borderRadius: 10,
              padding: '18px 22px', marginBottom: 28, textAlign: 'left',
              border: '1px solid var(--c-border-lite)',
            }}>
              <div style={{ fontSize: '0.743rem', color: 'var(--c-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Booking Reference</div>
              <div style={{ fontWeight: 800, fontSize: '1.286rem', color: 'var(--c-navy)', fontFamily: 'monospace', letterSpacing: '0.05em', marginBottom: 14 }}>
                {booking.bookingReference || booking.bookingId || `R1PRT${Date.now().toString().slice(-6)}`}
              </div>
              {booking.servicePin && (
                <>
                  <div style={{ fontSize: '0.743rem', color: 'var(--c-text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Verification PIN</div>
                  <div style={{ fontWeight: 800, fontSize: '2rem', color: 'var(--c-teal)', letterSpacing: '0.3em' }}>{booking.servicePin}</div>
                  <p style={{ fontSize: '0.786rem', color: 'var(--c-text-3)', marginTop: 6, lineHeight: 1.5 }}>
                    Share this PIN with your porter to start the service. Do not share with anyone else.
                  </p>
                </>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={() => navigate('/user/bookings')}>View My Bookings</button>
            <button className="btn btn-primary" onClick={resetForm}>Book Again</button>
          </div>
        </div>
      )}
    </div>
  );
}
