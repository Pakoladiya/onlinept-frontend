import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Check, ChevronRight, ArrowRight, Plus,
  Video, Settings, Smartphone, Shield, Globe,
  Sparkles,
} from 'lucide-react';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  blue: '#007AFF',
  blueDark: '#0055CC',
  blueLight: '#E8F1FF',
  green: '#34C759',
  surface: '#F5F5F7',
  white: '#FFFFFF',
  ink: '#1D1D1F',
  ink2: '#3A3A3C',
  ink3: '#636366',
  ink4: '#AEAEB2',
  border: 'rgba(0,0,0,0.08)',
  glass: 'rgba(255,255,255,0.82)',
  glassBg: 'rgba(255,255,255,0.72)',
  blur: 'blur(20px)',
  r: { sm: 12, md: 20, lg: 28, xl: 40 },
  shadowSm: '0 2px 8px rgba(0,0,0,0.06)',
  shadowMd: '0 8px 30px rgba(0,0,0,0.10)',
  shadowLg: '0 20px 60px rgba(0,0,0,0.14)',
};

// ─── FAQ Data ────────────────────────────────────────────────────────────────
const faqs = [
  { q: 'How quickly will my page go live?', a: 'The moment you complete sign-up, your subdomain is live. You can start sharing your page URL with patients immediately — no waiting period.' },
  { q: 'Do I need any technical knowledge?', a: 'Zero. If you can use WhatsApp, you can manage your OnlinePT page. The admin panel is designed to be intuitive for busy clinicians.' },
  { q: 'Can I change my services and fees anytime?', a: 'Yes, fully. Log into your admin panel at any time and update your services, fees, availability, and profile details. Changes reflect instantly on your public page.' },
  { q: 'What does the subdomain look like?', a: 'Your page will be at yourname.onlinept.in. For example: aruna.onlinept.in — clean, professional, and easy to share anywhere.' },
  { q: 'Is OnlinePT free forever?', a: 'The basic page is free. We\'ll introduce optional premium features in the future — but early sign-ups get extended free access.' },
  { q: 'Who created OnlinePT?', a: 'OnlinePT was founded by Dr. Aruna Koladiya — physiotherapist, Autophagy Consultant, and co-founder of Nijanand Fitness Centre, Surat. Built from real clinical experience, for real clinicians.' },
];

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatCard({ icon, title, body, tag, big, delay }) {
  const [vis, setVis] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); observer.unobserve(e.target); } },
      { threshold: 0.12 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="feat-card"
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? 'none' : 'translateY(28px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
        background: T.white,
        borderRadius: T.r.md,
        padding: 28,
        boxShadow: T.shadowSm,
        border: `1px solid ${T.border}`,
        ...(big ? { gridColumn: 'span 2', display: 'flex', gap: 28, alignItems: 'center' } : {}),
      }}
    >
      <div style={{
        width: 52, height: 52, flexShrink: 0,
        borderRadius: 16,
        background: `linear-gradient(135deg, ${T.blueLight}, rgba(90,200,250,0.2))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: big ? 28 : 24, marginBottom: big ? 0 : 16,
      }}>
        {icon}
      </div>
      <div>
        <h3 style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: 18, fontWeight: 700, color: T.ink,
          marginBottom: 8, letterSpacing: '-0.2px',
        }}>{title}</h3>
        <p style={{ fontSize: 14, color: T.ink3, lineHeight: 1.6 }}>{body}</p>
        {tag && (
          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 600,
            background: T.blueLight, color: T.blue,
            padding: '3px 10px', borderRadius: 100, marginTop: 12,
          }}>{tag}</span>
        )}
      </div>
    </div>
  );
}

// ─── How Card ─────────────────────────────────────────────────────────────────
function HowCard({ n, icon, title, body, delay }) {
  const [vis, setVis] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); observer.unobserve(e.target); } },
      { threshold: 0.12 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? 'none' : 'translateY(28px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
        background: T.white,
        border: `1px solid ${T.border}`,
        borderRadius: T.r.md,
        padding: '32px 28px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: T.shadowSm,
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${T.blue}, #5AC8FA)`,
        borderRadius: '3px 3px 0 0',
      }} />
      <div style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: 52, fontWeight: 800,
        color: T.blueLight, lineHeight: 1, marginBottom: 16,
      }}>{n}</div>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: T.blueLight,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, marginBottom: 20,
      }}>{icon}</div>
      <h3 style={{
        fontFamily: "'Manrope', sans-serif",
        fontSize: 20, fontWeight: 700, color: T.ink,
        marginBottom: 10, letterSpacing: '-0.3px',
      }}>{title}</h3>
      <p style={{ fontSize: 15, color: T.ink3, lineHeight: 1.65 }}>{body}</p>
    </div>
  );
}

