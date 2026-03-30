import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '@/firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
  Plus,
  StickyNote,
  Globe,
  Settings,
  Smartphone,
  Shield,
  MapPin,
  HeartPulse,
  Video,
  CheckCircle,
  Zap,
  Wallet,
  Wrench,
  ArrowRight,
  Mail,
  Lock,
  User,
  Building,
  GraduationCap,
  ChevronDown,
} from 'lucide-react';

// Design tokens
const C = {
  blue: '#007AFF',
  blueLight: '#E8F1FF',
  blueDark: '#0055CC',
  green: '#34C759', // kept for reference, prefer blue for branding
  surface: '#F5F5F7',
  white: '#FFFFFF',
  ink: '#1D1D1F',
  ink2: '#3A3A3C',
  ink3: '#636366',
  ink4: '#AEAEB2',
  border: 'rgba(0,0,0,0.08)',
  glassBg: 'rgba(255,255,255,0.72)',
  glassBlur: 'blur(20px)',
  shadowSm: '0 2px 8px rgba(0,0,0,0.06)',
  shadowMd: '0 8px 30px rgba(0,0,0,0.10)',
  shadowLg: '0 20px 60px rgba(0,0,0,0.14)',
  rSm: 12,
  rMd: 20,
  rLg: 28,
  rXl: 40,
};

// Shared style helpers
const glassCard = {
  background: C.white,
  border: `1px solid ${C.border}`,
  borderRadius: C.rMd,
  boxShadow: C.shadowSm,
};

const sectionInner = {
  maxWidth: 1080,
  margin: '0 auto',
};

const eyebrowStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  color: C.blue,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  marginBottom: 16,
};

const sectionTitleStyle = {
  fontFamily: "'Manrope', sans-serif",
  fontSize: 'clamp(32px, 4.5vw, 52px)',
  fontWeight: 800,
  letterSpacing: -1.5,
  lineHeight: 1.1,
  color: C.ink,
  marginBottom: 16,
};

const sectionSubStyle = {
  fontSize: 18,
  color: C.ink3,
  fontWeight: 400,
  maxWidth: 520,
  lineHeight: 1.6,
};

