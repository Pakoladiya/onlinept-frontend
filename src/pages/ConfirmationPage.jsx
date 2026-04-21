import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom';
import { 
   CheckCircle2, Calendar, Clock, MapPin, 
   ChevronRight, ArrowRight, Download, Share2, 
   Stethoscope, Activity, Sparkles, Wand2, Printer, X, FileText
 } from 'lucide-react';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const T = {
  bg: '#0F172A',
  ink: '#F8FAFC',
  ink2: '#94A3B8',
  glass: 'rgba(30, 41, 59, 0.4)',
  border: 'rgba(255, 255, 255, 0.08)',
};

export default function ConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const summary = location.state || {};
  
  const [clinicData, setClinicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);

  const revealRefs = useRef([]);
  const addToRefs = (el) => { if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el); };

  useEffect(() => {
    async function fetchClinic() {
      if (summary.clinicId) {
        const snap = await getDoc(doc(db, 'clinics', summary.clinicId));
        if (snap.exists()) setClinicData(snap.data());
      }
      setLoading(false);
    }
    if (Object.keys(summary).length === 0 && !id) {
      navigate('/');
      return;
    }
    fetchClinic();

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
    }, { threshold: 0.1 });
    const timer = setTimeout(() => { revealRefs.current.forEach(el => el && obs.observe(el)); }, 100);
    return () => { obs.disconnect(); clearTimeout(timer); };
  }, [summary.clinicId]);

  const pColor = clinicData?.primaryColor || '#10B981';

  if (loading) return null;

  return (
    <div style={{ background: '#09090B', color: '#F8FAFC', minHeight: '100vh', fontFamily: "'Manrope', sans-serif" }}>
       <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&display=swap');
          .reveal { opacity: 0; transform: translateY(20px); transition: all 1s cubic-bezier(0.16, 1, 0.3, 1); }
          .reveal.active { opacity: 1; transform: translateY(0); }
          .glass-card { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 40px; }
          .glow-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 40px ${pColor}40; filter: brightness(1.2); }
       `}</style>
       
       <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: `radial-gradient(circle at 10% 10%, ${pColor}10 0%, transparent 40%), radial-gradient(circle at 90% 90%, ${pColor}05 0%, transparent 40%)`, pointerEvents: 'none' }}></div>

       <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', padding: '100px 24px 120px' }}>
          
          <div ref={addToRefs} className="reveal" style={{ textAlign: 'center', marginBottom: 60 }}>
             <div style={{ width: 96, height: 96, borderRadius: 32, background: `linear-gradient(135deg, ${pColor}, #FFF0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: `0 30px 60px ${pColor}30` }}>
                <CheckCircle2 size={48} color="#FFF" />
             </div>
             <h1 style={{ fontSize: 'clamp(32px, 8vw, 56px)', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1 }}>Appointment <span style={{ color: pColor }}>Confirmed</span></h1>
             <p style={{ fontSize: 18, color: '#94A3B8', marginTop: 20, maxWidth: 500, margin: '20px auto 0', lineHeight: 1.6 }}>Your clinical consultation has been secured and a confirmation is on its way to your WhatsApp.</p>
          </div>

          <div ref={addToRefs} className="reveal glass-card" style={{ padding: 48, marginBottom: 40, border: `2px solid ${pColor}30` }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
                <div>
                   <label style={{ fontSize: 11, fontWeight: 800, color: pColor, textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: 12 }}>Consultation For</label>
                   <p style={{ fontSize: 20, fontWeight: 700 }}>{summary.serviceName || 'Physical Therapy Session'}</p>
                   <p style={{ fontSize: 14, color: '#64748B', marginTop: 8 }}>Booking ID: {id.slice(-8)}</p>
                </div>
                <div>
                   <label style={{ fontSize: 11, fontWeight: 800, color: pColor, textTransform: 'uppercase', letterSpacing: '2px', display: 'block', marginBottom: 12 }}>Time & Date</label>
                   <p style={{ fontSize: 20, fontWeight: 700 }}>{summary.dateDisplay || summary.date}</p>
                   <p style={{ fontSize: 14, color: '#64748B', marginTop: 8 }}>{summary.slotLabel || summary.slot?.time}</p>
                </div>
             </div>

             <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                   <div style={{ width: 52, height: 52, borderRadius: 16, background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={24} color={pColor} /></div>
                   <div>
                      <p style={{ fontSize: 15, fontWeight: 800 }}>{clinicData?.clinicName || 'Clinic'}</p>
                      <p style={{ fontSize: 13, color: '#64748B' }}>Physiotherapy Excellence</p>
                   </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '8px 16px', borderRadius: 100 }}>Payment Received</div>
             </div>
          </div>

          <div ref={addToRefs} className="reveal glass-card" style={{ padding: 40, background: `linear-gradient(225deg, rgba(30,41,59,0.6) 0%, rgba(15,23,42,0.9) 100%)`, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 20 }}>
             <div style={{ display: 'flex', alignItems: 'start', gap: 16 }}>
                <div style={{ minWidth: 28, height: 28, borderRadius: 8, background: `${pColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pColor }}><Sparkles size={16} /></div>
                <div>
                   <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Check your WhatsApp</p>
                   <p style={{ fontSize: 13, color: '#94A3B8' }}>A detailed preparation guide and session link have been sent to you.</p>
                </div>
             </div>
             <div style={{ display: 'flex', alignItems: 'start', gap: 16 }}>
                <div style={{ minWidth: 28, height: 28, borderRadius: 8, background: `${pColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: pColor }}><CheckCircle2 size={16} /></div>
                <div>
                   <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Receipt Sent</p>
                   <p style={{ fontSize: 13, color: '#94A3B8' }}>Your digital invoice has been dispatched to your email address.</p>
                </div>
             </div>
          </div>

          <div ref={addToRefs} className="reveal" style={{ marginTop: 60, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
             <button onClick={() => navigate('/')} className="glow-btn" style={{ height: 64, padding: '0 40px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: '#FFF', border: `1px solid ${pColor}40`, fontSize: 16, fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s' }}>
                Done, Return Home
             </button>
             <button onClick={() => setShowReceipt(true)} className="glow-btn" style={{ height: 64, padding: '0 40px', borderRadius: 20, background: pColor, color: '#FFF', border: 'none', fontSize: 16, fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={20} /> Generate Receipt
             </button>
          </div>

          {/* 🧾 Digital Receipt Modal */}
          {showReceipt && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
               <div style={{ background: '#FFF', color: '#1E293B', width: '100%', maxWidth: 500, borderRadius: 32, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                  <div style={{ padding: '32px 40px', background: '#F8FAFC', borderBottom: '1px dashed #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '1px' }}>Payment Receipt</h2>
                        <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>TXN ID: #{id.slice(-8).toUpperCase()}</p>
                     </div>
                     <button onClick={() => setShowReceipt(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={24} /></button>
                  </div>
                  <div style={{ padding: 40 }}>
                     <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        {clinicData?.logo ? (
                           <img src={clinicData.logo} style={{ height: 40, marginBottom: 16, objectFit: 'contain' }} alt="Logo" />
                        ) : (
                           <div style={{ width: 44, height: 44, background: pColor, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 20, fontWeight: 900, color: '#FFF' }}>{clinicData?.clinicName?.charAt(0) || 'C'}</div>
                        )}
                        <h3 style={{ fontSize: 16, fontWeight: 800 }}>{clinicData?.clinicName}</h3>
                        <p style={{ fontSize: 13, color: '#64748B' }}>{clinicData?.address?.split(',')[0]} • {clinicData?.phone}</p>
                     </div>

                     <div style={{ display: 'grid', gap: 16, padding: '24px 0', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                           <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Patient Name</span>
                           <span style={{ fontSize: 13, fontWeight: 700 }}>{summary.patientName || 'Patient'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                           <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Consultation</span>
                           <span style={{ fontSize: 13, fontWeight: 700 }}>{summary.serviceName}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                           <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Date & Time</span>
                           <span style={{ fontSize: 13, fontWeight: 700 }}>{summary.dateDisplay} • {summary.slotLabel}</span>
                        </div>
                     </div>

                     <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                           <p style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Amount Paid</p>
                           <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A' }}>₹{summary.servicePrice || '500'}</h2>
                        </div>
                        <div style={{ border: `2px solid ${pColor}`, color: pColor, padding: '6px 16px', borderRadius: 8, fontSize: 14, fontWeight: 900, transform: 'rotate(-5deg)', opacity: 0.8 }}>PAID</div>
                     </div>

                     <div style={{ marginTop: 40, display: 'flex', gap: 12 }}>
                        <button onClick={() => window.print()} style={{ flex: 1, height: 48, borderRadius: 12, background: '#F1F5F9', border: 'none', color: '#1E293B', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                           <Printer size={16} /> Print
                        </button>
                        <button style={{ flex: 1, height: 48, borderRadius: 12, background: pColor, border: 'none', color: '#FFF', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                           <Download size={16} /> Download
                        </button>
                     </div>
                  </div>
               </div>
               <style>{`
                  @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
               `}</style>
            </div>
          )}
       </div>

       <footer style={{ padding: '60px 24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', background: '#09090B' }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: '#475569', letterSpacing: '4px', textTransform: 'uppercase' }}>Workflow Secured by OnlinePT</p>
       </footer>
    </div>
  );
}
