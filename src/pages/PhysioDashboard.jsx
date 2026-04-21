import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { onAuth, signOut } from '@/firebase/auth';
import { getPhysioBookings, getPhysioPatients, blockSlot, getClinicByOwner } from '@/firebase/db';
import { isSuperAdminEmail } from '@/config/superAdminConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
  Settings, Clock, LogOut, ChevronRight, Video, Search, X,
  Loader2, Calendar, ShieldCheck, ChevronLeft,
  Users, CalendarCheck, TrendingUp, UserCheck, Activity,
  BarChart3, MessageSquare, Crown, Menu, PlusCircle, Share2, Copy, Send,
  HeartPulse, FileText, RefreshCw, PhoneCall, ArrowRight
} from 'lucide-react';

// ---─ Design Tokens ------------------------------------------------------------------------------------------
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
  surface: 'var(--color-surface)',
  r: { sm: 12, md: 18, lg: 24, xl: 32 },
};

const TABS = ['Overview', 'Patients', 'Schedule', 'Insights'];

const toTitleCase = (str) => {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

// ---─ Components ---------------------------------------------------------------------------------------------─

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div style={{
      background: T.white, borderRadius: T.r.md, border: `1px solid ${T.border}`,
      padding: 'clamp(16px, 4vw, 20px)', display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: `${color}10`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: color
      }}>
        <Icon size={20} />
      </div>
      <div>
        <h4 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 'clamp(24px, 5vw, 28px)', fontWeight: 800, color: T.ink, lineHeight: 1, letterSpacing: '-0.5px' }}>
          {value ?? '—'}
        </h4>
        <p style={{ fontSize: 12, fontWeight: 600, color: T.ink3, marginTop: 4 }}>{label}</p>
      </div>
    </div>
  );
}

function PatientCard({ patient, onClick }) {
  return (
    <button onClick={onClick} style={{ width: '100%', background: T.white, borderRadius: T.r.md, border: `1px solid ${T.border}`, padding: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white, fontWeight: 800 }}>
        {(patient.name || 'P')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{toTitleCase(patient.name)}</p>
        <p style={{ fontSize: 12, color: T.ink3, marginTop: 2 }}>{patient.phone || patient.whatsapp || '—'} · {patient.age ? `${patient.age} yrs` : (patient.city || '—')}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, background: T.primaryLight, color: T.primary, padding: '3px 8px', borderRadius: 20 }}>View Record</span>
        <ChevronRight size={18} style={{ color: T.ink4 }} />
      </div>
    </button>
  );
}

