import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition, Reveal, StaggerContainer } from '../components/layout/LuxeMotion';
import { 
  Calendar, Clock, User, Phone, Mail, MapPin, 
  ChevronRight, ArrowRight, Loader2, Star, Shield, 
  Stethoscope, CheckCircle2, Info, Activity,
  Lock, Zap, Globe, Sparkles, RefreshCw, Search
} from 'lucide-react';
import { BookingFormSkeleton, ServiceCardSkeleton, Skeleton } from '../components/layout/LuxeSkeleton';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import clinicConfig from '../config/clinicConfig';
import SchedulePicker from '../components/booking/SchedulePicker';
import WhatsAppButton from '../components/WhatsAppButton';

// ── Design Tokens: Luxe Midnight Edition ─────────────────────────────────
const T = {
  bg: '#0F172A',
  bgCard: 'rgba(30, 41, 59, 0.5)',
  glass: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  ink: '#F1F5F9',
  ink2: '#94A3B8',
  ink3: '#64748B',
  accent: '#14A3A8',
  white: '#FFFFFF',
  r: { sm: 16, md: 24, lg: 32 }
};

const SectionLabel = ({ children, icon: Icon, color }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: `${color || '#007AFF'}15`, padding: '8px 16px', borderRadius: 100,
    fontSize: 11, fontWeight: 800, color: color || '#007AFF',
    letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 20,
    border: `1px solid ${color || '#007AFF'}30`,
    backdropFilter: 'blur(8px)',
    maxWidth: '100%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
  }}>
    {Icon && <Icon size={12} />}
    {children}
  </div>
);

const FloatingInput = ({ label, icon: Icon, value, onChange, type = 'text', required, error, rows, color }) => {
  const [focused, setFocused] = useState(false);
  const shouldFloat = focused || (value && value.toString().length > 0);

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: 12 }}>
      <div style={{ 
        position: 'relative',
        background: focused ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
        borderRadius: 18,
        border: `2px solid ${error ? '#EF4444' : (focused ? color : 'rgba(255,255,255,0.1)')}`,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}>
        {Icon && (
          <div style={{ position: 'absolute', left: 16, top: 26, color: focused ? color : '#64748B', transition: 'color 0.2s' }}>
            <Icon size={18} />
          </div>
        )}
        <label style={{
          position: 'absolute', left: Icon ? 48 : 18,
          top: shouldFloat ? 10 : 26,
          fontSize: shouldFloat ? 10 : 15,
          fontWeight: 700,
          color: shouldFloat ? color : '#94A3B8',
          textTransform: shouldFloat ? 'uppercase' : 'none',
          letterSpacing: shouldFloat ? '1px' : '0',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'none'
        }}>
          {label} {required && '*'}
        </label>
        {type === 'textarea' ? (
          <textarea
            value={value} onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            required={required} rows={rows || 3}
            style={{ width: '100%', padding: '32px 18px 12px 18px', background: 'transparent', border: 'none', outline: 'none', fontSize: 15, fontWeight: 500, color: '#F1F5F9', resize: 'none', fontFamily: 'inherit' }}
          />
        ) : (
          <input
            type={type} value={value} onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            required={required}
            style={{ width: '100%', height: 64, padding: Icon ? '32px 16px 10px 48px' : '32px 16px 10px 18px', background: 'transparent', border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, color: '#F1F5F9' }}
          />
        )}
      </div>
      {error && <p style={{ color: '#EF4444', fontSize: 11, fontWeight: 600, marginTop: 4, marginLeft: 4 }}>{error}</p>}
    </div>
  );
};

