import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2, ArrowRight, ShieldCheck, Zap,
  Globe, Users, Smartphone, MessageSquare,
  BarChart3, Layout, Clock, Menu, X,
  ChevronDown, Star, Play, Activity, Stethoscope,
  Heart, CreditCard, Mail, Phone, MapPin, Search,
  Video, FileText
} from 'lucide-react';

const T = {
  primary: 'var(--color-primary)',
  primaryDark: 'var(--color-primary-hover)',
  primaryLight: 'var(--color-primary-light)',
  accent: 'var(--color-secondary)',
  white: '#FFFFFF',
  ink: '#1D1D1F',
  ink2: '#3A3A3C',
  ink3: '#636366',
  ink4: '#AEAEB2',
  border: 'var(--color-border)',
  glass: 'var(--glass-bg)',
  blur: 'var(--glass-blur)',
};

export default function SaaSLandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    physioName: '',
    clinicName: '',
    email: '',
    phone: '',
    password: '',
    subdomain: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    
    if (name === 'subdomain') {
      // Convert spaces to hyphens and strip invalid chars for subdomain
      finalValue = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    setFormData(prev => ({ 
      ...prev, 
      [name]: finalValue
    }));
  };

  const [isLoading, setIsLoading] = useState(false);
  
  const revealRefs = useRef([]);
  revealRefs.current = [];

  const addToRefs = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    revealRefs.current.forEach(ref => observer.observe(ref));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      revealRefs.current.forEach(ref => observer.unobserve(ref));
    };
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Store all data in sessionStorage for the onboarding flow to pick up
    try {
      sessionStorage.setItem('pendingOnboarding', JSON.stringify(formData));
    } catch (err) {
      console.error('Failed to save onboarding data:', err);
    }

    await new Promise(r => setTimeout(r, 1500));
    navigate('/saas/onboarding'); // Redirect straight to onboarding step 1
  };

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Solution', href: '#solution' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <div style={{ background: T.white, color: T.ink, overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .hero-gradient { background: radial-gradient(circle at 80% 20%, ${T.primary}08 0%, transparent 40%), radial-gradient(circle at 10% 80%, ${T.accent}08 0%, transparent 40%); }
        .mobile-menu-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: ${T.white}; z-index: 200; transform: translateX(${isMenuOpen ? '0' : '100%'}); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); padding: 80px 16px; }
        .nav-link { font-size: var(--font-subhead, 15px); font-weight: 600; color: ${T.ink3}; text-decoration: none; transition: color 0.2s; cursor: pointer; }
        .nav-link:hover { color: ${T.primary}; }
        html { scroll-behavior: smooth; }

        /* ── Physio background pattern overlay ─── */
        .physio-bg { position: relative; }
        .physio-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url('/assets/physio-bg-pattern.png');
          background-repeat: repeat;
          background-size: 400px 400px;
          opacity: 0.07;
          pointer-events: none;
          z-index: 0;
        }
        .physio-bg > * { position: relative; z-index: 1; }

        /* ── iOS-style button active state ─── */
        .ios-btn { min-height: 44px; transition: opacity 0.15s, transform 0.15s; -webkit-tap-highlight-color: transparent; }
        .ios-btn:active { opacity: 0.7; transform: scale(0.97); }

        /* ── Desktop/Mobile visibility ─── */
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }

        /* ── Mobile-first HIG adjustments ─── */
        @media (max-width: 768px) {
          /* Feature grid: 2 columns on tablet */
          .feature-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
          /* Pricing grid: single column, remove scale */
          .pricing-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .pricing-grid > div { transform: none !important; }
          /* Signup form: mobile padding */
          .signup-form-card { padding: 24px 20px !important; border-radius: 20px !important; }
          .signup-form-grid { grid-template-columns: 1fr !important; }
          /* Footer grid */
          .footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .footer-grid > div:first-child { grid-column: span 1 !important; }
        }
        @media (max-width: 540px) {
          /* Feature grid: single column on phone */
          .feature-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 150,
        height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 var(--section-px)', transition: 'all 0.3s',
        background: scrolled ? T.glass : 'transparent',
        backdropFilter: scrolled ? T.blur : 'none',
        WebkitBackdropFilter: scrolled ? T.blur : 'none',
        borderBottom: scrolled ? `1px solid ${T.border}` : 'none',
      }}>
        <div style={{ maxWidth: 1200, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
             <img src="/onlinept-logo-v3.png" alt="OnlinePT" style={{ width: 60, height: 60, objectFit: 'contain' }} />
             <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px' }}>OnlinePT</span>
          </div>

          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
             {navLinks.map(link => (
               <a key={link.label} href={link.href} className="nav-link">{link.label}</a>
             ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/dashboard-login" className="desktop-only" style={{ textDecoration: 'none', fontSize: 14, fontWeight: 700, color: T.ink }}>Sign In</Link>
            <button onClick={() => setIsMenuOpen(true)} className="mobile-only" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.ink }}>
              <Menu size={24} />
            </button>
            <button className="ios-btn" onClick={() => document.getElementById('signup').scrollIntoView({ behavior: 'smooth' })} style={{
              background: T.primary, color: T.white, border: 'none',
              padding: '10px 20px', borderRadius: 100, fontSize: 15, fontWeight: 600,
              boxShadow: `0 4px 12px ${T.primary}20`, cursor: 'pointer',
              minHeight: 44,
            }}>
              Join Network
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu ────────────────────────────────────────────────── */}
      <div className="mobile-menu-overlay">
         <button onClick={() => setIsMenuOpen(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', cursor: 'pointer', color: T.ink }}>
            <X size={28} />
         </button>
         <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {navLinks.map(link => (
              <a key={link.label} href={link.href} onClick={() => setIsMenuOpen(false)} style={{ fontSize: 28, fontWeight: 800, color: T.ink, textDecoration: 'none', fontFamily: 'Manrope, sans-serif' }}>{link.label}</a>
            ))}
            <hr style={{ border: 'none', borderTop: `1px solid ${T.border}`, margin: '8px 0' }} />
            <Link to="/dashboard-login" onClick={() => setIsMenuOpen(false)} style={{ fontSize: 24, fontWeight: 700, color: T.primary, textDecoration: 'none' }}>Physio Login</Link>
         </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="hero-gradient physio-bg" style={{ padding: 'clamp(120px, 20vw, 160px) var(--section-px) clamp(48px, 10vw, 80px)', textAlign: 'center' }}>
        <div className="reveal active" style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.primaryLight, padding: '8px 16px', borderRadius: 100, color: T.primary, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', marginBottom: 24 }}>
            <Zap size={14} /> The Future of Physical Therapy is Here
          </div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(32px, 7vw, 72px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: 24 }}>
            Build Your Digital <br className="desktop-only" /> <span style={{ color: T.primary }}>Clinic in 60 Seconds.</span>
          </h1>
          <p style={{ fontSize: 'clamp(17px, 2.5vw, 21px)', color: T.ink3, lineHeight: 1.6, maxWidth: 640, margin: '0 auto 48px', fontWeight: 500 }}>
            The all-in-one platform for physiotherapists to manage bookings, assessments, and patient growth with a clinical-grade digital presence.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
             <button className="ios-btn" onClick={() => document.getElementById('signup').scrollIntoView({ behavior: 'smooth' })} style={{
               padding: '14px 32px', borderRadius: 100, background: T.primary, color: T.white,
               border: 'none', fontSize: 16, fontWeight: 600, boxShadow: `0 8px 24px ${T.primary}25`,
               cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
               minHeight: 48,
             }}>
               Start Your Clinic <ArrowRight size={18} />
             </button>
             <button className="ios-btn" onClick={() => document.getElementById('testimonials').scrollIntoView({ behavior: 'smooth' })} style={{
               padding: '14px 32px', borderRadius: 100, background: T.white, color: T.ink,
               border: 'none', fontSize: 16, fontWeight: 600,
               boxShadow: 'var(--shadow-md)',
               cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
               minHeight: 48,
             }}>
               <Star size={18} fill={T.ink} /> See Success Stories
             </button>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features" className="physio-bg" style={{ padding: 'var(--section-py) var(--section-px)', background: T.white }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="reveal" ref={addToRefs} style={{ textAlign: 'center', marginBottom: 80 }}>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1.5px', color: T.ink }}>
              Everything You Need <br className="desktop-only" /> to <span style={{ color: T.primary }}>Scale Your Practice.</span>
            </h2>
          </div>

          <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[
              /* ── Upper Row (4): Core Clinical Capabilities ── */
              { icon: Layout, title: 'Branded Booking Portal', desc: 'A premium, white-labeled booking site with ₹ pricing, slot calendar & WhatsApp integration — built for Indian clinics.', img: '/assets/features/booking-portal.png' },
              { icon: ShieldCheck, title: 'Super Admin Controls', desc: 'Manage clinics across Surat, Mumbai, Delhi from one dashboard. Approve, suspend, and track revenue in ₹.', img: '/assets/features/admin-controls.png' },
              { icon: Activity, title: 'Patient Recovery Tracking', desc: 'Visualize recovery with pain calendars and VAS scores. Track patients like Amit Patel through their rehab journey.', img: '/assets/features/recovery-tracking.png' },
              { icon: Globe, title: 'Custom Subdomains', desc: 'Every clinic gets a unique address — nijanand.onlinept.in, grace.onlinept.in — each with its own brand theme.', img: '/assets/features/custom-subdomains.png' },
              /* ── Lower Row (4): Operational & Engagement ── */
              { icon: Smartphone, title: 'Mobile-First Design', desc: 'Patients book in seconds from their phone. WhatsApp confirmation, ₹500 payment, and appointment reminders built in.', img: '/assets/features/mobile-first.png' },
              { icon: BarChart3, title: 'Growth Analytics', desc: 'Deep insights in ₹ — monthly revenue, patient city breakdowns (Surat, Mumbai, Ahmedabad), and retention trends.', img: '/assets/features/growth-analytics.png' },
              { icon: Video, title: 'Secure Video Consultations', desc: 'Conduct live tele-rehab sessions via WhatsApp or built-in video. Perfect for follow-ups and remote patient check-ins.', img: '/assets/features/video-consult.png' },
              { icon: FileText, title: 'SOAP Notes & HEP Builder', desc: 'Clinical-grade documentation with structured SOAP notes and Home Exercise Programs — share PDFs directly with patients.', img: '/assets/features/soap-notes.png' },
            ].map((f, i) => (
              <div key={i} className="reveal" ref={addToRefs} style={{
                borderRadius: 16, overflow: 'hidden',
                background: T.white, transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: 'var(--shadow-card)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
              >
                {/* Feature Image */}
                <div style={{
                  width: '100%', aspectRatio: '4/3', overflow: 'hidden', position: 'relative',
                  background: `linear-gradient(135deg, ${T.primaryLight}, #F0F4FF)`,
                }}>
                  <img src={f.img} alt={f.title} loading="lazy" style={{
                    width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top',
                    transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                </div>
                {/* Content */}
                <div style={{ padding: '20px 20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, background: T.primaryLight,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: T.primary, flexShrink: 0,
                    }}>
                      <f.icon size={20} />
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: T.ink, letterSpacing: '-0.2px' }}>{f.title}</h3>
                  </div>
                  <p style={{ color: T.ink3, lineHeight: 1.6, fontSize: 15 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mockup / Visual ──────────────────────────────────────────────── */}
      <section id="solution" style={{ padding: 'var(--section-py) var(--section-px)', background: T.ink, color: T.white, textAlign: 'center' }}>
         <div className="reveal" ref={addToRefs} style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: 24 }}>
              The Premium Dashboard <br /> Your Practice <span style={{ color: T.primary }}>Deserves.</span>
            </h2>
            <p style={{ color: T.ink4, fontSize: 18, maxWidth: 600, margin: '0 auto 48px' }}>
              Ditch the spreadsheets. Manage your clinic with the elegance of a Silicon Valley tech company.
            </p>
            
            <div style={{
              background: '#2C2C2E', borderRadius: 16, padding: '12px 16px 16px',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6)', border: '1px solid #3A3A3C',
              position: 'relative', overflow: 'hidden'
            }}>
               <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF453A' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFD60A' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#32D74B' }} />
               </div>
               <div style={{ background: '#1C1C1E', borderRadius: 8, padding: 4 }}>
                  <img 
                    src="/assets/features/dashboard-preview.png" 
                    alt="OnlinePT Physio Dashboard Preview" 
                    style={{ 
                      width: '100%', 
                      height: 'auto',
                      borderRadius: 6,
                      display: 'block',
                      transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    }} 
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
               </div>
            </div>
         </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section id="pricing" className="physio-bg" style={{ padding: 'var(--section-py) var(--section-px)', background: T.white }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="reveal" ref={addToRefs} style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.primaryLight, padding: '8px 16px', borderRadius: 100, color: T.primary, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 20 }}>
              💎 Transparent Pricing
            </div>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1.5px', color: T.ink }}>
              Simple, Honest <span style={{ color: T.primary }}>Pricing.</span>
            </h2>
            <p style={{ color: T.ink3, fontSize: 16, maxWidth: 500, margin: '16px auto 0', lineHeight: 1.6 }}>
              No hidden fees. Start free and scale as your practice grows across India.
            </p>
          </div>

          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
            {/* Starter Plan */}
            <div className="reveal" ref={addToRefs} style={{
              borderRadius: 16, border: 'none', padding: 'clamp(24px, 5vw, 40px) clamp(20px, 4vw, 36px)',
              background: T.white, transition: 'all 0.3s', boxShadow: 'var(--shadow-sm)',
            }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: T.ink4, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>Starter</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: T.ink, letterSpacing: '-2px' }}>Free</span>
              </div>
              <p style={{ color: T.ink3, fontSize: 14, marginBottom: 32, lineHeight: 1.5 }}>Perfect for solo practitioners just getting started with online consultations.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
                {['Branded booking portal', 'Up to 30 bookings/month', 'WhatsApp video integration', 'Basic patient records', '1 service type'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: T.ink2 }}>
                    <CheckCircle2 size={16} color={T.primary} style={{ flexShrink: 0 }} /> {f}
                  </div>
                ))}
              </div>
              <button onClick={() => document.getElementById('signup').scrollIntoView({ behavior: 'smooth' })} style={{
                width: '100%', height: 56, borderRadius: 16, background: T.white, color: T.ink,
                border: `2px solid ${T.border}`, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
                Get Started Free
              </button>
            </div>

            {/* Growth Plan — Popular */}
            <div className="reveal" ref={addToRefs} style={{
              borderRadius: 16, border: `2px solid ${T.primary}`, padding: 'clamp(24px, 5vw, 40px) clamp(20px, 4vw, 36px)',
              background: T.white, position: 'relative', boxShadow: `0 12px 40px ${T.primary}15`,
              transform: 'scale(1.02)',
            }}>
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: T.primary, color: T.white, padding: '5px 16px', borderRadius: 100, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Most Popular
              </div>
              <p style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>Growth</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: T.ink, letterSpacing: '-2px' }}>₹999</span>
                <span style={{ fontSize: 14, color: T.ink4, fontWeight: 600 }}>/month</span>
              </div>
              <p style={{ color: T.ink3, fontSize: 14, marginBottom: 32, lineHeight: 1.5 }}>For growing clinics with multiple service types and serious about patient management.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
                {['Everything in Starter', 'Unlimited bookings', 'Custom subdomain (clinic.onlinept.in)', '3 service types (Consult, Follow-up, Treatment)', 'Razorpay payment gateway', 'Recovery tracking & VAS scores', 'Growth analytics dashboard', 'Priority WhatsApp support'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: T.ink2 }}>
                    <CheckCircle2 size={16} color={T.primary} style={{ flexShrink: 0 }} /> {f}
                  </div>
                ))}
              </div>
              <button onClick={() => document.getElementById('signup').scrollIntoView({ behavior: 'smooth' })} style={{
                width: '100%', height: 56, borderRadius: 16, background: T.primary, color: T.white,
                border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                boxShadow: `0 8px 24px ${T.primary}40`, transition: 'all 0.2s',
              }}>
                Start 14-Day Free Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="reveal" ref={addToRefs} style={{
              borderRadius: 16, border: 'none', padding: 'clamp(24px, 5vw, 40px) clamp(20px, 4vw, 36px)',
              background: T.white, transition: 'all 0.3s', boxShadow: 'var(--shadow-sm)',
            }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: T.ink4, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>Enterprise</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: T.ink, letterSpacing: '-2px' }}>₹2,499</span>
                <span style={{ fontSize: 14, color: T.ink4, fontWeight: 600 }}>/month</span>
              </div>
              <p style={{ color: T.ink3, fontSize: 14, marginBottom: 32, lineHeight: 1.5 }}>For multi-branch clinics and hospital chains needing full platform control.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
                {['Everything in Growth', 'Multi-branch management', 'Unlimited service types & custom pricing', 'Multi-physio team support', 'SOAP notes & HEP builder', 'Invoicing & GST billing', 'Custom branding & logo', 'Dedicated account manager'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: T.ink2 }}>
                    <CheckCircle2 size={16} color={T.primary} style={{ flexShrink: 0 }} /> {f}
                  </div>
                ))}
              </div>
              <button onClick={() => document.getElementById('signup').scrollIntoView({ behavior: 'smooth' })} style={{
                width: '100%', height: 56, borderRadius: 16, background: T.ink, color: T.white,
                border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
                Contact Sales
              </button>
            </div>
          </div>

          {/* Fee Customization Note */}
          <div className="reveal" ref={addToRefs} style={{ textAlign: 'center', marginTop: 40, padding: '16px 20px', background: T.primaryLight, borderRadius: 12, maxWidth: 700, margin: '40px auto 0' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.primary }}>
              💡 Every clinician can set their own Consultation, Follow-up & Treatment charges from their Settings panel. Super Admins can define default templates.
            </p>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <section id="testimonials" className="physio-bg" style={{ padding: 'var(--section-py) var(--section-px)', background: T.white }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="reveal" ref={addToRefs} style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: 12 }}>Testimonials</p>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, letterSpacing: '-1px', color: T.ink, marginBottom: 12 }}>
              Trusted by <span style={{ color: T.primary }}>Clinicians</span> Across India
            </h2>
            <p style={{ color: T.ink3, fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
              Hear from physiotherapists who have transformed their practices with OnlinePT.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 20,
          }}>
            {[
              {
                name: 'Dr. Puja Panda',
                title: 'Chief Physio, Vyom Advanced Pain & Sports Clinic',
                location: 'Bhubaneswar',
                image: '/assets/testimonials/dr-puja-panda.png',
                quote: 'OnlinePT completely transformed how I manage my sports rehab patients. The video consultation feature alone saved me hours every week. My patients love the branded booking portal!',
                rating: 5,
              },
              {
                name: 'Dr. Aruna Koladiya',
                title: 'Senior Physio and Yoga Trainer',
                location: 'Nijanand Fitness Centre',
                image: '/assets/testimonials/dr-aruna-koladiya.png',
                quote: 'Setting up my clinic portal took less than 10 minutes. The SOAP notes and recovery tracking features are exactly what I needed. It feels like the platform was built by a physiotherapist!',
                rating: 5,
              },
              {
                name: 'Dr. Bhupat Sakariya',
                title: 'Senior Ortho Physiotherapist At Sakariya Physiotherapy Clinic',
                location: 'Ahmedabad',
                image: '/assets/testimonials/dr-bhupat-sakariya.png',
                quote: 'The analytics dashboard gives me insights I never had before — patient trends, revenue growth, appointment patterns. It\'s helped me make better decisions for my clinic\'s expansion.',
                rating: 5,
              },
              {
                name: 'Dr. Paresh Karad',
                title: 'Senior Physiotherapist',
                location: 'Pune',
                image: '/assets/testimonials/dr-paresh-karad.png',
                quote: 'My patients are impressed with the professional booking experience. The WhatsApp reminders reduced no-shows by 40%. I wish I found OnlinePT sooner — it\'s a game changer.',
                rating: 5,
              },
            ].map((t, i) => (
              <div className="reveal" ref={addToRefs} key={i} style={{
                background: T.white,
                borderRadius: 20,
                padding: 28,
                border: `1px solid ${T.border}`,
                transition: 'all 0.3s',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                boxShadow: 'var(--shadow-sm)',
                height: '100%',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Stars */}
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} size={16} fill="#FF9500" color="#FF9500" />
                  ))}
                </div>

                {/* Quote */}
                <p style={{
                  fontSize: 14, lineHeight: 1.7, color: T.ink3, flex: 1,
                  fontStyle: 'italic',
                }}>
                  "{t.quote}"
                </p>

                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: `1px solid ${T.border}`, paddingTop: 16, marginTop: 'auto' }}>
                  <img
                    src={t.image}
                    alt={t.name}
                    style={{
                      width: 48, height: 48, borderRadius: '50%',
                      objectFit: 'cover', border: `2px solid ${T.primaryLight}`,
                    }}
                  />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: T.ink, marginBottom: 2 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: T.ink4 }}>{t.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Signup Form ─────────────────────────────────────────────────── */}
      <section id="signup" className="physio-bg" style={{ padding: 'var(--section-py) var(--section-px)', background: `linear-gradient(135deg, ${T.primaryLight} 0%, ${T.white} 100%)` }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div className="reveal" ref={addToRefs}>
             <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Ready to transform?</h2>
             <p style={{ color: T.ink3, marginBottom: 40, fontSize: 16 }}>Join 100+ clinicians building the future of physiotherapy in India.</p>
             
             <div className="signup-form-card" style={{ background: T.white, padding: 'clamp(24px, 5vw, 48px)', borderRadius: 24, boxShadow: 'var(--shadow-xl)', border: 'none' }}>
                <form onSubmit={handleSignup} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* Grid fields */}
                  <div className="signup-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, textAlign: 'left' }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8, display: 'block', paddingLeft: 4 }}>Full Name</label>
                      <input required name="physioName" autoComplete="off" value={formData.physioName} onChange={handleChange} placeholder="Dr. Rajesh Kumar" style={{ width: '100%', height: 56, borderRadius: 16, border: `2px solid ${T.border}`, padding: '0 20px', fontSize: 16, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8, display: 'block', paddingLeft: 4 }}>Work Email</label>
                      <input required type="email" name="email" autoComplete="off" value={formData.email} onChange={handleChange} placeholder="rajesh@physio.in" style={{ width: '100%', height: 56, borderRadius: 16, border: `2px solid ${T.border}`, padding: '0 20px', fontSize: 16, outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8, display: 'block', paddingLeft: 4 }}>Mobile Number</label>
                      <input required name="phone" autoComplete="off" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" style={{ width: '100%', height: 56, borderRadius: 16, border: `2px solid ${T.border}`, padding: '0 20px', fontSize: 16, outline: 'none' }} />
                    </div>

                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8, display: 'block', paddingLeft: 4 }}>Security Password</label>
                      <input required type="password" name="password" autoComplete="new-password" value={formData.password} onChange={handleChange} placeholder="••••••••" style={{ width: '100%', height: 56, borderRadius: 16, border: `2px solid ${T.border}`, padding: '0 20px', fontSize: 16, outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8, display: 'block', paddingLeft: 4 }}>Clinic Name</label>
                    <input required name="clinicName" autoComplete="off" value={formData.clinicName} onChange={handleChange} placeholder="e.g. Wellness Physio Center" style={{ width: '100%', height: 56, borderRadius: 16, border: `2px solid ${T.border}`, padding: '0 20px', fontSize: 16, outline: 'none' }} />
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8, display: 'block', paddingLeft: 4 }}>Your Unique Subdomain</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#F2F2F7', borderRadius: 16, border: `2px solid ${T.border}`, overflow: 'hidden' }}>
                      <input
                        required
                        name="subdomain"
                        value={formData.subdomain}
                        onChange={handleChange}
                        className="no-titlecase"
                        placeholder="My Clinic"
                        style={{ flex: 1, height: 56, border: 'none', background: 'transparent', padding: '0 20px', fontSize: 16, outline: 'none' }}
                      />
                      <span style={{ padding: '0 20px', fontWeight: 700, color: T.ink3, fontSize: 14 }}>.onlinept.in</span>
                    </div>
                  </div>
                  
                  <button disabled={isLoading} style={{
                    height: 64, borderRadius: 100, background: T.primary, color: T.white,
                    border: 'none', fontSize: 18, fontWeight: 800, marginTop: 12, cursor: 'pointer',
                    boxShadow: `0 10px 30px ${T.primary}40`, transition: 'all 0.2s',
                  }}>
                    {isLoading ? 'Creating Your Portal...' : 'Get Early Access'}
                  </button>
                </form>
             </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer style={{ padding: '80px var(--section-px) 40px', background: T.white, borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 60, marginBottom: 60 }}>
              <div style={{ gridColumn: 'span 2' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <img src="/onlinept-logo-v3.png" alt="OnlinePT" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                    <span style={{ fontWeight: 800, fontSize: 20 }}>OnlinePT</span>
                 </div>
                 <p style={{ color: T.ink3, lineHeight: 1.6, maxWidth: 300 }}>
                    Modern clinical management for the next generation of physical therapists. Build your brand, manage your patients, and grow your practice.
                 </p>
              </div>
              <div>
                 <h4 style={{ fontWeight: 700, marginBottom: 20 }}>Network</h4>
                 <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, color: T.ink3, fontSize: 14 }}>
                    <li><a href="#" className="nav-link">Features</a></li>
                    <li><a href="#" className="nav-link">Medical Partners</a></li>
                    <li><Link to="/physio-signup" className="nav-link" style={{ color: T.primary }}>Join as Therapist</Link></li>
                 </ul>
              </div>
              <div>
                 <h4 style={{ fontWeight: 700, marginBottom: 20 }}>Support</h4>
                 <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, color: T.ink3, fontSize: 14 }}>
                    <li><Link to="/help" className="nav-link">Help Center</Link></li>
                    <li><Link to="/privacy" className="nav-link">Privacy Policy</Link></li>
                    <li><Link to="/contact" className="nav-link">Contact Us</Link></li>
                 </ul>
              </div>
           </div>
           
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, paddingTop: 40, borderTop: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 12, color: T.ink4 }}>© 2026 OnlinePT Media. All rights reserved.</p>
              <div style={{ display: 'flex', gap: 20 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.ink4, fontSize: 12 }}>
                    <ShieldCheck size={14} /> HIPAA Compliant
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.ink4, fontSize: 12 }}>
                    <Activity size={14} /> 99.9% Uptime
                 </div>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