// Reveal hook
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.opacity = '1';
            e.target.style.transform = 'none';
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// FAQ data
const faqs = [
  {
    q: 'How quickly will my page go live?',
    a: 'The moment you complete sign-up, your subdomain is live. You can start sharing your page URL with patients immediately — no waiting period.',
  },
  {
    q: 'Do I need any technical knowledge?',
    a: 'Zero. If you can use WhatsApp, you can manage your OnlinePT page. The admin panel is designed to be intuitive for busy clinicians.',
  },
  {
    q: 'Can I change my services and fees anytime?',
    a: 'Yes, fully. Log into your admin panel at any time and update your services, fees, availability, and profile details. Changes reflect instantly on your public page.',
  },
  {
    q: 'What does the subdomain look like?',
    a: 'Your page will be at yourname.onlinept.in. For example: aruna.onlinept.in — clean, professional, and easy to share anywhere.',
  },
  {
    q: 'Is OnlinePT free forever?',
    a: 'The basic page is free. We\'ll introduce optional premium features in the future (like payment integration and analytics) — but early sign-ups get extended free access.',
  },
  {
    q: 'Who created OnlinePT?',
    a: 'OnlinePT was founded by Dr. Aruna Koladiya — physiotherapist and Autophagy Consultant. Built from real clinical experience, for real clinicians.',
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    subdomain: '',
    clinicName: '',
    city: '',
    qualification: '',
    email: '',
    password: '',
  });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useReveal();

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError('');
    try {
      const cred = auth
        ? await createUserWithEmailAndPassword(auth, formData.email, formData.password)
        : null;
      const uid = cred?.user?.uid || 'demo-uid';
      sessionStorage.setItem('pendingOnboarding', JSON.stringify({
        uid,
        physioName: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        clinicName: formData.clinicName,
        subdomain: formData.subdomain,
        city: formData.city,
        qualification: formData.qualification,
      }));
      navigate(`/saas/onboarding?uid=${uid}`);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setSignupError('An account with this email already exists. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setSignupError('Password must be at least 6 characters.');
      } else {
        setSignupError(err.message || 'Sign up failed. Please try again.');
      }
      setSignupLoading(false);
    }
  };

  // Shared responsive grid styles
  const gridStyle = (cols) => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: 20,
  });

  // ── NAVBAR ────────────────────────────────────────────────
  const navbarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 40px',
    height: 64,
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: C.glassBlur,
    WebkitBackdropFilter: C.glassBlur,
    borderBottom: `1px solid ${C.border}`,
    boxShadow: scrolled ? C.shadowSm : 'none',
    transition: 'box-shadow 0.3s',
  };

  const logoMarkStyle = {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: `linear-gradient(135deg, ${C.blue} 0%, #5AC8FA 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,122,255,0.35)',
  };

  const logoTextStyle = {
    fontFamily: "'Manrope', sans-serif",
    fontWeight: 800,
    fontSize: 18,
    color: C.ink,
    letterSpacing: -0.5,
  };

  // ── HERO ─────────────────────────────────────────────────
  const heroStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '120px 24px 80px',
    position: 'relative',
    background: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,122,255,0.10) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(90,200,250,0.08) 0%, transparent 60%), ${C.white}`,
  };

  const heroBadgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: C.glassBg,
    backdropFilter: C.glassBlur,
    WebkitBackdropFilter: C.glassBlur,
    border: `1px solid ${C.border}`,
    padding: '6px 16px 6px 6px',
    borderRadius: 100,
    fontSize: 13,
    fontWeight: 500,
    color: C.ink2,
    marginBottom: 28,
  };

  const heroBadgeDotStyle = {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${C.blue}, #5AC8FA)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const heroH1Style = {
    fontFamily: "'Manrope', sans-serif",
    fontSize: 'clamp(42px, 7vw, 80px)',
    fontWeight: 800,
    lineHeight: 1.08,
    letterSpacing: -2.5,
    color: C.ink,
    maxWidth: 820,
  };

  const heroEmStyle = {
    fontStyle: 'normal',
    background: `linear-gradient(135deg, ${C.blue} 0%, #5AC8FA 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const heroSubStyle = {
    fontSize: 'clamp(16px, 2vw, 20px)',
    fontWeight: 400,
    color: C.ink3,
    maxWidth: 540,
    margin: '20px auto 36px',
    lineHeight: 1.6,
  };

  // ── HERO MOCKUP ──────────────────────────────────────────
  const mockupStyle = {
    width: 'min(780px, 90vw)',
    margin: '64px auto 0',
    borderRadius: C.rLg,
    boxShadow: `${C.shadowLg}, 0 0 0 1px ${C.border}`,
    overflow: 'hidden',
    background: C.white,
  };

  const mockupBodyStyle = {
    padding: '28px 28px 20px',
    background: 'linear-gradient(160deg, #F8FBFF 0%, #FFFFFF 100%)',
    minHeight: 200,
    display: 'flex',
    gap: 20,
    alignItems: 'flex-start',
  };

  // ── TRUST BAR ─────────────────────────────────────────────
  const trustBarStyle = {
    background: C.surface,
    padding: '28px 24px',
    textAlign: 'center',
  };

  // ── HOW / FEATURES / PREVIEW / FAQ / FOOTER ──────────────
  const sectionStyle = {
    padding: '100px 24px',
    position: 'relative',
  };

  // ── SIGNUP FORM ───────────────────────────────────────────
  const formCardStyle = {
    ...glassCard,
    borderRadius: C.rLg,
    padding: 40,
    boxShadow: C.shadowLg,
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.white, color: C.ink, overflowX: 'hidden' }}>

      {/* ── NAVBAR ────────────────────────────── */}
      <nav style={navbarStyle}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={logoMarkStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <rect x="11" y="5" width="2" height="14" rx="1"/>
              <rect x="7" y="9" width="2" height="10" rx="1"/>
              <rect x="15" y="9" width="2" height="10" rx="1"/>
            </svg>
          </div>
          <span style={logoTextStyle}>Online<span style={{ color: C.blue }}>PT</span></span>
        </Link>

        <ul style={{ display: 'flex', gap: 32, listStyle: 'none', margin: 0, padding: 0 }}>
          {['#how', '#features', '#preview', '#faq'].map((href) => (
            <li key={href}>
              <a href={href} style={{ fontSize: 14, fontWeight: 500, color: C.ink2, textDecoration: 'none', transition: 'color 0.2s' }}
                 onMouseEnter={(e) => e.target.style.color = C.blue}
                 onMouseLeave={(e) => e.target.style.color = C.ink2}>
                {href === '#how' ? 'How It Works' : href === '#features' ? 'Features' : href === '#preview' ? 'Your Page' : 'FAQ'}
              </a>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/dashboard-login" style={{ fontSize: 14, fontWeight: 500, color: C.ink2, textDecoration: 'none', padding: '8px 16px', borderRadius: 20, transition: 'background 0.2s, color 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.ink; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.ink2; }}>
            Sign In
          </Link>
          <a href="#signup" style={{ fontSize: 14, fontWeight: 600, color: C.white, textDecoration: 'none', padding: '9px 20px', background: C.blue, borderRadius: 20, boxShadow: '0 2px 8px rgba(0,122,255,0.30)', transition: 'transform 0.15s, box-shadow 0.15s, background 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.blueDark; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,122,255,0.40)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.blue; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,122,255,0.30)'; }}>
            Get Started Free →
          </a>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────── */}
      <section style={heroStyle}>
        <div style={heroBadgeStyle}>
          <div style={heroBadgeDotStyle}>
            <StickyNote size={11} color="white" />
          </div>
          Built by Physiotherapists, for Physiotherapists
        </div>

        <h1 style={heroH1Style}>
          Your Clinic.<br/><em style={heroEmStyle}>Online.</em> In Minutes.
        </h1>

        <p style={heroSubStyle}>
          Get your own professional page at <strong>yourname.onlinept.in</strong> —
          take online consultations, showcase your services, and grow your practice.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="#signup" style={{ fontSize: 16, fontWeight: 600, color: C.white, background: C.blue, padding: '14px 28px', borderRadius: 100, textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,122,255,0.35)', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.15s, transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.blueDark; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,122,255,0.40)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.blue; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,122,255,0.35)'; }}>
            <HeartPulse size={18} /> Create My Free Page
          </a>
          <a href="#how" style={{ fontSize: 16, fontWeight: 500, color: C.ink2, background: C.glassBg, backdropFilter: C.glassBlur, WebkitBackdropFilter: C.glassBlur, border: `1px solid ${C.border}`, padding: '14px 28px', borderRadius: 100, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.2s, transform 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.glassBg; e.currentTarget.style.transform = 'translateY(0)'; }}>
            See How It Works ↓
          </a>
        </div>

        {/* Browser Mockup */}
        <div style={mockupStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#F2F2F2', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
            <div style={{ flex: 1, background: C.white, borderRadius: 6, padding: '4px 12px', margin: '0 12px', fontSize: 12, color: C.ink3, fontFamily: "'DM Sans', sans-serif", border: `1px solid ${C.border}` }}>
              aruna.onlinept.in
            </div>
          </div>
          <div style={mockupBodyStyle}>
            <div style={{ flex: 1 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${C.blue}, #5AC8FA)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 20, marginBottom: 12 }}>
                A
              </div>
              <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 18, color: C.ink }}>Dr. Aruna Koladiya</div>
              <div style={{ fontSize: 12, color: C.ink3, margin: '2px 0 12px' }}>Physiotherapist · Surat, Gujarat</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {['Spine Care', 'Sports Rehab', 'Yoga Therapy', 'Trigger Point'].map((tag) => (
                  <span key={tag} style={{ fontSize: 11, fontWeight: 500, background: C.blueLight, color: C.blue, padding: '3px 10px', borderRadius: 100 }}>{tag}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {[{ n: '500+', l: 'Patients' }, { n: '15+', l: 'Years Exp.' }, { n: '4.9★', l: 'Rating' }].map((s) => (
                  <div key={s.l} style={{ flex: 1, background: C.glassBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 8, textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 16, color: C.ink }}>{s.n}</div>
                    <div style={{ fontSize: 10, color: C.ink4 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: 140, flexShrink: 0 }}>
              <div style={{ background: C.blue, color: C.white, borderRadius: C.rSm, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>CONSULTATION</div>
                <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 22, fontWeight: 800 }}>₹499</div>
                <div style={{ fontSize: 10, opacity: 0.7, margin: '2px 0 10px' }}>45 min · HD Video</div>
                <button style={{ width: '100%', background: C.white, color: C.blue, border: 'none', borderRadius: 8, padding: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Book Now</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ─────────────────────────── */}
      <div style={trustBarStyle}>
        <p style={{ fontSize: 13, fontWeight: 500, color: C.ink4, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 20 }}>
          Trusted by physiotherapists across India
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {['Free to set up', 'No tech skills needed', 'Live in under 5 minutes', 'Your own subdomain'].map((p) => (
            <div key={p} className="trust-bar-pill" style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.white, border: `1px solid ${C.border}`, borderRadius: 100, padding: '8px 18px', fontSize: 14, fontWeight: 500, color: C.ink2, boxShadow: C.shadowSm }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.blue }} />
              {p}
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ──────────────────────── */}
      <section id="how" style={sectionStyle}>
        <div style={sectionInner}>
          <div style={eyebrowStyle}>How It Works</div>
          <h2 style={sectionTitleStyle}>Three steps to your<br/>online clinic.</h2>
          <p style={sectionSubStyle}>No developers. No design experience. No technical setup. Just your expertise, online.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 56 }} className="reveal-grid">
            {[
              { num: '01', Icon: User, iconBg: C.blueLight, title: 'Sign Up Free', body: 'Create your account in 60 seconds. Tell us your name, clinic, and specialisation. That\'s it.' },
              { num: '02', Icon: Settings, iconBg: '#FFF3E0', title: 'Customise Your Page', body: 'Add your photo, services, fees, and availability from your personal admin panel. Update anytime.' },
              { num: '03', Icon: Zap, iconBg: '#E8F8EE', title: 'Share & Consult', body: <>Share <strong>yourname.onlinept.in</strong> with patients. They book, you consult via HD video call.</> },
            ].map(({ num, Icon, iconBg, title, body }) => (
              <div key={title} style={{ ...glassCard, padding: '32px 28px', position: 'relative', overflow: 'hidden', transition: 'transform 0.25s, box-shadow 0.25s' }}
                   onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = C.shadowMd; }}
                   onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = C.shadowSm; }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.blue}, #5AC8FA)`, borderRadius: '3px 3px 0 0' }} />
                <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 52, fontWeight: 800, color: C.blueLight, lineHeight: 1, marginBottom: 16 }}>{num}</div>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <Icon size={22} color={C.blue} />
                </div>
                <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 10, letterSpacing: -0.3 }}>{title}</h3>
                <p style={{ fontSize: 15, color: C.ink3, lineHeight: 1.65 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────── */}
      <section id="features" style={{ ...sectionStyle, background: C.surface }}>
        <div style={sectionInner}>
          <div style={eyebrowStyle}>Features</div>
          <h2 style={sectionTitleStyle}>Everything your online<br/>practice needs.</h2>
          <p style={sectionSubStyle}>One platform. Complete control. Built specifically for physiotherapists.</p>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 56 }}>
            {/* Big card spanning 2 cols */}
            <div style={{ ...glassCard, gridColumn: 'span 2', display: 'flex', gap: 28, alignItems: 'center', padding: 28, transition: 'transform 0.25s, box-shadow 0.25s' }}
                 onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = C.shadowMd; }}
                 onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = C.shadowSm; }}>
              <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 16, background: `linear-gradient(135deg, ${C.blueLight}, rgba(90,200,250,0.2))`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Globe size={28} color={C.blue} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8, letterSpacing: -0.2 }}>Your Own Subdomain</h3>
                <p style={{ fontSize: 14, color: C.ink3, lineHeight: 1.6 }}>
                  Get a professional, memorable URL like <strong>abc.onlinept.in</strong> — looks great on your card, WhatsApp bio, and Instagram. Patients trust a dedicated page over a generic booking link.
                </p>
                <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, background: C.blueLight, color: C.blue, padding: '3px 10px', borderRadius: 100, marginTop: 12 }}>yourname.onlinept.in</span>
              </div>
            </div>

            {/* Regular feature cards */}
            {[
              { Icon: Video, title: 'HD Video Consultations', body: 'Conduct professional assessments via integrated HD video. No third-party apps needed.' },
              { Icon: Settings, title: 'Personal Admin Panel', body: 'Full control over your profile, services, fees, and schedule. Update in real-time.' },
              { Icon: Smartphone, title: 'Mobile-First Design', body: 'Your patient page looks stunning on every device — phone, tablet, or desktop.' },
              { Icon: Shield, title: 'Secure & Private', body: 'Patient data is encrypted and protected. HIPAA-aligned practices built in by default.' },
              { Icon: MapPin, title: 'Made for India', body: 'Indian pricing, multilingual support, and built by a practising physiotherapist from Surat.' },
            ].map(({ Icon, title, body }) => (
              <div key={title} style={{ ...glassCard, padding: 28, transition: 'transform 0.25s, box-shadow 0.25s' }}
                   onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = C.shadowMd; }}
                   onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = C.shadowSm; }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${C.blueLight}, rgba(90,200,250,0.2))`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={24} color={C.blue} />
                </div>
                <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 8, letterSpacing: -0.2 }}>{title}</h3>
                <p style={{ fontSize: 14, color: C.ink3, lineHeight: 1.6 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUBDOMAIN PREVIEW ─────────────────── */}
      <section id="preview" style={sectionStyle}>
        <div style={sectionInner}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', marginTop: 56 }} className="reveal-grid">
            <div>
              <div style={eyebrowStyle}>Your Patient Page</div>
              <h2 style={sectionTitleStyle}>What your<br/>page looks like.</h2>
              <p style={sectionSubStyle}>A clean, professional one-page website your patients will love — fully managed by you.</p>
              <ul style={{ listStyle: 'none', marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14, padding: 0 }}>
                {[
                  'Doctor profile with photo & qualifications',
                  'Services list with fees',
                  'Online booking button',
                  'Patient reviews & ratings',
                  'WhatsApp & contact links',
                  'Languages spoken & clinic address',
                ].map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 15, color: C.ink2, lineHeight: 1.5 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: `linear-gradient(135deg, ${C.blue}, #5AC8FA)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <CheckCircle size={12} color="white" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Phone Mockup */}
            <div className="phone-preview" style={{ width: 280, margin: '0 auto', background: C.ink, borderRadius: 40, padding: 12, boxShadow: C.shadowLg }}>
              <div style={{ background: C.white, borderRadius: 30, overflow: 'hidden' }}>
                <div style={{ background: `linear-gradient(135deg, ${C.blue} 0%, #5AC8FA 100%)`, padding: '24px 16px 20px', color: C.white, textAlign: 'center' }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={24} color="white" />
                  </div>
                  <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 16 }}>Dr. Aruna Koladiya</div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>BPT · MIAP · Autophagy Consultant</div>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.ink4, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Services</div>
                  {[
                    { name: 'Initial Consultation', price: '₹499' },
                    { name: 'Follow-up Session', price: '₹299' },
                    { name: 'Yoga Assessment', price: '₹699' },
                  ].map((s) => (
                    <div key={s.name} style={{ background: C.surface, borderRadius: 10, padding: '10px 12px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>{s.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{s.price}</span>
                    </div>
                  ))}
                  <button style={{ display: 'block', width: '100%', background: C.blue, color: C.white, border: 'none', borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 600, textAlign: 'center', marginTop: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    Book a Consultation →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SIGN UP ───────────────────────────── */}
      <section id="signup" style={{ ...sectionStyle, background: 'linear-gradient(160deg, #F0F6FF 0%, #FFFFFF 100%)' }}>
        <div style={sectionInner}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="reveal-grid">

            {/* Perks */}
            <div className="signup-perks">
              <div style={eyebrowStyle}>Get Started</div>
              <h2 style={sectionTitleStyle}>Claim your free<br/>physio page today.</h2>
              <p style={sectionSubStyle}>Join physiotherapists across India who've already taken their practice online.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 32 }}>
                {[
                  { Icon: Zap, iconBg: C.blueLight, title: 'Live in Under 5 Minutes', body: 'Sign up, fill your details, and your page is instantly live at your subdomain.' },
                  { Icon: Wallet, iconBg: '#E8F8EE', title: 'Free to Start', body: 'No credit card. No hidden charges. Start free, upgrade when you need more.' },
                  { Icon: Wrench, iconBg: '#FFF3E0', title: 'Full Admin Control', body: 'Update your page, add services, change fees — all from your own admin panel.' },
                ].map(({ Icon, iconBg, title, body }) => (
                  <div key={title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 14, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} color={C.blue} />
                    </div>
                    <div>
                      <h4 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 3 }}>{title}</h4>
                      <p style={{ fontSize: 14, color: C.ink3, lineHeight: 1.5 }}>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Card */}
            <div className="form-card" style={formCardStyle}>
              <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 24, fontWeight: 800, color: C.ink, marginBottom: 6, letterSpacing: -0.5 }}>Create Your Free Page</div>
              <div style={{ fontSize: 14, color: C.ink3, marginBottom: 28 }}>Takes less than 2 minutes — no tech skills needed.</div>

              <form onSubmit={handleSignup}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink2, marginBottom: 6 }}>First Name</label>
                    <input name="firstName" value={formData.firstName} onChange={handleFormChange} placeholder="First Name" required style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${C.border}`, borderRadius: C.rSm, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.ink, background: C.white, outline: 'none', appearance: 'none' }}
                           onFocus={(e) => { e.target.style.borderColor = C.blue; e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.12)'; }}
                           onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink2, marginBottom: 6 }}>Last Name</label>
                    <input name="lastName" value={formData.lastName} onChange={handleFormChange} placeholder="Last Name" required style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${C.border}`, borderRadius: C.rSm, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.ink, background: C.white, outline: 'none', appearance: 'none' }}
                           onFocus={(e) => { e.target.style.borderColor = C.blue; e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.12)'; }}
                           onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink2, marginBottom: 6 }}>Your Subdomain</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${C.border}`, borderRadius: C.rSm, overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                       onFocusWithin={(e) => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.12)'; }}
                       ref={(el) => el && el.addEventListener('blur', () => { el.style.borderColor = C.border; el.style.boxShadow = 'none'; }, { once: true })}>
                    <div style={{ background: C.surface, padding: '12px 14px', fontSize: 14, color: C.ink3, whiteSpace: 'nowrap', borderRight: `1.5px solid ${C.border}` }}>
                      <User size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                    </div>
                    <input name="subdomain" value={formData.subdomain} onChange={handleFormChange} required style={{ flex: 1, border: 'none', borderRadius: 0, boxShadow: 'none', padding: '12px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.ink, background: C.white, outline: 'none' }} />
                    <div style={{ background: C.surface, padding: '12px 14px', fontSize: 14, color: C.ink3, whiteSpace: 'nowrap', borderLeft: `1.5px solid ${C.border}` }}>.onlinept.in</div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink2, marginBottom: 6 }}>Clinic / Practice Name</label>
                  <input name="clinicName" value={formData.clinicName} onChange={handleFormChange} placeholder="Your Clinic Name" required style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${C.border}`, borderRadius: C.rSm, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.ink, background: C.white, outline: 'none' }}
                         onFocus={(e) => { e.target.style.borderColor = C.blue; e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.12)'; }}
                         onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink2, marginBottom: 6 }}>City</label>
                    <input name="city" value={formData.city} onChange={handleFormChange} placeholder="City" required style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${C.border}`, borderRadius: C.rSm, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.ink, background: C.white, outline: 'none' }}
                           onFocus={(e) => { e.target.style.borderColor = C.blue; e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.12)'; }}
                           onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink2, marginBottom: 6 }}>Qualification</label>
                    <input name="qualification" value={formData.qualification} onChange={handleFormChange} placeholder="BPT, MPT" required style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${C.border}`, borderRadius: C.rSm, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.ink, background: C.white, outline: 'none' }}
                           onFocus={(e) => { e.target.style.borderColor = C.blue; e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.12)'; }}
                           onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink2, marginBottom: 6 }}>Email Address</label>
                  <input name="email" type="email" value={formData.email} onChange={handleFormChange} placeholder="Email Address" required style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${C.border}`, borderRadius: C.rSm, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.ink, background: C.white, outline: 'none' }}
                         onFocus={(e) => { e.target.style.borderColor = C.blue; e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.12)'; }}
                         onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
                </div>

                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink2, marginBottom: 6 }}>Password</label>
                  <input name="password" type="password" value={formData.password} onChange={handleFormChange} placeholder="Choose Password" required style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${C.border}`, borderRadius: C.rSm, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: C.ink, background: C.white, outline: 'none' }}
                         onFocus={(e) => { e.target.style.borderColor = C.blue; e.target.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.12)'; }}
                         onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
                </div>

                {signupError && (
                  <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 12, color: '#DC2626', fontSize: 13 }}>
                    {signupError}
                  </div>
                )}
                <button type="submit" disabled={signupLoading} style={{ width: '100%', padding: 15, background: signupLoading ? C.blueDark : C.blue, color: C.white, border: 'none', borderRadius: C.rSm, fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, cursor: signupLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(0,122,255,0.30)', marginTop: 8, transition: 'background 0.15s' }}>
                  {signupLoading ? 'Creating Account…' : 'Create My Page Free →'}
                </button>
                <p style={{ fontSize: 12, color: C.ink4, textAlign: 'center', marginTop: 12 }}>By signing up you agree to our Terms of Service. No credit card required.</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────── */}
      <section id="faq" style={{ ...sectionStyle, background: C.surface }}>
        <div style={{ ...sectionInner, maxWidth: 1080 }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ ...eyebrowStyle, justifyContent: 'center' }}>FAQ</div>
            <h2 style={sectionTitleStyle}>Questions from<br/>fellow physios.</h2>
          </div>
          <div className="faq-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 48 }}>
            {faqs.map((faq, idx) => (
              <div key={idx} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.rMd, overflow: 'hidden', boxShadow: C.shadowSm }}>
                <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, color: C.ink, textAlign: 'left', gap: 12, transition: 'background 0.15s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = C.surface}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                  {faq.q}
                  <Plus size={20} color={C.blue} style={{ transform: openFaq === idx ? 'rotate(45deg)' : 'none', transition: 'transform 0.25s', flexShrink: 0 }} />
                </button>
                <div style={{ maxHeight: openFaq === idx ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease, padding 0.3s ease', padding: openFaq === idx ? '0 24px 20px' : '0 24px' }}>
                  <div style={{ fontSize: 14, color: C.ink3, lineHeight: 1.65 }}>{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────── */}
      <footer style={{ background: C.ink, color: C.white, padding: '60px 24px 36px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48, gap: 40, flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 300 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${C.blue} 0%, #5AC8FA 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <rect x="11" y="5" width="2" height="14" rx="1"/>
                    <rect x="7" y="9" width="2" height="10" rx="1"/>
                    <rect x="15" y="9" width="2" height="10" rx="1"/>
                  </svg>
                </div>
                <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 17, color: C.white }}>Online<span style={{ color: '#5AC8FA' }}>PT</span></span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                Professional online physiotherapy pages for clinicians across India. Built by a physio, for physios.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 60, flexWrap: 'wrap' }}>
              {[
                { heading: 'Platform', links: ['How It Works', 'Features', 'Your Page', 'Sign Up Free'] },
                { heading: 'Support', links: ['FAQ', 'Contact Us', 'WhatsApp Support'] },
                { heading: 'Legal', links: ['Privacy Policy', 'Terms of Service'] },
              ].map(({ heading, links }) => (
                <div key={heading}>
                  <h5 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 16 }}>{heading}</h5>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, padding: 0 }}>
                    {links.map((link) => (
                      <li key={link}>
                        <a href="#" style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', transition: 'color 0.2s' }}
                           onMouseEnter={(e) => e.target.style.color = C.white}
                           onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.75)'}>
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>© 2025 OnlinePT · Your Online Physiotherapy Platform</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.blue }} />
              All systems operational
            </div>
          </div>
        </div>
      </footer>

      {/* Global styles for animations */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .reveal-grid .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .reveal-grid .reveal.visible,
        .reveal.visible {
          opacity: 1;
          transform: none;
        }
        @media (max-width: 768px) {
          nav { padding: 0 20px !important; }
          nav ul { display: none !important; }
          .hero-mockup-inner { flex-direction: column; }
          [style*="grid-template-columns: repeat(3, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
          [style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          [style*="grid-column: span 2"] {
            grid-column: span 1 !important;
            flex-direction: column !important;
          }
          .footer-top { flex-direction: column !important; }
          .footer-cols { gap: 32px !important; }
          section[id] { padding: 60px 16px !important; }
          #signup > div > div { gap: 0 !important; }
          .phone-preview { display: none !important; }
          .trust-bar-pill { font-size: 12px !important; padding: 6px 12px !important; }
          .faq-grid { grid-template-columns: 1fr !important; }
          .mockup-body { flex-direction: column !important; }
          .mockup-body > div:last-child { width: 100% !important; margin-top: 12px; }
          .signup-perks { display: none !important; }
          .form-card { padding: 24px !important; max-width: 100% !important; }
          #signup > div > div { flex-direction: column !important; }
          #signup > div > div > div:first-child { display: none !important; }
          #signup > div > div > div:last-child { width: 100% !important; }
          .features-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .phone-preview-hide-xs { display: none !important; }
        }
      `}</style>
    </div>
  );
}
