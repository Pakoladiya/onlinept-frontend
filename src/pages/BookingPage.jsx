import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '@/utils/api';
import { PageTransition, Reveal, StaggerContainer } from '../components/layout/LuxeMotion';
import { 
  Calendar, Clock, User, Phone, Mail, MapPin, 
  ChevronRight, ArrowRight, Loader2, Star, Shield, ShieldCheck,
  Stethoscope, CheckCircle2, Info, Activity,
  Lock, Zap, Globe, Sparkles, RefreshCw, Search,
  Facebook, Instagram, Youtube, Linkedin,
  Tag, Check, AlertCircle, X, Image
} from 'lucide-react';
import { BookingFormSkeleton, ServiceCardSkeleton, Skeleton } from '../components/layout/LuxeSkeleton';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import clinicConfig from '../config/clinicConfig';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';
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

// Helper: Get contrast color (White or Dark Slate) based on background hex
const getContrastColor = (hexcolor) => {
  if (!hexcolor || hexcolor.startsWith('rgba')) return '#FFFFFF';
  const hex = hexcolor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 170) ? '#0F172A' : '#FFFFFF';
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
            style={{ width: '100%', height: 64, padding: Icon ? '32px 16px 10px 48px' : '32px 16px 10px 18px', background: 'transparent', border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, color: '#F1F5F9', textTransform: (label?.toLowerCase().includes('name') || label?.toLowerCase().includes('clinic')) ? 'capitalize' : 'none' }}
          />
        )}
      </div>
      {error && <p style={{ color: '#EF4444', fontSize: 11, fontWeight: 600, marginTop: 4, marginLeft: 4 }}>{error}</p>}
    </div>
  );
};

const SocialLink = ({ href, icon: Icon, color }) => {
  if (!href) return null;
  // Ensure href is a protocol-absolute URL
  const safeHref = href.startsWith('http') ? href : `https://${href}`;
  
  return (
    <a 
      href={safeHref} target="_blank" rel="noreferrer"
      style={{ 
        width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.03)', 
        border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', 
        justifyContent: 'center', transition: 'all 0.3s', color: '#94A3B8' 
      }}
      onMouseOver={e => { e.currentTarget.style.background = `${color}15`; e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.color = color; }}
      onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94A3B8'; }}
    >
      <Icon size={16} />
    </a>
  );
};

