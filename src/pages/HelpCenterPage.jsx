import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Search, ChevronDown, ChevronRight, BookOpen, CreditCard, Monitor,
  Users, Shield, Settings, Video, Calendar, Stethoscope, HelpCircle,
  FileText, Globe, MessageSquare, Zap, CheckCircle2, Sparkles
} from 'lucide-react';

const T = {
  bg: '#09090B',
  ink: '#F8FAFC',
  ink2: '#94A3B8',
  glass: 'rgba(30, 41, 59, 0.4)',
  border: 'rgba(255, 255, 255, 0.08)',
  primary: '#007AFF',
};

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQ, setOpenFAQ] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  const categories = [
    {
      id: 'getting-started', icon: Zap, title: 'Getting Started', color: '#007AFF',
      desc: 'Set up your clinic and get running in minutes',
      articles: [
        { q: 'How do I create my OnlinePT clinic portal?', a: 'Visit onlinept.in and click "Start Your Clinic". Fill in the registration form with your name, email, phone, and clinic details. Choose your preferred subdomain (e.g., drkumar.onlinept.in). Once approved by our team, your branded portal goes live within 24 hours.' },
        { q: 'What information do I need to get started?', a: 'You\'ll need: Full name, email, phone number, clinic registration ID, years of experience, specialization(s), and your clinic logo (optional). You can also configure your services, pricing and availability during the onboarding process.' },
        { q: 'How long does account approval take?', a: 'Most accounts are approved within 12-24 hours during business days. We verify your professional credentials to maintain platform quality. You\'ll receive an email notification once approved.' },
        { q: 'Can I customize my clinic\'s branding?', a: 'Yes! From your Admin Panel, you can upload your logo, set your brand colors, customize your booking page text, and choose from multiple layout themes. Your subdomain (e.g., yourname.onlinept.in) is also fully branded.' },
      ]
    },
    {
      id: 'bookings', icon: Calendar, title: 'Appointments & Bookings', color: '#10B981',
      desc: 'Manage your schedule and patient appointments',
      articles: [
        { q: 'How do patients book appointments?', a: 'Patients visit your branded booking page (yourname.onlinept.in), select a service type (Consultation, Follow-up, or Treatment), choose an available time slot, fill in their details, and complete payment via Razorpay. They receive a confirmation via email and WhatsApp.' },
        { q: 'Can patients reschedule or cancel appointments?', a: 'Yes, patients can reschedule from their confirmation email. Cancellation policies are set by each clinician — you can configure free cancellation windows (e.g., 24 hours before) from your Settings panel.' },
        { q: 'How do I manage my availability?', a: 'Go to Settings → Availability. Set your working days, time slots, break times, and slot duration. You can also block specific dates for holidays. Changes take effect immediately on your booking page.' },
        { q: 'Can I offer multiple service types with different prices?', a: 'Absolutely! In Settings → Services, you can create multiple service types (Initial Consultation, Follow-up, Treatment Session) with custom durations, prices, and descriptions. Patients choose their service when booking.' },
      ]
    },
    {
      id: 'video', icon: Video, title: 'Video Consultations', color: '#A855F7',
      desc: 'Conduct secure online physiotherapy sessions',
      articles: [
        { q: 'How do video consultations work?', a: 'After a booking is confirmed as a "Video Call" appointment, both you and the patient receive a unique session link via WhatsApp/email. At the appointment time, both parties click the link to join a secure, browser-based video call — no app download required.' },
        { q: 'What technology is used for video calls?', a: 'We use WebRTC technology for peer-to-peer, encrypted video calls. This works directly in modern browsers (Chrome, Safari, Firefox, Edge) on both desktop and mobile without any plugins.' },
        { q: 'Can I share my screen during a session?', a: 'Yes, screen sharing is available during video sessions. This is useful for showing exercise demonstrations, reviewing reports, or displaying Home Exercise Programs (HEPs) to patients.' },
        { q: 'What if the video call has connectivity issues?', a: 'The system automatically adjusts video quality based on bandwidth. If issues persist, you can switch to audio-only mode. All session details are logged so you can follow up with the patient.' },
      ]
    },
    {
      id: 'billing', icon: CreditCard, title: 'Billing & Payments', color: '#F59E0B',
      desc: 'Understand pricing, payments, and invoicing',
      articles: [
        { q: 'What are the subscription plans?', a: 'We offer three plans: Starter (Free: 1 service, basic booking page), Professional (₹1,999/month: unlimited services, video calls, analytics), and Clinic (₹4,999/month: everything + multi-practitioner, priority support). All paid plans include a 14-day free trial.' },
        { q: 'How do patients pay for appointments?', a: 'Patient payments are processed securely via Razorpay (UPI, cards, net banking, wallets). The payment is collected at the time of booking. Funds are settled to your registered bank account as per Razorpay\'s settlement cycle.' },
        { q: 'Can I set my own consultation fees?', a: 'Yes! Each clinician has full control over their pricing in Settings → Services. You set separate fees for Initial Consultation, Follow-up, and Treatment sessions. Super Admins can also create default pricing templates.' },
        { q: 'Is there a transaction fee?', a: 'OnlinePT does not charge any additional transaction fees beyond the subscription. Standard Razorpay payment gateway charges apply (typically 2% for domestic transactions).' },
      ]
    },
    {
      id: 'clinical', icon: FileText, title: 'Clinical Documentation', color: '#EF4444',
      desc: 'SOAP notes, HEPs, and patient records',
      articles: [
        { q: 'What are SOAP notes and how do I use them?', a: 'SOAP (Subjective, Objective, Assessment, Plan) notes are the standard clinical documentation format. After each session, click "Post-Session Notes" to document patient findings. Our structured form guides you through each section with auto-filled patient details.' },
        { q: 'How do I create Home Exercise Programs (HEPs)?', a: 'Navigate to the HEP Builder from your dashboard. Search our exercise library, select exercises, set reps/sets/frequency, add notes, and generate a branded PDF. You can share it directly via WhatsApp to the patient.' },
        { q: 'Can I track patient recovery progress?', a: 'Yes! The Recovery Tracking feature lets you record VAS (Visual Analog Scale) pain scores, ROM measurements, and strength assessments at each visit. The system generates progress charts automatically.' },
        { q: 'Is patient data secure?', a: 'Absolutely. All patient medical data is encrypted in transit and at rest. Access is restricted to the treating clinician only — even our Super Admins cannot view individual patient clinical records. See our Privacy Policy for details.' },
      ]
    },
    {
      id: 'account', icon: Settings, title: 'Account Settings', color: '#6366F1',
      desc: 'Manage your profile, team, and preferences',
      articles: [
        { q: 'How do I update my profile information?', a: 'Go to Settings → Profile. You can update your display name, specializations, qualifications, profile photo, and contact information. Changes to clinic registration ID require admin verification.' },
        { q: 'Can I add multiple practitioners to my clinic?', a: 'Yes, with the Clinic plan! Navigate to Admin → Team Management. Invite practitioners via email — they\'ll create their own OnlinePT accounts and be linked to your clinic. Each practitioner has their own schedule and patient list.' },
        { q: 'How do I change my subdomain?', a: 'Subdomain changes require admin assistance. Contact our support team via the Contact Us page with your preferred new subdomain. Changes take effect within 24 hours and the old URL will redirect automatically.' },
        { q: 'How do I delete my account?', a: 'You can request account deletion via our Contact Us page. We\'ll process your request within 30 days, retaining only data required by law (financial records for 7 years). All active patient bookings will be cancelled upon deletion.' },
      ]
    },
  ];

  const filtered = searchQuery.trim().length > 2
    ? categories.map(cat => ({
        ...cat,
        articles: cat.articles.filter(a =>
          a.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.articles.length > 0)
    : categories;

  return (
    <div style={{ background: T.bg, color: T.ink, minHeight: '100vh', fontFamily: "'Manrope', sans-serif" }}>
       <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&display=swap');
          .glass { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); }
          .cat-card:hover { transform: translateY(-5px); border-color: ${T.primary}40; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
          .faq-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; margin-bottom: 12px; transition: all 0.3s; }
          .faq-item:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
          .search-box:focus-within { border-color: ${T.primary}; box-shadow: 0 0 20px ${T.primary}30; }
       `}</style>

      {/* Header */}
      <div style={{ padding: '24px 24px', position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: T.ink, fontWeight: 800, fontSize: 14 }}>
            <ArrowLeft size={18} /> Back
          </Link>
          <div style={{ fontSize: 13, fontWeight: 800, color: T.primary, letterSpacing: '4px', textTransform: 'uppercase' }}>Help Center</div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: '80px 24px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%', background: `radial-gradient(circle at center, ${T.primary}15 0%, transparent 70%)`, pointerEvents: 'none' }}></div>
        
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: 100, fontSize: 12, fontWeight: 800, color: T.primary, marginBottom: 24, letterSpacing: '1px' }}>
            <Sparkles size={14} /> HOW CAN WE HELP?
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 8vw, 64px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 32 }}>
            Search the <span style={{ color: T.primary }}>Knowledge Base</span>
          </h1>

          <div className="search-box glass" style={{ maxWidth: 600, margin: '0 auto', padding: '6px 6px 6px 20px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Search size={20} color={T.ink2} />
            <input
              type="text"
              placeholder="e.g. Setting up branding, WhatsApp alerts..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setActiveCategory(null); }}
              style={{ flex: 1, background: 'none', border: 'none', color: '#FFF', padding: '16px 0', fontSize: 16, outline: 'none' }}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 100px' }}>
        
        {/* Category Selection */}
        {!activeCategory && !searchQuery.trim() && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {categories.map(cat => (
              <div key={cat.id} className="cat-card glass" style={{ padding: 40, borderRadius: 32, cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={() => setActiveCategory(cat.id)}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: `${cat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: cat.color }}>
                  <cat.icon size={32} />
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>{cat.title}</h3>
                <p style={{ color: T.ink2, fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>{cat.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.primary, fontWeight: 800, fontSize: 14 }}>
                  Explore Articles <ArrowLeft style={{ transform: 'rotate(180deg)' }} size={16} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results/Category View */}
        {(activeCategory || searchQuery.trim().length > 2) && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <button onClick={() => { setActiveCategory(null); setSearchQuery(''); }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: T.primary, fontWeight: 800, fontSize: 14, cursor: 'pointer', marginBottom: 40 }}>
              <ArrowLeft size={16} /> All Categories
            </button>

            {filtered.filter(cat => !activeCategory || cat.id === activeCategory).map(cat => (
              <div key={cat.id} style={{ marginBottom: 60 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${cat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.color }}>
                    <cat.icon size={24} />
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 800 }}>{cat.title}</h2>
                </div>
                
                {cat.articles.map((art, idx) => {
                  const key = `art-${cat.id}-${idx}`;
                  const isOpen = openFAQ === key;
                  return (
                    <div key={key} className="faq-item">
                      <button onClick={() => setOpenFAQ(isOpen ? null : key)} style={{ width: '100%', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', color: '#FFF', textAlign: 'left' }}>
                        <span style={{ fontSize: 17, fontWeight: 700 }}>{art.q}</span>
                        <ChevronDown size={20} color={T.primary} style={{ transition: 'transform 0.4s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                      </button>
                      {isOpen && (
                        <div style={{ padding: '0 32px 32px', color: T.ink2, fontSize: 15, lineHeight: 1.8 }}>
                          {art.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Support CTA */}
        <div className="glass" style={{ marginTop: 80, padding: 60, borderRadius: 40, textAlign: 'center', border: `1px solid ${T.primary}30`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: `linear-gradient(45deg, ${T.primary}10 0%, transparent 100%)`, pointerEvents: 'none' }}></div>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Still Stuck?</h2>
          <p style={{ color: T.ink2, maxWidth: 500, margin: '0 auto 40px', fontSize: 16, lineHeight: 1.6 }}>Our clinical support team is ready to assist you with any technical or clinical workflow issues.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.primary, color: '#FFF', padding: '18px 36px', borderRadius: 100, fontWeight: 800, textDecoration: 'none', fontSize: 15 }}>
              <MessageSquare size={18} /> Chat with Support
            </Link>
            <a href="mailto:onlinepthelp@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', color: '#FFF', padding: '18px 36px', borderRadius: 100, fontWeight: 800, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', fontSize: 15 }}>
              <HelpCircle size={18} /> Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
