import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { onAuth, signOut } from '@/firebase/auth';
import { getPhysioBookings, getPhysioPatients, blockSlot, getClinicByOwner } from '@/firebase/db';
import { isSuperAdminEmail } from '@/config/superAdminConfig';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import SessionOutcomesWidget from '@/components/SessionOutcomesWidget';
import axios from 'axios';
import { 
  LayoutGrid, Users, Calendar, TrendingUp, Activity, 
  Settings, LogOut, Bell, Search, Plus, ExternalLink, 
  Menu, X, ChevronRight, Filter, Download, MoreVertical,
  CheckCircle2, AlertCircle, Clock, Video, FileText,
  FolderOpen, Layers, Palette
} from 'lucide-react';
import ResourceLibrary from './ResourceLibrary';
import ContentCreator from './ContentCreator';
import ClinicBranding from './ClinicBranding';

import { API_BASE } from '@/utils/api';
import clinicConfig from '@/config/clinicConfig';

const toTitleCase = (str) => {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const NAV_ITEMS = [
  { id: 'Overview', label: 'Overview', icon: LayoutGrid },
  { id: 'Patients', label: 'Patients', icon: Users },
  { id: 'Schedule', label: 'Schedule', icon: Calendar },
  { id: 'Insights', label: 'Insights', icon: TrendingUp },
  { id: 'Outcomes', label: 'Outcomes', icon: Activity },
  { id: 'Library', label: 'Library', icon: FolderOpen },
  { id: 'Creator', label: 'Creator', icon: Layers },
  { id: 'Branding', label: 'Branding', icon: Palette }
];

// ---─ Luxe Midnight Design Tokens (premium iOS) ------------------------------------------------------------------------------------------
const T = {
  bg: '#020617', // Deep Obsidian
  bgCard: 'rgba(15, 23, 42, 0.6)', 
  glass: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  ink: '#F8FAFC',
  inkSecondary: '#94A3B8',
  inkTertiary: '#64748B',
  ink2: '#94A3B8',
  ink3: '#64748B',
  ink4: '#475569',
  primary: '#0EA5E9', // iOS-style Cyan/Blue
  primaryVibrant: '#38BDF8',
  accent: '#14A3A8',
  white: '#FFFFFF',
  r: { sm: 12, md: 16, lg: 24, xl: 32 },
  blur: 'blur(30px)',
};

// ---─ Components ---------------------------------------------------------------------------------------------─

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div style={{
      background: T.bgCard, borderRadius: T.r.md, border: `1px solid ${T.glassBorder}`,
      padding: 'clamp(20px, 4vw, 28px)', display: 'flex', flexDirection: 'column', gap: 18,
      backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '40%', height: '40%',
        background: `radial-gradient(circle at top right, ${color}10 0%, transparent 70%)`,
        zIndex: 0
      }} />
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: color,
        border: `1px solid ${color}30`, position: 'relative', zIndex: 1
      }}>
        <Icon size={24} />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h4 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 800, color: T.ink, lineHeight: 1, letterSpacing: '-1.5px' }}>
          {value ?? '—'}
        </h4>
        <p style={{ fontSize: 13, fontWeight: 600, color: T.inkSecondary, marginTop: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</p>
      </div>
    </div>
  );
}

