import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clinicConfig from '@/config/clinicConfig';
import {
  CheckCircle2, Loader2, ChevronRight, ChevronLeft,
  Clock, Phone, Mail, User, Calendar, MessageSquare,
  Star, Award, Users, SunMedium, Sunset, Moon,
} from 'lucide-react';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  primary: '#0D7377',
  primaryDark: '#0A5C5F',
  primaryLight: '#E8F5F5',
  accent: '#14A3A8',
  surface: '#F5F7FA',
  surface2: '#E8F0F0',
  white: '#FFFFFF',
  ink: '#1D1D1F',
  ink2: '#3A3A3C',
  ink3: '#636366',
  ink4: '#AEAEB2',
  border: 'rgba(13,115,119,0.12)',
  glass: 'rgba(255,255,255,0.90)',
  green: '#34C759',
  red: '#FF3B30',
  shadowSm: '0 2px 8px rgba(13,115,119,0.08)',
  shadowMd: '0 8px 24px rgba(13,115,119,0.12)',
  shadowLg: '0 20px 60px rgba(13,115,119,0.16)',
  r: { sm: 12, md: 16, lg: 24, xl: 32 },
};

// ─── Floating Input ────────────────────────────────────────────────────────────
function FloatingInput({ label, type = 'text', value, onChange, required, placeholder, icon: Icon, options, rows }) {
  const [focused, setFocused] = useState(false);
  const hasValue = value && value.length > 0;

  const inputStyle = {
    width: '100%', padding: '22px 18px 8px',
    background: T.white,
    border: `1.5px solid ${focused ? T.primary : T.border}`,
    borderRadius: T.r.sm,
    fontSize: 16, fontFamily: "'DM Sans', sans-serif",
    color: T.ink, outline: 'none',
    boxShadow: focused ? `0 0 0 3px rgba(13,115,119,0.10)` : T.shadowSm,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    appearance: type === 'select-one' ? 'none' : 'text',
  };

  if (type === 'textarea') {
    return (
      <div style={{ position: 'relative' }}>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={rows || 3}
          style={{ ...inputStyle, paddingTop: 28, resize: 'none' }}
        />
        <label style={{
          position: 'absolute', left: 18, top: hasValue || focused ? 10 : 18,
          fontSize: hasValue || focused ? 11 : 15,
          fontWeight: hasValue || focused ? 600 : 400,
          color: focused ? T.primary : T.ink3,
          pointerEvents: 'none',
          transition: 'all 0.2s',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {label} {required && <span style={{ color: T.red }}>*</span>}
        </label>
        {Icon && <Icon size={16} style={{ position: 'absolute', right: 16, top: 16, color: T.ink3, pointerEvents: 'none' }} />}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {Icon && (
        <Icon size={16} style={{
          position: 'absolute', left: 16,
          top: hasValue || focused ? 18 : 20,
          color: focused ? T.primary : T.ink3,
          pointerEvents: 'none',
          transition: 'top 0.2s, color 0.2s',
          zIndex: 1,
        }} />
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...inputStyle, paddingLeft: Icon ? 44 : 18 }}
      />
      <label style={{
        position: 'absolute', left: Icon ? 44 : 18,
        top: hasValue || focused ? 10 : 18,
        fontSize: hasValue || focused ? 11 : 15,
        fontWeight: hasValue || focused ? 600 : 400,
        color: focused ? T.primary : T.ink3,
        pointerEvents: 'none',
        transition: 'all 0.2s',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {label} {required && <span style={{ color: T.red }}>*</span>}
      </label>
    </div>
  );
}

// ─── Time Slot Chip ────────────────────────────────────────────────────────────
function TimeChip({ label, icon: Icon, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, padding: '14px 8px',
        background: selected ? `linear-gradient(135deg, ${T.primary}, ${T.accent})` : T.white,
        color: selected ? T.white : T.ink2,
        border: `1.5px solid ${selected ? T.primary : T.border}`,
        borderRadius: T.r.sm,
        cursor: 'pointer', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        fontFamily: "'DM Sans', sans-serif",
        transition: 'all 0.2s',
        boxShadow: selected ? `0 4px 16px rgba(13,115,119,0.30)` : T.shadowSm,
        transform: selected ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <Icon size={20} />
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
    </button>
  );
}

// ─── Trust Strip ───────────────────────────────────────────────────────────────
function TrustStrip() {
  const items = [
    { icon: Award, label: '10+ Years Experience' },
    { icon: Users, label: '500+ Patients' },
    { icon: Star, label: 'Expert Team' },
    { icon: Clock, label: 'Flexible Timings' },
  ];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
      background: T.primaryLight,
      borderRadius: T.r.md, padding: 20,
      marginTop: 20,
    }}>
      {items.map(({ icon: Icon, label }) => (
        <div key={label} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          textAlign: 'center',
        }}>
          <Icon size={22} style={{ color: T.primary }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: T.primary, lineHeight: 1.3 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Success Card ─────────────────────────────────────────────────────────────
function SuccessCard({ form }) {
  return (
    <div style={{
      animation: 'scaleIn 0.4s ease both',
      textAlign: 'center', padding: '32px 20px',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'linear-gradient(135deg, #34C759, #30B350)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
        boxShadow: '0 8px 30px rgba(52,199,89,0.40)',
        animation: 'popIn 0.5s 0.2s ease both',
      }}>
        <CheckCircle2 size={40} color="white" />
      </div>
      <h3 style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: 22, fontWeight: 800, color: T.ink, marginBottom: 8,
      }}>Appointment Requested!</h3>
      <p style={{ fontSize: 14, color: T.ink3, lineHeight: 1.6, marginBottom: 20 }}>
        We've received your booking request for <strong>{form.service}</strong>.<br />
        Our team will confirm your appointment via phone within 2 hours.
      </p>
      <div style={{
        background: T.primaryLight, borderRadius: T.r.sm, padding: 14,
        display: 'inline-block',
      }}>
        <p style={{ fontSize: 12, color: T.ink3 }}>
          <strong style={{ color: T.primary }}>{form.name}</strong> · {form.phone}<br />
          {form.date} · {form.slot}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BookingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    service: clinicConfig.services[0]?.name || 'Physiotherapy',
    date: '', slot: '', message: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = `Book Appointment | ${clinicConfig.clinicName}`;
  }, []);

  // Min date = today
  const today = new Date().toISOString().split('T')[0];

  const slots = [
    { id: 'morning', label: 'Morning', icon: SunMedium, time: '9AM – 12PM' },
    { id: 'afternoon', label: 'Afternoon', icon: Sunset, time: '12PM – 5PM' },
    { id: 'evening', label: 'Evening', icon: Moon, time: '5PM – 9PM' },
  ];

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Please enter your full name';
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) e.phone = 'Please enter a valid 10-digit phone number';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Please enter a valid email address';
    if (!form.date) e.date = 'Please select a preferred date';
    if (!form.slot) e.slot = 'Please select a time preference';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    const mockBookingId = `BK-${Date.now().toString().slice(-6)}`;
    navigate(`/intake/${mockBookingId}`, {
      state: {
        date: form.date,
        slot: form.slot,
        serviceName: form.service,
      },
    });
  };

  return (
    <div style={{
      minHeight: '100vh', background: T.white,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;1,9..40,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes popIn { 0% { transform: scale(0); } 70% { transform: scale(1.1); } 100% { transform: scale(1); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        input:focus, textarea:focus { border-color: ${T.primary} !important; }
        @media (max-width: 768px) {
          .trust-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .form-row { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: T.glass, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${T.border}`,
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 17, color: T.ink }}>
            {clinicConfig.clinicName}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <a href={`tel:${clinicConfig.contactPhone}`} style={{
            fontSize: 13, fontWeight: 600, color: T.primary,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Phone size={14} /> {clinicConfig.contactPhone}
          </a>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(160deg, ${T.white} 0%, ${T.primaryLight} 60%, ${T.white} 100%)`,
        padding: '48px 24px 40px',
        textAlign: 'center',
        animation: 'fadeUp 0.5s ease both',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: T.primaryLight, border: `1px solid ${T.border}`,
          borderRadius: 100, padding: '4px 14px 4px 6px',
          fontSize: 12, fontWeight: 600, color: T.primary, marginBottom: 20,
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.white, fontSize: 10,
          }}>✓</div>
          Book in Under 2 Minutes
        </div>

        <h1 style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800,
          color: T.ink, letterSpacing: '-1px', lineHeight: 1.1,
          marginBottom: 12,
        }}>
          Book Your
          <span style={{
            color: T.primary,
            display: 'block',
          }}>Appointment</span>
        </h1>
        <p style={{
          fontSize: 16, color: T.ink3, maxWidth: 480, margin: '0 auto',
          lineHeight: 1.6,
        }}>
          Expert physiotherapy consultations tailored to your needs. Available for online and in-person sessions.
        </p>
      </div>

      {/* ── Form ─────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 560, margin: '0 auto', padding: '0 24px 60px',
      }}>
        <div style={{
          background: T.white,
          borderRadius: T.r.lg,
          boxShadow: T.shadowLg,
          border: `1px solid ${T.border}`,
          padding: 32,
          animation: 'fadeUp 0.6s 0.1s ease both',
        }}>
          {submitted ? (
            <SuccessCard form={form} />
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Name */}
                <FloatingInput
                  label="Full Name" icon={User} value={form.name}
                  onChange={v => { setForm({ ...form, name: v }); setErrors({ ...errors, name: '' }); }}
                  required placeholder="Arun Patel"
                  error={errors.name}
                />
                {errors.name && (
                  <p style={{ fontSize: 11, color: T.red, marginTop: -12, fontWeight: 500 }}>{errors.name}</p>
                )}

                {/* Phone */}
                <FloatingInput
                  label="Phone Number" icon={Phone} type="tel" value={form.phone}
                  onChange={v => { setForm({ ...form, phone: v }); setErrors({ ...errors, phone: '' }); }}
                  required placeholder="98765 43210"
                  error={errors.phone}
                />
                {errors.phone && (
                  <p style={{ fontSize: 11, color: T.red, marginTop: -12, fontWeight: 500 }}>{errors.phone}</p>
                )}

                {/* Email */}
                <FloatingInput
                  label="Email Address" icon={Mail} type="email" value={form.email}
                  onChange={v => { setForm({ ...form, email: v }); setErrors({ ...errors, email: '' }); }}
                  required placeholder="arun@example.com"
                  error={errors.email}
                />
                {errors.email && (
                  <p style={{ fontSize: 11, color: T.red, marginTop: -12, fontWeight: 500 }}>{errors.email}</p>
                )}

                {/* Service */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{
                      position: 'absolute', left: 16, top: 18,
                      color: T.ink3, pointerEvents: 'none', zIndex: 1,
                    }} />
                    <select
                      value={form.service}
                      onChange={e => setForm({ ...form, service: e.target.value })}
                      style={{
                        width: '100%', padding: '22px 18px 8px',
                        background: T.white,
                        border: `1.5px solid ${T.border}`,
                        borderRadius: T.r.sm,
                        fontSize: 16, fontFamily: "'DM Sans', sans-serif",
                        color: T.ink, outline: 'none',
                        paddingLeft: 44,
                        appearance: 'none', cursor: 'pointer',
                      }}
                    >
                      {clinicConfig.services.map(s => (
                        <option key={s.id} value={s.name}>{s.name} — ₹{s.price}</option>
                      ))}
                    </select>
                    <label style={{
                      position: 'absolute', left: 44, top: form.service ? 10 : 18,
                      fontSize: form.service ? 11 : 15,
                      fontWeight: form.service ? 600 : 400,
                      color: T.ink3, pointerEvents: 'none',
                      transition: 'all 0.2s',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>Select Service</label>
                    <ChevronRight size={16} style={{
                      position: 'absolute', right: 16, top: 20,
                      color: T.ink3, pointerEvents: 'none', transform: 'rotate(90deg)',
                    }} />
                  </div>
                </div>

                {/* Date */}
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{
                    position: 'absolute', left: 16, top: 18,
                    color: T.ink3, pointerEvents: 'none', zIndex: 1,
                  }} />
                  <input
                    type="date"
                    value={form.date}
                    min={today}
                    onChange={e => { setForm({ ...form, date: e.target.value }); setErrors({ ...errors, date: '' }); }}
                    style={{
                      width: '100%', padding: '22px 18px 8px',
                      background: T.white,
                      border: `1.5px solid ${errors.date ? T.red : (form.date ? T.primary : T.border)}`,
                      borderRadius: T.r.sm,
                      fontSize: 16, fontFamily: "'DM Sans', sans-serif",
                      color: T.ink, outline: 'none',
                      paddingLeft: 44,
                      boxShadow: errors.date ? `0 0 0 3px rgba(255,59,48,0.10)` : (form.date ? `0 0 0 3px rgba(13,115,119,0.10)` : 'none'),
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                  />
                  <label style={{
                    position: 'absolute', left: 44, top: form.date ? 10 : 18,
                    fontSize: form.date ? 11 : 15,
                    fontWeight: form.date ? 600 : 400,
                    color: errors.date ? T.red : (form.date ? T.primary : T.ink3),
                    pointerEvents: 'none',
                    transition: 'all 0.2s',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>Preferred Date <span style={{ color: T.red }}>*</span></label>
                </div>
                {errors.date && (
                  <p style={{ fontSize: 11, color: T.red, marginTop: -12, fontWeight: 500 }}>{errors.date}</p>
                )}

                {/* Time Slot */}
                <div>
                  <label style={{
                    display: 'block', fontSize: 12, fontWeight: 600,
                    color: T.ink2, marginBottom: 10, letterSpacing: '0.2px',
                  }}>
                    Preferred Time Slot <span style={{ color: T.red }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {slots.map(s => (
                      <TimeChip
                        key={s.id}
                        label={s.label}
                        icon={s.icon}
                        selected={form.slot === s.id}
                        onClick={() => { setForm({ ...form, slot: s.id }); setErrors({ ...errors, slot: '' }); }}
                      />
                    ))}
                  </div>
                  {form.slot && (
                    <p style={{ fontSize: 11, color: T.ink3, marginTop: 6, textAlign: 'center' }}>
                      {slots.find(s => s.id === form.slot)?.time}
                    </p>
                  )}
                  {errors.slot && (
                    <p style={{ fontSize: 11, color: T.red, marginTop: 6, fontWeight: 500 }}>{errors.slot}</p>
                  )}
                </div>

                {/* Message */}
                <FloatingInput
                  label="Chief Complaint / Message (optional)" icon={MessageSquare}
                  type="textarea" value={form.message} rows={3}
                  onChange={v => setForm({ ...form, message: v })}
                  placeholder="Describe your symptoms or reason for consultation..."
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', height: 54, marginTop: 24,
                  background: loading
                    ? `linear-gradient(135deg, ${T.primary}CC, ${T.accent}CC)`
                    : `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
                  color: T.white, border: 'none', borderRadius: T.r.md,
                  fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: `0 4px 20px rgba(13,115,119,0.35)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'transform 0.15s, box-shadow 0.15s, background 0.15s',
                }}
                onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Processing...</>
                ) : (
                  <>Book Appointment <ChevronRight size={18} /></>
                )}
              </button>

              <p style={{ fontSize: 11, color: T.ink4, textAlign: 'center', marginTop: 12 }}>
                No payment required now · We'll call to confirm
              </p>
            </form>
          )}
        </div>

        {/* Trust Strip */}
        {!submitted && <TrustStrip />}

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a href="/" style={{ fontSize: 13, color: T.ink3, textDecoration: 'none', fontWeight: 500 }}>
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