// ─── Preview Phone ────────────────────────────────────────────────────────────
function PreviewPhone() {
  return (
    <div style={{
      width: 280, margin: '0 auto',
      background: T.ink, borderRadius: 40,
      padding: 12, boxShadow: T.shadowLg,
    }}>
      <div style={{
        background: T.white, borderRadius: 30, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${T.blue} 0%, #5AC8FA 100%)`,
          padding: '24px 16px 20px', color: T.white, textAlign: 'center',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            margin: '0 auto 8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
          <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 16 }}>Dr. Aruna Koladiya</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>BPT · MIAP · Autophagy Consultant</div>
        </div>
        {/* Body */}
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.ink4, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>Services</div>
          {[
            { name: 'Initial Consultation', price: '₹499' },
            { name: 'Follow-up Session', price: '₹299' },
            { name: 'Yoga Assessment', price: '₹699' },
          ].map((s, i) => (
            <div key={i} style={{
              background: T.surface, borderRadius: 10, padding: '10px 12px',
              marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{s.name}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.blue }}>{s.price}</span>
            </div>
          ))}
          <button style={{
            display: 'block', width: '100%', background: T.blue, color: T.white,
            border: 'none', borderRadius: 10, padding: 12,
            fontSize: 14, fontWeight: 600, textAlign: 'center', marginTop: 12,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            Book a Consultation →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a, delay }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: T.white, border: `1px solid ${T.border}`,
      borderRadius: T.r.md, overflow: 'hidden', boxShadow: T.shadowSm,
      ...(open ? {} : {}),
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500,
          color: T.ink, textAlign: 'left', gap: 12,
          transition: 'background 0.15s',
        }}
      >
        {q}
        <svg
          width="20" height="20" flexShrink="0"
          viewBox="0 0 24 24" fill="none"
          stroke={T.blue} strokeWidth="2.5"
          style={{
            flexShrink: 0,
            transform: open ? 'rotate(45deg)' : 'none',
            transition: 'transform 0.25s',
          }}
        >
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      <div style={{
        maxHeight: open ? 200 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.3s ease, padding 0.3s ease',
        fontSize: 14, color: T.ink3, lineHeight: 1.65,
        padding: open ? '0 24px 20px' : '0 24px',
      }}>
        {a}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SaaSLandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [subdomain, setSubdomain] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', clinic: '', city: '', qualification: '', email: '', password: '' });
  const [signupDone, setSignupDone] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSubdomain = (v) => {
    setSubdomain(v.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setSignupDone(true);
    setTimeout(() => setSignupDone(false), 3000);
  };

  const section = (pad = '100px 24px') => ({
    padding: pad, position: 'relative',
  });
  const inner = () => ({ maxWidth: 1080, margin: '0 auto' });
  const eyebrow = () => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 600, color: T.blue,
    letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 16,
  });
  const sectionTitle = () => ({
    fontFamily: "'Manrope', sans-serif",
    fontSize: 'clamp(32px, 4.5vw, 52px)',
    fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1,
    color: T.ink, marginBottom: 16,
  });
  const sectionSub = () => ({
    fontSize: 18, color: T.ink3, fontWeight: 400,
    maxWidth: 520, lineHeight: 1.6,
  });

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: T.white, color: T.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        a { text-decoration: none; }
        @media (max-width: 768px) {
          .how-grid, .features-grid, .preview-wrap, .signup-wrap, .faq-grid { grid-template-columns: 1fr !important; }
          .feat-card.big { flex-direction: column !important; grid-column: span 1 !important; }
          .preview-phone { display: none !important; }
          .footer-top { flex-direction: column !important; }
          .footer-cols { gap: 32px !important; }
          .nav-links { display: none !important; }
          .form-row { grid-template-columns: 1fr !important; }
          .signup-wrap { gap: 40px !important; }
          .how-grid { gap: 16px !important; }
        }
      `}</style>

      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <nav ref={navRef} style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64,
        background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
        borderBottom: `1px solid ${T.border}`,
        boxShadow: scrolled ? T.shadowSm : 'none',
        transition: 'box-shadow 0.3s',
      }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: `linear-gradient(135deg, ${T.blue} 0%, #5AC8FA 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,122,255,0.35)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <rect x="11" y="5" width="2" height="14" rx="1"/>
              <rect x="7" y="9" width="2" height="10" rx="1"/>
              <rect x="15" y="9" width="2" height="10" rx="1"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 18, color: T.ink, letterSpacing: '-0.5px' }}>
            Online<span style={{ color: T.blue }}>PT</span>
          </span>
        </a>

        <ul className="nav-links" style={{ display: 'flex', gap: 32, listStyle: 'none' }}>
          {[['#how', 'How It Works'], ['#features', 'Features'], ['#preview', 'Your Page'], ['#faq', 'FAQ']].map(([href, label]) => (
            <li key={href}>
              <a href={href} style={{ fontSize: 14, fontWeight: 500, color: T.ink2, textDecoration: 'none', transition: 'color 0.2s' }}>
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="#" style={{
            fontSize: 14, fontWeight: 500, color: T.ink2,
            textDecoration: 'none', padding: '8px 16px', borderRadius: 20,
            transition: 'background 0.2s, color 0.2s',
          }}>
            Sign In
          </a>
          <a href="#signup" style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: T.white,
            textDecoration: 'none', padding: '9px 20px',
            background: T.blue, borderRadius: 20, border: 'none', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,122,255,0.30)',
            transition: 'transform 0.15s, box-shadow 0.15s, background 0.15s',
            display: 'inline-flex', alignItems: 'center',
          }}>
            Get Started Free
          </a>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '120px 24px 80px', position: 'relative',
        background: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,122,255,0.10) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(90,200,250,0.08) 0%, transparent 60%), ${T.white}`,
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: T.glassBg, backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
          border: `1px solid ${T.border}`, padding: '6px 16px 6px 6px',
          borderRadius: 100, fontSize: 13, fontWeight: 500, color: T.ink2,
          marginBottom: 28, animation: 'fadeUp 0.6s ease both',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: `linear-gradient(135deg, ${T.blue}, #5AC8FA)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: T.white, fontWeight: 700,
          }}>✦</div>
          Built by Physiotherapists, for Physiotherapists
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: 'clamp(42px, 7vw, 80px)', fontWeight: 800,
          lineHeight: 1.08, letterSpacing: '-2.5px', color: T.ink,
          maxWidth: 820, margin: '0 auto',
          animation: 'fadeUp 0.6s 0.1s ease both',
        }}>
          Your Clinic.<br />
          <span style={{
            background: `linear-gradient(135deg, ${T.blue} 0%, #5AC8FA 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Online.</span> In Minutes.
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)', fontWeight: 400, color: T.ink3,
          maxWidth: 540, margin: '20px auto 36px', lineHeight: 1.6,
          animation: 'fadeUp 0.6s 0.2s ease both',
        }}>
          Get your own professional page at <strong>yourname.onlinept.in</strong> — take online consultations, showcase your services, and grow your practice.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center',
          animation: 'fadeUp 0.6s 0.3s ease both',
        }}>
          <a href="#signup" style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, color: T.white,
            background: T.blue, padding: '14px 28px', borderRadius: 100, border: 'none',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0,122,255,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s, background 0.15s',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            Create My Free Page
          </a>
          <a href="#how" style={{
            fontSize: 16, fontWeight: 500, color: T.ink2,
            background: T.glassBg, backdropFilter: T.blur,
            border: `1px solid ${T.border}`, padding: '14px 28px', borderRadius: 100,
            textDecoration: 'none',
            transition: 'background 0.2s, transform 0.15s',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            See How It Works ↓
          </a>
        </div>

        {/* Browser Mockup */}
        <div style={{
          width: 'min(780px, 90vw)', margin: '64px auto 0',
          borderRadius: T.r.lg, boxShadow: T.shadowLg,
          overflow: 'hidden', border: `1px solid ${T.border}`,
          background: T.white, animation: 'fadeUp 0.8s 0.4s ease both',
        }}>
          {/* Mockup Bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
            background: '#F2F2F2', borderBottom: `1px solid ${T.border}`,
          }}>
            {[['#FF5F57', 'r'], ['#FEBC2E', 'y'], ['#28C840', 'g']].map(([c, cls]) => (
              <div key={cls} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
            ))}
            <div style={{
              flex: 1, background: T.white, borderRadius: 6,
              padding: '4px 12px', margin: '0 12px',
              fontSize: 12, color: T.ink3, fontFamily: "'DM Sans', sans-serif",
              border: `1px solid ${T.border}`,
            }}>aruna.onlinept.in</div>
          </div>
          {/* Mockup Body */}
          <div style={{
            padding: '28px 28px 20px',
            background: 'linear-gradient(160deg, #F8FBFF 0%, #FFFFFF 100%)',
            display: 'flex', gap: 20, alignItems: 'flex-start',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: `linear-gradient(135deg, ${T.blue}, #5AC8FA)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.white, fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 20,
                marginBottom: 12,
              }}>A</div>
              <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 18, color: T.ink }}>Dr. Aruna Koladiya</div>
              <div style={{ fontSize: 12, color: T.ink3, margin: '2px 0 12px' }}>Physiotherapist · Surat, Gujarat</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Spine Care', 'Sports Rehab', 'Yoga Therapy', 'Trigger Point'].map(t => (
                  <span key={t} style={{
                    fontSize: 11, fontWeight: 500,
                    background: T.blueLight, color: T.blue,
                    padding: '3px 10px', borderRadius: 100,
                  }}>{t}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                {[['500+', 'Patients'], ['15+', 'Years Exp.'], ['4.9★', 'Rating']].map(([n, l]) => (
                  <div key={l} style={{
                    flex: 1, background: T.glassBg, border: `1px solid ${T.border}`,
                    borderRadius: 10, padding: 8, textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 16, color: T.ink }}>{n}</div>
                    <div style={{ fontSize: 10, color: T.ink4 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ width: 140, flexShrink: 0 }}>
              <div style={{
                background: T.blue, color: T.white,
                borderRadius: T.r.sm, padding: 14, textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>CONSULTATION</div>
                <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 22, fontWeight: 800 }}>₹499</div>
                <div style={{ fontSize: 10, opacity: 0.7, margin: '2px 0 10px' }}>45 min · HD Video</div>
                <button style={{
                  width: '100%', background: T.white, color: T.blue,
                  border: 'none', borderRadius: 8, padding: 8,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>Book Now</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ──────────────────────────────────────────────────── */}
      <div style={{ background: T.surface, padding: '28px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: T.ink4, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 20 }}>
          Trusted by physiotherapists across India
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {['Free to set up', 'No tech skills needed', 'Live in under 5 minutes', 'Your own subdomain'].map(item => (
            <div key={item} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: T.white, border: `1px solid ${T.border}`,
              borderRadius: 100, padding: '8px 18px',
              fontSize: 14, fontWeight: 500, color: T.ink2, boxShadow: T.shadowSm,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.green }} />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section id="how" style={section()}>
        <div style={inner()}>
          <div style={eyebrow()}>How It Works</div>
          <h2 style={sectionTitle()}>Three steps to your<br />online clinic.</h2>
          <p style={sectionSub()}>No developers. No design experience. No technical setup. Just your expertise, online.</p>
          <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 56 }}>
            <HowCard n="01" icon="📝" title="Sign Up Free" body="Create your account in 60 seconds. Tell us your name, clinic, and specialisation. That's it." delay={0} />
            <HowCard n="02" icon="🎨" title="Customise Your Page" body="Add your photo, services, fees, and availability from your personal admin panel. Update anytime." delay={80} />
            <HowCard n="03" icon="🚀" title="Share & Consult" body={<span>Share <strong>yourname.onlinept.in</strong> with patients. They book, you consult via HD video call.</span>} delay={160} />
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features" style={{ ...section(), background: T.surface }}>
        <div style={inner()}>
          <div style={eyebrow()}>Features</div>
          <h2 style={sectionTitle()}>Everything your online<br />practice needs.</h2>
          <p style={sectionSub()}>One platform. Complete control. Built specifically for physiotherapists.</p>
          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 56 }}>
            <FeatCard
              big icon="🌐" title="Your Own Subdomain"
              body={<>Get a professional, memorable URL like <strong>abc.onlinept.in</strong> — looks great on your card, WhatsApp bio, and Instagram. Patients trust a dedicated page over a generic booking link.</>}
              tag="yourname.onlinept.in"
              delay={0}
            />
            <FeatCard icon="📹" title="HD Video Consultations" body="Conduct professional assessments via integrated HD video. No third-party apps needed." delay={80} />
            <FeatCard icon="⚙️" title="Personal Admin Panel" body="Full control over your profile, services, fees, and schedule. Update in real-time." delay={160} />
            <FeatCard icon="📱" title="Mobile-First Design" body="Your patient page looks stunning on every device — phone, tablet, or desktop." delay={240} />
            <FeatCard icon="🔒" title="Secure & Private" body="Patient data is encrypted and protected. HIPAA-aligned practices built in by default." delay={320} />
            <FeatCard icon="🇮🇳" title="Made for India" body="Indian pricing, multilingual support, and built by a practising physiotherapist from Surat." delay={400} />
          </div>
        </div>
      </section>

      {/* ── Preview ─────────────────────────────────────────────────────── */}
      <section id="preview" style={section()}>
        <div style={inner()}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }} className="preview-wrap">
            <div>
              <div style={eyebrow()}>Your Patient Page</div>
              <h2 style={sectionTitle()}>What your<br />page looks like.</h2>
              <p style={sectionSub()}>A clean, professional one-page website your patients will love — fully managed by you.</p>
              <ul style={{ listStyle: 'none', marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  'Doctor profile with photo & qualifications',
                  'Services list with fees',
                  'Online booking button',
                  'Patient reviews & ratings',
                  'WhatsApp & contact links',
                  'Languages spoken & clinic address',
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 15, color: T.ink2, lineHeight: 1.5 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${T.blue}, #5AC8FA)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 1, color: T.white, fontSize: 12, fontWeight: 700,
                    }}>✓</div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <PreviewPhone />
          </div>
        </div>
      </section>

      {/* ── Signup ─────────────────────────────────────────────────────── */}
      <section id="signup" style={{ ...section(), background: 'linear-gradient(160deg, #F0F6FF 0%, #FFFFFF 100%)' }}>
        <div style={inner()}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="signup-wrap">
            {/* Perks */}
            <div>
              <div style={eyebrow()}>Get Started</div>
              <h2 style={sectionTitle()}>Claim your free<br />physio page today.</h2>
              <p style={sectionSub()}>Join physiotherapists across India who've already taken their practice online.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 32 }}>
                {[
                  { icon: '⚡', h: 'Live in Under 5 Minutes', p: 'Sign up, fill your details, and your page is instantly live at your subdomain.' },
                  { icon: '💸', h: 'Free to Start', p: 'No credit card. No hidden charges. Start free, upgrade when you need more.' },
                  { icon: '🛠️', h: 'Full Admin Control', p: 'Update your page, add services, change fees — all from your own admin panel.' },
                ].map(({ icon, h, p }) => (
                  <div key={h} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 44, height: 44, flexShrink: 0,
                      borderRadius: 14, background: T.blueLight,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}>{icon}</div>
                    <div>
                      <h4 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 3 }}>{h}</h4>
                      <p style={{ fontSize: 14, color: T.ink3, lineHeight: 1.5 }}>{p}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div style={{
              background: T.white, border: `1px solid ${T.border}`,
              borderRadius: T.r.lg, padding: 40, boxShadow: T.shadowLg,
            }}>
              <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 24, fontWeight: 800, color: T.ink, marginBottom: 6, letterSpacing: '-0.5px' }}>
                Create Your Free Page
              </div>
              <div style={{ fontSize: 14, color: T.ink3, marginBottom: 28 }}>Takes less than 2 minutes — no tech skills needed.</div>

              <form onSubmit={handleSignup}>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.ink2, marginBottom: 6 }}>First Name</label>
                    <input type="text" placeholder="Aruna" required value={form.firstName}
                      onChange={e => setForm({ ...form, firstName: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${T.border}`, borderRadius: T.r.sm, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: T.ink, background: T.white, outline: 'none', appearance: 'none' }} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.ink2, marginBottom: 6 }}>Last Name</label>
                    <input type="text" placeholder="Koladiya" required value={form.lastName}
                      onChange={e => setForm({ ...form, lastName: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${T.border}`, borderRadius: T.r.sm, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: T.ink, background: T.white, outline: 'none', appearance: 'none' }} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.ink2, marginBottom: 6 }}>Your Subdomain</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${T.border}`, borderRadius: T.r.sm, overflow: 'hidden' }}>
                    <div style={{ background: T.surface, padding: '12px 14px', fontSize: 14, color: T.ink3, whiteSpace: 'nowrap', borderRight: `1.5px solid ${T.border}` }}>
                      <input type="text" placeholder="yourname" required value={subdomain}
                        onChange={e => handleSubdomain(e.target.value)}
                        style={{ border: 'none', borderRadius: 0, boxShadow: 'none', outline: 'none', width: 100, fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: 0, background: 'transparent' }} />
                    </div>
                    <span style={{ background: T.surface, padding: '12px 14px', fontSize: 14, color: T.ink3, whiteSpace: 'nowrap', borderLeft: `1.5px solid ${T.border}` }}>.onlinept.in</span>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.ink2, marginBottom: 6 }}>Clinic / Practice Name</label>
                  <input type="text" placeholder="Nijanand Fitness Centre" required value={form.clinic}
                    onChange={e => setForm({ ...form, clinic: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${T.border}`, borderRadius: T.r.sm, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: T.ink, background: T.white, outline: 'none', appearance: 'none' }} />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.ink2, marginBottom: 6 }}>City</label>
                    <input type="text" placeholder="Surat" required value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${T.border}`, borderRadius: T.r.sm, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: T.ink, background: T.white, outline: 'none', appearance: 'none' }} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.ink2, marginBottom: 6 }}>Qualification</label>
                    <input type="text" placeholder="BPT, MPT…" required value={form.qualification}
                      onChange={e => setForm({ ...form, qualification: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${T.border}`, borderRadius: T.r.sm, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: T.ink, background: T.white, outline: 'none', appearance: 'none' }} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.ink2, marginBottom: 6 }}>Email Address</label>
                  <input type="email" placeholder="you@example.com" required value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${T.border}`, borderRadius: T.r.sm, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: T.ink, background: T.white, outline: 'none', appearance: 'none' }} />
                </div>

                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.ink2, marginBottom: 6 }}>Password</label>
                  <input type="password" placeholder="Choose a strong password" required value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${T.border}`, borderRadius: T.r.sm, fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: T.ink, background: T.white, outline: 'none', appearance: 'none' }} />
                </div>

                <button type="submit" style={{
                  width: '100%', padding: 15, background: signupDone ? T.green : T.blue, color: T.white,
                  border: 'none', borderRadius: T.r.sm,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0,122,255,0.30)',
                  transition: 'background 0.15s, transform 0.15s, box-shadow 0.15s',
                  marginTop: 8,
                }}>
                  {signupDone ? 'Page Created! Redirecting…' : 'Create My Page Free'}
                </button>
                <p style={{ fontSize: 12, color: T.ink4, textAlign: 'center', marginTop: 12 }}>
                  By signing up you agree to our Terms of Service. No credit card required.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ ...section(), background: T.surface }}>
        <div style={inner()}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ ...eyebrow(), justifyContent: 'center' }}>FAQ</div>
            <h2 style={sectionTitle()}>Questions from<br />fellow physios.</h2>
          </div>
          <div className="faq-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {faqs.map((f, i) => <FaqItem key={i} {...f} delay={i * 80} />)}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{
        background: T.ink, color: T.white, padding: '60px 24px 36px',
      }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48, gap: 40, flexWrap: 'wrap' }} className="footer-top">
            <div style={{ maxWidth: 300 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: `linear-gradient(135deg, ${T.blue} 0%, #5AC8FA 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <rect x="11" y="5" width="2" height="14" rx="1"/>
                    <rect x="7" y="9" width="2" height="10" rx="1"/>
                    <rect x="15" y="9" width="2" height="10" rx="1"/>
                  </svg>
                </div>
                <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 17, color: T.white }}>
                  Online<span style={{ color: '#5AC8FA' }}>PT</span>
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                Professional online physiotherapy pages for clinicians across India. Built by a physio, for physios.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 60, flexWrap: 'wrap' }} className="footer-cols">
              {[
                { h: 'Platform', links: ['How It Works', 'Features', 'Your Page', 'Sign Up Free'] },
                { h: 'Support', links: ['FAQ', 'Contact Us', 'WhatsApp Support'] },
                { h: 'Legal', links: ['Privacy Policy', 'Terms of Service'] },
              ].map(({ h, links }) => (
                <div key={h}>
                  <h5 style={{
                    fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 700,
                    color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 16,
                  }}>{h}</h5>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {links.map(l => (
                      <li key={l}>
                        <a href="#" style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', textDecoration: 'none', transition: 'color 0.2s' }}>{l}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: 28,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              © 2025 OnlinePT · Nijanand Fitness Centre, Surat, Gujarat, India
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