function PatientCard({ patient, onClick }) {
  return (
    <button onClick={onClick} style={{ width: '100%', background: T.bgCard, borderRadius: T.r.md, border: `1px solid ${T.glassBorder}`, padding: 20, display: 'flex', alignItems: 'center', gap: 18, cursor: 'pointer', textAlign: 'left', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', backdropFilter: T.blur, WebkitBackdropFilter: T.blur }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)'; e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'; e.currentTarget.style.borderColor = `${T.primary}40`; }}
      onMouseLeave={e => { e.currentTarget.style.background = T.bgCard; e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.borderColor = T.glassBorder; }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${T.primary}, #0D9488)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white, fontWeight: 800, fontSize: 18, boxShadow: `0 8px 16px ${T.primary}30` }}>
        {(patient.name || 'P')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{toTitleCase(patient.name)}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <p style={{ fontSize: 13, color: T.inkSecondary }}>{patient.phone || patient.whatsapp || '—'}</p>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: T.inkTertiary }} />
          <p style={{ fontSize: 13, color: T.inkSecondary }}>{patient.age ? `${patient.age} yrs` : (patient.city || '—')}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRight size={20} color={T.inkSecondary} />
        </div>
      </div>
    </button>
  );
}

// ─── Patient Health Record Modal ─────────────────────────────────────────────
function PatientRecordModal({ patient, bookings, onClose }) {
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
      background: 'rgba(5, 8, 15, 0.85)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }} onClick={onClose}>
      <div style={{
        background: '#0F172A', borderRadius: 32, maxWidth: 600, width: '100%',
        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
        border: `1px solid ${T.glassBorder}`,
        animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '28px 32px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: `linear-gradient(135deg, ${T.accent}, #0D9488)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white, fontWeight: 800, fontSize: 24, boxShadow: `0 8px 24px ${T.accent}20` }}>
              {(patient.name || 'P')[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 22, fontWeight: 800, color: T.ink }}>{toTitleCase(patient.name)}</h2>
              <p style={{ fontSize: 14, color: T.ink2, marginTop: 2 }}>{patient.phone || patient.whatsapp} · {patient.age ? `${patient.age} yrs` : ''} {patient.gender || ''}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: 50, border: `1px solid ${T.glassBorder}`, background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
            <X size={20} color={T.ink} />
          </button>
        </div>

        <div style={{ padding: '28px 32px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Patient History Section */}
          <div style={{ background: 'rgba(20, 163, 168, 0.05)', borderRadius: 24, padding: 24, border: '1px solid rgba(20, 163, 168, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{color: T.accent}}><Activity size={20} /></div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Clinical Assessment</h3>
            </div>
            {latestBooking?.intake?.clinicalInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {latestBooking.intake.clinicalInfo.primaryComplaint && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: T.ink2, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Chief Complaint</p>
                    <p style={{ fontSize: 15, color: T.ink, lineHeight: 1.6 }}>{latestBooking.intake.clinicalInfo.primaryComplaint}</p>
                  </div>
                )}
                {latestBooking.intake.clinicalInfo.duration && (
                  <div style={{ display: 'flex', gap: 32 }}>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: T.ink2, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Duration</p>
                      <p style={{ fontSize: 15, color: T.ink }}>{latestBooking.intake.clinicalInfo.duration}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: T.ink3, fontStyle: 'italic' }}>No intake data available for the latest session.</p>
            )}
          </div>

          {/* Session History */}
          {hasRecords && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 800, color: T.ink3, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16 }}>Previous Sessions ({patientBookings.length})</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {patientBookings.map((b, i) => (
                  <div key={b.id || i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: `1px solid ${T.glassBorder}` }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: b.status === 'completed' ? '#10B981' : T.accent }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{b.serviceName || b.service || 'Consultation'}</p>
                      <p style={{ fontSize: 12, color: T.ink2, marginTop: 2 }}>{b.date} · {b.slotLabel || b.slot}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: b.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(20, 163, 168, 0.1)', color: b.status === 'completed' ? '#10B981' : T.accent }}>
                      {b.status === 'completed' ? 'Success' : 'Scheduled'}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'Overview');

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (id) => {
    setActiveTab(id);
    setSearchParams({ tab: id });
  };
  const [patients, setPatients] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [clinicInfo, setClinicInfo] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [followUpSearch, setFollowUpSearch] = useState('');
  const [followUpResults, setFollowUpResults] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);
  const [blockingLoading, setBlockingLoading] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Check for WhatsApp OTP session (when Firebase custom token wasn't available)
    const waSession = localStorage.getItem('whatsapp_session');
    if (waSession) {
      try {
        const session = JSON.parse(waSession);
        const isValid = session?.expiresAt && new Date() < new Date(session.expiresAt);
        if (isValid) {
          // Use a synthetic user-like object so the dashboard can load clinic data
          // The clinicByOwner lookup needs a uid — fall back to userId from session or phone-derived
          const syntheticUser = {
            uid: session.userId || `wa_${session.phone}`,
            phone: session.phone,
            email: null,
            _isWhatsAppSession: true,
          };
          setUser(syntheticUser);
          setAuthLoading(false);
          return; // Don't set up Firebase auth listener — we have a WA session
        } else {
          // Session expired — clear it
          localStorage.removeItem('whatsapp_session');
          localStorage.removeItem('auth_method');
          localStorage.removeItem('auth_phone');
        }
      } catch {
        localStorage.removeItem('whatsapp_session');
      }
    }

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
        // For WhatsApp sessions, pass phone as fallback to find clinic
        const clinicData = await getClinicByOwner(user.uid, user.phone || null);
        setClinicInfo(clinicData);

        if (!clinicData) {
          navigate('/setup');
          return;
        }

        if (clinicData?.subscriptionStatus === 'pending_approval') {
          navigate('/saas/pending');
          return;
        }

        if (clinicData) {
          const trialEnd = clinicData.trialEndsAt ? new Date(clinicData.trialEndsAt) : null;
          const now = new Date();
          const isExpired = trialEnd && now > trialEnd;
          const isActive = clinicData.subscriptionStatus === 'active';
          if (isExpired && !isActive) setIsLocked(true);
        }
        const effectiveUid = user._isWhatsAppSession ? (clinicData.uid || user.uid) : user.uid;
        const [b, p] = await Promise.all([getPhysioBookings(effectiveUid), getPhysioPatients(effectiveUid)]);
        setBookings(b || []);
        setPatients(p || []);
      } catch (err) { console.error(err); }
      setDataLoading(false);
    }
    loadData();
  }, [user, authLoading, navigate]);

  const handleCancelAppointment = async (apt) => {
    if (!window.confirm(`Are you sure you want to cancel the appointment with ${apt.patientName}? This will notify the patient via WhatsApp.`)) return;
    setCancellingId(apt.id);
    try {
      const res = await axios.delete(`${API_BASE}/api/appointments/${apt.id}`);
      if (res.data.booking) {
        setBookings(prev => prev.map(b => b.id === apt.id ? { ...b, status: 'cancelled' } : b));
        alert('Appointment cancelled successfully.');
      }
    } catch (err) { alert(err.response?.data?.error || 'Failed to cancel appointment.'); } finally { setCancellingId(null); }
  };

  const handleQuickBlock = async (type) => {
    const dateStr = document.getElementById('quick-block-date')?.value;
    if (!dateStr) { alert('Please select a date.'); return; }
    setBlockingLoading(true);
    try {
      if (type === 'day') {
        const currentBlocked = clinicInfo.blockedDates || [];
        if (currentBlocked.includes(dateStr)) { alert('This date is already blocked.'); setBlockingLoading(false); return; }
        const clinicsRef = doc(db, 'clinics', clinicInfo.id);
        await updateDoc(clinicsRef, { blockedDates: [...currentBlocked, dateStr] });
        setClinicInfo(prev => ({ ...prev, blockedDates: [...currentBlocked, dateStr] }));
        alert(`Date ${dateStr} has been blocked successfully.`);
      } else {
        const time = document.getElementById('quick-block-time')?.value;
        if (!time) { alert('Please enter a time.'); setBlockingLoading(false); return; }
        await blockSlot(user.uid, dateStr, { startTime: time, endTime: time, reason: 'Quick block from dashboard' });
        alert(`Slot at ${time} on ${dateStr} has been blocked.`);
      }
    } catch (err) { console.error('Block Error:', err); alert('Failed to block availability.'); } finally { setBlockingLoading(false); }
  };

  const isCancelable = (apt) => {
    if (apt.status === 'cancelled') return false;
    try {
      const bDate = new Date(apt.date);
      const timeStr = (typeof apt.slot === 'object' ? apt.slot?.label : apt.slot) || '';
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        let [_, h, m, meridiem] = timeMatch;
        h = parseInt(h); m = parseInt(m);
        if (meridiem) {
          if (meridiem.toUpperCase() === 'PM' && h < 12) h += 12;
          if (meridiem.toUpperCase() === 'AM' && h === 12) h = 0;
        }
        bDate.setHours(h, m, 0, 0);
      }
      const now = new Date();
      const diffMs = bDate.getTime() - now.getTime();
      return (diffMs / (1000 * 60 * 60)) >= 12;
    } catch (e) { return false; }
  };

  const filteredPatients = patients.filter(p =>
    !patientSearch ||
    (p.name || '').toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.phone || '').includes(patientSearch) ||
    (p.whatsapp || '').includes(patientSearch)
  );
  
  const todayBookings = bookings.filter(b => (b.date instanceof Date ? b.date.toISOString().split('T')[0] : b.date) === today);
  const upcoming = todayBookings.filter(b => b.status !== 'completed' && b.status !== 'blocked').sort((a,b) => (a.slot || '').localeCompare(b.slot || ''));
  const nextApt = upcoming[0];

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

  if (authLoading) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: T.bg, gap: 20 }}>
      <div className="animate-spin" style={{color: T.accent}}><Clock size={40} /></div>
      <p style={{ color: T.ink2, fontSize: 14, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>Synchronizing...</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.ink, fontFamily: "'DM Sans', sans-serif", paddingBottom: 60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .tab-scroll { 
          display: flex; gap: 8px; padding: 4px 16px; 
          overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none;
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
        .tab-scroll::-webkit-scrollbar { display: none; }
        
        .premium-card {
          background: ${T.bgCard};
          border: 1px solid ${T.glassBorder};
          backdrop-filter: ${T.blur};
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .btn-hover:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }
        
        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .overview-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 500px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      
      {/* --- Header ---------------------------------------------------------------------------------─ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 2000, background: 'rgba(11, 15, 26, 0.8)', backdropFilter: 'blur(30px)', borderBottom: `1px solid ${T.glassBorder}` }}>
        <div style={{ maxWidth: 1200, height: 84, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                 <img 
                   src={clinicConfig.logo || "/onlinept-logo-v3.png"} 
                   alt={clinicConfig.name || "Clinic Logo"}
                   style={{ width: 64, height: 64, objectFit: 'contain', background: '#fff', borderRadius: 16, padding: 6 }}
                 />
                 <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, background: '#10B981', border: `2.5px solid #0F172A`, borderRadius: '50%' }} />
              </div>
             <div>
                <h1 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: 18, color: T.ink, letterSpacing: '-0.5px' }}>
                   {new Date().getHours() < 12 ? 'Good Morning' : 'Welcome Back'}
                </h1>
                <p style={{ fontSize: 11, color: T.inkSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 2 }}>{clinicInfo?.name || 'Clinic Command'}</p>
             </div>
          </div>
          
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
             <button onClick={() => navigate('/admin')} style={{ width: 44, height: 44, borderRadius: 15, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.glassBorder}`, color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                <Settings size={20} />
             </button>
             <button onClick={async () => { 
               localStorage.removeItem('whatsapp_session');
               localStorage.removeItem('auth_method');
               localStorage.removeItem('auth_phone');
               await signOut(); 
               navigate('/'); 
             }} style={{ width: 44, height: 44, borderRadius: 15, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}>
                <LogOut size={20} color="#EF4444" />
             </button>
          </div>
        </div>
        
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
           <div className="tab-scroll">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleTabChange(id)}
                    className={`h-10 px-5 rounded-full flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all shrink-0 ${
                      activeTab === id 
        ? 'bg-[#14A3A8] text-white shadow-lg shadow-[#14A3A8]/20' 
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
           </div>
        </div>
      </header>

      {/* --- Main Content ---------------------------------------------------------------------------------─ */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        
        {/* --- Overview --- */}
        {activeTab === 'Overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, animation: 'slideUp 0.6s ease-out' }}>
            
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
               <StatCard label="Today" value={todayBookings.length} icon={Calendar} color={T.primary} />
               <StatCard label="Patients" value={patients.length} icon={Users} color="#8B5CF6" />
               <StatCard label="Upcoming" value={upcoming.length} icon={Clock} color="#F59E0B" />
               <StatCard label="Growth" value="+12%" icon={TrendingUp} color="#10B981" />
            </div>

            <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>
               
               {/* Primary Action Card */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ 
                    position: 'relative', overflow: 'hidden', padding: 48, borderRadius: 40,
                    background: `linear-gradient(225deg, ${T.accent}EE, #020617)`,
                    color: T.white, boxShadow: `0 40px 80px ${T.accent}15`
                  }}>
                    {/* Abstract Illustration Background */}
                    <img 
                      src="https://raw.githubusercontent.com/Pakoladiya/onlinept-frontend/main/artifacts/physio_hero_illustration_1776789812795.png"
                      alt="Hero background"
                      style={{ 
                        position: 'absolute', top: 0, right: 0, height: '100%', width: '100%', 
                        objectFit: 'cover', opacity: 0.3, pointerEvents: 'none',
                        mixBlendMode: 'overlay'
                      }}
                    />
                    
                    {nextApt ? (
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: T.white, animation: 'pulse 2s infinite' }} />
                          <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Upcoming</span>
                        </div>
                        <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(36px, 6vw, 48px)', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1, marginBottom: 20 }}>{toTitleCase(nextApt.patientName)}</h2>
                        <div style={{ display: 'flex', gap: 24, marginBottom: 40, opacity: 0.9 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={18} /> <span style={{ fontWeight: 700, fontSize: 16 }}>{nextApt.slotLabel || nextApt.slot}</span></div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Video size={18} /> <span style={{ fontWeight: 700, fontSize: 16 }}>Video Consulting</span></div>
                        </div>
                        <button 
                          onClick={() => navigate(`/join/${nextApt.id}`)}
                          className="btn-hover" 
                          style={{ height: 60, padding: '0 40px', borderRadius: 100, background: T.white, color: T.accent, border: 'none', fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.15)', transition: 'all 0.3s' }}
                        >
                          <Video size={20} fill="currentColor" /> Join Consultation
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px 0', position: 'relative', zIndex: 1 }}>
                        <Calendar size={60} style={{ opacity: 0.3, marginBottom: 20 }} />
                        <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Schedule Clear</h2>
                        <p style={{ opacity: 0.8, fontWeight: 600 }}>No upcoming appointments for the rest of today.</p>
                      </div>
                    )}
                  </div>

                  {/* Quick Availability Block */}
                  <div style={{ background: T.bgCard, borderRadius: 32, border: `1px solid ${T.glassBorder}`, padding: '28px', display: 'flex', flexDirection: 'column', gap: 20, backdropFilter: T.blur }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                        <div style={{color: '#EF4444'}}><Ban size={20} /></div>
                      </div>
                      <h3 style={{ fontSize: 17, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>Quick Block</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 800, color: T.inkSecondary, textTransform: 'uppercase' }}>Date</label>
                        <input 
                          type="date" 
                          id="quick-block-date"
                          defaultValue={today}
                          style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.glassBorder}`, borderRadius: 12, padding: '12px', color: T.ink, fontSize: 14, outline: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, fontWeight: 800, color: T.inkSecondary, textTransform: 'uppercase' }}>Time (Optional)</label>
                        <input 
                          type="time" 
                          id="quick-block-time"
                          style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.glassBorder}`, borderRadius: 12, padding: '12px', color: T.ink, fontSize: 14, outline: 'none' }}
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                       <button 
                         onClick={() => handleQuickBlock('day')}
                         disabled={blockingLoading}
                         style={{ background: 'rgba(255,255,255,0.05)', color: T.ink, border: `1px solid ${T.glassBorder}`, borderRadius: 14, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                       >
                         Block Full Day
                       </button>
                       <button 
                         onClick={() => handleQuickBlock('slot')}
                         disabled={blockingLoading}
                         style={{ background: T.accent, color: T.white, border: 'none', borderRadius: 14, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                       >
                         Block Slot
                       </button>
                    </div>
                  </div>
               </div>

               {/* Right Column: Mini Tools */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ background: T.bgCard, borderRadius: 32, border: `1px solid ${T.glassBorder}`, padding: '32px', backdropFilter: T.blur }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(20, 163, 168, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.accent }}>
                        <RefreshCw size={20} />
                      </div>
                      <h3 style={{ fontSize: 17, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>Quick Follow-Up</h3>
                    </div>
                    
                    <div style={{ position: 'relative', marginBottom: 12 }}>
                       <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: T.ink4 }} />
                       <input 
                         value={followUpSearch}
                         onChange={e => handleFollowUpSearch(e.target.value)}
                         placeholder="Search patient..." 
                         style={{ width: '100%', height: 52, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.glassBorder}`, borderRadius: 16, padding: '0 20px 0 48px', color: T.ink, fontSize: 14, outline: 'none' }}
                       />
                    </div>

                    {followUpResults.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: 8 }}>
                        {followUpResults.map(p => (
                          <button key={p.id} onClick={() => {
                            const msg = `Hi ${toTitleCase(p.name)}, this is ${clinicInfo?.name}. We'd like to check in on your recovery. Would you like to schedule a follow-up session?\n\nBook here: https://${clinicInfo?.subdomain}.onlinept.in`;
                            window.open(`https://wa.me/${p.phone || p.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
                            setFollowUpSearch('');
                            setFollowUpResults([]);
                          }} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'transparent', border: 'none', color: T.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <span>{toTitleCase(p.name)}</span>
                            <Send size={14} color={T.accent} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* --- Patients --- */}
        {activeTab === 'Patients' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'slideUp 0.6s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>Patient Directory</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.bgCard, borderRadius: 20, padding: '12px 20px', border: `1px solid ${T.glassBorder}` }}>
              <Search size={20} color={T.ink3} />
              <input 
                placeholder="Search patient name, phone..." 
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: T.ink, fontSize: 15, fontWeight: 600 }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
               {filteredPatients.map(p => (
                 <PatientCard key={p.id} patient={p} onClick={() => setSelectedPatient(p)} />
               ))}
            </div>
          </div>
        )}

        {/* --- Schedule --- */}
        {activeTab === 'Schedule' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'slideUp 0.6s ease-out' }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <h3 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>Master Schedule</h3>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '8px 16px', border: `1px solid ${T.glassBorder}` }}>
                   <span style={{ color: T.ink3, fontSize: 13, fontWeight: 600 }}>{bookings.length} Total Appointments</span>
                </div>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {bookings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '80px 0', background: T.bgCard, borderRadius: 32, border: `1px solid ${T.glassBorder}` }}>
                    <Calendar size={48} color={T.ink4} style={{ marginBottom: 16 }} />
                    <p style={{ color: T.ink2, fontSize: 16, fontWeight: 600 }}>No appointments scheduled yet.</p>
                  </div>
                ) : (
                  [...new Set(bookings.map(b => b.date))].sort((a,b) => b.localeCompare(a)).slice(0, 14).map(date => {
                    const dayBookings = bookings.filter(b => b.date === date).sort((a,b) => (a.slot || '').localeCompare(b.slot || ''));
                    return (
                      <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                           <div style={{ padding: '6px 14px', background: date === today ? 'rgba(20, 163, 168, 0.1)' : 'rgba(255,255,255,0.03)', color: date === today ? T.accent : T.ink2, borderRadius: 10, fontSize: 12, fontWeight: 800 }}>
                              {date === today ? 'TODAY' : new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                           </div>
                           <div style={{ flex: 1, height: 1, background: T.glassBorder }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                          {dayBookings.map(apt => (
                             <div 
                               key={apt.id} 
                               style={{ padding: 16, background: T.bgCard, borderRadius: 20, border: `1px solid ${apt.status === 'cancelled' ? '#ef444430' : T.glassBorder}`, display: 'flex', gap: 14, alignItems: 'center', transition: 'all 0.2s', opacity: apt.status === 'cancelled' ? 0.6 : 1 }}
                             >
                                <div onClick={() => navigate(`/join/${apt.id}`)} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: T.accent, cursor: 'pointer' }}>
                                   {(apt.patientName || 'P')[0]}
                                </div>
                                <div onClick={() => navigate(`/join/${apt.id}`)} style={{ flex: 1, cursor: 'pointer' }}>
                                   <p style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{toTitleCase(apt.patientName)}</p>
                                   <p style={{ fontSize: 12, color: T.ink2, marginTop: 2 }}>{apt.slotLabel || apt.slot}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', padding: '4px 8px', borderRadius: 6, background: apt.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : apt.status === 'cancelled' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)', color: apt.status === 'completed' ? '#10B981' : apt.status === 'cancelled' ? '#EF4444' : T.ink3 }}>
                                     {apt.status}
                                   </span>
                                   {isCancelable(apt) && (
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); handleCancelAppointment(apt); }}
                                       disabled={cancellingId === apt.id}
                                       style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}
                                       onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
                                       onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                     >
                                       {cancellingId === apt.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} Cancel
                                     </button>
                                   )}
                                </div>
                             </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
             </div>
          </div>
        )}

        {/* --- Outcomes --- */}
        {activeTab === 'Outcomes' && user && (
          <div style={{ animation: 'slideUp 0.6s ease-out' }}>
            <SessionOutcomesWidget user={user} />
          </div>
        )}

        {/* --- Insights --- */}
        {activeTab === 'Insights' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, animation: 'slideUp 0.6s ease-out' }}>
             <h3 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>Clinic Intelligence</h3>
             
             {bookings.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '80px 0', background: T.bgCard, borderRadius: 32, border: `1px solid ${T.glassBorder}` }}>
                 <BarChart3 size={48} color={T.ink4} style={{ marginBottom: 16 }} />
                 <p style={{ color: T.ink2, fontSize: 16, fontWeight: 600 }}>Insufficient data to generate insights.</p>
                 <p style={{ color: T.ink3, fontSize: 14, marginTop: 8 }}>Insights will appear once patients start booking sessions.</p>
               </div>
             ) : (
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                  {/* Service Distribution */}
                  <div style={{ background: T.bgCard, borderRadius: 28, border: `1px solid ${T.glassBorder}`, padding: 24 }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <Layers size={18} color={T.accent} />
                        <h4 style={{ fontSize: 16, fontWeight: 700 }}>Service Popularity</h4>
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {Object.entries(bookings.reduce((acc, b) => {
                          const s = b.serviceName || b.service || 'Consultation';
                          acc[s] = (acc[s] || 0) + 1;
                          return acc;
                        }, {})).sort((a,b) => b[1] - a[1]).map(([name, count]) => {
                          const percentage = Math.round((count / bookings.length) * 100);
                          return (
                            <div key={name}>
                               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                                  <span style={{ color: T.ink }}>{name}</span>
                                  <span style={{ color: T.ink3 }}>{count} sessions</span>
                               </div>
                               <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${percentage}%`, background: T.accent, borderRadius: 10 }} />
                               </div>
                            </div>
                          );
                        })}
                     </div>
                  </div>

                  {/* Patient Retention Placeholder */}
                  <div style={{ background: T.bgCard, borderRadius: 28, border: `1px solid ${T.glassBorder}`, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 16 }}>
                     <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                        <UserCheck size={32} />
                     </div>
                     <div>
                        <h4 style={{ fontSize: 24, fontWeight: 800 }}>
                           {(() => {
                             const patientBookingCounts = bookings.reduce((acc, b) => {
                               const pid = b.patientPhone || b.patientName;
                               if (pid) acc[pid] = (acc[pid] || 0) + 1;
                               return acc;
                             }, {});
                             const totalWithBookings = Object.keys(patientBookingCounts).length;
                             const retained = Object.values(patientBookingCounts).filter(count => count > 1).length;
                             return totalWithBookings > 0 ? Math.round((retained / totalWithBookings) * 100) : 0;
                           })()}%
                        </h4>
                        <p style={{ fontSize: 13, color: T.ink3, marginTop: 4 }}>Patient Retention Rate</p>
                     </div>
                     <p style={{ fontSize: 12, color: T.ink4, lineHeight: 1.5 }}>Analysis of patients who booked more than one session.</p>
                  </div>
               </div>
             )}
          </div>
        )}

        {/* --- Library --- */}
        {activeTab === 'Library' && (
          <div style={{ animation: 'slideUp 0.6s ease-out' }}>
             <ResourceLibrary isEmbedded={true} />
          </div>
        )}

        {/* --- Creator --- */}
        {activeTab === 'Creator' && (
          <div style={{ animation: 'slideUp 0.6s ease-out' }}>
             <ContentCreator isEmbedded={true} />
          </div>
        )}

        {/* --- Branding --- */}
        {activeTab === 'Branding' && (
          <div style={{ animation: 'slideUp 0.6s ease-out' }}>
             <ClinicBranding isEmbedded={true} />
          </div>
        )}

        {selectedPatient && <PatientRecordModal patient={selectedPatient} bookings={bookings} onClose={() => setSelectedPatient(null)} />}
      </main>
    </div>
  );
}
