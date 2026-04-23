import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle2, Stethoscope, Sparkles } from 'lucide-react';

const T = {
  bg: '#09090B',
  ink: '#F8FAFC',
  ink2: '#94A3B8',
  glass: 'rgba(30, 41, 59, 0.4)',
  border: 'rgba(255, 255, 255, 0.08)',
  primary: '#007AFF',
};

export default function ContactUsPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: 'general', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const formRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSubmitted(true);
  };

  return (
    <div style={{ background: T.bg, color: T.ink, minHeight: '100vh', fontFamily: "'Manrope', sans-serif" }}>
       <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&display=swap');
          .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.08); }
          .luxe-input { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 16px 20px; color: #FFF; font-size: 15px; outline: none; transition: 0.3s; width: 100%; }
          .luxe-input:focus { border-color: ${T.primary}; box-shadow: 0 0 15px ${T.primary}30; background: rgba(255,255,255,0.05); }
          .glow-card:hover { transform: translateY(-3px); border-color: ${T.primary}40; box-shadow: 0 15px 30px rgba(0,0,0,0.4); }
          .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px ${T.primary}40; filter: brightness(1.2); }
       `}</style>

      {/* Header */}
      <div style={{ padding: '24px', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: T.ink, fontWeight: 800 }}>
            <ArrowLeft size={18} /> Back
          </Link>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.primary, letterSpacing: '4px', textTransform: 'uppercase' }}>CONTACT CLINIC</div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: '80px 24px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%', background: `radial-gradient(circle at center, ${T.primary}10 0%, transparent 70%)`, pointerEvents: 'none' }}></div>
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: 100, fontSize: 12, fontWeight: 800, color: T.primary, marginBottom: 24, letterSpacing: '1px' }}>
             <MessageSquare size={14} /> CONNECT WITH US
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 8vw, 64px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 24 }}>
            Get in <span style={{ color: T.primary }}>Touch</span>
          </h1>
          <p style={{ color: T.ink2, fontSize: 18, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>Whether you are a clinician looking to modernize or a patient needing care, we are here for you.</p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 100px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 48 }}>
           {[
             { icon: Mail, title: 'Email', value: 'onlinepthelp@gmail.com', color: T.primary, href: 'mailto:onlinepthelp@gmail.com' },
             { icon: Phone, title: 'WhatsApp', value: '+91 92281 08454', color: '#10B981', href: 'https://wa.me/919228108454' },
             { icon: MapPin, title: 'Studio', value: 'Surat, Gujarat, India', color: '#F59E0B', href: 'https://maps.google.com/?q=Nijanand+Fitness+Centre+Sarthana+Jakatnaka+Surat' }
           ].map((item, idx) => (
             <a key={idx} href={item.href} target="_blank" rel="noopener noreferrer" className="glass glow-card" style={{ padding: 32, borderRadius: 32, textDecoration: 'none', color: '#FFF', transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
               <div style={{ width: 44, height: 44, borderRadius: 14, background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: item.color }}>
                 <item.icon size={22} />
               </div>
               <p style={{ fontSize: 13, fontWeight: 800, color: T.ink2, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8 }}>{item.title}</p>
               <p style={{ fontSize: 17, fontWeight: 700 }}>{item.value}</p>
             </a>
           ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, alignItems: 'start' }}>
          {/* Form */}
          <div className="glass" style={{ padding: 48, borderRadius: 40 }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 80, height: 80, borderRadius: 28, background: '#10B98120', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                  <CheckCircle2 size={40} color="#10B981" />
                </div>
                <h3 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Message Sent</h3>
                <p style={{ color: T.ink2, fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>We've received your inquiry. A clinical specialist will reach out to you within 24 hours.</p>
                <button onClick={() => setSubmitted(false)} style={{ background: T.primary, color: '#FFF', border: 'none', padding: '16px 32px', borderRadius: 100, fontWeight: 800, cursor: 'pointer' }}>Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Send a Message</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <input className="luxe-input" placeholder="Your Name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  <input className="luxe-input" type="email" placeholder="Email Address" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <select className="luxe-input" style={{ appearance: 'none' }} value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
                   <option value="general" style={{ background: '#09090B' }}>General Inquiry</option>
                   <option value="support" style={{ background: '#09090B' }}>Technical Support</option>
                   <option value="demo" style={{ background: '#09090B' }}>Request a Demo</option>
                </select>
                <textarea className="luxe-input" placeholder="How can we assist you?" required rows={5} value={form.message} onChange={e => setForm({...form, message: e.target.value})} style={{ resize: 'none' }} />
                <button type="submit" disabled={sending} className="submit-btn" style={{ background: T.primary, color: '#FFF', border: 'none', padding: '20px', borderRadius: 20, fontSize: 16, fontWeight: 800, cursor: 'pointer', transition: '0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  {sending ? 'Processing...' : <><Send size={18} /> Dispatch Message</>}
                </button>
              </form>
            )}
          </div>

          {/* Info Card */}
          <div className="glass" style={{ padding: 48, borderRadius: 40, border: `1px solid ${T.primary}20` }}>
             <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32 }}>Location & Hours</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                <div style={{ display: 'flex', gap: 20 }}>
                   <div style={{ minWidth: 48, height: 48, borderRadius: 16, background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}><Clock size={22} /></div>
                   <div>
                      <p style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Operating Hours</p>
                      <p style={{ color: T.ink2, fontSize: 14 }}>Mon — Sat: 9:00 AM – 7:00 PM IST</p>
                   </div>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                   <div style={{ minWidth: 48, height: 48, borderRadius: 16, background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}><Stethoscope size={22} /></div>
                   <div>
                      <p style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Clinical Support</p>
                      <p style={{ color: T.ink2, fontSize: 14 }}>Specialized assistance for physiotherapists digitizing their practice.</p>
                   </div>
                </div>
                <div style={{ marginTop: 20, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: T.primary, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: 16 }}>Office Location</p>
                  <p style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.6 }}>Nijanand Fitness Centre, 241 Royal Arcade, Sarthana Jakatnaka, Surat, India 395006</p>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