// ─── Patient Health Record Modal ─────────────────────────────────────────────
function PatientRecordModal({ patient, bookings, onClose }) {
  // Get all bookings for this patient sorted by date
  const patientBookings = (bookings || []).filter(b =>
    b.patientPhone === patient.phone ||
    b.patientPhone === patient.whatsapp ||
    b.patientName?.toLowerCase() === patient.name?.toLowerCase()
  ).sort((a, b) => {
    const ta = a.createdAt?.seconds || 0;
    const tb = b.createdAt?.seconds || 0;
    return tb - ta;
  });

  const latestBooking = patientBookings[0];
  const hasRecords = patientBookings.length > 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: T.white, borderRadius: 28, maxWidth: 560, width: '100%',
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white, fontWeight: 800, fontSize: 20 }}>
              {(patient.name || 'P')[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 20, fontWeight: 800, color: T.ink }}>{toTitleCase(patient.name)}</h2>
              <p style={{ fontSize: 13, color: T.ink3 }}>{patient.phone || patient.whatsapp} · {patient.age ? `${patient.age} yrs` : ''} {patient.gender || ''}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 50, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color={T.ink3} />
          </button>
        </div>

        <div style={{ padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* What Patient Felt During Booking */}
          <div style={{ background: '#FFF7ED', borderRadius: 18, padding: 20, border: '1px solid #FFEDD5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <HeartPulse size={18} color="#EA580C" />
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#9A3412' }}>What Patient Reported (At Booking)</h3>
            </div>
            {latestBooking?.intake?.clinicalInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {latestBooking.intake.clinicalInfo.primaryComplaint && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Chief Complaint</p>
                    <p style={{ fontSize: 14, color: '#78350F', lineHeight: 1.5 }}>{latestBooking.intake.clinicalInfo.primaryComplaint}</p>
                  </div>
                )}
                {latestBooking.intake.clinicalInfo.duration && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Duration of Issue</p>
                    <p style={{ fontSize: 14, color: '#78350F' }}>{latestBooking.intake.clinicalInfo.duration}</p>
                  </div>
                )}
                {latestBooking.intake.clinicalInfo.medicalHistory && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Medical History</p>
                    <p style={{ fontSize: 14, color: '#78350F', lineHeight: 1.5 }}>{latestBooking.intake.clinicalInfo.medicalHistory}</p>
                  </div>
                )}
                {latestBooking.complaints && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Primary Concern</p>
                    <p style={{ fontSize: 14, color: '#78350F' }}>{latestBooking.complaints}</p>
                  </div>
                )}
              </div>
            ) : latestBooking?.complaints ? (
              <p style={{ fontSize: 14, color: '#78350F', lineHeight: 1.5 }}>{latestBooking.complaints}</p>
            ) : (
              <p style={{ fontSize: 13, color: '#D97706', fontStyle: 'italic' }}>No intake form completed yet.</p>
            )}
          </div>

          {/* Therapist's Last Session Notes */}
          <div style={{ background: '#F0F9FF', borderRadius: 18, padding: 20, border: '1px solid #BAE6FD' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <FileText size={18} color="#0284C7" />
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#0C4A6E' }}>Therapist's Last Session Record</h3>
            </div>
            {latestBooking?.sessionNotes ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {latestBooking.sessionNotes.findings && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Clinical Findings</p>
                    <p style={{ fontSize: 14, color: '#0C4A6E', lineHeight: 1.5 }}>{latestBooking.sessionNotes.findings}</p>
                  </div>
                )}
                {latestBooking.sessionNotes.treatment && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Treatment Given</p>
                    <p style={{ fontSize: 14, color: '#0C4A6E', lineHeight: 1.5 }}>{latestBooking.sessionNotes.treatment}</p>
                  </div>
                )}
                {latestBooking.sessionNotes.nextSteps && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Next Steps / HEP</p>
                    <p style={{ fontSize: 14, color: '#0C4A6E', lineHeight: 1.5 }}>{latestBooking.sessionNotes.nextSteps}</p>
                  </div>
                )}
                <p style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Last updated: {latestBooking.sessionNotes.date || (latestBooking.date)}</p>
              </div>
            ) : latestBooking?.postSession ? (
              <div>
                <p style={{ fontSize: 14, color: '#0C4A6E', lineHeight: 1.5 }}>{typeof latestBooking.postSession === 'string' ? latestBooking.postSession : JSON.stringify(latestBooking.postSession)}</p>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: '#0284C7', fontStyle: 'italic' }}>No session notes added yet. Add notes after the consultation.</p>
            )}
          </div>

          {/* Session History Summary */}
          {hasRecords && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: T.ink3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Session History ({patientBookings.length} sessions)</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {patientBookings.slice(0, 4).map((b, i) => (
                  <div key={b.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: i === 0 ? T.primary : T.surface, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? T.white : T.ink3, fontWeight: 700, fontSize: 12 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{b.serviceName || b.service || 'Consultation'}</p>
                      <p style={{ fontSize: 11, color: T.ink3 }}>{b.date} · {b.slotLabel || b.slot || '—'}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: b.status === 'completed' ? '#D1FAE5' : '#FEF3C7', color: b.status === 'completed' ? '#059669' : '#D97706' }}>
                      {b.status || 'Scheduled'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---─ Main Dashboard ---------------------------------------------------------------------------------------─
export default function PhysioDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [patients, setPatients] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [clinicInfo, setClinicInfo] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  // Follow-up quick booking
  const [followUpSearch, setFollowUpSearch] = useState('');
  const [followUpResults, setFollowUpResults] = useState([]);
  
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const unsub = onAuth((u) => {
      if (!u) { navigate('/dashboard-login'); return; }
      if (isSuperAdminEmail(u.email)) { navigate('/saas/dashboard'); return; }
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, [navigate]);

  useEffect(() => {
    if (!user || authLoading) return;
    async function loadData() {
      setDataLoading(true);
      try {
        const clinicData = await getClinicByOwner(user.uid);
        setClinicInfo(clinicData);

        // Permanent Fix: If no clinic data exists for this account, redirect to setup
        if (!clinicData) {
          console.warn('[DASHBOARD] No clinic found for this user. Redirecting to setup...');
          navigate('/setup');
          return;
        }

        if (clinicData?.subscriptionStatus === 'pending_approval') {
          navigate('/saas/pending');
          return;
        }

        // Logic for Soft Lock
        if (clinicData) {
          const trialEnd = clinicData.trialEndsAt ? new Date(clinicData.trialEndsAt) : null;
          const now = new Date();
          const isExpired = trialEnd && now > trialEnd;
          const isActive = clinicData.subscriptionStatus === 'active';

          if (isExpired && !isActive) {
            setIsLocked(true);
          }
        }

        const [b, p] = await Promise.all([getPhysioBookings(user.uid), getPhysioPatients(user.uid)]);
        setBookings(b || []);
        setPatients(p || []);
      } catch (err) { console.error(err); }
      setDataLoading(false);
    }
    loadData();
  }, [user, authLoading, navigate]);

  const filteredPatients = patients.filter(p =>
    !patientSearch ||
    (p.name || '').toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.phone || '').includes(patientSearch) ||
    (p.whatsapp || '').includes(patientSearch)
  );
  const todayBookings = bookings.filter(b => (b.date instanceof Date ? b.date.toISOString().split('T')[0] : b.date) === today);
  const upcoming = todayBookings.filter(b => b.status !== 'completed' && b.status !== 'blocked');
  const nextApt = upcoming[0];

  // Follow-up search handler
  const handleFollowUpSearch = (val) => {
    setFollowUpSearch(val);
    if (!val.trim()) { setFollowUpResults([]); return; }
    const lower = val.toLowerCase();
    const matched = patients.filter(p =>
      (p.name || '').toLowerCase().includes(lower) ||
      (p.phone || '').includes(val) ||
      (p.whatsapp || '').includes(val)
    ).slice(0, 5);
    setFollowUpResults(matched);
  };

  if (authLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.surface }}><Loader2 className="animate-spin" color={T.primary} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .tab-scroll { overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; display: flex; gap: 8px; padding-bottom: 4px; }
        .tab-scroll::-webkit-scrollbar { display: none; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          .overview-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .header-title { display: none; }
        }
      `}</style>

      {/* --- Navbar ---------------------------------------------------------------------------------─ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: T.glass, backdropFilter: T.blur, borderBottom: `1px solid ${T.border}`, padding: '0 var(--section-px)' }}>
        <div style={{ maxWidth: 1100, height: 64, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
             <Link to="/">
                <img src="/logo.png" alt="OnlinePT" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'contain' }} />
             </Link>
             <div>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 15, color: T.ink, lineHeight: 1 }}>{new Date().getHours() < 12 ? 'Good Morning' : 'Hello'}</p>
                <p style={{ fontSize: 11, color: T.primary, fontWeight: 700, marginTop: 2 }}>● Practice Active</p>
             </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
             <button onClick={() => navigate('/admin')} style={{ width: 40, height: 40, borderRadius: 12, background: T.white, border: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Settings size={18} color={T.ink3} /></button>
             <button onClick={async () => { await signOut(); navigate('/'); }} style={{ width: 40, height: 40, borderRadius: 12, background: '#FEF2F2', border: '1.5px solid #FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><LogOut size={18} color="var(--color-error)" /></button>
          </div>
        </div>
        
        <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 12 }}>
           <div className="tab-scroll">
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 18px', borderRadius: 100, fontSize: 14, fontWeight: 700, border: 'none', background: activeTab === tab ? T.primary : 'transparent', color: activeTab === tab ? T.white : T.ink3, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>{tab}</button>
              ))}
           </div>
        </div>
      </header>

      {/* --- Main Content ---------------------------------------------------------------------------------─ */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px var(--section-px)' }}>
        
        {/* --- Overview --- */}
        {activeTab === 'Overview' && (
          <div className="reveal active" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
               <StatCard label="Today" value={todayBookings.length} icon={Calendar} color={T.primary} />
               <StatCard label="Patients" value={patients.length} icon={Users} color={T.accent} />
               <StatCard label="Pending" value={upcoming.length} icon={Clock} color="var(--color-warning)" />
               <StatCard label="Growth" value="+12%" icon={TrendingUp} color={T.primary} />
            </div>

            {/* --- Growth Kit Card --- */}
            <div style={{ 
              background: T.white, borderRadius: 28, border: `2px solid ${T.primary}20`, 
              padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20,
              boxShadow: '0 10px 30px rgba(0,122,255,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: T.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}>
                    <Share2 size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>Patient Growth Kit</h3>
                    <p style={{ fontSize: 13, color: T.ink3 }}>Share your link to get your first online booking today.</p>
                  </div>
                </div>
                <div style={{ padding: '6px 14px', background: '#E8F8EE', color: '#059669', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>Approved</div>
              </div>

              {/* WhatsApp Share — full URL embedded in code, only button shown */}
              {/* URL: https://{subdomain}.onlinept.in — not displayed to keep UI clean */}
              <button 
                onClick={() => {
                  const subdom = clinicInfo?.subdomain || clinicInfo?.id || '';
                  if (!subdom) {
                    alert("Clinic details not fully loaded. Please wait a moment or refresh.");
                    return;
                  }
                  
                  // Professional professional URL
                  const fullUrl = `https://${subdom}.onlinept.in`;
                  
                  const message = 
                    `*Book Your Next Physiotherapy Session Online!*\n\n` +
                    `Hello! I'm now accepting online appointments.\n` +
                    `Skip the wait & book your slot instantly from anywhere:\n\n` +
                    `🔗 ${fullUrl}\n\n` +
                    `✅ Easy online booking\n` +
                    `✅ Secure & confidential\n` +
                    `✅ Instant WhatsApp confirmation\n\n` +
                    `Book now & start your recovery journey! 💪`;

                  window.open(`https://wa.me?text=${encodeURIComponent(message)}`, '_blank');
                }}
                style={{
                  width: '100%', background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  color: T.white, border: 'none', borderRadius: 20, padding: '18px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 8px 24px rgba(37,211,102,0.3)',
                  fontSize: 16, fontWeight: 800,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(37,211,102,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,211,102,0.3)'; }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Share on WhatsApp
              </button>

              <div style={{ padding: '16px 20px', background: '#FFF7ED', borderRadius: 18, border: '1px solid #FFEDD5', display: 'flex', gap: 14 }}>
                 <div style={{ width: 32, height: 32, borderRadius: 50, background: '#FDBA74', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Crown size={16} color="white" />
                 </div>
                 <p style={{ fontSize: 13, color: '#9A3412', lineHeight: 1.5 }}>
                   <strong>Pro Tip:</strong> Add your link to your <strong>WhatsApp Bio</strong> and <strong>Instagram Profile</strong> to make it easy for patients to find you 24/7.
                 </p>
              </div>
            </div>

            <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
               {/* Next Up Card */}
               <div style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`, borderRadius: 32, padding: 32, color: T.white, boxShadow: `0 12px 40px ${T.primary}30`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
                  {nextApt ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}><div style={{ width: 8, height: 8, borderRadius: 50, background: T.white, animation: 'pulse 2s infinite' }} /><span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', opacity: 0.8 }}>Upcoming Appointment</span></div>
                      <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 16 }}>{toTitleCase(nextApt.patientName)}</h2>
                      <div style={{ display: 'flex', gap: 20, marginBottom: 32, opacity: 0.9 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={16} /> <span style={{ fontWeight: 600 }}>{nextApt.slotLabel || nextApt.slot}</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Video size={16} /> <span style={{ fontWeight: 600 }}>Video Call</span></div>
                      </div>
                      <button style={{ height: 52, padding: '0 32px', borderRadius: 100, background: T.white, color: T.primary, border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}><Video size={18} /> Join Now</button>
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}><Calendar size={48} style={{ opacity: 0.4, marginBottom: 12 }} /><p style={{ fontWeight: 700 }}>No more sessions for today</p></div>
                  )}
               </div>

               {/* Recent Queue */}
               <div style={{ background: T.white, borderRadius: 28, border: `1px solid ${T.border}`, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>Today's Queue</h3>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.primary, background: T.primaryLight, padding: '4px 10px', borderRadius: 20 }}>{upcoming.length} Pending</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {upcoming.length === 0 ? <p style={{ fontSize: 13, color: T.ink4, textAlign: 'center', padding: '20px 0' }}>All clear for today!</p> : upcoming.map(apt => (
                      <div key={apt.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: T.surface, borderRadius: 16 }}>
                         <div style={{ width: 36, height: 36, borderRadius: 10, background: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: T.primary }}>{(apt.patientName || 'P')[0]}</div>
                         <div style={{ flex: 1 }}><p style={{ fontSize: 14, fontWeight: 700 }}>{toTitleCase(apt.patientName)}</p><p style={{ fontSize: 11, color: T.ink3 }}>{apt.slotLabel || apt.slot}</p></div>
                         <ChevronRight size={14} color={T.ink4} />
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* --- Patients --- */}
        {activeTab === 'Patients' && (
          <div className="reveal active" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Follow-Up Quick Booking */}
            <div style={{ background: 'linear-gradient(135deg, rgba(0,122,255,0.06), rgba(90,200,250,0.04))', borderRadius: 20, border: `1.5px solid ${T.primary}20`, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <RefreshCw size={16} color={T.primary} />
                <p style={{ fontSize: 14, fontWeight: 800, color: T.ink, fontFamily: 'Manrope, sans-serif' }}>Book Follow-Up</p>
                <span style={{ fontSize: 11, color: T.ink3, fontWeight: 600 }}>Search by patient name or phone</span>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ background: T.white, borderRadius: 16, border: `1.5px solid ${T.border}`, height: 52, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
                  <PhoneCall size={18} color={T.primary} />
                  <input
                    value={followUpSearch}
                    onChange={e => handleFollowUpSearch(e.target.value)}
                    placeholder="Enter patient name or phone number..."
                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 15, fontFamily: 'inherit', fontWeight: 600, color: T.ink }}
                  />
                  {followUpSearch && <X size={16} color={T.ink4} style={{ cursor: 'pointer' }} onClick={() => { setFollowUpSearch(''); setFollowUpResults([]); }} />}
                </div>
                {followUpResults.length > 0 && (
                  <div style={{ position: 'absolute', top: 56, left: 0, right: 0, zIndex: 100, background: T.white, borderRadius: 16, border: `1.5px solid ${T.border}`, boxShadow: '0 12px 40px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                    {followUpResults.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          const subdomain = clinicInfo?.subdomain || '';
                          // Navigate to booking page with patient details pre-filled via URL params
                          navigate(`/book?followup=1&name=${encodeURIComponent(p.name || '')}&phone=${encodeURIComponent(p.phone || p.whatsapp || '')}`);
                          setFollowUpSearch('');
                          setFollowUpResults([]);
                        }}
                        style={{ width: '100%', padding: '14px 20px', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', borderBottom: `1px solid ${T.border}`, textAlign: 'left', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = T.surface}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
                          {(p.name || 'P')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{toTitleCase(p.name)}</p>
                          <p style={{ fontSize: 12, color: T.ink3 }}>{p.phone || p.whatsapp || '—'}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.primary, fontSize: 12, fontWeight: 700 }}>
                          Book Follow-Up <ArrowRight size={14} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Patient Search */}
            <div style={{ background: T.white, borderRadius: 20, border: `1.5px solid ${T.border}`, height: 56, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12 }}>
               <Search size={20} color={T.ink4} />
               <input value={patientSearch} onChange={e => setPatientSearch(e.target.value)} placeholder="Search by name or phone..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 15, fontFamily: 'inherit' }} />
               {patientSearch && <X size={16} color={T.ink4} style={{ cursor: 'pointer' }} onClick={() => setPatientSearch('')} />}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
               {filteredPatients.length === 0 && patientSearch && (
                 <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: T.ink4 }}>
                   <Users size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                   <p style={{ fontWeight: 600 }}>No patients found for "{patientSearch}"</p>
                 </div>
               )}
               {filteredPatients.map(p => (
                 <PatientCard key={p.id} patient={p} onClick={() => setSelectedPatient(p)} />
               ))}
            </div>
          </div>
        )}

        {/* Patient Record Modal */}
        {selectedPatient && (
          <PatientRecordModal
            patient={selectedPatient}
            bookings={bookings}
            onClose={() => setSelectedPatient(null)}
          />
        )}
      </main>

      {/* --- Soft Lock Overlay ---------------------------------------------------------------─ */}
      {isLocked && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: T.white, borderRadius: 32, border: `1px solid ${T.border}`,
            padding: 48, maxWidth: 500, width: '100%', textAlign: 'center',
            boxShadow: '0 24px 80px rgba(0,0,0,0.1)',
            animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{
              width: 80, height: 80, background: 'rgba(0,122,255,0.1)',
              borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.primary, margin: '0 auto 24px'
            }}>
              <Crown size={40} />
            </div>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 28, fontWeight: 800, color: T.ink, marginBottom: 12 }}>Trial Expired</h2>
            <p style={{ fontSize: 15, color: T.ink3, lineHeight: 1.6, marginBottom: 32 }}>
              Your 14-day free trial has concluded. To continue managing your clinic, patients, and bookings, please activate a professional plan.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                onClick={() => navigate('/saas/payment', { state: { clinicId: clinicInfo?.id, plan: 'Pro', price: 3999 } })}
                style={{
                  height: 56, background: T.primary, color: T.white, border: 'none',
                  borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: 'pointer',
                  boxShadow: `0 8px 24px ${T.primary}30`
                }}
              >
                Activate Membership
              </button>
              <button 
                onClick={async () => { await signOut(); navigate('/'); }}
                style={{
                  height: 56, background: 'transparent', color: T.ink3, border: 'none',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