export default function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [fetchingConfig, setFetchingConfig] = useState(true);
  const [activeClinic, setActiveClinic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Modify consultation state
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifyPhone, setModifyPhone] = useState('');
  const [modifySearching, setModifySearching] = useState(false);
  const [modifyError, setModifyError] = useState('');

  // Read follow-up params from URL
  const urlSearchParams = new URLSearchParams(location.search);
  const followUpName = urlSearchParams.get('name') || '';
  const followUpPhone = urlSearchParams.get('phone') || '';
  const isFollowUp = urlSearchParams.get('followup') === '1';
  
  const [form, setForm] = useState({
    patientName: followUpName, patientPhone: followUpPhone, patientEmail: '',
    service: '', date: '', slot: null, complaints: ''
  });

  const revealRefs = useRef([]);
  const addToRefs = (el) => { if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el); };

  // 1. Logic Effect (Resolution)
  useEffect(() => {
    async function resolveClinic() {
      const hostname = window.location.hostname;
      const urlParams = new URL(window.location.href).searchParams;
      
      // Target: dev param OR subdomain
      let targetSubdomain = urlParams.get('dev') || urlParams.get('tenant');
      if (!targetSubdomain && hostname.split('.').length >= 3) {
        targetSubdomain = hostname.split('.')[0];
      }

      if (!targetSubdomain || targetSubdomain === 'www') {
         // If no subdomain, check if we have a default clinic config as fallback
         setActiveClinic({ ...clinicConfig, id: 'default' });
         setForm(prev => ({ ...prev, service: (clinicConfig.services || [])[0]?.name || '' }));
         setFetchingConfig(false);
         return;
      }

      try {
        const q = query(collection(db, 'clinics'), where('subdomain', '==', targetSubdomain));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData = snap.docs[0].data();
          const settings = docData.settings || {};
          const clinicData = {
            id: snap.docs[0].id,
            services: clinicConfig.services,
            workingHours: clinicConfig.workingHours,
            slotDurationMinutes: clinicConfig.slotDurationMinutes,
            ...docData,
            // Admin panel saves these under settings — read from both locations
            logo: settings.logo || docData.logo || '',
            coverPhoto: settings.coverPhoto || docData.coverPhoto || '',
            primaryColor: settings.primaryColor || docData.primaryColor || '#007AFF',
            secondaryColor: settings.secondaryColor || docData.secondaryColor || '#5AC8FA',
            physioPhoto: settings.physioPhoto || docData.physioPhoto || '',
            videoMode: settings.videoMode || docData.videoMode || 'whatsapp',
            zoomLink: settings.zoomLink || docData.zoomLink || '',
            facebook: settings.facebook || docData.facebook || '',
            instagram: settings.instagram || docData.instagram || '',
            youtube: settings.youtube || docData.youtube || '',
            linkedin: settings.linkedin || docData.linkedin || '',
          };
          setActiveClinic(clinicData);
          setForm(prev => ({ ...prev, service: (clinicData.services || [])[0]?.name || '' }));
          document.title = `${clinicData.clinicName || 'Clinic'} | Expert Physiotherapy`;
        } else {
          setActiveClinic({ ...clinicConfig, id: 'fallback', services: clinicConfig.services, workingHours: clinicConfig.workingHours });
        }
      } catch (err) {
        console.error('[BookingPage] Resolution failed:', err);
        setActiveClinic({ ...clinicConfig, id: 'fallback', services: clinicConfig.services, workingHours: clinicConfig.workingHours });
      } finally {
        setFetchingConfig(false);
      }
    }
    resolveClinic();
  }, []);

  // 2. Behavioral Effect (Reveal)
  useEffect(() => {
    if (fetchingConfig) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    const timer = setTimeout(() => {
      revealRefs.current.forEach(el => el && observer.observe(el));
    }, 100);

    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [fetchingConfig]);

  const primaryColor = activeClinic?.primaryColor || '#007AFF';

  const handleInputChange = (field, v) => {
    setForm(p => ({ ...p, [field]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.slot) { alert('Please select a time slot.'); return; }
    setLoading(true);
    // Mimic processing
    await new Promise(r => setTimeout(r, 1000));
    const dateDisplay = form.date instanceof Date
      ? form.date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      : form.date;
    navigate(`/intake/BK-${Date.now().toString().slice(-6)}`, {
      state: {
        ...form,
        date: dateDisplay,
        dateDisplay,
        slotLabel: form.slot?.label || form.slot?.time || '',
        clinicId: activeClinic.id || 'unknown',
        clinicName: activeClinic.clinicName || activeClinic.name,
        subdomain: activeClinic.subdomain,
        serviceName: form.service,
        servicePrice: (activeClinic.services || []).find(s => s.name === form.service)?.price || 0,
        isFollowUp: isFollowUp,
      }
    });
  };

  // Modify consultation handler — find booking by phone and redirect to reschedule
  const handleModifySearch = async () => {
    if (!modifyPhone.trim()) { setModifyError('Please enter your phone number.'); return; }
    setModifySearching(true);
    setModifyError('');
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef,
        where('patientPhone', '==', modifyPhone.trim()),
        where('clinicId', '==', activeClinic?.id || '')
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setModifyError('No booking found with this phone number. Please try again.');
      } else {
        // Find the most recent upcoming booking
        const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const upcoming = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled')
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        if (upcoming.length === 0) {
          setModifyError('No active bookings found. Only upcoming appointments can be modified.');
        } else {
          navigate(`/reschedule/${upcoming[0].id}`);
        }
      }
    } catch (err) {
      setModifyError('Something went wrong. Please try again.');
    }
    setModifySearching(false);
  };

  if (fetchingConfig) {
    return (
      <div style={{ height: '100vh', width: '100vw', background: '#0F172A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <Loader2 size={40} className="animate-spin" style={{ color: '#F1F5F9' }} />
        <p style={{ color: '#94A3B8', fontWeight: 600, letterSpacing: '2px', fontSize: 12 }}>INITIALIZING LUXE PORTAL...</p>
      </div>
    );
  }

  if (!activeClinic) {
     return <div>Error loading clinic</div>;
  }

  return (
    <div style={{ background: '#0F172A', color: '#F8FAFC', minHeight: '100vh', fontFamily: "'Manrope', sans-serif", width: '100%', overflowX: 'hidden', maxWidth: '100vw' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap');
        html, body { overflow-x: hidden; width: 100%; max-width: 100%; position: relative; }
        *, *::before, *::after { box-sizing: border-box; }
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal.active { opacity: 1; transform: translateY(0); }
        .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 32px; width: 100%; max-width: 100%; overflow: hidden; }
        .glow-button { width: 100%; transition: all 0.3s; }
        .glow-button:hover { transform: translateY(-3px); box-shadow: 0 15px 35px ${primaryColor}40; filter: brightness(1.1); }
        .glow-button:active { transform: translateY(-1px); }
        .animate-pulse-subtle { animation: pulse 3s infinite ease-in-out; }
        @keyframes pulse { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.25; } }
        
        .layout-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 32px;
          width: 100%;
          max-width: 100%;
        }
        .layout-grid > * { min-width: 0; overflow: hidden; }
        .booking-section {
          padding: 0 clamp(12px, 4vw, 24px) 120px;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          box-sizing: border-box;
        }
        .booking-inner {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }
        .hero-section {
          position: relative;
          overflow: hidden;
          padding: clamp(80px, 12vw, 120px) clamp(16px, 4vw, 24px) clamp(40px, 6vw, 80px);
          width: 100%;
          box-sizing: border-box;
        }
        .input-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 1024px) {
          .layout-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .input-grid { grid-template-columns: 1fr; }
          .glass-card { padding: 20px; border-radius: 20px; }
        }
      `}</style>

      {/* ── Cinematic Hero ────────────────────────────────────────── */}
      <section className="hero-section">
        {/* Abstract Background Glow — clamped to 100% width to prevent overflow */}
        <div className="animate-pulse-subtle" style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: '100%', height: '150%', background: `radial-gradient(circle at center, ${primaryColor}25 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}></div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div ref={addToRefs} className="reveal">
            {isFollowUp && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${primaryColor}15`, padding: '8px 18px', borderRadius: 100, fontSize: 12, fontWeight: 700, color: primaryColor, border: `1px solid ${primaryColor}30`, marginBottom: 20 }}>
                <RefreshCw size={12} /> Welcome back! Booking your follow-up session
              </div>
            )}
            <SectionLabel color={primaryColor} icon={Sparkles}>Professional Healthcare Portal</SectionLabel>
            <h1 style={{ fontSize: 'clamp(32px, 8vw, 84px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 0.95, marginBottom: 28, fontFamily: 'inherit' }}>
              Restore Your <br />
              <span style={{ color: primaryColor }}>Movement.</span>
            </h1>
            <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#94A3B8', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.6, fontWeight: 500 }}>
              Book an exclusive consultation with {activeClinic.physioName || 'our leading therapist'} at <span style={{ color: '#F8FAFC', fontWeight: 700 }}>{activeClinic.clinicName}</span>.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => document.getElementById('booking').scrollIntoView({ behavior: 'smooth' })}
                style={{ height: 64, padding: '0 40px', borderRadius: 20, background: primaryColor, color: '#FFF', border: 'none', fontSize: 16, fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s' }}
                className="glow-button"
              >
                Book Online Appointment <ArrowRight size={18} style={{ marginLeft: 8 }} />
              </button>
              {/* Manage Appointment Button — Only for subdomain clinic pages */}
              <button
                onClick={() => setShowModifyModal(true)}
                style={{ height: 64, padding: '0 28px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', color: '#94A3B8', border: '2px solid rgba(255,255,255,0.1)', fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <RefreshCw size={16} /> Manage My Appointment
              </button>
              {/* Share on WhatsApp Button */}
              <button
                onClick={() => {
                   const text = `Check out this expert physiotherapy clinic! Book your assessment online quickly and securely:\n\nhttps://${activeClinic?.domain || window.location.host}`;
                   window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                style={{ width: 64, height: 64, borderRadius: 20, background: '#25D366', color: '#FFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s', flexShrink: 0 }}
                title="Share Clinic on WhatsApp"
                className="glow-button"
              >
                <div dangerouslySetInnerHTML={{ __html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>` }} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Modify Consultation Modal ─────────────────────────────── */}
      {showModifyModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowModifyModal(false)}
        >
          <div style={{ background: 'rgba(15, 23, 42, 0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: 40, maxWidth: 460, width: '100%', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: `${primaryColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: `1px solid ${primaryColor}30` }}>
                <RefreshCw size={28} color={primaryColor} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#F1F5F9', marginBottom: 8 }}>Manage Your Appointment</h2>
              <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>Enter your registered WhatsApp number to find your booking. You can modify or cancel your appointment.</p>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, border: `2px solid ${modifyError ? '#EF4444' : 'rgba(255,255,255,0.1)'}`, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, height: 60 }}>
                <Phone size={18} color={primaryColor} />
                <input
                  value={modifyPhone}
                  onChange={e => { setModifyPhone(e.target.value); setModifyError(''); }}
                  placeholder="Your registered phone number"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 16, fontWeight: 600, color: '#F1F5F9' }}
                  onKeyDown={e => e.key === 'Enter' && handleModifySearch()}
                />
              </div>
              {modifyError && <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 600, marginTop: 8, marginLeft: 4 }}>{modifyError}</p>}
            </div>
            <button
              onClick={handleModifySearch}
              disabled={modifySearching}
              style={{ width: '100%', height: 56, borderRadius: 16, background: primaryColor, color: '#fff', border: 'none', fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              {modifySearching ? <Loader2 size={20} className="animate-spin" /> : <><Search size={18} /> Find My Booking</>}
            </button>
            <p style={{ textAlign: 'center', color: '#475569', fontSize: 12, marginTop: 16 }}>Rescheduling is only available ≥4 hours before your appointment.</p>
          </div>
        </div>
      )}

      {/* ── Main Booking Form ────────────────────────────────────────── */}
      <section id="booking" className="booking-section" style={{ position: 'relative', zIndex: 2 }}>
        <div className="layout-grid booking-inner">
          
          {/* Left: Interactive Form */}
          <Reveal>
            <div className="glass-card" style={{ padding: 'clamp(20px, 4vw, 40px)' }}>
               <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Activity size={24} style={{ color: primaryColor }} /> Session Details
               </h3>
             
               {fetchingConfig ? (
                 <BookingFormSkeleton />
               ) : (
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="input-grid">
                      <FloatingInput label="Full Name" icon={User} color={primaryColor} value={form.patientName} onChange={v => handleInputChange('patientName', v)} required />
                      <FloatingInput label="WhatsApp Number" icon={Phone} color={primaryColor} value={form.patientPhone} onChange={v => handleInputChange('patientPhone', v)} required />
                    </div>
                    <FloatingInput label="Email Address" type="email" icon={Mail} color={primaryColor} value={form.patientEmail} onChange={v => handleInputChange('patientEmail', v)} required />
                    
                    <div style={{ marginTop: 24 }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 16, display: 'block' }}>Select Treatment</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                          {activeClinic.services?.map(s => (
                            <div 
                              key={s.name}
                              onClick={() => setForm(p => ({ ...p, service: s.name }))}
                              style={{ 
                                padding: '20px', borderRadius: 18, cursor: 'pointer',
                                background: form.service === s.name ? `${primaryColor}15` : 'rgba(255,255,255,0.02)',
                                border: `2px solid ${form.service === s.name ? primaryColor : 'rgba(255,255,255,0.05)'}`,
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: form.service === s.name ? 'scale(1.02)' : 'none'
                              }}
                            >
                              <p style={{ fontWeight: 700, fontSize: 15, color: form.service === s.name ? '#F1F5F9' : '#94A3B8' }}>{s.name}</p>
                              <p style={{ fontSize: 13, color: form.service === s.name ? primaryColor : '#64748B', marginTop: 4 }}>₹{s.price} • {s.duration}m</p>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div style={{ marginTop: 48 }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 16, display: 'block' }}>Choose Your Slot</label>
                      <SchedulePicker 
                          clinicConfig={activeClinic}
                          selectedDate={form.date}
                          selectedTime={form.slot}
                          onSelect={(d, s) => {
                            if (d) setForm(p => ({ ...p, date: d }));
                            if (s) setForm(p => ({ ...p, slot: s }));
                          }}
                          T={{
                            primary: primaryColor,
                            border: 'rgba(255,255,255,0.1)',
                            white: 'rgba(30, 41, 59, 1)',
                            ink: '#F8FAFC',
                            primaryLight: `${primaryColor}20`
                          }}
                      />
                    </div>

                    <div style={{ marginTop: 32, opacity: 0.9 }}>
                      <FloatingInput label="Primary Concern (Optional)" type="textarea" color={primaryColor} value={form.complaints} onChange={v => handleInputChange('complaints', v)} />
                    </div>

                    <button 
                      type="submit" disabled={loading}
                      style={{ 
                        height: 72, marginTop: 40, borderRadius: 20, background: primaryColor, color: '#FFF', 
                        border: 'none', fontSize: 18, fontWeight: 800, cursor: 'pointer',
                        boxShadow: `0 15px 40px ${primaryColor}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
                      }}
                      className="glow-button"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : (
                        <>Confirm Appointment <ArrowRight size={20} /></>
                      )}
                    </button>
                  </form>
               )}
            </div>
          </Reveal>

          {/* Right: Social Proof & Trust */}
          <div style={{ display: 'grid', gap: 24, alignContent: 'start' }}>
             <div ref={addToRefs} className="reveal glass-card" style={{ padding: 40 }}>
                <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                   <Shield size={20} style={{ color: '#10B981' }} /> Clinical Integrity
                </h4>
                <div style={{ display: 'grid', gap: 20 }}>
                   <div style={{ display: 'flex', gap: 14 }}>
                      <div style={{ minWidth: 24, height: 24, borderRadius: '50%', background: '#10B98120', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={14} /></div>
                      <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>100% HIPAA compliant data encryption.</p>
                   </div>
                   <div style={{ display: 'flex', gap: 14 }}>
                      <div style={{ minWidth: 24, height: 24, borderRadius: '50%', background: '#10B98120', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={14} /></div>
                      <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>Certified specialized clinical assessment.</p>
                   </div>
                   <div style={{ display: 'flex', gap: 14 }}>
                      <div style={{ minWidth: 24, height: 24, borderRadius: '50%', background: '#10B98120', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={14} /></div>
                      <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>Instant WhatsApp confirmation & receipt.</p>
                   </div>
                </div>
             </div>

             {(activeClinic.whatsappNumber || activeClinic.whatsapp || activeClinic.phone) && (
               <div ref={addToRefs} className="reveal glass-card" style={{ padding: 40, border: `1px solid ${primaryColor}30` }}>
                  <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Need Support?</h4>
                  <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 24 }}>Message us for clinical inquiries or emergency slots.</p>
                  <WhatsAppButton
                     phone={activeClinic.whatsappNumber || activeClinic.whatsapp || activeClinic.phone}
                     clinicName={activeClinic.clinicName || activeClinic.name || 'Clinic'}
                     inline
                  />
               </div>
             )}

             {/* Review Card */}
             <div ref={addToRefs} className="reveal glass-card" style={{ padding: 40, background: 'linear-gradient(225deg, rgba(30,41,59,0.6), rgba(15,23,42,0.8))' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                   {[1,2,3,4,5].map(i => <Star key={i} size={16} fill={primaryColor} stroke={primaryColor} />)}
                </div>
                <p style={{ fontSize: 16, fontStyle: 'italic', color: '#F1F5F9', lineHeight: 1.8, marginBottom: 24 }}>
                   "The convenience and quality of telehealth movement therapy provided here is world-class. Truly professional expertise."
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                   <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(${primaryColor}, ${primaryColor}dd)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>DR</div>
                   <div>
                      <p style={{ fontSize: 14, fontWeight: 800 }}>Dr. Sanjay Verma</p>
                      <p style={{ fontSize: 12, color: '#64748B' }}>Senior Orthopedic Surgeon</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '80px 24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#09090B' }}>
          <div style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
             <img src={activeClinic?.logo || '/logo.png'} alt={activeClinic?.clinicName || 'Clinic'} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
          </div>

         {/* Clinic Contact Info */}
         <div style={{ maxWidth: 600, margin: '0 auto 40px' }}>
           <h4 style={{ fontSize: 18, color: '#F1F5F9', fontWeight: 800, marginBottom: 16 }}>{activeClinic.clinicName || 'Clinic'}</h4>
           
           {(activeClinic.address || activeClinic.phone || activeClinic.email) && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
               {activeClinic.address && (
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8', fontSize: 14 }}>
                   <MapPin size={16} style={{ color: primaryColor, flexShrink: 0 }} />
                   <span>{activeClinic.address}</span>
                 </div>
               )}
               {(activeClinic.phone || activeClinic.whatsappNumber) && (
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8', fontSize: 14 }}>
                   <Phone size={16} style={{ color: primaryColor, flexShrink: 0 }} />
                   <span>{activeClinic.phone || activeClinic.whatsappNumber}</span>
                 </div>
               )}
               {activeClinic.email && (
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8', fontSize: 14 }}>
                   <Mail size={16} style={{ color: primaryColor, flexShrink: 0 }} />
                   <span>{activeClinic.email}</span>
                 </div>
               )}
             </div>
           )}
         </div>

         <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '4px', color: '#475569', textTransform: 'uppercase' }}>
            Trusted by Professionals Worldwide
         </p>
         
         {/* Policy Links */}
         <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 24, flexWrap: 'wrap' }}>
            <a href="/cancellation" style={{ fontSize: 13, color: '#94A3B8', textDecoration: 'none', transition: 'color 0.2s', fontWeight: 600 }} onMouseOver={e => e.target.style.color = '#F8FAFC'} onMouseOut={e => e.target.style.color = '#94A3B8'}>Cancellation Policy</a>
            <a href="/privacy" style={{ fontSize: 13, color: '#94A3B8', textDecoration: 'none', transition: 'color 0.2s', fontWeight: 600 }} onMouseOver={e => e.target.style.color = '#F8FAFC'} onMouseOut={e => e.target.style.color = '#94A3B8'}>Privacy Policy</a>
            <a href="/contact" style={{ fontSize: 13, color: '#94A3B8', textDecoration: 'none', transition: 'color 0.2s', fontWeight: 600 }} onMouseOver={e => e.target.style.color = '#F8FAFC'} onMouseOut={e => e.target.style.color = '#94A3B8'}>Contact Us</a>
         </div>

         <p style={{ fontSize: 13, color: '#64748B', marginTop: 24 }}>
            Powered by OnlinePT • Clinical Workflow Automation • v1.0.9
         </p>
      </footer>


    </div>
  );
}
