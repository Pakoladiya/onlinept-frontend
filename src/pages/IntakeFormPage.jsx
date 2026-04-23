import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageTransition, Reveal } from '../components/layout/LuxeMotion';
import { 
  User, Phone, Mail, MapPin, Activity, 
  Stethoscope, Clock, ChevronRight, ArrowLeft, ArrowRight,
  Loader2, CheckCircle2, Shield, Lock, Sparkles
} from 'lucide-react';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const T = {
  bg: '#121212',
  ink: '#F8FAFC',
  ink2: '#94A3B8',
  glass: 'rgba(30, 41, 59, 0.4)',
  border: 'rgba(255, 255, 255, 0.08)',
};

const SectionHeader = ({ title, icon: Icon, color }) => (
  <div style={{ marginBottom: 32 }}>
    <div style={{
       display: 'inline-flex', alignItems: 'center', gap: 10,
       padding: '10px 18px', borderRadius: 100, background: `${color || '#007AFF'}15`,
       color: color || '#007AFF', marginBottom: 16, border: `1px solid ${color || '#007AFF'}25`,
       fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px'
    }}>
      {Icon && <Icon size={14} />} {title}
    </div>
  </div>
);

const LuxeInput = ({ label, icon: Icon, value, onChange, type = 'text', required, color, rows }) => {
  const [focused, setFocused] = useState(false);
  const isFloat = focused || (value && value.toString().length > 0);

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: 20 }}>
       <div style={{
          position: 'relative', background: focused ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
          borderRadius: 18, border: `2px solid ${focused ? color : 'rgba(255,255,255,0.08)'}`,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', padding: rows ? '32px 18px 12px 18px' : '32px 18px 12px 18px'
       }}>
          {Icon && <div style={{ position: 'absolute', left: 16, top: 28, color: focused ? color : '#64748B' }}><Icon size={18} /></div>}
          <label style={{
             position: 'absolute', left: Icon ? 48 : 20, top: isFloat ? 10 : 28,
             fontSize: isFloat ? 10 : 15, fontWeight: isFloat ? 800 : 500,
             color: isFloat ? color : '#94A3B8', textTransform: isFloat ? 'uppercase' : 'none', letterSpacing: isFloat ? '1.2px' : '0',
             transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', pointerEvents: 'none'
          }}>{label}{required && '*'}</label>
          
          {rows ? (
             <textarea value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} rows={rows}
               style={{ width: '100%', paddingLeft: Icon ? 30 : 0, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 15, fontWeight: 500, fontFamily: 'inherit', resize: 'none' }} />
          ) : (
             <input value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} type={type}
               style={{ width: '100%', paddingLeft: Icon ? 30 : 0, background: 'transparent', border: 'none', outline: 'none', color: '#F8FAFC', fontSize: 16, fontWeight: 600 }} />
          )}
       </div>
    </div>
  );
}