export default function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [fetchingConfig, setFetchingConfig] = useState(true);
  const [activeClinic, setActiveClinic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  // Modify consultation state
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifyPhone, setModifyPhone] = useState('');
  const [modifySearching, setModifySearching] = useState(false);
  const [modifyError, setModifyError] = useState('');
  const [modifyStep, setModifyStep] = useState('phone'); // 'phone' | 'otp'
  const [modifyOtp, setModifyOtp] = useState('');
  const [modifyFoundId, setModifyFoundId] = useState(null);
  const [modifyOtpSending, setModifyOtpSending] = useState(false);
  const [modifyPatientName, setModifyPatientName] = useState('');

  // Read follow-up params from URL
  const urlSearchParams = new URLSearchParams(location.search);
  const followUpName = urlSearchParams.get('name') || '';
  const { language, setLanguage } = useLanguage();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
  const t = (key) => translations[language]?.[key] || translations['en'][key] || key;

  const availableLangs = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'hi', label: 'Hindi', short: 'HI' },
    { code: 'gu', label: 'Gujarati', short: 'GU' }
  ].filter(l => 
    l.code === 'en' || 
    activeClinic?.languages?.some(al => al.toLowerCase().includes(l.label.toLowerCase()))
  );
  const followUpPhone = urlSearchParams.get('phone') || '';
  const isFollowUp = urlSearchParams.get('followup') === '1';
  
  const [form, setForm] = useState({
    patientName: followUpName, patientPhone: followUpPhone, patientEmail: '',
    service: '', date: '', slot: null, complaints: ''
  });
  const [activeBookingTab, setActiveBookingTab] = useState('services'); // 'services' or 'packages'
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const revealRefs = useRef([]);
  const addToRefs = (el) => { if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el); };

  // 1. Logic Effect (Resolution)
  useEffect(() => {
    async function resolveClinic() {
      const hostname = window.location.hostname;
      const urlParams = new URL(window.location.href).searchParams;
      
      // Target: dev param OR subdomain
      let rawTenant = urlParams.get('dev') || urlParams.get('tenant');
      let targetSubdomain = rawTenant;
      
      // 💡 Smart Clip: If they provided "abc.onlinept.in", just take "abc"
      if (rawTenant && rawTenant.includes('.')) {
        targetSubdomain = rawTenant.split('.')[0];
      }

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
        let clinicDocData = null;
        let clinicDocId = null;

        // Strategy A: query by subdomain field
        const q = query(collection(db, 'clinics'), where('subdomain', '==', targetSubdomain));
        const snap = await getDocs(q);
        if (!snap.empty) {
          clinicDocData = snap.docs[0].data();
          clinicDocId = snap.docs[0].id;
        }

        // Strategy B: direct document ID lookup (subdomain == doc ID)
        if (!clinicDocData) {
          const directSnap = await getDoc(doc(db, 'clinics', targetSubdomain));
          if (directSnap.exists()) {
            clinicDocData = directSnap.data();
            clinicDocId = directSnap.id;
          }
        }

        if (clinicDocData) {
          // ── Check clinic is approved (allow missing/undefined status too for legacy) ──
          const status = clinicDocData.status;
          if (status && status !== 'approved' && status !== 'active') {
            console.warn(`[BookingPage] Clinic "${targetSubdomain}" status is "${status}" — blocked`);
            setActiveClinic(null);
            setFetchingConfig(false);
            return;
          }

          const settings = clinicDocData.settings || {};
          const clinicData = {
            id: clinicDocId,
            ...clinicDocData,
            // Ensure critical arrays/configs have proper fallbacks
            services: clinicDocData.services || settings.services || clinicConfig.services,
            packages: clinicDocData.packages || settings.packages || clinicConfig.packages || [],
            coupons: clinicDocData.coupons || settings.coupons || clinicConfig.coupons || [],
            workingHours: clinicDocData.workingHours || settings.workingHours || clinicConfig.workingHours,
            slotDurationMinutes: clinicDocData.slotDurationMinutes || settings.slotDurationMinutes || clinicConfig.slotDurationMinutes || 15,
            
            // Admin panel saves these under settings — read from both locations
            logo: settings.logo || clinicDocData.logo || '',
            logoWidth: settings.logoWidth || clinicDocData.logoWidth || 44,
            logoHeight: settings.logoHeight || clinicDocData.logoHeight || 44,
            coverPhoto: settings.coverPhoto || clinicDocData.coverPhoto || '',
            physioPhoto: settings.physioPhoto || clinicDocData.physioPhoto || '',
            physioName: settings.physioName || clinicDocData.physioName || clinicDocData.name || 'Clinical Director',
            primaryColor: settings.primaryColor || clinicDocData.primaryColor || '#007AFF',
            secondaryColor: settings.secondaryColor || clinicDocData.secondaryColor || '#5AC8FA',
            videoMode: settings.videoMode || clinicDocData.videoMode || 'whatsapp',
            zoomLink: settings.zoomLink || clinicDocData.zoomLink || '',
            facebook: settings.facebook || clinicDocData.facebook || '',
            instagram: settings.instagram || clinicDocData.instagram || '',
            youtube: settings.youtube || clinicDocData.youtube || '',
            linkedin: settings.linkedin || clinicDocData.linkedin || '',
            
            // New Branding Fields
            testimonials: settings.testimonials || clinicDocData.testimonials || [],
            showTestimonials: settings.showTestimonials ?? clinicDocData.showTestimonials ?? false,
            highlights: settings.highlights || clinicDocData.highlights || [],
            showHighlights: settings.showHighlights ?? clinicDocData.showHighlights ?? false,
            noticeText: settings.noticeText || clinicDocData.noticeText || '',
            showNotice: settings.showNotice ?? clinicDocData.showNotice ?? false,
            adBanner: settings.adBanner || clinicDocData.adBanner || '',
            showAdBanner: settings.showAdBanner !== undefined ? settings.showAdBanner : clinicDocData.showAdBanner ?? false,
            googleReviews: settings.googleReviews || '',
            justDial: settings.justDial || '',
            languages: settings.languages || clinicDocData.languages || [],
            showLanguages: settings.showLanguages ?? true,
          };
          setActiveClinic(clinicData);
          setForm(prev => ({ ...prev, service: (clinicData.services || [])[0]?.name || '' }));
          document.title = `${clinicData.clinicName || 'Clinic'} | Expert Physiotherapy`;
        } else {
          // 🛑 NO FALLBACK: clinic not found by subdomain field OR doc ID
          setActiveClinic(null);
        }
      } catch (err) {
        console.error('[BookingPage] Resolution failed:', err);
        setActiveClinic(null);
      } finally {
        setFetchingConfig(false);
      }
    }
    resolveClinic();
  }, []);

  // 2. Behavioral Effect (Reveal) - MUST BE BEFORE EARLY RETURNS
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
    }, 200);

    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [fetchingConfig, activeClinic]);

  // 1.5 - Helper to render the "Clinic Not Found" state
  if (!fetchingConfig && !activeClinic) {
    return (
      <div style={{ 
        height: '100vh', width: '100vw', background: '#09090B', color: '#FFF',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 40, textAlign: 'center'
      }}>
        <div style={{ 
          width: 80, height: 80, background: '#14A3A820', borderRadius: '24px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 
        }}>
          <Shield size={40} color="#14A3A8" />
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>Clinical Portal Not Found</h1>
        <p style={{ color: '#94A3B8', maxWidth: 400, lineHeight: 1.6, marginBottom: 40, fontSize: 16 }}>
          This subdomain is not yet registered or has been suspended. Please check the URL or contact your physiotherapist.
        </p>
        <Link to="/" style={{
          padding: '16px 32px', borderRadius: 100, background: '#14A3A8', color: '#FFF',
          textDecoration: 'none', fontWeight: 800, boxShadow: '0 10px 40px rgba(20, 163, 168, 0.3)'
        }}>
          Go to OnlinePT.in
        </Link>
      </div>
    );
  }

  const primaryColor = activeClinic?.primaryColor || '#14A3A8';
  const secondaryColor = activeClinic?.secondaryColor || '#007AFF';

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

  // Step 1: find booking by phone → send OTP
  const handleModifySearch = async () => {
    if (!modifyPhone.trim()) { setModifyError('Please enter your phone number.'); return; }
    setModifySearching(true);
    setModifyError('');
    try {
      const digits = modifyPhone.trim().replace(/\D/g, '');
      const ten    = digits.slice(-10);
      const e164   = `+91${ten}`;
      const full91 = `91${ten}`;
      const cId    = activeClinic?.id || '';

      const bookingsRef = collection(db, 'bookings');
      const [snap1, snap2, snap3] = await Promise.all([
        getDocs(query(bookingsRef, where('patientPhone', '==', e164),   where('clinicId', '==', cId))),
        getDocs(query(bookingsRef, where('patientPhone', '==', full91), where('clinicId', '==', cId))),
        getDocs(query(bookingsRef, where('patientPhone', '==', ten),    where('clinicId', '==', cId))),
      ]);
      const allDocs = [...snap1.docs, ...snap2.docs, ...snap3.docs]
        .filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i);

      if (allDocs.length === 0) {
        setModifyError('No booking found. Please enter the exact WhatsApp number you used while booking.');
        setModifySearching(false);
        return;
      }
      const bookings = allDocs.map(d => ({ id: d.id, ...d.data() }));
      const upcoming = bookings
        .filter(b => b.status !== 'completed' && b.status !== 'cancelled')
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      if (upcoming.length === 0) {
        setModifyError('No active bookings found. Only upcoming appointments can be modified.');
        setModifySearching(false);
        return;
      }
      // Booking found — now send OTP to verify identity
      const found = upcoming[0];
      setModifyFoundId(found.id);
      setModifyPatientName(found.patientName || 'Patient');

      const otpRes = await fetch(`${API_BASE}/api/notifications/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164, purpose: 'reschedule', userName: found.patientName || 'Patient' }),
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok || !otpData.success) {
        setModifyError(otpData.error || 'Failed to send OTP. Please try again.');
        setModifySearching(false);
        return;
      }
      setModifyStep('otp'); // advance to OTP step
    } catch (err) {
      console.error('[ModifySearch]', err);
      setModifyError('Something went wrong. Please try again.');
    }
    setModifySearching(false);
  };

  // Step 2: verify OTP → navigate to reschedule page
  const handleModifyVerifyOtp = async () => {
    if (modifyOtp.length < 6) return;
    setModifyOtpSending(true);
    setModifyError('');
    try {
      const digits = modifyPhone.trim().replace(/\D/g, '');
      const e164   = `+91${digits.slice(-10)}`;
      const res = await fetch(`${API_BASE}/api/notifications/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164, otp: modifyOtp }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setModifyError(data.error || 'Invalid OTP. Please try again.');
        setModifyOtpSending(false);
        return;
      }
      // OTP verified — navigate to reschedule page
      navigate(`/reschedule/${modifyFoundId}`);
    } catch (err) {
      setModifyError('OTP verification failed. Please try again.');
    }
    setModifyOtpSending(false);
  };

  const handleCloseModifyModal = () => {
    setShowModifyModal(false);
    setModifyStep('phone');
    setModifyPhone('');
    setModifyOtp('');
    setModifyError('');
    setModifyFoundId(null);
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
        html, body { overflow-x: hidden; width: 100%; max-width: 100%; position: relative; margin: 0; padding: 0; }
        *, *::before, *::after { box-sizing: border-box; }
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal.active { opacity: 1; transform: translateY(0); }
        .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 32px; width: 100%; max-width: 100%; overflow: hidden; }
        .glow-button { cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .glow-button:hover { transform: translateY(-3px); box-shadow: 0 20px 40px ${primaryColor}40; filter: brightness(1.1); }
        .glow-button:active { transform: translateY(-1px); scale: 0.98; }
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
          padding: clamp(120px, 15vw, 160px) clamp(16px, 4vw, 24px) clamp(40px, 6vw, 80px);
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
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
        }
        @media (max-width: 640px) {
          .input-grid { grid-template-columns: 1fr; }
          .glass-card { padding: 20px; border-radius: 20px; }
          .hero-section { padding-top: 100px; }
        }
        .clinic-header { position: sticky; top: 0; z-index: 9999; height: 80px; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; alignItems: center; padding: 0 clamp(16px, 4vw, 24px); }
      `}</style>

      {/* ── Premium Sticky Header ─────────────────────────────────── */}
      <header className="clinic-header">
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {activeClinic.logo ? (
                <img 
                  src={activeClinic.logo} 
                  style={{ 
                    width: activeClinic.logoWidth || 'auto', 
                    height: activeClinic.logoHeight || 'auto', 
                    maxWidth: 160, 
                    maxHeight: 60, 
                    objectFit: 'contain'
                  }} 
                  alt="Logo" 
                />
              ) : (
                <div style={{ 
                  width: activeClinic.logoWidth || 44, 
                  height: activeClinic.logoHeight || 44, 
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, 
                  borderRadius: 8,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: Math.min((activeClinic.logoWidth || 44) * 0.4, 18), 
                  fontWeight: 900, 
                  color: '#FFF' 
                }}>
                   {activeClinic.clinicName?.charAt(0) || 'C'}
                </div>
              )}
              <div>
                 <p style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', marginBottom: 2, textTransform: 'capitalize' }}>{activeClinic.clinicName}</p>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#32D74B' }}></div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#32D74B', textTransform: 'uppercase', letterSpacing: '1px' }}>Pro Clinical Verified</span>
                 </div>
              </div>
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
                {activeClinic.facebook && <SocialLink href={activeClinic.facebook} icon={Facebook} color={primaryColor} />}
                {activeClinic.instagram && <SocialLink href={activeClinic.instagram} icon={Instagram} color={primaryColor} />}
                {activeClinic.youtube && <SocialLink href={activeClinic.youtube} icon={Youtube} color={primaryColor} />}
                {activeClinic.linkedin && <SocialLink href={activeClinic.linkedin} icon={Linkedin} color={primaryColor} />}
              </div>
              <button 
                onClick={() => document.getElementById('booking').scrollIntoView({ behavior: 'smooth' })}
                style={{ 
                  height: 48, padding: '0 24px', borderRadius: 100, background: primaryColor, color: getContrastColor(primaryColor), 
                  border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer' 
                }}
                className="glow-button"
              >
                Book Appointment
              </button>
           </div>
        </div>
      </header>
      
      {/* 🚩 Notice Board: Dismissible Drop-down Dialog */}
      {activeClinic.showNotice && activeClinic.noticeText && !noticeDismissed && (
        <div style={{ 
          position: 'fixed', top: 96, left: '50%', transform: 'translateX(-50%)', 
          zIndex: 99999, width: 'clamp(320px, 90vw, 600px)',
          background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)',
          border: `1px solid ${primaryColor}40`, borderRadius: 24,
          padding: '20px 24px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-start', gap: 16,
          animation: 'slideInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: 12, background: `${primaryColor}20`, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
          }}>
            <AlertCircle size={20} color={primaryColor} />
          </div>
          <div style={{ flex: 1, paddingTop: 4 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#CBD5E1', lineHeight: 1.5 }}>
              {activeClinic.noticeText}
            </p>
          </div>
          <button 
            onClick={() => setNoticeDismissed(true)}
            style={{ 
              padding: 8, background: 'rgba(255,255,255,0.05)', border: 'none', 
              borderRadius: 10, cursor: 'pointer', color: '#94A3B8',
              transition: 'all 0.2s', alignSelf: 'flex-start'
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#FFF'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94A3B8'; }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ── Immersive Clinic Hero ───────────────────────────────────── */}
      <section className="hero-section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Background Overlay (Cover Photo) */}
        {activeClinic.coverPhoto && (
          <div style={{ 
            position: 'absolute', inset: 0, 
            background: `linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.9)), url(${activeClinic.coverPhoto}) center/cover no-repeat`, 
            opacity: 0.8, 
            filter: 'contrast(1.1)',
            zIndex: 0 
          }} />
        )}
        
        <div className="animate-pulse-subtle" style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: '100%', height: '150%', background: `radial-gradient(circle at center, ${primaryColor}15 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}></div>
 
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', textAlign: 'center', padding: '0 24px' }}>
          <div ref={addToRefs} className="reveal">
             <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
               <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${primaryColor}15`, padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 800, color: primaryColor, border: `1px solid ${primaryColor}30` }}>
                  <Shield size={14} /> {t('officialPortal')}
               </div>
 
               {availableLangs.length > 1 && (
                <div style={{ position: 'relative' }}>
                   <button 
                      onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', 
                        background: 'rgba(255,255,255,0.05)', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)',
                        color: T.white, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer'
                      }}
                   >
                      <Globe size={12} style={{ color: primaryColor }} />
                      {availableLangs.find(l => l.code === language)?.short}
                      <ChevronRight size={10} style={{ transform: showLanguageMenu ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.2s' }} />
                   </button>
                   
                   <AnimatePresence>
                     {showLanguageMenu && (
                       <motion.div 
                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
                         style={{ 
                           position: 'absolute', top: '120%', right: 0, minWidth: 120, 
                           background: '#1E293B', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)',
                           padding: 6, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', zIndex: 101, overflow: 'hidden'
                         }}
                       >
                          {availableLangs.map(l => (
                            <button
                              key={l.code}
                              onClick={() => { setLanguage(l.code); setShowLanguageMenu(false); }}
                              style={{ 
                                width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none',
                                background: language === l.code ? primaryColor : 'transparent',
                                color: T.white, fontSize: 11, fontWeight: 700, textAlign: 'left',
                                cursor: 'pointer', transition: '0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                              }}
                            >
                               {l.label}
                               {language === l.code && <Check size={12} />}
                            </button>
                          ))}
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
               )}
             </div>
             
             <h1 style={{ fontSize: 'clamp(40px, 10vw, 92px)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 0.9, marginBottom: 32, textTransform: 'uppercase' }}>
               {t('heroTitlePart1')} <span style={{ color: '#FFF' }}>{t('heroTitlePart2')}</span><br />
               <span style={{ color: primaryColor }}>{t('heroTitlePart3')}.</span>
             </h1>

             <p style={{ fontSize: 'clamp(17px, 2.5vw, 22px)', color: '#CBD5E1', maxWidth: 700, margin: '0 auto 48px', lineHeight: 1.6, fontWeight: 500 }}>
               {t('welcomeTo')} <span style={{ color: '#F8FAFC', fontWeight: 800, textTransform: 'capitalize' }}>{activeClinic.clinicName}</span>.
             </p>

             <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
               <button 
                 onClick={() => document.getElementById('booking').scrollIntoView({ behavior: 'smooth' })}
                 style={{ height: 72, padding: '0 48px', borderRadius: 24, background: primaryColor, color: '#FFF', border: 'none', fontSize: 18, fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s' }}
                 className="glow-button"
               >
                 {t('scheduleAppointment')} <ArrowRight size={18} style={{ marginLeft: 8 }} />
               </button>
               
               <button
                 onClick={() => setShowModifyModal(true)}
                 style={{ height: 72, padding: '0 32px', borderRadius: 24, background: 'rgba(255,255,255,0.06)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.1)', fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: 10 }}
               >
                 <RefreshCw size={18} /> {t('manageExisting')}
               </button>
             </div>
          </div>
        </div>
      </section>

      {/* ── Clinical Excellence Benchmarks ────────────────────────── */}
      <section style={{ padding: '80px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
             {(activeClinic.showHighlights ? activeClinic.highlights : [
               'Expert Clinical Care', 'Verified Medical Facility', 'Indian Healthcare Protocols', 'Secure Medical Records'
             ]).map((h, i) => {
               if (!h) return null;
               const icons = [Activity, MapPin, ShieldCheck, Zap];
               const Icon = icons[i % icons.length];
               return (
                 <div key={i} className="reveal glass-card" ref={addToRefs} style={{ padding: 32, border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 16, background: `${primaryColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                       <Icon size={24} color={primaryColor} />
                    </div>
                    <h4 style={{ fontSize: 18, fontWeight: 800, color: '#F8FAFC', marginBottom: 8 }}>{h}</h4>
                    <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.5 }}>Authorized and maintained by our digital clinical platform.</p>
                 </div>
               );
             })}
          </div>
        </div>
      </section>

      {/* ── Specialized Treatments Grid ────────────────────────────── */}
      <section style={{ padding: '120px 24px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div ref={addToRefs} className="reveal">
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, marginBottom: 20 }}>{t('clinicalSpecialities')}</h2>
            <p style={{ color: '#94A3B8', maxWidth: 600, margin: '0 auto 64px' }}>
              We provide state-of-the-art evidence-based treatments for a variety of clinical conditions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {(activeClinic.services || [1,2,3]).map((s, i) => (
              <div key={i} className="reveal glass-card" ref={addToRefs} style={{ padding: 40, textAlign: 'left', transition: 'all 0.3s' }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
                   <Stethoscope size={28} color={primaryColor} />
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#F8FAFC', marginBottom: 16, textTransform: 'capitalize' }}>{s.name || 'Therapeutic Session'}</h3>
                <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6, marginBottom: 28 }}>
                   Professional grade focus on {s.name || 'rehabilitation'} with dedicated attention.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                   <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>₹{s.price || 0}</div>
                   <div style={{ color: '#475569', fontSize: 14 }}>• {s.duration || 30} Minutes Session</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modify Consultation Modal ─────────────────────────────── */}
      {showModifyModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={handleCloseModifyModal}
        >
          <div style={{ background: 'rgba(15, 23, 42, 0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: 40, maxWidth: 460, width: '100%', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: `${primaryColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: `1px solid ${primaryColor}30` }}>
                <RefreshCw size={28} color={primaryColor} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#F1F5F9', marginBottom: 8 }}>{t('manageAppointment')}</h2>
              <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6 }}>
                {modifyStep === 'phone'
                  ? 'Enter your registered WhatsApp number to find your booking.'
                  : `We sent a 6-digit OTP to your WhatsApp. Enter it below to verify your identity.`}
              </p>
            </div>

            {modifyStep === 'phone' ? (
              <>
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
                  style={{ width: '100%', height: 56, borderRadius: 16, background: primaryColor, color: getContrastColor(primaryColor), border: 'none', fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                >
                  {modifySearching ? <Loader2 size={20} className="animate-spin" /> : <><Search size={18} /> Find My Booking</>}
                </button>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <input
                    type="text"
                    value={modifyOtp}
                    onChange={e => { setModifyOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setModifyError(''); }}
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                    style={{
                      width: '100%', height: 70, borderRadius: 16,
                      border: `2px solid ${modifyError ? '#EF4444' : primaryColor}`,
                      background: 'rgba(255,255,255,0.05)',
                      fontSize: 32, fontWeight: 800, textAlign: 'center', letterSpacing: 14,
                      color: '#F1F5F9', outline: 'none',
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleModifyVerifyOtp()}
                  />
                  {modifyError && <p style={{ color: '#EF4444', fontSize: 12, fontWeight: 600, marginTop: 8, textAlign: 'center' }}>{modifyError}</p>}
                </div>
                <button
                  onClick={handleModifyVerifyOtp}
                  disabled={modifyOtp.length < 6 || modifyOtpSending}
                  style={{ width: '100%', height: 56, borderRadius: 16, background: modifyOtp.length < 6 ? '#334155' : primaryColor, color: '#fff', border: 'none', fontSize: 16, fontWeight: 800, cursor: modifyOtp.length < 6 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                >
                  {modifyOtpSending ? <Loader2 size={20} className="animate-spin" /> : 'Verify & Continue →'}
                </button>
                <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#64748B' }}>
                  Wrong number?{' '}
                  <span onClick={() => { setModifyStep('phone'); setModifyOtp(''); setModifyError(''); }} style={{ color: primaryColor, fontWeight: 700, cursor: 'pointer' }}>
                    Go back
                  </span>
                  {' · '}
                  <span onClick={handleModifySearch} style={{ color: primaryColor, fontWeight: 700, cursor: 'pointer' }}>
                    Resend OTP
                  </span>
                </p>
              </>
            )}
            <p style={{ textAlign: 'center', color: '#475569', fontSize: 12, marginTop: 16 }}>Rescheduling is only available ≥12 hours before your appointment.</p>
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
                  <Activity size={24} style={{ color: primaryColor }} /> {t('sessionDetails')}
               </h3>
             
               {fetchingConfig ? (
                 <BookingFormSkeleton />
               ) : (
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="input-grid">
                      <FloatingInput label={t('fullName')} icon={User} color={primaryColor} value={form.patientName} onChange={v => handleInputChange('patientName', v)} required />
                      <FloatingInput label={t('phoneNumber')} icon={Phone} color={primaryColor} value={form.patientPhone} onChange={v => handleInputChange('patientPhone', v)} required />
                    </div>
                    <FloatingInput label={t('emailAddress')} type="email" icon={Mail} color={primaryColor} value={form.patientEmail} onChange={v => handleInputChange('patientEmail', v)} required />
                    
                    <div style={{ marginTop: 24 }}>
                       <div style={{ display: 'flex', gap: 16, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <button 
                            type="button"
                            onClick={() => setActiveBookingTab('services')}
                            style={{ padding: '0 0 12px 0', background: 'none', border: 'none', borderBottom: `2px solid ${activeBookingTab === 'services' ? primaryColor : 'transparent'}`, color: activeBookingTab === 'services' ? '#FFF' : '#64748B', fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                          >
                            {t('singleSessions')}
                          </button>
                          {activeClinic.packages?.length > 0 && (
                            <button 
                              type="button"
                              onClick={() => setActiveBookingTab('packages')}
                              style={{ padding: '0 0 12px 0', background: 'none', border: 'none', borderBottom: `2px solid ${activeBookingTab === 'packages' ? primaryColor : 'transparent'}`, color: activeBookingTab === 'packages' ? '#FFF' : '#64748B', fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                            >
                              {t('valuePackages')}
                            </button>
                          )}
                       </div>

                       <label style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 16, display: 'block' }}>
                          Select {activeBookingTab === 'services' ? t('treatment') : t('preferredPackage')}
                       </label>

                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                          {activeBookingTab === 'services' ? (
                            activeClinic.services?.map(s => (
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
                                <p style={{ fontWeight: 700, fontSize: 13, color: form.service === s.name ? '#F1F5F9' : '#94A3B8', textTransform: 'capitalize' }}>{s.name}</p>
                                <p style={{ fontSize: 13, color: form.service === s.name ? primaryColor : '#64748B', marginTop: 4 }}>₹{s.price} • {s.duration}m</p>
                              </div>
                            ))
                          ) : (
                            activeClinic.packages?.map(pkg => (
                              <div 
                                key={pkg.name}
                                onClick={() => setForm(p => ({ ...p, service: pkg.name }))}
                                style={{ 
                                  padding: '20px', borderRadius: 18, cursor: 'pointer', position: 'relative', overflow: 'hidden',
                                  background: form.service === pkg.name ? `${primaryColor}15` : 'rgba(255,255,255,0.02)',
                                  border: `2px solid ${form.service === pkg.name ? primaryColor : 'rgba(255,255,255,0.05)'}`,
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  transform: form.service === pkg.name ? 'scale(1.02)' : 'none'
                                }}
                              >
                                {pkg.totalSessions >= 5 && (
                                  <div style={{ position: 'absolute', top: 0, right: 0, background: primaryColor, color: getContrastColor(primaryColor), fontSize: 9, fontWeight: 900, padding: '4px 8px', borderRadius: '0 0 0 10px', textTransform: 'uppercase' }}>Best Value</div>
                                )}
                                <p style={{ fontWeight: 700, fontSize: 15, color: form.service === pkg.name ? '#F1F5F9' : '#94A3B8', textTransform: 'capitalize' }}>{pkg.name}</p>
                                <p style={{ fontSize: 13, color: form.service === pkg.name ? primaryColor : '#64748B', marginTop: 4 }}>₹{pkg.price} • {pkg.totalSessions} Sessions</p>
                              </div>
                            ))
                          )}
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

                     <div style={{ marginTop: 32 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                           <div style={{ flex: 1 }}>
                              <FloatingInput 
                                label={t('promoCode')} icon={Tag} color={primaryColor} 
                                value={couponCode} onChange={setCouponCode} 
                                style={{ marginBottom: 0 }}
                              />
                           </div>
                           <button 
                             type="button"
                             onClick={() => {
                               const c = activeClinic.coupons?.find(cp => cp.code?.toUpperCase() === couponCode?.toUpperCase());
                               if (c) {
                                  setAppliedCoupon(c);
                                  alert(`Coupon Observed: ${c.discountPercent}% Off Applied!`);
                               } else {
                                  alert('Invalid or expired coupon code.');
                                  setAppliedCoupon(null);
                                }
                             }}
                             style={{ height: 64, padding: '0 24px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: `1px solid ${appliedCoupon ? '#10B981' : 'rgba(255,255,255,0.1)'}`, color: appliedCoupon ? '#10B981' : '#94A3B8', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                           >
                             {appliedCoupon ? <Check size={18} /> : t('apply')}
                           </button>
                        </div>
                        {appliedCoupon && (
                          <p style={{ fontSize: 12, color: '#10B981', fontWeight: 600, marginTop: 8, marginLeft: 16 }}>
                             ✨ Success! {appliedCoupon.discountPercent}% discount will be applied to your final payment.
                          </p>
                        )}
                     </div>

                    <div style={{ marginTop: 24, opacity: 0.9 }}>
                      <FloatingInput label={t('problemDescription')} type="textarea" color={primaryColor} value={form.complaints} onChange={v => handleInputChange('complaints', v)} />
                    </div>

                    <button 
                      type="submit" disabled={loading}
                      style={{ 
                        height: 72, marginTop: 40, borderRadius: 20, 
                        background: primaryColor, color: getContrastColor(primaryColor), 
                        border: 'none', fontSize: 18, fontWeight: 800, cursor: 'pointer',
                        boxShadow: `0 15px 40px ${primaryColor}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
                      }}
                      className="glow-button"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : (
                        <>{t('confirmBooking')} <ArrowRight size={20} /></>
                      )}
                    </button>
                  </form>
               )}
            </div>
          </Reveal>

          {/* Right: Clinical Identity & Social Proof */}
          <div style={{ display: 'grid', gap: 24, alignContent: 'start' }}>
             
             {/* 🎖️ Professional Expert Profile */}
             <Reveal>
               <div className="glass-card" style={{ padding: 32, border: `2px solid ${primaryColor}20`, background: `linear-gradient(145deg, rgba(30,41,59,0.7), rgba(15,23,42,0.9))` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                     <div style={{ 
                        width: 80, height: 80, borderRadius: 24, 
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32, fontWeight: 800, color: getContrastColor(primaryColor),
                        boxShadow: `0 10px 30px ${primaryColor}30`,
                        overflow: 'hidden'
                     }}>
                        {activeClinic.physioPhoto ? (
                          <img src={activeClinic.physioPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Physio" />
                        ) : (activeClinic.physioName?.charAt(0) || 'D')}
                     </div>
                     <div>
                        <h4 style={{ fontSize: 20, fontWeight: 800, color: '#F8FAFC', marginBottom: 4, textTransform: 'capitalize' }}>
                          {activeClinic.physioName}
                        </h4>
                         <p style={{ fontSize: 13, color: primaryColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                           {activeClinic.qualifications || 'Expert Physiotherapist'}
                         </p>
                         {activeClinic.yearsExperience && (
                           <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: 600 }}>
                              {activeClinic.yearsExperience} {t('experience')}
                           </p>
                         )}
                         {activeClinic.showLanguages && activeClinic.languages?.length > 0 && (
                           <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                              {activeClinic.languages.map(lang => (
                                <span key={lang} style={{ padding: '4px 10px', background: `${primaryColor}10`, border: `1px solid ${primaryColor}25`, borderRadius: 6, fontSize: 10, fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                   {lang}
                                </span>
                              ))}
                           </div>
                         )}
                     </div>
                  </div>

                  <div style={{ display: 'grid', gap: 16 }}>
                    {activeClinic.address && (
                      <div style={{ display: 'flex', gap: 12, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                         <MapPin size={20} style={{ color: primaryColor, shrink: 0 }} />
                         <div style={{ textAlign: 'left' }}>
                            <p style={{ fontSize: 11, fontWeight: 800, color: primaryColor, textTransform: 'uppercase', marginBottom: 4 }}>{t('physicalClinic')}</p>
                            <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.5 }}>{activeClinic.address}</p>
                         </div>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: 12 }}>
                       <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', color: '#CBD5E1', fontSize: 13 }}>
                          <Phone size={16} color={primaryColor} /> {activeClinic.phone || 'Contact us'}
                       </div>
                    </div>

                    {(activeClinic.facebook || activeClinic.instagram || activeClinic.youtube || activeClinic.linkedin || activeClinic.googleReviews || activeClinic.justDial) && (
                       <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          {activeClinic.facebook && <SocialLink href={activeClinic.facebook} icon={Facebook} color={primaryColor} />}
                          {activeClinic.instagram && <SocialLink href={activeClinic.instagram} icon={Instagram} color={primaryColor} />}
                          {activeClinic.youtube && <SocialLink href={activeClinic.youtube} icon={Youtube} color={primaryColor} />}
                          {activeClinic.linkedin && <SocialLink href={activeClinic.linkedin} icon={Linkedin} color={primaryColor} />}
                          {activeClinic.googleReviews && <SocialLink href={activeClinic.googleReviews} icon={Star} color="#FABB05" />}
                          {activeClinic.justDial && <SocialLink href={activeClinic.justDial} icon={Globe} color="#4B3BC2" />}
                       </div>
                    )}
                  </div>
               </div>
             </Reveal>

             {/* 🛡️ Clinical Trust Badges */}
             <div ref={addToRefs} className="reveal glass-card" style={{ padding: 32 }}>
                <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, color: '#F1F5F9', display: 'flex', alignItems: 'center', gap: 8 }}>
                   <ShieldCheck size={18} style={{ color: '#10B981' }} /> Trust & Safety
                </h4>
                <div style={{ display: 'grid', gap: 16 }}>
                   <div style={{ display: 'flex', gap: 12 }}>
                      <CheckCircle2 size={16} style={{ color: '#10B981', marginTop: 2, shrink: 0 }} />
                      <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>HIPAA-Compliant Encrypted Medical Consultations.</p>
                   </div>
                   <div style={{ display: 'flex', gap: 12 }}>
                      <CheckCircle2 size={16} style={{ color: '#10B981', marginTop: 2, shrink: 0 }} />
                      <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5 }}>Instant Confirmation via WhatsApp & Email.</p>
                   </div>
                </div>
             </div>

             {(activeClinic.whatsappNumber || activeClinic.whatsapp || activeClinic.phone) && (
               <div ref={addToRefs} className="reveal glass-card" style={{ padding: 32, background: `${primaryColor}08`, border: `1px solid ${primaryColor}25` }}>
                  <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, color: '#F1F5F9' }}>{t('directSupport')}</h4>
                  <WhatsAppButton
                     phone={activeClinic.whatsappNumber || activeClinic.whatsapp || activeClinic.phone}
                     clinicName={activeClinic.clinicName || activeClinic.name || 'Clinic'}
                     inline
                  />
               </div>
             )}

             {/* Social Review Card */}
             {activeClinic.googleReviewUrl && (
               <div ref={addToRefs} className="reveal glass-card" style={{ padding: 32, textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 16 }}>
                     {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="#FACC15" color="#FACC15" />)}
                  </div>
                  <p style={{ fontSize: 14, fontStyle: 'italic', color: '#CBD5E1', lineHeight: 1.6, marginBottom: 16 }}>
                    "Highly recommended for anyone looking for professional ortho-recovery."
                  </p>
                  <a 
                    href={activeClinic.googleReviewUrl} target="_blank" rel="noreferrer"
                    style={{ fontSize: 13, fontWeight: 700, color: primaryColor, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    View on Google Business <ChevronRight size={14} />
                  </a>
               </div>
             )}
          </div>
        </div>
      </section>

      {/* ⭐ Testimonials Section */}
      {activeClinic.showTestimonials && (
        <section style={{ padding: '0 24px 120px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
            <div ref={addToRefs} className="reveal">
              <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, marginBottom: 40, color: '#F1F5F9' }}>Patient <span style={{ color: primaryColor }}>{t('successStories')}</span></h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {(activeClinic.testimonials?.length > 0 ? activeClinic.testimonials : [
                { name: 'Anil Mehta', text: 'Incredibly knowledgeable. My chronic back pain is significantly better after just 4 sessions under the director\'s care.', rating: 5 },
                { name: 'Sonal Verma', text: 'The clinic is clean and modern, and the online booking is so seamless. No waiting, just professional care.', rating: 5 },
                { name: 'Kushal Shah', text: 'Highly recommend for sports injury rehab. They have state-of-the-art evidence-based treatment protocols.', rating: 5 }
              ]).map((t, i) => (
                <div key={i} className="reveal glass-card" ref={addToRefs} style={{ padding: 32, textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', color: '#F59E0B', gap: 4, marginBottom: 16 }}>
                    {[...Array(t.rating || 5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                  <p style={{ fontSize: 14, color: '#CBD5E1', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 24 }}>"{t.text}"</p>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#F8FAFC' }}>{t.name}</p>
                    <p style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Verified Patient Focus</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 🗺️ Contact & Location Hub */}
      {activeClinic.address && (
        <section style={{ padding: '0 24px 120px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            
             {/* Left: Contact Info Card */}
             <div className="reveal glass-card" ref={addToRefs} style={{ padding: 40, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ fontSize: 32, fontWeight: 900, color: '#F8FAFC', marginBottom: 32 }}>Let's <span style={{ color: primaryColor }}>{t('connect')}</span></h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                   <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${primaryColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: primaryColor }}>
                         <Phone size={20} />
                      </div>
                      <div>
                         <p style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('callWhatsapp')}</p>
                         <p style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>{activeClinic.phone || '+91 92281 08454'}</p>
                      </div>
                   </div>
                   <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${primaryColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: primaryColor }}>
                         <Mail size={20} />
                      </div>
                      <div>
                         <p style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('emailAddress')}</p>
                         <p style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>{activeClinic.email || 'onlinepthelp@gmail.com'}</p>
                      </div>
                   </div>
                   <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${primaryColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: primaryColor }}>
                         <MapPin size={20} />
                      </div>
                      <div>
                         <p style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('clinicLocation')}</p>
                         <p style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', lineHeight: 1.4 }}>{activeClinic.address}</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Right: Compact Map Card */}
             <div className="reveal" ref={addToRefs} style={{ borderRadius: 32, overflow: 'hidden', height: 350, border: '1px solid rgba(255,255,255,0.05)', boxShadow: `0 20px 50px ${primaryColor}10` }}>
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(activeClinic.address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                  allowFullScreen
                ></iframe>
             </div>

          </div>
        </section>
      )}

      {/* 🖼️ Commercial Ad Banner */}
      {activeClinic.showAdBanner && (
        <section style={{ padding: '0 24px 120px' }}>
          <div className="reveal" ref={addToRefs} style={{ 
            maxWidth: 1200, 
            margin: '0 auto', 
            overflow: 'hidden', 
            borderRadius: 32, 
            border: '1px solid rgba(255,255,255,0.1)', 
            boxShadow: `0 30px 60px ${primaryColor}20`,
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(20px)',
            minHeight: activeClinic.adBanner ? 'auto' : 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {activeClinic.adBanner ? (
              <img src={activeClinic.adBanner} style={{ width: '100%', height: 'auto', display: 'block' }} alt="Clinic Promotion" />
            ) : (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Image size={48} color={primaryColor} style={{ marginBottom: 16, opacity: 0.5 }} />
                <p style={{ color: '#94A3B8', fontSize: 14, fontWeight: 600, letterSpacing: '1px' }}>PROMOTIONAL BOARD ACTIVE</p>
                <p style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>Upload your banner in the Admin Panel to show here.</p>
              </div>
            )}
          </div>
        </section>
      )}
      <footer style={{ padding: '100px 24px', textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#09090B', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 48, marginBottom: 80 }}>
                {/* Brand Section */}
                <div>
                   <div style={{ 
                      width: activeClinic.logoWidth || 64, 
                      height: activeClinic.logoHeight || 64, 
                      marginBottom: 24, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                   }}>
                      {activeClinic?.logo ? (
                        <img 
                          src={activeClinic.logo} 
                          alt={activeClinic.clinicName} 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'contain'
                          }} 
                        />
                      ) : (
                        <div style={{ 
                          width: '100%', 
                          height: '100%', 
                          borderRadius: (activeClinic.logoWidth || activeClinic.logoHeight) ? 8 : '50%', 
                          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: Math.min((activeClinic.logoWidth || 64) * 0.4, 24), 
                          fontWeight: 900, 
                          color: '#FFF' 
                        }}>
                           {activeClinic?.clinicName?.charAt(0) || 'C'}
                        </div>
                      )}
                   </div>
                   <h4 style={{ fontSize: 24, fontWeight: 900, color: '#F8FAFC', marginBottom: 16 }}>{activeClinic.clinicName}</h4>
                   <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.6, maxWidth: 300 }}>
                      Provided expert clinical care and physical rehabilitation under the leadership of {activeClinic.physioName}.
                   </p>
                   <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                      {activeClinic.facebook && <SocialLink href={activeClinic.facebook} icon={Facebook} color={primaryColor} />}
                      {activeClinic.instagram && <SocialLink href={activeClinic.instagram} icon={Instagram} color={primaryColor} />}
                      {activeClinic.youtube && <SocialLink href={activeClinic.youtube} icon={Youtube} color={primaryColor} />}
                      {activeClinic.linkedin && <SocialLink href={activeClinic.linkedin} icon={Linkedin} color={primaryColor} />}
                      {activeClinic.googleReviews && <SocialLink href={activeClinic.googleReviews} icon={Star} color="#FABB05" />}
                      {activeClinic.justDial && <SocialLink href={activeClinic.justDial} icon={Globe} color="#4B3BC2" />}
                   </div>
                </div>

                {/* Direct Contact Section */}
                <div>
                   <h5 style={{ fontSize: 13, fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 24 }}>{t('directContact')}</h5>
                   <div style={{ display: 'grid', gap: 16 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: '#CBD5E1' }}>
                         <Phone size={18} color={primaryColor} /> <span>{activeClinic.phone}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: '#CBD5E1' }}>
                         <Mail size={18} color={primaryColor} /> <span>{activeClinic.email || 'Contact Clinic'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: '#CBD5E1' }}>
                         <MapPin size={18} color={primaryColor} style={{ marginTop: 2 }} /> <span style={{ fontSize: 14 }}>{activeClinic.address}</span>
                      </div>
                   </div>
                </div>

                {/* Booking Navigation */}
                <div>
                   <h5 style={{ fontSize: 13, fontWeight: 800, color: primaryColor, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 24 }}>{t('patientPortal')}</h5>
                   <div style={{ display: 'grid', gap: 12 }}>
                      <a href="#booking" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#FFF'}>Schedule Appointment</a>
                      <div onClick={() => setShowModifyModal(true)} style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 14, cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#FFF'}>{t('manageBooking')}</div>
                      <a href="/privacy" style={{ color: '#94A3B8', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color = '#FFF'}>{t('privacyTerms')}</a>
                   </div>
                </div>
             </div>

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 13, color: '#64748B' }}>
                   &copy; {new Date().getFullYear()} {activeClinic.clinicName}. All rights reserved.
                </p>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                   <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '1px', color: '#334155', textTransform: 'uppercase' }}>
                      Powered by OnlinePT • v1.1.0
                   </p>
                </div>
             </div>
          </div>
      </footer>

      {/* ── Floating WhatsApp Support ────────────────────────────────── */}
      {(activeClinic.whatsappNumber || activeClinic.whatsapp || activeClinic.phone) && (
        <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999 }}>
           <WhatsAppButton 
              phone={activeClinic.whatsappNumber || activeClinic.whatsapp || activeClinic.phone}
              clinicName={activeClinic.clinicName}
           />
        </div>
      )}
    </div>
  );
}
