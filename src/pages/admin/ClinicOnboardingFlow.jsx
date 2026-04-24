import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { db, auth } from '@/firebase/config';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import {
  CheckCircle2, ChevronRight, Stethoscope, Paintbrush,
  ShieldCheck, Rocket, LayoutTemplate, AlertCircle, Loader2, MessageSquare,
} from 'lucide-react';

const API_BASE = import.meta.env.DEV ? 'http://localhost:5001' : '';

// Brand name — hardcoded for the SaaS onboarding engine
const BRAND_NAME = 'OnlinePT';

const T = {
  primary: '#14A3A8',
  primaryDark: '#0E8084',
  primaryLight: 'rgba(20, 163, 168, 0.15)',
  accent: '#5AC8FA',
  bg: '#09090B',
  surface: 'rgba(255, 255, 255, 0.03)',
  border: 'rgba(255, 255, 255, 0.08)',
  ink: '#F8FAFC',
  ink2: '#CBD5E1',
  ink3: '#94A3B8',
  ink4: '#475569',
  glass: 'rgba(9, 9, 11, 0.85)',
  bgCard: 'rgba(255, 255, 255, 0.03)',
  white: '#FFFFFF',
  blur: 'blur(20px)',
  r: { sm: 12, md: 20, lg: 32, xl: 40 },
};

// ── simple controlled input ───────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div className="space-y-2">
      <label style={{ color: T.ink2, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }} className="block ml-1">{label}</label>
      {children}
      {hint && <p style={{ color: T.ink4, fontSize: 11 }} className="ml-1">{hint}</p>}
    </div>
  );
}

