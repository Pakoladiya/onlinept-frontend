import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2, ShieldCheck,
  Globe, Users, Smartphone, MessageSquare,
  BarChart3, Layout, Clock, Menu, X,
  ChevronDown, Star, Play, Activity, Stethoscope,
  Heart, CreditCard, Mail, Phone, MapPin, Search,
  Video, FileText
} from 'lucide-react';
import HeroIntro from '@/components/HeroIntro';

const T = {
  primary: '#14A3A8',
  primaryDark: '#0E8084',
  primaryLight: 'rgba(20, 163, 168, 0.15)',
  accent: '#5AC8FA',
  white: '#FFFFFF',
  bg: '#09090B',
  surface: 'rgba(255, 255, 255, 0.03)',
  border: 'rgba(255, 255, 255, 0.08)',
  ink: '#F8FAFC',
  ink2: '#CBD5E1',
  ink3: '#94A3B8',
  ink4: '#475569',
  glass: 'rgba(9, 9, 11, 0.85)',
  blur: 'blur(16px)',
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    physioName: '',
    email: '',
    phone: '',
    password: '',
    subdomain: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'subdomain' ? value.toLowerCase().replace(/[^a-z0-9-]/g, '') : value 
    }));
  };

  const [isLoading, setIsLoading] = useState(false);
  
  const revealRefs = useRef([]);
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

    const timeout = setTimeout(() => {
      revealRefs.current.forEach(ref => {
        if (ref) observer.observe(ref);
      });
    }, 150);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      sessionStorage.setItem('pendingOnboarding', JSON.stringify(formData));
    } catch (err) {
      console.error('Failed to save onboarding data:', err);
    }
    await new Promise(r => setTimeout(r, 1500));
    navigate('/saas/onboarding');
  };

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <div style={{ background: T.bg, color: T.ink, overflowX: 'hidden', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@800&family=DM+Sans:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        .mobile-menu-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: ${T.bg}; z-index: 200; transform: translateX(${isMenuOpen ? '0' : '100%'}); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); padding: 80px 16px; border-left: 1px solid ${T.border}; }
        .nav-link { font-size: 15px; font-weight: 600; color: ${T.ink3}; text-decoration: none; transition: all 0.2s; cursor: pointer; }
        .nav-link:hover { color: ${T.primary}; }
        html { scroll-behavior: smooth; }
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal.active { opacity: 1; transform: translateY(0); }
        .feature-card:hover { border-color: ${T.primary}40 !important; background: rgba(255,255,255,0.05) !important; transform: translateY(-4px); }
        .ios-btn { min-height: 44px; transition: opacity 0.15s, transform 0.15s; cursor: pointer; border: none; }
        .ios-btn:active { opacity: 0.7; transform: scale(0.97); }
        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .feature-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
          .pricing-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
        @media (max-width: 540px) {
          .feature-grid { grid-template-columns: 1fr !important; }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #09090B inset !important;
            -webkit-text-fill-color: #F8FAFC !important;
            transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ maxWidth: 1200, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
             <img src="/onlinept-logo-v3.png" alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain' }} />
             <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px' }}>Online<span style={{ color: T.primary }}>PT</span></span>
          </div>

          <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
             {navLinks.map(link => (
               <a key={link.label} href={link.href} className="nav-link">{link.label}</a>
             ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/dashboard-login" className="desktop-only" style={{ textDecoration: 'none', fontSize: 14, fontWeight: 700, color: T.ink3 }}>Sign In</Link>
            <button className="ios-btn" onClick={() => document.getElementById('signup').scrollIntoView({ behavior: 'smooth' })} style={{
              background: T.primary, color: T.white, padding: '12px 28px', borderRadius: 100, fontSize: 14, fontWeight: 800,
              boxShadow: `0 8px 24px ${T.primary}30`
            }}>Join Network</button>
            <button onClick={() => setIsMenuOpen(true)} className="mobile-only" style={{ background: 'none', border: 'none', color: T.white }}><Menu size={24} /></button>
          </div>
        </div>
      </nav>

      <div className="mobile-menu-overlay">
         <button onClick={() => setIsMenuOpen(false)} style={{ position: 'absolute', top: 32, right: 24, background: 'none', border: 'none', color: T.white }}><X size={32} /></button>
         <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: '20px' }}>
            {navLinks.map(link => (
              <a key={link.label} href={link.href} onClick={() => setIsMenuOpen(false)} style={{ fontSize: 32, fontWeight: 800, color: T.ink, textDecoration: 'none' }}>{link.label}</a>
            ))}
            <Link to="/dashboard-login" style={{ fontSize: 24, fontWeight: 700, color: T.primary, textDecoration: 'none' }}>Physio Login</Link>
         </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <HeroIntro />

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="reveal" ref={addToRefs} style={{ textAlign: 'center', marginBottom: 80 }}>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-1.5px' }}>
              Built for <span style={{ color: T.primary }}>Performance.</span> <br /> Designed for <span style={{ color: T.accent }}>Care.</span>
            </h2>
          </div>

          <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {[
              { icon: Layout, title: 'Branded Portal', desc: 'A stunning, clinical-grade booking site with your logo & theme.', img: '/assets/features/booking-portal.png' },
              { icon: ShieldCheck, title: 'Smart Admin', desc: 'Complete control over schedules, revenue & clinics.', img: '/assets/features/dashboard-preview.png' },
              { icon: Activity, title: 'Recovery Tracker', desc: 'Visual VAS scales & clinical outcomes in real-time.', img: '/assets/features/recovery-tracking.png' },
              { icon: Globe, title: 'Custom Domains', desc: 'Every clinic gets its own home on the web.', img: '/assets/features/custom-subdomains.png' },
              { icon: Smartphone, title: 'Mobile-First', desc: 'Patients book in under 30 seconds from any device.', img: '/assets/features/mobile-first.png' },
              { icon: BarChart3, title: 'Growth Hub', desc: 'Financial insights, patient retention & cohort analytics.', img: '/assets/features/growth-analytics.png' },
              { icon: Video, title: 'Tele-Rehab', desc: 'Integrated clinical video calls & session recordings.', img: '/assets/features/video-consult.png' },
              { icon: FileText, title: 'Digital SOAP', desc: 'Automated documentation & clinical notes exporter.', img: '/assets/features/soap-notes.png' },
            ].map((f, i) => (
              <div key={i} className="reveal feature-card" ref={addToRefs} style={{ 
                borderRadius: 24, overflow: 'hidden', background: T.surface, border: `1px solid ${T.border}`, transition: 'all 0.4s' 
              }}>
                <div style={{ width: '100%', aspectRatio: '16/10', background: '#000', overflow: 'hidden' }}>
                  <img src={f.img} alt={f.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                </div>
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${T.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}><f.icon size={18} /></div>
                    <h3 style={{ fontSize: 17, fontWeight: 700 }}>{f.title}</h3>
                  </div>
                  <p style={{ color: T.ink3, fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <section id="testimonials" style={{ padding: '100px 24px', background: 'rgba(255,255,255,0.02)', borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="reveal" ref={addToRefs} style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, marginBottom: 16 }}>Leading Clinicians <span style={{ color: T.primary }}>Trust OnlinePT</span></h2>
            <p style={{ color: T.ink3, fontSize: 16 }}>Empowering the future of physiotherapy across India.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {[
              { name: 'Dr. Puja Panda', title: 'Sports Rehab Specialist', img: '/assets/testimonials/dr-puja-panda.png', quote: "The branded booking portal reduced my booking overhead by 80%. My patients absolutely love the process." },
              { name: 'Dr. Aruna Koladiya', title: 'Senior Physiotherapist', img: '/assets/testimonials/dr-aruna-koladiya.png', quote: "The clinical documentation features are a life-saver. I can now spend more time with my patients." },
              { name: 'Dr. Bhupat Sakariya', title: 'Ortho Specialist', img: '/assets/testimonials/dr-bhupat-sakariya.png', quote: "Growth analytics helped me identify my best months and optimize my clinical schedules." }
            ].map((t, i) => (
              <div key={i} className="reveal" ref={addToRefs} style={{ padding: 32, borderRadius: 24, background: T.surface, border: `1px solid ${T.border}` }}>
                <Star size={24} fill={T.primary} color={T.primary} style={{ marginBottom: 20 }} />
                <p style={{ fontSize: 15, lineHeight: 1.8, color: T.ink2, fontStyle: 'italic', marginBottom: 24 }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img src={t.img} alt={t.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${T.primary}` }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: T.ink4 }}>{t.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '100px 24px' }}>
         <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 42, fontWeight: 800, marginBottom: 64 }}>Simple, <span style={{ color: T.primary }}>Unified Pricing.</span></h2>
            <div style={{ padding: 48, borderRadius: 32, background: 'linear-gradient(145deg, #111, #000)', border: `2px solid ${T.primary}40`, boxShadow: `0 20px 60px ${T.primary}10`, maxWidth: 500, margin: '0 auto' }}>
               <p style={{ color: T.primary, fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Growth Plan</p>
               <div style={{ fontSize: 72, fontWeight: 800, marginBottom: 16 }}>₹999<span style={{ fontSize: 18, color: T.ink4 }}>/mo</span></div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left', marginBottom: 40 }}>
                  {['Unlimited Patients & Bookings', 'Razorpay Payment Gateway', 'Custom Clinic Subdomain', 'Clinical Dashboard', 'Priority WhatsApp Support'].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: T.ink2 }}><CheckCircle2 size={18} color={T.primary} /> {f}</div>
                  ))}
               </div>
               <button onClick={() => document.getElementById('signup').scrollIntoView({ behavior: 'smooth' })} style={{ width: '100%', height: 60, borderRadius: 16, background: T.primary, color: '#FFF', fontSize: 16, fontWeight: 800, border: 'none', cursor: 'pointer', boxShadow: `0 10px 30px ${T.primary}30` }}>Start Your Free Trial</button>
            </div>
         </div>
      </section>

      {/* ── Signup ───────────────────────────────────────────────────── */}
      <section id="signup" style={{ padding: '100px 24px', background: 'linear-gradient(to bottom, transparent, #14A3A810)' }}>
        <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 40 }}>Claim Your Handle</h2>
          <div style={{ padding: 40, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 32 }}>
             <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <input required placeholder="Full Name" style={{ height: 60, borderRadius: 16, background: 'rgba(0,0,0,0.3)', border: `1px solid ${T.border}`, color: '#FFF', padding: '0 20px', fontSize: 16 }} onChange={e => setFormData({...formData, physioName: e.target.value})} />
                <input required type="email" placeholder="Email Address" autoComplete="email" style={{ height: 60, borderRadius: 16, background: 'rgba(0,0,0,0.3)', border: `1px solid ${T.border}`, color: '#FFF', padding: '0 20px', fontSize: 16 }} onChange={e => setFormData({...formData, email: e.target.value})} />
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden' }}>
                   <input required placeholder="My Clinic" spellCheck="false" autoComplete="off" className="no-titlecase" style={{ flex: 1, height: 60, border: 'none', background: 'transparent', color: '#FFF', padding: '0 20px', fontSize: 16 }} onChange={e => setFormData({...formData, subdomain: e.target.value})} />
                   <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', color: T.primary, fontWeight: 800 }}>.onlinept.in</div>
                </div>
                <button style={{ height: 64, marginTop: 12, borderRadius: 16, background: T.primary, color: '#FFF', fontSize: 18, fontWeight: 800, border: 'none', cursor: 'pointer' }}>Create Portal</button>
             </form>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer style={{ padding: '80px 24px 40px', background: T.bg, borderTop: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 60, marginBottom: 60 }}>
              <div style={{ gridColumn: 'span 2' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                    <img src="/onlinept-logo-v3.png" alt="OnlinePT" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                    <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 20 }}>OnlinePT</span>
                 </div>
                 <p style={{ color: T.ink3, lineHeight: 1.6, maxWidth: 300 }}>
                    Modern clinical management for the next generation of physical therapists. Build your brand, manage your patients, and grow your practice.
                 </p>
              </div>
              <div>
                 <h4 style={{ fontWeight: 700, marginBottom: 20 }}>Network</h4>
                 <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, color: T.ink3, fontSize: 14 }}>
                    <li><a href="#features" className="nav-link">Features</a></li>
                    <li><a href="#pricing" className="nav-link">Pricing</a></li>
                    <li><Link to="/physio-signup" className="nav-link" style={{ color: T.primary }}>Join as Therapist</Link></li>
                 </ul>
              </div>
              <div>
                 <h4 style={{ fontWeight: 700, marginBottom: 20 }}>Support</h4>
                 <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, color: T.ink3, fontSize: 14 }}>
                    <li><Link to="/help" className="nav-link">Help Center</Link></li>
                    <li><Link to="/privacy" className="nav-link">Privacy Policy</Link></li>
                    <li><Link to="/cancellation" className="nav-link">Cancellation Policy</Link></li>
                    <li><Link to="/contact" className="nav-link">Contact Us</Link></li>
                 </ul>
              </div>
           </div>
           
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, paddingTop: 40, borderTop: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 12, color: T.ink4 }}>© 2026 OnlinePT. All rights reserved.</p>
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
