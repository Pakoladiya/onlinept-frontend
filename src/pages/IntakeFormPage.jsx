import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageTransition, Reveal } from '../components/layout/LuxeMotion';
import {
  User, Phone, Mail, Activity,
  Stethoscope, ArrowLeft, ArrowRight,
  Loader2, Lock, ChevronDown, Zap
} from 'lucide-react';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

/* ─── Quick-select Chip ─────────────────────────────────────── */
const Chip = ({ label, selected, onClick, color }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '10px 18px', borderRadius: 100, border: `2px solid ${selected ? color : 'rgba(255,255,255,0.1)'}`,
      background: selected ? `${color}20` : 'rgba(255,255,255,0.03)',
      color: selected ? color : '#94A3B8', fontSize: 13, fontWeight: 700,
      cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
      transform: selected ? 'scale(1.04)' : 'scale(1)',
    }}
  >
    {label}
  </button>
);

/* ─── Condition Checkbox ────────────────────────────────────── */
const ConditionBox = ({ label, checked, onChange, color }) => (
  <label style={{
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
    borderRadius: 14, border: `2px solid ${checked ? color : 'rgba(255,255,255,0.08)'}`,
    background: checked ? `${color}15` : 'rgba(255,255,255,0.02)',
    cursor: 'pointer', transition: 'all 0.2s',
  }}>
    <div style={{
      width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? color : '#475569'}`,
      background: checked ? color : 'transparent', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s',
    }}>
      {checked && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>✓</span>}
    </div>
    <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
    <span style={{ fontSize: 13, fontWeight: 600, color: checked ? color : '#94A3B8' }}>{label}</span>
  </label>
);

/* ─── Floating Label Input ──────────────────────────────────── */
const LuxeInput = ({ label, icon: Icon, value, onChange, type = 'text', required, color, rows }) => {
  const [focused, setFocused] = useState(false);
  const isFloat = focused || (value && value.toString().length > 0);
  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: 20 }}>
      <div style={{
        position: 'relative', background: focused ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
        borderRadius: 18, border: `2px solid ${focused ? color : 'rgba(255,255,255,0.08)'}`,
        transition: 'all 0.3s', padding: '32px 18px 12px 18px',
      }}>
        {Icon && <div style={{ position: 'absolute', left: 16, top: 28, color: focused ? color : '#64748B' }}><Icon size={18} /></div>}
        <label style={{
          position: 'absolute', left: Icon ? 48 : 20, top: isFloat ? 10 : 28,
          fontSize: isFloat ? 10 : 15, fontWeight: isFloat ? 800 : 500,
          color: isFloat ? color : '#94A3B8', textTransform: isFloat ? 'uppercase' : 'none',
          letterSpacing: isFloat ? '1.2px' : '0', transition: 'all 0.2s', pointerEvents: 'none',
        }}>{label}{required && ' *'}</label>
        {rows ? (
          <textarea value={value} onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} rows={rows}
            style={{ width: '100%', paddingLeft: Icon ? 30 : 0, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 15, fontWeight: 500, fontFamily: 'inherit', resize: 'none' }} />
        ) : (
          <input value={value} onChange={e => onChange(e.target.value)} type={type}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={{ width: '100%', paddingLeft: Icon ? 30 : 0, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 16, fontWeight: 600 }} />
        )}
      </div>
    </div>
  );
};

/* ─── Section Card ──────────────────────────────────────────── */
const Card = ({ children, style = {} }) => (
  <div className="glass-card" style={{ padding: '32px', marginBottom: 24, ...style }}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, title, subtitle, color, optional }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span style={{ fontSize: 17, fontWeight: 800, color: '#F8FAFC' }}>{title}</span>
      </div>
      {optional && (
        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.06)' }}>
          Optional
        </span>
      )}
    </div>
    {subtitle && <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, marginLeft: 46 }}>{subtitle}</p>}
  </div>
);

/* ─── Data ──────────────────────────────────────────────────── */
const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const AGE_RANGES = ['Under 18', '18–25', '26–35', '36–45', '46–55', '56–65', '65+'];

const DURATION_OPTIONS = ['< 1 week', '1–2 weeks', '2–4 weeks', '1–3 months', '3–6 months', '6–12 months', '> 1 year'];

const CONDITIONS = [
  'Hypertension', 'Diabetes (Type 1)', 'Diabetes (Type 2)',
  'Heart Disease', 'Asthma / COPD', 'Thyroid Disorder',
  'Osteoporosis', 'Arthritis', 'Obesity', 'Kidney Disease',
  'Cancer (current/history)', 'Neurological Disorder', 'None of the above',
];

const PAIN_AREAS = [
  'Neck', 'Shoulder', 'Elbow', 'Wrist / Hand', 'Upper Back',
  'Lower Back', 'Hip', 'Knee', 'Ankle / Foot', 'Full Body / Generalized',
];

const MEETING_PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp Video', icon: Phone },
  { id: 'zoom', label: 'Zoom Meeting', icon: Activity },
  { id: 'google_meet', label: 'Google Meet', icon: Mail },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function IntakeFormPage() {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialData = location.state || {};

  if (Object.keys(initialData).length === 0 && !bookingId) {
    navigate('/'); return null;
  }

  const [loading, setLoading] = useState(false);
  const [clinicData, setClinicData] = useState(null);
  const [errors, setErrors] = useState({});

  const [intakeData, setIntakeData] = useState({
    personalInfo: {
      fullName:   initialData.patientName  || '',
      email:      initialData.patientEmail || '',
      whatsapp:   initialData.patientPhone || '',
      age:        '',
      gender:     '',
      occupation: '',
    },
    clinicalInfo: {
      painAreas:          [],       // multi-select chips
      primaryComplaint:   initialData.complaints || '',
      duration:           '',
      vasScore:           5,
      conditions:         [],       // multi-select checkboxes
      previousTreatment:  '',
      preferredPlatform:  'whatsapp', // default
    },
  });

  useEffect(() => {
    if (initialData.clinicId) {
      getDoc(doc(db, 'clinics', initialData.clinicId))
        .then(snap => { if (snap.exists()) setClinicData(snap.data()); });
    }
  }, [initialData.clinicId]);

  const pColor = clinicData?.primaryColor || clinicData?.settings?.primaryColor || '#007AFF';

  /* helpers */
  const setPersonal = (field, val) => {
    setIntakeData(p => ({ ...p, personalInfo: { ...p.personalInfo, [field]: val } }));
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  };
  const setClinical = (field, val) => {
    setIntakeData(p => ({ ...p, clinicalInfo: { ...p.clinicalInfo, [field]: val } }));
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  };
  const toggleChipList = (field, item) => {
    setClinical(field, intakeData.clinicalInfo[field].includes(item)
      ? intakeData.clinicalInfo[field].filter(x => x !== item)
      : [...intakeData.clinicalInfo[field], item]);
  };

  /* validation — only required: name, whatsapp, complaint */
  const validate = () => {
    const e = {};
    if (!intakeData.personalInfo.fullName.trim()) e.fullName = 'Full name is required';
    if (!intakeData.personalInfo.whatsapp.trim()) e.whatsapp = 'WhatsApp number is required';
    if (!intakeData.clinicalInfo.primaryComplaint.trim()) e.primaryComplaint = 'Please describe your main complaint';
    setErrors(e);
    if (Object.keys(e).length > 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    return Object.keys(e).length === 0;
  };

  const handleNext = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    navigate(`/payment/${bookingId}`, {
      state: { ...initialData, intakeData, clinicName: clinicData?.clinicName || initialData.clinicName },
    });
  };

  const VAS_EMOJI = v => v <= 2 ? '😊' : v <= 4 ? '😐' : v <= 6 ? '😟' : v <= 8 ? '😣' : '😫';
  const vasColor  = v => v <= 2 ? '#22c55e' : v <= 4 ? '#84cc16' : v <= 6 ? '#eab308' : v <= 8 ? '#f97316' : '#ef4444';

  /* ── RENDER ── */
  return (
    <PageTransition>
      <div style={{ background: '#0D1117', color: '#F8FAFC', minHeight: '100vh', fontFamily: "'Manrope', sans-serif" }}>

        {/* Background glow using clinic color */}
        <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(ellipse at 70% 10%, ${pColor}18 0%, transparent 55%)`, pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 780, margin: '0 auto', padding: '48px 16px 120px' }}>

          {/* Back */}
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, cursor: 'pointer', color: '#64748B', width: 'fit-content' }} onClick={() => navigate(-1)}>
              <ArrowLeft size={16} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Back</span>
            </div>
          </Reveal>

          {/* Header */}
          <Reveal delay={0.05}>
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100, background: `${pColor}15`, border: `1px solid ${pColor}30`, fontSize: 11, fontWeight: 800, color: pColor, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16 }}>
                <Stethoscope size={13} /> Clinical Intake
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                Tell us about your <span style={{ color: pColor }}>condition</span>
              </h1>
              <p style={{ color: '#64748B', marginTop: 12, fontSize: 14, lineHeight: 1.6 }}>
                Only <strong style={{ color: '#94A3B8' }}>Name, WhatsApp & Complaint</strong> are required. All other fields are optional — tap to fill, skip to continue.
              </p>
            </div>
          </Reveal>

          <form onSubmit={handleNext}>

            {/* ── 1. Personal Info ── */}
            <Reveal delay={0.1}>
              <Card>
                <SectionTitle icon={User} title="Personal Details" color={pColor} />

                {/* Full Name */}
                <LuxeInput label="Full Name" icon={User} value={intakeData.personalInfo.fullName}
                  onChange={v => setPersonal('fullName', v)} color={pColor} required />
                {errors.fullName && <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 700, marginTop: -12, marginBottom: 16 }}>{errors.fullName}</p>}

                {/* WhatsApp + Email row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div>
                    <LuxeInput label="WhatsApp Number" icon={Phone} value={intakeData.personalInfo.whatsapp}
                      onChange={v => setPersonal('whatsapp', v)} color={pColor} required type="tel" />
                    {errors.whatsapp && <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 700, marginTop: -12, marginBottom: 16 }}>{errors.whatsapp}</p>}
                  </div>
                  <LuxeInput label="Email (optional)" icon={Mail} value={intakeData.personalInfo.email}
                    onChange={v => setPersonal('email', v)} color={pColor} type="email" />
                </div>

                {/* Gender chips */}
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>Sex <span style={{ color: '#475569', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {GENDER_OPTIONS.map(g => (
                      <Chip key={g} label={g} color={pColor}
                        selected={intakeData.personalInfo.gender === g}
                        onClick={() => setPersonal('gender', intakeData.personalInfo.gender === g ? '' : g)} />
                    ))}
                  </div>
                </div>

                {/* Age dropdown */}
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12 }}>Age Group <span style={{ color: '#475569', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></p>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={intakeData.personalInfo.age}
                      onChange={e => setPersonal('age', e.target.value)}
                      style={{
                        width: '100%', padding: '14px 44px 14px 18px', borderRadius: 16,
                        background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.08)',
                        color: intakeData.personalInfo.age ? '#F8FAFC' : '#64748B',
                        fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
                        outline: 'none', appearance: 'none', cursor: 'pointer',
                      }}
                    >
                      <option value="">Select age group…</option>
                      {AGE_RANGES.map(a => <option key={a} value={a} style={{ background: '#1E293B' }}>{a}</option>)}
                    </select>
                    <ChevronDown size={16} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
                  </div>
                </div>
              </Card>
            </Reveal>

            {/* ── 2. Pain Area chips ── */}
            <Reveal delay={0.15}>
              <Card>
                <SectionTitle icon={Activity} title="Pain / Problem Area" color={pColor} subtitle="Tap all that apply" optional />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {PAIN_AREAS.map(area => (
                    <Chip key={area} label={area} color={pColor}
                      selected={intakeData.clinicalInfo.painAreas.includes(area)}
                      onClick={() => toggleChipList('painAreas', area)} />
                  ))}
                </div>
              </Card>
            </Reveal>

            {/* ── 3. Main Complaint ── */}
            <Reveal delay={0.2}>
              <Card>
                <SectionTitle icon={Stethoscope} title="Chief Complaint" color={pColor} subtitle="Required — describe what's bothering you most" />
                <LuxeInput label="Describe your main complaint…" rows={3}
                  value={intakeData.clinicalInfo.primaryComplaint}
                  onChange={v => setClinical('primaryComplaint', v)} color={pColor} required />
                {errors.primaryComplaint && <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 700, marginTop: -12, marginBottom: 8 }}>{errors.primaryComplaint}</p>}

                {/* Duration chips */}
                <p style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 12, marginTop: 8 }}>
                  How long? <span style={{ color: '#475569', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {DURATION_OPTIONS.map(d => (
                    <Chip key={d} label={d} color={pColor}
                      selected={intakeData.clinicalInfo.duration === d}
                      onClick={() => setClinical('duration', intakeData.clinicalInfo.duration === d ? '' : d)} />
                  ))}
                </div>
              </Card>
            </Reveal>

            {/* ── 4. Pain Score ── */}
            <Reveal delay={0.25}>
              <Card style={{ textAlign: 'center' }}>
                <SectionTitle icon={Activity} title="Pain Intensity" color={pColor} subtitle="How bad is the pain right now?" optional />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 52, lineHeight: 1 }}>{VAS_EMOJI(intakeData.clinicalInfo.vasScore)}</div>
                  <div style={{ fontSize: 56, fontWeight: 900, color: vasColor(intakeData.clinicalInfo.vasScore), textShadow: `0 0 40px ${vasColor(intakeData.clinicalInfo.vasScore)}40` }}>
                    {intakeData.clinicalInfo.vasScore}<span style={{ fontSize: 20, color: '#475569' }}>/10</span>
                  </div>
                  <input type="range" min="0" max="10"
                    value={intakeData.clinicalInfo.vasScore}
                    onChange={e => setClinical('vasScore', +e.target.value)}
                    style={{ width: '100%', maxWidth: 380, height: 8, borderRadius: 10, appearance: 'none', background: 'linear-gradient(to right, #22C55E, #EAB308, #EF4444)', cursor: 'pointer' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 380, fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    <span>No Pain</span><span>Moderate</span><span>Severe</span>
                  </div>
                </div>
              </Card>
            </Reveal>

            {/* ── 5. Pre-existing Conditions ── */}
            <Reveal delay={0.3}>
              <Card>
                <SectionTitle icon={Activity} title="Pre-existing Conditions" color={pColor} subtitle="Select all that apply" optional />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {CONDITIONS.map(c => (
                    <ConditionBox key={c} label={c} color={pColor}
                      checked={intakeData.clinicalInfo.conditions.includes(c)}
                      onChange={() => toggleChipList('conditions', c)} />
                  ))}
                </div>
              </Card>
            </Reveal>

            {/* ── 6. Previous Treatment ── */}
            <Reveal delay={0.35}>
              <Card>
                <SectionTitle icon={Stethoscope} title="Previous Treatment" color={pColor} subtitle="Any treatments taken before for this issue?" optional />
                <LuxeInput label="e.g. Physiotherapy, medicines, surgery…" rows={2}
                  value={intakeData.clinicalInfo.previousTreatment}
                  onChange={v => setClinical('previousTreatment', v)} color={pColor} />
              </Card>
            </Reveal>

            {/* ── 7. Preferred Platform ── */}
            <Reveal delay={0.38}>
              <Card>
                <SectionTitle icon={Zap} title="Preferred Meeting Platform" color={pColor} subtitle="Where would you prefer to have the video consultation?" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  {MEETING_PLATFORMS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setClinical('preferredPlatform', p.id)}
                      style={{
                        padding: '20px 16px', borderRadius: 20, border: `2px solid ${intakeData.clinicalInfo.preferredPlatform === p.id ? pColor : 'rgba(255,255,255,0.06)'}`,
                        background: intakeData.clinicalInfo.preferredPlatform === p.id ? `${pColor}15` : 'rgba(255,255,255,0.02)',
                        color: intakeData.clinicalInfo.preferredPlatform === p.id ? pColor : '#94A3B8',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <p.icon size={24} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </Card>
            </Reveal>

            {/* ── Submit ── */}
            <Reveal delay={0.4}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569' }}>
                  <Lock size={14} />
                  <span style={{ fontSize: 12, fontWeight: 700 }}>HIPAA · End-to-End Encrypted</span>
                </div>
                <button type="submit" disabled={loading} className="glow-button"
                  style={{
                    height: 60, padding: '0 40px', background: pColor, color: '#FFF', border: 'none',
                    borderRadius: 20, fontSize: 16, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.3s',
                    boxShadow: `0 16px 40px ${pColor}40`, opacity: loading ? 0.7 : 1,
                  }}>
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <>Continue to Payment <ArrowRight size={20} /></>}
                </button>
              </div>
            </Reveal>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