function TextInput({ className = '', ...props }) {
  return (
    <input
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1.5px solid ${T.border}`,
        borderRadius: 12,
        color: T.ink,
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      className={`w-full px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-ink4 ${className}`}
      {...props}
    />
  );
}

export default function ClinicOnboardingFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subdomainStatus, setSubdomainStatus] = useState({ status: 'idle', message: '' }); // 'idle' | 'checking' | 'available' | 'taken'

  // ── WhatsApp OTP verification state ──────────────────────────────────────────
  const [countryCode, setCountryCode] = useState('91');
  const [rawPhone, setRawPhone] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [phoneOtpError, setPhoneOtpError] = useState('');

  // Common country codes list
  const COUNTRY_CODES = [
    { code: '91',  flag: '🇮🇳', name: 'India' },
    { code: '1',   flag: '🇺🇸', name: 'USA/Canada' },
    { code: '44',  flag: '🇬🇧', name: 'UK' },
    { code: '61',  flag: '🇦🇺', name: 'Australia' },
    { code: '971', flag: '🇦🇪', name: 'UAE' },
    { code: '65',  flag: '🇸🇬', name: 'Singapore' },
    { code: '60',  flag: '🇲🇾', name: 'Malaysia' },
    { code: '49',  flag: '🇩🇪', name: 'Germany' },
    { code: '33',  flag: '🇫🇷', name: 'France' },
    { code: '81',  flag: '🇯🇵', name: 'Japan' },
    { code: '86',  flag: '🇨🇳', name: 'China' },
    { code: '55',  flag: '🇧🇷', name: 'Brazil' },
    { code: '27',  flag: '🇿🇦', name: 'South Africa' },
    { code: '92',  flag: '🇵🇰', name: 'Pakistan' },
    { code: '880', flag: '🇧🇩', name: 'Bangladesh' },
    { code: '94',  flag: '🇱🇰', name: 'Sri Lanka' },
    { code: '977', flag: '🇳🇵', name: 'Nepal' },
  ];

  // Helper: combine countryCode + rawPhone → formData.phone
  const buildFullPhone = (cc, num) => `${cc}${num.replace(/\D/g, '')}`;

  const handlePhonePartChange = (newCc, newRaw) => {
    const full = buildFullPhone(newCc, newRaw);
    setFormData(prev => ({ ...prev, phone: full }));
    setPhoneVerified(false);
    setPhoneOtpSent(false);
    setPhoneOtp('');
    setPhoneOtpError('');
  };

  // Pre-fill from sessionStorage if available (set by SaaS landing page signup)
  const getInitialFormData = () => {
    try {
      const saved = sessionStorage.getItem('pendingOnboarding');
      if (saved) {
        const data = JSON.parse(saved);
        // We don't remove it yet in case of refresh
        return {
          physioName: data.physioName || '',
          email: data.email || '',
          clinicName: data.clinicName || '',
          subdomain: data.subdomain || '',
          phone: data.phone || '',
          primaryColor: '#14A3A8',
          secondaryColor: '#5AC8FA',
          plan: '',
        };
      }
    } catch {}
    return {
      physioName: '', email: '', clinicName: '', subdomain: '',
      phone: '', primaryColor: '#14A3A8', secondaryColor: '#5AC8FA', plan: '',
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  // ── Subdomain availability check ──────────────────────────────────────────────
  const checkSubdomain = async (value) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!clean) {
      setSubdomainStatus({ status: 'idle', message: '' });
      return;
    }
    if (clean.length < 3) {
      setSubdomainStatus({ status: 'idle', message: 'At least 3 characters' });
      return;
    }
    setSubdomainStatus({ status: 'checking', message: 'Verifying...' });
    try {
      if (db) {
        const snap = await getDoc(doc(db, 'clinics', clean));
        setSubdomainStatus(snap.exists()
          ? { status: 'taken', message: 'Sorry, this address is not available' }
          : { status: 'available', message: 'Congrats! This address is available' });
      } else {
        setSubdomainStatus({ status: 'available', message: 'Congrats! This address is available' });
      }
    } catch {
      setSubdomainStatus({ status: 'idle', message: '' });
    }
  };

  // Check availability automatically on load if subdomain is pre-filled
  useEffect(() => {
    if (formData.subdomain) {
      checkSubdomain(formData.subdomain);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'subdomain') {
      const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setFormData((prev) => ({ ...prev, subdomain: clean }));
      checkSubdomain(clean);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  // ── WhatsApp OTP functions ────────────────────────────────────────────────────
  async function sendPhoneOTP() {
    if (!formData.phone) { setPhoneOtpError('Please enter your WhatsApp number first.'); return; }
    setPhoneOtpLoading(true);
    setPhoneOtpError('');
    try {
      const res = await axios.post(`${API_BASE}/api/notifications/send-otp`, {
        phone: formData.phone,
        purpose: 'signup',
        userName: formData.physioName || 'Doctor',
      });
      if (res.data.success) {
        setPhoneOtpSent(true);
        setPhoneOtp('');
      } else {
        setPhoneOtpError(res.data.error || 'Failed to send OTP. Try again.');
      }
    } catch (err) {
      setPhoneOtpError(err.response?.data?.error || 'Failed to send OTP. Check your number.');
    }
    setPhoneOtpLoading(false);
  }

  async function verifyPhoneOTP() {
    if (!phoneOtp || phoneOtp.length !== 6) { setPhoneOtpError('Please enter the 6-digit OTP.'); return; }
    setPhoneOtpLoading(true);
    setPhoneOtpError('');
    try {
      const res = await axios.post(`${API_BASE}/api/notifications/verify-otp`, {
        phone: formData.phone,
        otp: phoneOtp,
      });
      if (res.data.success) {
        setPhoneVerified(true);
        setPhoneOtpSent(false);
        setPhoneOtpError('');
      } else {
        setPhoneOtpError(res.data.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setPhoneOtpError(err.response?.data?.error || 'Verification failed. Try again.');
    }
    setPhoneOtpLoading(false);
  }

  // ── Firebase provisioning ────────────────────────────────────────────────────
  const handleCompleteSignUp = async () => {
    setLoading(true);
    setError('');

    try {
      const clinicId = formData.subdomain;
      if (!db) {
        await new Promise((r) => setTimeout(r, 2000));
        setStep(5);
        setLoading(false);
        return;
      }

      const getUid = () => {
        return new Promise((resolve) => {
          if (auth?.currentUser?.uid) return resolve(auth.currentUser.uid);
          const unsub = onAuthStateChanged(auth, (user) => {
            unsub();
            resolve(user?.uid || 'unknown');
          });
          setTimeout(() => resolve('unknown'), 3000);
        });
      };

      const uid = await getUid();

      await setDoc(doc(collection(db, 'clinics'), clinicId), {
        uid,
        clinicId,
        clinicName: formData.clinicName,
        physioName: formData.physioName,
        email: formData.email,
        phone: formData.phone || '',
        whatsapp: formData.phone || '',
        domain: `${clinicId}.onlinept.in`,
        subdomain: clinicId,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        tagline: `Expert physiotherapy consultations online`,
        plan: formData.plan,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionStatus: 'pending_approval',
        workingHours: { start: '09:00', end: '19:00', days: [1, 2, 3, 4, 5, 6] },
        slotDurationMinutes: 30,
        videoMode: 'zoom',
        razorpayEnabled: false,
        currency: 'INR',
        createdAt: serverTimestamp(),
        createdBy: 'master_admin',
      });

      setStep(5);
    } catch (err) {
      console.error('Clinic provisioning failed:', err);
      if (window.location.hostname === 'localhost') {
        setStep(5);
      } else {
        setError(`Provisioning error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const stepMeta = [
    { n: 1, label: 'Profile',  Icon: Stethoscope },
    { n: 2, label: 'Identity', Icon: Paintbrush },
    { n: 3, label: 'Package',  Icon: LayoutTemplate },
    { n: 4, label: 'Deploy',   Icon: Rocket },
  ];

  const Stepper = () => (
    <div className="w-full max-w-2xl flex justify-between mb-16 relative px-4 mx-auto">
      {stepMeta.map(({ n, label, Icon }, idx) => {
        const isActive = step === n;
        const isPast   = step > n;
        return (
          <div key={n} className="flex flex-col items-center flex-1 relative z-10">
            <div 
              style={{
                background: isPast ? T.primary : isActive ? `${T.primary}20` : 'rgba(255,255,255,0.02)',
                borderColor: isPast || isActive ? T.primary : T.border,
                color: isPast ? T.white : isActive ? T.primary : T.ink4,
                boxShadow: isActive ? `0 0 20px ${T.primary}40` : 'none',
                transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 z-10"
            >
              {isPast ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5 shadow-sm" />}
            </div>
            <p style={{ color: isActive ? T.ink : T.ink4, fontSize: 11, fontWeight: isActive ? 800 : 500 }} className="mt-3 uppercase tracking-widest">{label}</p>
            {idx < stepMeta.length - 1 && (
              <div
                style={{ background: isPast ? T.primary : T.border, left: '50%', right: '-50%' }}
                className="absolute top-6 h-[1.5px] z-0 transition-colors duration-700 opacity-60"
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const commonFeatures = [
    'Appointment Booking',
    'Patient Records',
    'WhatsApp Alerts',
    'Secure Video Calls',
    'Digital Prescriptions',
    'Custom Branding'
  ];

  const plans = [
    { 
      id: 'Starter',        
      price: '₹0', 
      billing: '/15 days',
      desc: 'Full clinical access for 15 days.',
      features: commonFeatures
    },
    { 
      id: 'Monthly',            
      price: '₹351', 
      billing: '/month',
      desc: 'Flexible monthly billing for growing clinics.',
      features: commonFeatures
    },
    { 
      id: 'Annual', 
      price: '₹2,500', 
      billing: '/year',
      desc: 'Maximum value clinical ecosystem.',
      features: commonFeatures
    },
  ];

  return (
    <div style={{ background: T.bg, color: T.ink }} className="min-h-screen flex flex-col font-sans overflow-x-hidden">
      <style>{`
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
        .cosmic-blob { position: fixed; border-radius: 50%; filter: blur(80px); z-index: 0; opacity: 0.15; pointer-events: none; }
      `}</style>
      
      {/* Dynamic Background */}
      <div className="cosmic-blob w-96 h-96 top-0 -left-20" style={{ background: T.primary }}></div>
      <div className="cosmic-blob w-80 h-80 bottom-0 -right-20" style={{ background: T.accent }}></div>

      <header style={{ background: T.glass, backdropFilter: T.blur, borderBottomColor: T.border }} className="border-b px-8 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div style={{ background: T.primary }} className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <span style={{ fontFamily: "'Manrope', sans-serif" }} className="text-xl font-extrabold tracking-tight">
            Online<span style={{ color: T.primary }}>PT</span> <span style={{ fontWeight: 400, opacity: 0.5, marginLeft: 6 }}>Setup</span>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs font-bold text-ink4 tracking-widest uppercase">
          Provisioning Instance 0422
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center py-16 px-4 z-10 relative">
        <div className="w-full max-w-4xl">
          {step < 5 && <Stepper />}

          <Card style={{ background: T.bgCard, backdropFilter: T.blur, borderColor: T.border }} className="shadow-2xl overflow-hidden border-t-0">
            {/* Step 1: Details */}
            {step === 1 && (
              <div className="p-4 sm:p-10">
                <h2 style={{ fontFamily: "'Manrope', sans-serif" }} className="text-3xl font-extrabold mb-2 tracking-tight">Welcome to the Cloud</h2>
                <p style={{ color: T.ink3 }} className="mb-10 text-base">Let's create your clinical environment.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                   <Field label="Physiotherapist Name">
                     <TextInput name="physioName" value={formData.physioName} onChange={handleChange} placeholder="Dr. Firstname Lastname" />
                   </Field>
                   <Field label="Professional Email">
                     <TextInput type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@clinic.com" />
                   </Field>
                   {/* ── WhatsApp Number + OTP Verification ── */}
                 <div style={{ gridColumn: '1 / -1' }}>
                   <Field label="WhatsApp Number" hint="We'll send a 6-digit OTP to this WhatsApp number to verify it.">

                     {/* Row 1: Country code dropdown + number input + Send OTP button */}
                     <div style={{ display: 'flex', gap: 8 }}>

                       {/* Country Code Dropdown */}
                       <select
                         value={countryCode}
                         onChange={(e) => {
                           setCountryCode(e.target.value);
                           handlePhonePartChange(e.target.value, rawPhone);
                         }}
                         disabled={phoneVerified}
                         style={{
                           background: 'rgba(255,255,255,0.05)',
                           border: `1.5px solid ${T.border}`,
                           borderRadius: 12, color: T.ink,
                           padding: '12px 10px', fontSize: 14, fontWeight: 700,
                           cursor: phoneVerified ? 'default' : 'pointer',
                           outline: 'none', minWidth: 100,
                         }}
                       >
                         {COUNTRY_CODES.map(c => (
                           <option key={c.code} value={c.code} style={{ background: '#1a1a1a' }}>
                             {c.flag} +{c.code}
                           </option>
                         ))}
                       </select>

                       {/* Phone Number Input */}
                       <input
                         type="tel"
                         value={rawPhone}
                         onChange={(e) => {
                           const digits = e.target.value.replace(/\D/g, '');
                           setRawPhone(digits);
                           handlePhonePartChange(countryCode, digits);
                         }}
                         placeholder="9876543210"
                         disabled={phoneVerified}
                         style={{
                           flex: 1, background: 'rgba(255,255,255,0.03)',
                           border: `1.5px solid ${T.border}`, borderRadius: 12,
                           color: T.ink, padding: '12px 16px', fontSize: 15,
                           fontWeight: 600, outline: 'none',
                           opacity: phoneVerified ? 0.6 : 1,
                         }}
                       />

                       {/* Verified badge OR Send OTP button */}
                       {phoneVerified ? (
                         <div style={{
                           display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px',
                           background: 'rgba(16, 185, 129, 0.1)', border: '1.5px solid rgba(16, 185, 129, 0.3)',
                           borderRadius: 12, color: '#10B981', fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap'
                         }}>
                           <CheckCircle2 size={16} /> Verified
                         </div>
                       ) : (
                         <button
                           type="button"
                           onClick={sendPhoneOTP}
                           disabled={!rawPhone || rawPhone.length < 7 || phoneOtpLoading}
                           style={{
                             padding: '0 18px', borderRadius: 12, border: `1.5px solid ${T.primary}`,
                             background: phoneOtpSent ? 'transparent' : T.primary,
                             color: phoneOtpSent ? T.primary : T.white,
                             fontWeight: 800, fontSize: 13, cursor: 'pointer',
                             display: 'flex', alignItems: 'center', gap: 6,
                             opacity: (!rawPhone || rawPhone.length < 7 || phoneOtpLoading) ? 0.5 : 1,
                             whiteSpace: 'nowrap', transition: 'all 0.2s'
                           }}
                         >
                           {phoneOtpLoading && !phoneOtpSent
                             ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                             : <MessageSquare size={15} />}
                           {phoneOtpSent ? 'Resend' : 'Send OTP'}
                         </button>
                       )}
                     </div>

                     {/* Full number preview */}
                     {rawPhone && !phoneVerified && (
                       <p style={{ marginTop: 6, marginLeft: 2, fontSize: 11, color: T.ink4, fontWeight: 600 }}>
                         Sending to: <span style={{ color: T.ink2 }}>+{countryCode} {rawPhone}</span>
                       </p>
                     )}

                     {/* OTP Input row — shown after OTP is sent */}
                     {phoneOtpSent && !phoneVerified && (
                       <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                         <input
                           type="text"
                           value={phoneOtp}
                           onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                           placeholder="• • • • • •"
                           maxLength={6}
                           autoFocus
                           style={{
                             flex: 1, background: 'rgba(255,255,255,0.03)',
                             border: `1.5px solid ${phoneOtp.length === 6 ? T.primary : T.border}`,
                             borderRadius: 12, color: T.ink, padding: '12px 16px',
                             fontSize: 22, fontWeight: 800, textAlign: 'center',
                             letterSpacing: '10px', outline: 'none', transition: 'border-color 0.2s'
                           }}
                           onKeyDown={(e) => { if (e.key === 'Enter') verifyPhoneOTP(); }}
                         />
                         <button
                           type="button"
                           onClick={verifyPhoneOTP}
                           disabled={phoneOtp.length !== 6 || phoneOtpLoading}
                           style={{
                             padding: '0 22px', borderRadius: 12, border: 'none',
                             background: phoneOtp.length === 6 ? T.primary : 'rgba(255,255,255,0.06)',
                             color: T.white, fontWeight: 800, fontSize: 14,
                             cursor: phoneOtp.length === 6 ? 'pointer' : 'not-allowed',
                             display: 'flex', alignItems: 'center', gap: 6,
                             opacity: (phoneOtp.length !== 6 || phoneOtpLoading) ? 0.5 : 1,
                             transition: 'all 0.2s'
                           }}
                         >
                           {phoneOtpLoading
                             ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                             : <ShieldCheck size={16} />}
                           Verify
                         </button>
                       </div>
                     )}

                     {/* Error message */}
                     {phoneOtpError && (
                       <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: '#F87171', fontSize: 12, fontWeight: 600 }}>
                         <AlertCircle size={14} /> {phoneOtpError}
                       </div>
                     )}
                   </Field>
                 </div>
                   <Field label="Clinic Full Name">
                     <TextInput name="clinicName" value={formData.clinicName} onChange={handleChange} placeholder="e.g. Zen Physio Center" />
                   </Field>
                </div>

                <div className="mt-8">
                  <Field label="Claim Your Subdomain" hint="This will be your permanent clinical handle.">
                    <div className="flex group">
                      <TextInput
                        name="subdomain"
                        value={formData.subdomain}
                        onChange={handleChange}
                        placeholder="yourclinic"
                        className="rounded-r-none border-r-0"
                      />
                      <div 
                        style={{ background: 'rgba(255,255,255,0.02)', borderColor: T.border, color: T.ink4 }}
                        className="inline-flex items-center px-6 rounded-r-xl border-1.5 border-l-0 font-bold text-sm tracking-wide"
                      >
                        .onlinept.in
                      </div>
                    </div>
                    {formData.subdomain && (
                      <div className="flex items-center gap-2 mt-3 ml-1">
                        {subdomainStatus.status === 'checking' ? <Loader2 className="w-4 h-4 animate-spin text-ink4" /> : subdomainStatus.status === 'available' ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                        <span style={{ 
                          color: subdomainStatus.status === 'available' ? T.primary : subdomainStatus.status === 'taken' ? '#F87171' : T.ink4,
                          fontSize: 12, fontWeight: 600
                        }}>
                          {subdomainStatus.message}
                        </span>
                      </div>
                    )}
                  </Field>
                </div>

                <div className="mt-12 flex justify-end">
                   <Button size="lg" onClick={handleNext} disabled={!formData.physioName || !formData.clinicName || !formData.subdomain || subdomainStatus.status !== 'available' || !phoneVerified}>
                      Continue to Branding <ChevronRight className="w-5 h-5 ml-2" />
                   </Button>
                </div>
              </div>
            )}

            {/* Step 2: Branding */}
            {step === 2 && (
              <div className="p-4 sm:p-10">
                <h2 style={{ fontFamily: "'Manrope', sans-serif" }} className="text-3xl font-extrabold mb-2 tracking-tight">Clinic Identity</h2>
                <p style={{ color: T.ink3 }} className="mb-10 text-base">Your brand, your rules. Choose your color palette.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                   <div className="space-y-8">
                      {[
                        { label: 'Primary Brand Color', name: 'primaryColor',   hint: 'Used for buttons, links, and primary UI highlights.' },
                        { label: 'Secondary Accent',  name: 'secondaryColor', hint: 'Used for secondary buttons and subtle accents.' },
                      ].map(({ label, name, hint }) => (
                        <Field key={name} label={label} hint={hint}>
                          <div className="flex items-center gap-4">
                            <div className="relative group">
                              <input
                                type="color"
                                name={name}
                                value={formData[name]}
                                onChange={handleChange}
                                style={{ background: 'transparent' }}
                                className="w-16 h-16 rounded-2xl cursor-pointer border-2 border-border p-1"
                              />
                            </div>
                            <TextInput
                              name={name}
                              value={formData[name]}
                              onChange={handleChange}
                              className="w-36 font-mono text-center uppercase"
                              maxLength={7}
                            />
                          </div>
                        </Field>
                      ))}
                   </div>

                   <div style={{ background: 'rgba(255,255,255,0.01)', border: `1px solid ${T.border}` }} className="rounded-3xl p-8 flex flex-col justify-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-ink4 mb-6">Real-time Interface Simulation</p>
                      <div style={{ background: T.bg, border: `1px solid ${T.border}` }} className="rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                         <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                               <div style={{ background: formData.primaryColor }} className="w-6 h-6 rounded-md" />
                               <span className="font-bold text-xs">{formData.clinicName || 'Clinic'}</span>
                            </div>
                            <div className="h-2 w-8 rounded-full bg-border" />
                         </div>
                         <div className="h-3 w-full rounded bg-surface mb-3" />
                         <div className="h-3 w-2/3 rounded bg-surface mb-8" />
                         <div 
                           style={{ background: formData.primaryColor, boxShadow: `0 8px 20px ${formData.primaryColor}30` }} 
                           className="h-10 w-full rounded-xl flex items-center justify-center font-bold text-[10px] text-white"
                         >
                           BOOK APPOINTMENT
                         </div>
                      </div>
                   </div>
                </div>

                <div className="mt-12 flex justify-between">
                   <Button variant="ghost" onClick={handleBack}>Go Back</Button>
                   <Button size="lg" onClick={handleNext}>Confirm Branding <ChevronRight className="w-5 h-5 ml-2" /></Button>
                </div>
              </div>
            )}

            {/* Step 3: Plan */}
            {step === 3 && (
              <div className="p-4 sm:p-10">
                <h2 style={{ fontFamily: "'Manrope', sans-serif" }} className="text-3xl font-extrabold mb-2 tracking-tight">Select Membership</h2>
                <p style={{ color: T.ink3 }} className="mb-10 text-base">Transparent pricing for scaling clinics. 14 Days free.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {plans.map((p) => {
                    const active = formData.plan === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setFormData(prev => ({ ...prev, plan: p.id }))}
                        style={{
                          background: active ? `${T.primary}05` : 'transparent',
                          borderColor: active ? T.primary : T.border,
                          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                        className={`p-8 rounded-[2rem] border-2 cursor-pointer flex flex-col group relative ${active ? 'scale-105 shadow-2xl z-20' : 'hover:border-primary/30 z-10'}`}
                      >
                        {active && (
                          <div style={{ background: T.primary }} className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-tighter">
                            SELECTED
                          </div>
                        )}
                        <h4 className="text-xl font-extrabold mb-1 tracking-tight">{p.id}</h4>
                        <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-2xl font-black">{p.price}</span>
                          <span className="text-xs text-ink4 font-bold">{p.billing}</span>
                        </div>
                        <p style={{ color: T.ink3 }} className="text-xs font-medium mb-6 leading-relaxed flex-grow">{p.desc}</p>
                        <ul className="space-y-3 pt-6 border-t border-border mt-auto">
                           {p.features.map((f, i) => (
                             <li key={i} className="flex items-center gap-2 text-[10px] font-bold text-ink2 uppercase tracking-wide">
                                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> {f}
                             </li>
                           ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-12 flex justify-between">
                   <Button variant="ghost" onClick={handleBack}>Go Back</Button>
                   <Button size="lg" onClick={handleNext} disabled={!formData.plan}>
                      Review & Provision <ChevronRight className="w-5 h-5 ml-2" />
                   </Button>
                </div>
              </div>
            )}

            {/* Step 4: Final Launch */}
            {step === 4 && (
              <div className="p-4 sm:p-10 text-center">
                 <div style={{ animation: 'float 4s ease-in-out infinite' }} className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-2xl shadow-primary/20">
                    <Rocket className="w-12 h-12 text-primary" />
                 </div>
                 <h2 style={{ fontFamily: "'Manrope', sans-serif" }} className="text-4xl font-black mb-3 tracking-tighter uppercase">Launch Protocol</h2>
                 <p style={{ color: T.ink3 }} className="mb-12 max-w-md mx-auto text-base">Your clinical ecosystem is ready for deployment. Please review your portal details.</p>

                 <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }} className="max-w-md mx-auto rounded-3xl p-8 mb-12 space-y-4 text-left">
                    {[
                      { l: 'Clinical ID', v: formData.subdomain },
                      { l: 'Public URI', v: `${formData.subdomain}.onlinept.in` },
                      { l: 'Physician',  v: formData.physioName },
                      { l: 'Plan Type',  v: formData.plan },
                    ].map(item => (
                      <div key={item.l} className="flex justify-between items-center group">
                         <span className="text-[10px] font-black text-ink4 uppercase tracking-widest">{item.l}</span>
                         <span className="text-sm font-extrabold group-hover:text-primary transition-colors">{item.v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-4 border-t border-border">
                       <span className="text-[10px] font-black text-ink4 uppercase tracking-widest">Brand DNA</span>
                       <div className="flex gap-2.5">
                          <div style={{ background: formData.primaryColor }} className="w-6 h-6 rounded-lg shadow-lg" />
                          <div style={{ background: formData.secondaryColor }} className="w-6 h-6 rounded-lg shadow-lg" />
                       </div>
                    </div>
                 </div>

                 {error && (
                   <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }} className="mb-8 p-4 rounded-2xl border flex items-center gap-3 text-red-400 text-sm font-bold">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      {error}
                   </div>
                 )}

                 <div className="flex flex-col items-center gap-4">
                    <Button 
                      size="lg" 
                      className="w-full max-w-md h-16 shadow-2xl shadow-primary/30 text-base font-black tracking-widest"
                      onClick={handleCompleteSignUp}
                      loading={loading}
                    >
                       CLAIM 15-DAY CLOUD TRIAL
                    </Button>
                    <button onClick={handleBack} disabled={loading} className="text-xs font-bold text-ink4 uppercase tracking-widest hover:text-ink transition-colors mt-2">Modify Configuration</button>
                 </div>
              </div>
            )}

            {/* Step 5: Success */}
            {step === 5 && (
              <div className="p-4 sm:p-16 text-center">
                 <div className="w-28 h-28 bg-primary/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border-2 border-primary/40 shadow-2xl shadow-primary/40">
                    <CheckCircle2 className="w-14 h-14 text-primary" />
                 </div>
                 <h2 style={{ fontFamily: "'Manrope', sans-serif" }} className="text-4xl font-black mb-4 tracking-tighter uppercase">Deployed to Cloud</h2>
                 <p style={{ color: T.ink3 }} className="mb-12 max-w-lg mx-auto text-lg leading-relaxed font-medium">
                   Welcome to the future of physiotherapy, <strong>{formData.physioName.split(' ')[0]}</strong>.<br />
                   Your clinical environment is being provisioned. Soon our backoffice will look into the application and accept/reject your application.
                 </p>

                 <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.primary}30` }} className="max-w-sm mx-auto p-8 rounded-[2rem] mb-12">
                     <p className="text-[10px] font-black text-ink4 uppercase tracking-widest mb-3">Permanent Access Link</p>
                     <p style={{ color: T.primary }} className="text-2xl font-black tracking-tighter">
                        {formData.subdomain}.onlinept.in
                     </p>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-5 justify-center mt-8">
                    <Button size="lg" className="px-10 h-14" onClick={() => navigate('/dashboard-login')}>
                       Log In to Dashboard
                    </Button>
                    <Button size="lg" variant="outline" className="px-10 h-14" onClick={() => window.location.reload()}>
                       Onboard Another
                    </Button>
                 </div>
              </div>
            )}
          </Card>
        </div>
      </main>

      <footer style={{ background: 'rgba(0,0,0,0.4)', borderTop: `1px solid ${T.border}` }} className="py-12 px-8 flex flex-col md:flex-row items-center justify-between gap-8 z-10">
         <div className="flex flex-col gap-2">
            <span className="font-bold text-sm tracking-tight">OnlinePT Cloud <span style={{ color: T.primary }}>SaaS</span></span>
            <p className="text-[10px] font-bold text-ink4 uppercase tracking-widest">Global Digital Health Infrastructure</p>
         </div>
         <div className="flex gap-12">
            {['Privacy', 'Security', 'Legal'].map(l => (
              <span key={l} className="text-[10px] font-bold text-ink4 uppercase tracking-widest hover:text-ink cursor-pointer transition-colors">{l}</span>
            ))}
         </div>
      </footer>
    </div>
  );
}