export default function IntakeFormPage() {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialData = location.state || {};

  if (Object.keys(initialData).length === 0 && !bookingId) {
    navigate('/');
    return null;
  }

  const [loading, setLoading] = useState(false);
  const [clinicData, setClinicData] = useState(null);
  const [intakeData, setIntakeData] = useState({
    personalInfo: {
      fullName: initialData.patientName || '',
      email: initialData.patientEmail || '',
      whatsapp: initialData.patientPhone || '',
      age: '', gender: '', occupation: ''
    },
    clinicalInfo: {
      primaryComplaint: initialData.complaints || '',
      duration: '',
      medicalHistory: '',
      previousTreatment: ''
    }
  });

  useEffect(() => {
    async function fetchClinic() {
      if (initialData.clinicId) {
        const snap = await getDoc(doc(db, 'clinics', initialData.clinicId));
        if (snap.exists()) setClinicData(snap.data());
      }
    }
    fetchClinic();
  }, [initialData.clinicId]);

  const pColor = clinicData?.primaryColor || '#007AFF';

  const handleUpdate = (section, field, value) => {
    setIntakeData(p => ({ ...p, [section]: { ...p[section], [field]: value } }));
    if (errors[field]) setErrors(prev => {
      const n = { ...prev };
      delete n[field];
      return n;
    });
  };

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    const { personalInfo, clinicalInfo } = intakeData;
    
    if (!personalInfo.fullName) newErrors.fullName = 'Full name is required';
    if (!personalInfo.age) newErrors.age = 'Age is required';
    if (!personalInfo.gender) newErrors.gender = 'Gender is required';
    if (!personalInfo.whatsapp) newErrors.whatsapp = 'WhatsApp number is required';
    if (!personalInfo.email) newErrors.email = 'Email is required';
    if (!clinicalInfo.primaryComplaint) newErrors.primaryComplaint = 'Please describe your complaint';
    if (!clinicalInfo.duration) newErrors.duration = 'Please specify duration';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    navigate(`/payment/${bookingId}`, { 
      state: { 
        ...initialData, 
        intakeData,
        clinicName: clinicData?.clinicName || initialData.clinicName
      } 
    });
  };

  const VAS_COLORS = ['#22c55e','#4ade80','#84cc16','#eab308','#f97316','#ef4444','#dc2626'];
  const getVasColor = (val) => {
    if (val <= 2) return VAS_COLORS[0];
    if (val <= 4) return VAS_COLORS[2];
    if (val <= 6) return VAS_COLORS[3];
    if (val <= 8) return VAS_COLORS[4];
    return VAS_COLORS[6];
  };

  return (
    <PageTransition>
      <div style={{ background: '#121212', color: '#F8FAFC', minHeight: '100vh', fontFamily: "'Manrope', sans-serif" }}>
        
        {/* Background Glow */}
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: `radial-gradient(circle at 80% 20%, ${pColor}10 0%, transparent 50%), radial-gradient(circle at 20% 80%, ${pColor}05 0%, transparent 50%)`, pointerEvents: 'none', zIndex: 0 }}></div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '60px 24px 120px' }}>
          
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, cursor: 'pointer', color: '#94A3B8' }} onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> <span style={{ fontSize: 14, fontWeight: 700 }}>Back to appointment</span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div style={{ marginBottom: 60 }}>
                <SectionHeader title="Clinical Intake Form" icon={Stethoscope} color={pColor} />
                <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1 }}>Help us understand your <span style={{ color: pColor }}>condition</span>.</h1>
                <p style={{ fontSize: 16, color: '#94A3B8', marginTop: 16, lineHeight: 1.6 }}>Please provide accurate details. This information is strictly confidential and used only for clinical assessment.</p>
            </div>
          </Reveal>

          <form onSubmit={handleNext}>
              <Reveal delay={0.2}>
                <div className="glass-card" style={{ padding: 40, marginBottom: 32 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <User size={20} style={{ color: pColor }} /> Personal Profile
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                      <LuxeInput label="Full Name" value={intakeData.personalInfo.fullName} onChange={v => handleUpdate('personalInfo', 'fullName', v)} color={pColor} icon={User} required />
                      <LuxeInput label="Age" type="number" value={intakeData.personalInfo.age} onChange={v => handleUpdate('personalInfo', 'age', v)} color={pColor} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                      <LuxeInput label="Gender" value={intakeData.personalInfo.gender} onChange={v => handleUpdate('personalInfo', 'gender', v)} color={pColor} required />
                      <LuxeInput label="Occupation" value={intakeData.personalInfo.occupation} onChange={v => handleUpdate('personalInfo', 'occupation', v)} color={pColor} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                      <LuxeInput label="WhatsApp Number" value={intakeData.personalInfo.whatsapp} onChange={v => handleUpdate('personalInfo', 'whatsapp', v)} color={pColor} icon={Phone} required />
                      <LuxeInput label="Email Address" value={intakeData.personalInfo.email} onChange={v => handleUpdate('personalInfo', 'email', v)} color={pColor} icon={Mail} required />
                  </div>
                  {Object.keys(errors).length > 0 && <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 700, marginTop: 16 }}>Please fill all required fields marked with *</p>}
                </div>
              </Reveal>

              <Reveal delay={0.25}>
                <div className="glass-card" style={{ padding: 40, marginBottom: 32, textAlign: 'center' }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                      <Activity size={20} style={{ color: pColor }} /> Pain Assessment
                  </h3>
                  <p style={{ color: '#94A3B8', fontSize: 14, marginBottom: 32 }}>On a scale of 0-10, how would you rate your pain right now?</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                    <div style={{ fontSize: 64, fontWeight: 900, color: getVasColor(intakeData.clinicalInfo.vasScore || 0), textShadow: `0 0 30px ${getVasColor(intakeData.clinicalInfo.vasScore || 0)}40` }}>
                      {intakeData.clinicalInfo.vasScore || 0}
                    </div>
                    <input 
                      type="range" min="0" max="10" 
                      value={intakeData.clinicalInfo.vasScore || 0}
                      onChange={e => handleUpdate('clinicalInfo', 'vasScore', parseInt(e.target.value))}
                      style={{ 
                        width: '100%', maxWidth: 400, height: 8, borderRadius: 10, appearance: 'none', 
                        background: `linear-gradient(to right, #22C55E, #EAB308, #EF4444)`, cursor: 'pointer'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 400, fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      <span>No Pain</span>
                      <span>Moderate</span>
                      <span>Worst</span>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.3}>
                <div className="glass-card" style={{ padding: 40, marginBottom: 48 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Activity size={20} style={{ color: pColor }} /> Clinical Background
                  </h3>
                  <LuxeInput label="Chief Complaint / Paining Area" rows={2} value={intakeData.clinicalInfo.primaryComplaint} onChange={v => handleUpdate('clinicalInfo', 'primaryComplaint', v)} color={pColor} required />
                  <LuxeInput label="How long have you had this issue?" value={intakeData.clinicalInfo.duration} onChange={v => handleUpdate('clinicalInfo', 'duration', v)} color={pColor} required />
                  <LuxeInput label="Relevant Medical History (BP, Diabetes, etc.)" value={intakeData.clinicalInfo.medicalHistory} onChange={v => handleUpdate('clinicalInfo', 'medicalHistory', v)} color={pColor} rows={3} />
                  <LuxeInput label="Any previous treatments taken for this?" value={intakeData.clinicalInfo.previousTreatment} onChange={v => handleUpdate('clinicalInfo', 'previousTreatment', v)} color={pColor} rows={2} />
                </div>
              </Reveal>

              <Reveal delay={0.4}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#64748B' }}>
                      <Lock size={16} /> <span style={{ fontSize: 13, fontWeight: 600 }}>End-to-End Encrypted</span>
                  </div>
                  <button type="submit" disabled={loading} className="glow-button" style={{ height: 64, padding: '0 40px', background: pColor, color: '#FFF', border: 'none', borderRadius: 20, fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.3s' }}>
                      {loading ? <Loader2 className="animate-spin" /> : <>Continue to Payment <ArrowRight size={20} /></>}
                  </button>
                </div>
              </Reveal>
          </form>

          <footer style={{ padding: '60px 24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', background: '#09090B' }}>
             <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '2px', color: '#475569', textTransform: 'uppercase' }}>Secure Clinical Intake • HIPAA Standard</p>
          </footer>
        </div>
      </div>
    </PageTransition>
  );
}
