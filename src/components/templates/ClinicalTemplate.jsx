import { 
  Stethoscope, Sparkles, Heart, Activity, Award, CheckCircle2, 
  Users, Calendar, Phone, Mail, MapPin, ArrowRight, Clock, Image as ImageIcon
} from 'lucide-react';
import WhatsAppButton from '../WhatsAppButton';

export default function ClinicalTemplate({ clinicConfig, scrollToForm, T, siteType, currentPage }) {
  const settings = clinicConfig.settings || {};
  
  // High-quality Indian scenario defaults
  const DEFAULTS = {
    hero: '/assets/images/indian_physio_hero_1775753932226.png',
    about: '/assets/images/indian_physio_consultation_1775753981763.png',
    gallery: [
      '/assets/images/indian_clinic_facility_1775753957250.png',
      '/assets/images/indian_physio_hero_1775753932226.png',
      '/assets/images/indian_clinic_facility_1775753957250.png'
    ]
  };

  const SectionLabel = ({ children, icon: Icon }) => (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: `${clinicConfig.primaryColor}10`, padding: '6px 14px', borderRadius: 100,
      fontSize: 12, fontWeight: 700, color: clinicConfig.primaryColor,
      letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 16,
      border: `1px solid ${clinicConfig.primaryColor}20`,
    }}>
      {Icon && <Icon size={14} />}
      {children}
    </div>
  );

  const show = (page) => siteType !== 'multi' || currentPage === page;

  return (
    <div style={{ background: '#FFF', color: '#1D1D1F' }}>
      {/* --- Hero ------------------------------------------------------------------------------------ */}
      {(show('home')) && (
      <section style={{ 
        padding: '160px 24px 100px', 
        textAlign: 'center', 
        position: 'relative',
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#1D1D1F' // Fallback for the whole section
      }}>
        {/* Background Image with Overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url(${settings.heroImage || DEFAULTS.hero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#1D1D1F',
          filter: 'brightness(0.4) saturate(1.2)',
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.8) 100%)`,
          zIndex: 2
        }} />

        <div style={{ maxWidth: 840, margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: '#FFF', fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)', marginBottom: 24, letterSpacing: 1 }}>
            Voted #1 Physiotherapy in {clinicConfig.address?.split(',')?.pop()?.trim() || 'the city'}
          </div>
          <h1 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 'clamp(44px, 10vw, 84px)', fontWeight: 850, letterSpacing: '-3px', lineHeight: 1.0, marginBottom: 28, color: '#FFF' }}>
            Elite Care for <span style={{ color: clinicConfig.primaryColor || '#007AFF' }}>Exceptional</span> Recovery.
          </h1>
          <p style={{ fontSize: 'clamp(18px, 2.5vw, 22px)', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, maxWidth: 620, margin: '0 auto 48px', fontWeight: 500 }}>
            {clinicConfig.clinicName} offers world-class physiotherapy and rehabilitation tailored to your specific movement goals.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
             <button onClick={scrollToForm} style={{ padding: '20px 48px', borderRadius: 16, background: clinicConfig.primaryColor, color: '#FFF', border: 'none', fontSize: 17, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: `0 20px 40px ${clinicConfig.primaryColor}40` }}>
                Book Appointment <ArrowRight size={22} />
             </button>
             <a href={`tel:${clinicConfig.phone}`} style={{ padding: '20px 48px', borderRadius: 16, background: 'rgba(255,255,255,0.1)', color: '#FFF', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)', fontSize: 17, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
               <Phone size={22} /> Quick Consultation
             </a>
          </div>
        </div>
      </section>
      )}

      {/* --- Services ------------------------------------------------------------------------------─ */}
      {(show('services')) && (
      <section style={{ padding: '100px 24px', background: '#F8F9FA' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <SectionLabel icon={Activity}>Specialized Services</SectionLabel>
            <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 42, fontWeight: 850, letterSpacing: -1 }}>Clinical Excellence</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28 }}>
            {clinicConfig.services.map(s => (
              <div key={s.id} style={{ background: '#FFF', padding: 36, borderRadius: 32, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', transition: 'all 0.3s', color: '#1D1D1F' }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: `${clinicConfig.primaryColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: clinicConfig.primaryColor, marginBottom: 24 }}>
                  <Heart size={28} />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>{s.name}</h3>
                <p style={{ fontSize: 15, color: '#636366', lineHeight: 1.7, marginBottom: 28 }}>{s.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F2F2F7', paddingTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#AEAEB2' }}>
                    <Clock size={16} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{s.duration} MIN</span>
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 900, color: clinicConfig.primaryColor }}>₹{s.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* --- Gallery Section ------------------------------------------------------------------─ */}
      {(show('gallery')) && (
      <section style={{ padding: '100px 24px', background: '#FFF' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <SectionLabel icon={ImageIcon}>Facility View</SectionLabel>
            <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 40, fontWeight: 850, letterSpacing: -1 }}>Inside Our Clinic</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {(settings.galleryImages?.length > 0 ? settings.galleryImages : DEFAULTS.gallery).map((img, i) => (
              <div key={i} style={{ aspectRatio: '4/3', borderRadius: 24, overflow: 'hidden', background: '#F2F2F7', boxShadow: '0 15px 40px rgba(0,0,0,0.06)' }}>
                <img src={img} alt="Clinic Interior" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} onMouseOver={e => e.target.style.transform = 'scale(1.05)'} onMouseOut={e => e.target.style.transform = 'scale(1)'} />
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* --- About ------------------------------------------------------------------------------------ */}
      {(show('about')) && (
      <>
      <section style={{ padding: '120px 24px', background: `linear-gradient(180deg, #F8F9FA 0%, #FFF 100%)` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 80, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
             <div style={{ aspectRatio: '4/5', borderRadius: 40, overflow: 'hidden', background: '#F2F2F7', boxShadow: '0 30px 80px rgba(0,0,0,0.1)' }}>
               <img src={settings.aboutImage || DEFAULTS.about} alt="Our Expertise" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             </div>
             {/* Dynamic Float Badge */}
             <div style={{ position: 'absolute', bottom: -20, right: -20, background: '#FFF', padding: '24px 32px', borderRadius: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.15)', border: '1px solid #E5E5E7' }}>
               <div style={{ fontSize: 32, fontWeight: 900, color: clinicConfig.primaryColor, lineHeight: 1 }}>{new Date().getFullYear() - (clinicConfig.passingYear || 2012)}+</div>
               <div style={{ fontSize: 13, fontWeight: 700, color: '#636366', textTransform: 'uppercase', marginTop: 4, letterSpacing: 0.5 }}>Years Experience</div>
             </div>
          </div>
          <div>
             <SectionLabel icon={Award}>Our Philosophy</SectionLabel>
             <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 44, fontWeight: 850, lineHeight: 1.1, marginBottom: 24 }}>Recovery with <span style={{ color: clinicConfig.primaryColor }}>Precision.</span></h2>
             <p style={{ fontSize: 18, color: '#636366', lineHeight: 1.8, marginBottom: 32 }}>
               {clinicConfig.bio || `${clinicConfig.clinicName} is dedicated to providing evidence-based treatment plans that empower our patients to regain their independence and return to their passion.`}
             </p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
               {[
                 { title: 'Personalized Plans', desc: 'No cookie-cutter solutions here.' },
                 { title: 'Advanced Modalities', desc: 'State-of-the-art equipment and tech.' },
                 { title: 'Supportive Environment', desc: 'We are with you every step of the way.' }
               ].map((item, id) => (
                 <div key={id} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${clinicConfig.primaryColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: clinicConfig.primaryColor, flexShrink: 0 }}>
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{item.title}</div>
                      <div style={{ fontSize: 14, color: '#AEAEB2' }}>{item.desc}</div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* --- Profile & Social Proof --- */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 140, height: 140, borderRadius: 100, overflow: 'hidden', margin: '0 auto 32px', border: `4px solid ${clinicConfig.primaryColor}20`, padding: 6 }}>
            <img src={clinicConfig.physioPhoto} alt={clinicConfig.physioName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 850, marginBottom: 8 }}>Dr. {clinicConfig.physioName}</h2>
          <p style={{ fontSize: 18, fontWeight: 700, color: clinicConfig.primaryColor, marginBottom: 24 }}>Clinical Director & Lead Consultant</p>
          <div style={{ maxWidth: 640, margin: '0 auto', fontSize: 17, color: '#636366', lineHeight: 1.8, fontStyle: 'italic' }}>
            "Our goal isn't just to treat the symptoms, but to rebuild the athlete, the professional, and the human being within you."
          </div>
        </div>
      </section>
      </>
      )}

      {/* --- Contact & Location --- */}
      {(show('home')) && (
      <section style={{ padding: '120px 24px', borderTop: '1px solid #F2F2F7', background: '#F8F9FA' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <SectionLabel icon={MapPin}>Visit Us</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, marginTop: 40, textAlign: 'left' }}>
            <div style={{ background: '#FFF', padding: 40, borderRadius: 36, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 20px 50px rgba(0,0,0,0.03)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: clinicConfig.primaryColor, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, boxShadow: `0 10px 20px ${clinicConfig.primaryColor}30` }}>
                <MapPin size={26} />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 850, marginBottom: 12, color: '#1D1D1F' }}>Practice Location</h3>
              <p style={{ color: '#636366', fontSize: 17, lineHeight: 1.6, fontWeight: 500 }}>{clinicConfig.address || 'Clinic full address will appear here.'}</p>
            </div>

            <div style={{ background: '#FFF', padding: 40, borderRadius: 36, border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 20px 50px rgba(0,0,0,0.03)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: clinicConfig.primaryColor, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, boxShadow: `0 10px 20px ${clinicConfig.primaryColor}30` }}>
                <Clock size={26} />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 850, marginBottom: 16, color: '#1D1D1F' }}>Working Hours</h3>
              <div style={{ color: '#636366', fontSize: 16, lineHeight: 1.6, fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#1D1D1F' }}>Mon — Fri</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, color: clinicConfig.primaryColor, display: 'block' }}>09:00 AM — 01:00 PM</span>
                    <span style={{ fontWeight: 800, color: clinicConfig.primaryColor, display: 'block' }}>04:00 PM — 08:00 PM</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F2F2F7', paddingTop: 12 }}>
                  <span style={{ color: '#1D1D1F' }}>Saturday</span>
                  <span style={{ fontWeight: 800, color: clinicConfig.primaryColor }}>09:00 AM — 01:00 PM</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F2F2F7', paddingTop: 12 }}>
                  <span style={{ color: '#1D1D1F' }}>Sunday</span>
                  <span style={{ fontWeight: 800, color: '#FF3B30', background: '#FF3B3010', padding: '4px 12px', borderRadius: 100, fontSize: 14 }}>Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

    </div>
  );
}
