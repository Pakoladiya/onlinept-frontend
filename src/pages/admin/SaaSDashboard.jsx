import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, updateDoc, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
  Users, Calendar, Activity, TrendingUp, Plus,
  Settings, LogOut, Menu, X, Crown,
  Clock, UserX, Trash2, ExternalLink,
  Globe, Loader2, Info, Key, ShieldAlert, ShieldCheck,
  CheckCircle2, AlertCircle, ChevronRight,
  MoreVertical, Search, BarChart3, CreditCard,
  Tag, Save, Mail, Phone, MapPin
} from 'lucide-react';
import { sendResetEmail } from '@/firebase/auth';
import { getAllPlatformBookings } from '@/firebase/db';
import { API_ROOT } from '@/utils/api';

// ---─ Design Tokens ---------------------------------------------------------------------------------------------
const T = {
  sidebar: '#0F172A',
  sidebarHover: '#1E293B',
  sidebarActive: 'var(--color-primary)',
  sidebarText: '#94A3B8',
  sidebarTextBright: '#F1F5F9',
  primary: 'var(--color-primary)',
  primaryLight: 'var(--color-primary-light)',
  accent: 'var(--color-secondary)',
  surface: 'var(--color-surface)',
  white: '#FFFFFF',
  ink: '#1D1D1F',
  ink2: '#3A3A3C',
  ink3: '#636366',
  ink4: '#AEAEB2',
  border: 'var(--color-border)',
  glass: 'var(--glass-bg)',
  blur: 'var(--glass-blur)',
  r: { sm: 12, md: 18, lg: 24, xl: 32 },
};

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: BarChart3 },
  { id: 'clinics', label: 'Clinics', icon: Globe },
  { id: 'pricing', label: 'Pricing', icon: Tag },
  { id: 'billing', label: 'System Keys', icon: Key },
  { id: 'appointments', label: 'Platform Schedule', icon: Calendar },
  { id: 'users', label: 'Admins', icon: Users },
  { id: 'settings', label: 'System', icon: Settings },
];

const toTitleCase = (str) => {
  if (!str) return '';
  return str.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

// ---─ Stat Card ------------------------------------------------------------------------------------------------─
function StatCard({ title, value, icon: Icon, trend, color, bg }) {
  return (
    <div style={{
      background: T.white, borderRadius: T.r.md, border: `1px solid ${T.border}`,
      padding: 'clamp(16px, 4vw, 24px)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: bg || T.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color || T.primary,
        }}>
          <Icon size={22} />
        </div>
        {trend && (
          <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981', background: '#D1FAE5', padding: '4px 10px', borderRadius: 100 }}>{trend}</span>
        )}
      </div>
      <div>
        <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 800, color: T.ink, lineHeight: 1, letterSpacing: '-1px' }}>
          {value}
        </h3>
        <p style={{ fontSize: 12, color: T.ink3, marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{title}</p>
      </div>
    </div>
  );
}

// ---─ Status Badge ---------------------------------------------------------------------------------------------─
function StatusBadge({ status }) {
  const map = {
    active: { color: T.primary, bg: T.primaryLight, label: 'Active' },
    pending_approval: { color: '#D97706', bg: '#FEF3C7', label: 'Pending Approval' },
    confirmed: { color: T.primary, bg: T.primaryLight, label: 'Confirmed' },
    completed: { color: T.primary, bg: T.primaryLight, label: 'Completed' },
    suspended: { color: '#DC2626', bg: '#FEE2E2', label: 'Suspended' },
    rejected: { color: '#DC2626', bg: '#FEE2E2', label: 'Rejected' },
  };
  const s = map[status] || { color: T.ink4, bg: T.surface, label: status };
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, color: s.color,
      background: s.bg, padding: '4px 10px', borderRadius: 100,
      textTransform: 'uppercase', letterSpacing: '0.4px',
    }}>
      {s.label}
    </span>
  );
}

// ---─ Sidebar ---------------------------------------------------------------------------─
function Sidebar({ activeTab, onTab, collapsed, onSignOut, mobileOpen, onMobileClose }) {
  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ height: 72, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <img src="/onlinept-logo-v3.png" alt="OnlinePT" style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }} />
        {(mobileOpen || !collapsed) && (
          <div>
            <p style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 16, color: T.sidebarTextBright, lineHeight: 1.1 }}>OnlinePT</p>
            <p style={{ fontSize: 10, color: T.sidebarText, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Super Console</p>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { onTab(id); if (mobileOpen) onMobileClose(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: (collapsed && !mobileOpen) ? '12px' : '14px 16px',
              background: activeTab === id ? T.sidebarActive : 'transparent',
              border: 'none', borderRadius: 12,
              cursor: 'pointer', width: '100%',
              color: activeTab === id ? T.white : T.sidebarText,
              fontFamily: 'inherit', fontWeight: 700, fontSize: 14,
              transition: 'all 0.2s',
              justifyContent: (collapsed && !mobileOpen) ? 'center' : 'flex-start',
            }}
          >
            <Icon size={20} style={{ flexShrink: 0 }} />
            {(mobileOpen || !collapsed) && <span>{label}</span>}
          </button>
        ))}
      </nav>

      <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={onSignOut}
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'transparent', border: 'none', borderRadius: 12, cursor: 'pointer', width: '100%', color: '#FB7185', fontWeight: 700, fontSize: 14, justifyContent: (collapsed && !mobileOpen) ? 'center' : 'flex-start' }}
        >
          <LogOut size={20} />
          {(mobileOpen || !collapsed) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hide-mobile" style={{ width: collapsed ? 80 : 256, minHeight: '100vh', background: T.sidebar, display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 110, transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)', overflow: 'hidden' }}>
        {content}
      </aside>
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }} onClick={onMobileClose}>
          <div style={{ width: 280, height: '100%', background: T.sidebar, animation: 'slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} onClick={e => e.stopPropagation()}>{content}</div>
        </div>
      )}
    </>
  );
}

// ---─ Action Button ---------------------------------------------------------------------------─
function ActionButton({ onClick, label, bg, color, icon: Icon }) {
  return (
    <button onClick={onClick} style={{ height: 34, padding: '0 12px', background: bg, color, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {Icon && <Icon size={14} />} {label}
    </button>
  );
}

// ---─ Main Component ---------------------------------------------------------------------------------------─
export default function SaaSDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [platformBookings, setPlatformBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [pricingTemplates, setPricingTemplates] = useState([]);
  const [platformBilling, setPlatformBilling] = useState({ 
    razorpayKeyId: '', 
    razorpayKeySecret: '',
    whatsappToken: '',
    whatsappPhoneId: ''
  });
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingSaved, setPricingSaved] = useState(false);
  const [billingSaving, setBillingSaving] = useState(false);
  const [billingSaved, setBillingSaved] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetSentIds, setResetSentIds] = useState({});

  const handleAdminReset = async () => {
    try {
      await sendResetEmail('pakoladiya@gmail.com');
      setResetEmailSent(true);
      setTimeout(() => setResetEmailSent(false), 3000);
    } catch(e) {
      console.error(e);
      alert('Failed to send reset email.');
    }
  };

  const handleResetPhysio = async (id, email) => {
    try {
      await sendResetEmail(email);
      setResetSentIds(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setResetSentIds(prev => ({ ...prev, [id]: false })), 3000);
    } catch(e) {
      console.error(e);
      alert(`Failed to send reset email to ${email}`);
    }
  };

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    const unsub = onSnapshot(collection(db, 'clinics'), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by createdAt descending (newest first)
      list.sort((a, b) => {
        const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return db - da;
      });
      setClinics(list);
      setLoading(false);
    }, () => setLoading(false));

    getAllPlatformBookings().then(setPlatformBookings);

    // Fetch Templates
    const fetchTemplates = async () => {
      const snap = await getDoc(doc(db, 'platform_config', 'pricing'));
      if (snap.exists()) setPricingTemplates(snap.data().templates || []);
    };
    
    // Fetch Platform Billing
    const fetchBilling = async () => {
       const bDoc = await getDoc(doc(db, 'platform_config', 'billing'));
       if (bDoc.exists()) setPlatformBilling(bDoc.data());
    };

    fetchTemplates();
    fetchBilling();

    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    const { signOut } = await import('@/firebase/auth');
    await signOut(); navigate('/dashboard-login');
  };

  const updateClinicStatus = async (id, status, extra = {}) => {
    if (db) {
      await updateDoc(doc(db, 'clinics', id), { subscriptionStatus: status, ...extra, lastUpdateAt: serverTimestamp() });
      
      // Notify therapist on activation
      if (status === 'active') {
        try {
          const clinic = clinics.find(c => c.id === id);
          if (clinic) {
            await fetch(`${API_ROOT}/notifications/notify-clinic-approval`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clinicId: id })
            });
          }
        } catch (通知Err) {
          console.warn('Activation notification failed:', 通知Err);
        }
      }
    }
    setConfirmDialog(null);
  };

  const deleteClinic = async (id) => {
    if (window.confirm('Are you sure you want to PERMANENTLY delete this clinic? This cannot be undone.')) {
      try {
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'clinics', id));
      } catch (e) {
        alert('Failed to delete clinic');
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.surface, color: T.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .hide-mobile { display: block; }
        .main-content { margin-left: 256px; }
        .stats-grid { grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .main-content { margin-left: 0 !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px !important; }
          .header-title { display: none; }
        }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .table-wrap { overflow-x: auto; scrollbar-width: none; }
        .table-wrap::-webkit-scrollbar { display: none; }
      `}</style>

      <Sidebar 
        activeTab={activeTab} onTab={setActiveTab} 
        collapsed={sidebarCollapsed} onSignOut={handleSignOut}
        mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="main-content" style={{ flex: 1, marginLeft: sidebarCollapsed ? 80 : 256, transition: 'margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)', minHeight: '100vh' }}>
        <header style={{ background: T.glass, backdropFilter: T.blur, borderBottom: `1px solid ${T.border}`, padding: '0 var(--section-px)', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => { if (window.innerWidth <= 768) setMobileMenuOpen(true); else setSidebarCollapsed(!sidebarCollapsed); }} style={{ width: 40, height: 40, borderRadius: 12, background: T.white, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.ink3 }}><Menu size={20} /></button>
            <h1 className="header-title" style={{ fontFamily: 'Manrope, sans-serif', fontSize: 18, fontWeight: 800 }}>{NAV_ITEMS.find(n => n.id === activeTab)?.label}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
             <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                <Crown size={12} /> Super Admin
             </div>
             <div style={{ width: 38, height: 38, borderRadius: 12, background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white, fontWeight: 800 }}>A</div>
          </div>
        </header>

        <div style={{ padding: '24px var(--section-px)' }}>
          {activeTab === 'dashboard' && (
            <div className="reveal active" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
               <div className="stats-grid" style={{ display: 'grid', gap: 24 }}>
                  <StatCard title="Platform Load" value={platformBookings.length} icon={Activity} trend="+12%" color={T.primary} bg={T.primaryLight} />
                  <StatCard title="Active Clinics" value={clinics.filter(c => c.subscriptionStatus === 'active').length} icon={Globe} trend="+2" color="#10B981" bg="#D1FAE5" />
                  <StatCard
                    title="Revenue"
                    value={`₹${platformBookings.filter(b => b.paymentStatus === 'paid').reduce((sum, b) => sum + (b.servicePrice || b.servicePrice || b.amount || b.totalPrice || 0), 0).toLocaleString('en-IN')}`}
                    icon={TrendingUp}
                    trend="Live"
                    color="#8B5CF6"
                    bg="#F5F3FF"
                  />
                  <StatCard title="Platform Speed" value="98.5%" icon={Activity} color={T.accent} bg={T.primaryLight} />
               </div>

               {/* Pending Queue */}
               {clinics.some(c => c.subscriptionStatus === 'pending_approval') && (
                 <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: T.r.lg, padding: 'clamp(20px, 4vw, 32px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                       <AlertCircle size={20} color="#D97706" />
                       <h3 style={{ fontSize: 16, fontWeight: 800 }}>Clinic Approvals Required</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                       {clinics.filter(c => c.subscriptionStatus === 'pending_approval').map(c => (
                         <div key={c.id} style={{ background: T.white, borderRadius: T.r.md, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #FEF3C7', flexWrap: 'wrap', gap: 16 }}>
                            <div>
                               <p style={{ fontWeight: 800, fontSize: 16 }}>{toTitleCase(c.clinicName || c.name)}</p>
                               <p style={{ fontSize: 12, color: T.ink4 }}>{toTitleCase(c.physioName)} &bull; {c.email}</p>
                                {c.createdAt && (
                                   <p style={{ fontSize: 11, color: '#D97706', marginTop: 6, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <Clock size={12} /> Applied: {c.createdAt.toDate ? c.createdAt.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : new Date(c.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                   </p>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                               <button onClick={() => updateClinicStatus(c.id, 'active')} style={{ padding: '8px 16px', borderRadius: 8, background: '#10B981', color: T.white, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Approve</button>
                               <button onClick={() => updateClinicStatus(c.id, 'rejected')} style={{ padding: '8px 16px', borderRadius: 8, background: '#EF4444', color: T.white, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Deny</button>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'clinics' && (
            <div className="reveal active">
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>Clinic Directory</h2>
                  <button onClick={() => navigate('/saas/onboarding')} style={{ height: 44, padding: '0 20px', borderRadius: 12, background: T.primary, color: T.white, border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 8px 24px ${T.primary}40` }}><Plus size={18} /> New Clinic</button>
               </div>

               <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                  <div className="table-wrap">
                     <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                        <thead>
                           <tr style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
                              {['Clinic Info', 'Domain', 'Contact', 'Status', 'Actions'].map(h => <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: T.ink3, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</th>)}
                           </tr>
                        </thead>
                        <tbody>
                           {clinics.map(c => (
                             <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                                <td style={{ padding: '16px 24px' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      <div style={{ width: 36, height: 36, borderRadius: 10, background: T.primaryLight, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{(c.clinicName || c.name || 'C')[0]}</div>
                                      <div><p style={{ fontWeight: 700, fontSize: 14 }}>{toTitleCase(c.clinicName || c.name)}</p><p style={{ fontSize: 11, color: T.ink4 }}>ID: {c.id.slice(0,8)}</p></div>
                                   </div>
                                </td>
                                <td style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600 }}>
                                   <a 
                                      href={c.domain?.includes('.') ? `https://${c.domain}` : `https://${c.domain || c.id}.onlinept.in`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      style={{ color: T.primary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                                      onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                      onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                                      title={c.domain?.includes('.') ? `Visit ${c.domain}` : `Visit ${c.domain || c.id}.onlinept.in`}
                                   >
                                      {c.domain || 'No Domain'} <ExternalLink size={14} />
                                   </a>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                   <p style={{ fontSize: 14, fontWeight: 600 }}>{toTitleCase(c.physioName)}</p>
                                   <p style={{ fontSize: 11, color: T.ink4 }}>{c.email}</p>
                                   {c.createdAt && (
                                     <p style={{ fontSize: 10, color: T.ink4, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                       <Clock size={10} /> {c.createdAt.toDate ? c.createdAt.toDate().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : new Date(c.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                     </p>
                                   )}
                                </td>
                                <td style={{ padding: '16px 24px' }}><StatusBadge status={c.subscriptionStatus} /></td>
                                <td style={{ padding: '16px 24px' }}>
                                   <div style={{ display: 'flex', gap: 8 }}>
                                      <button title="Reset Password" onClick={() => handleResetPhysio(c.id, c.email)} style={{ width: 32, height: 32, borderRadius: 8, background: resetSentIds[c.id] ? '#D1FAE5' : T.surface, border: `1px solid ${resetSentIds[c.id] ? '#10B981' : 'transparent'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: resetSentIds[c.id] ? '#059669' : T.ink3 }}>
                                        {resetSentIds[c.id] ? <CheckCircle2 size={16} /> : <Key size={16} />}
                                      </button>
                                      <button title="Details" onClick={() => setSelectedClinic(c)} style={{ width: 32, height: 32, borderRadius: 8, background: T.surface, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink3 }}><Info size={16} /></button>
                                      {c.subscriptionStatus === 'active' ? (
                                        <button title="Suspend Clinic" onClick={() => updateClinicStatus(c.id, 'suspended')} style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF3C7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}><ShieldAlert size={16} /></button>
                                      ) : (
                                        <button title="Activate Clinic" onClick={() => updateClinicStatus(c.id, 'active')} style={{ width: 32, height: 32, borderRadius: 8, background: '#D1FAE5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}><CheckCircle2 size={16} /></button>
                                      )}
                                      <button title="Delete Clinic" onClick={() => deleteClinic(c.id)} style={{ width: 32, height: 32, borderRadius: 8, background: '#FEE2E2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', marginLeft: 4 }}><Trash2 size={16} /></button>
                                   </div>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="reveal active" style={{ maxWidth: 800 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>System Commands & Keys</h2>
                  <p style={{ fontSize: 13, color: T.ink3, marginTop: 4 }}>Manage the technical heart of OnlinePT. Configure payments and notifications.</p>
                </div>
                <button
                  onClick={async () => {
                    setBillingSaving(true);
                    try {
                      await setDoc(doc(db, 'platform_config', 'billing'), { ...platformBilling, updatedAt: serverTimestamp() });
                      setBillingSaved(true);
                      setTimeout(() => setBillingSaved(false), 3000);
                    } catch (e) { alert('Failed to save billing settings'); }
                    setBillingSaving(false);
                  }}
                  style={{ height: 44, padding: '0 24px', borderRadius: 12, background: billingSaved ? '#10B981' : T.primary, color: T.white, border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 8px 24px ${T.primary}40`, transition: 'all 0.3s' }}
                >
                  {billingSaving ? <Loader2 size={16} className="animate-spin" /> : billingSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                  {billingSaving ? 'Saving...' : billingSaved ? 'Saved!' : 'Save System Keys'}
                </button>
              </div>

              <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, padding: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, padding: '16px 20px', background: T.primaryLight, borderRadius: 16 }}>
                  <ShieldCheck size={24} className="text-primary" />
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.primary }}>These keys are used for **Platform Subscription Fees** paid by clinicians to you.</p>
                </div>

                <div style={{ display: 'grid', gap: 24 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: T.ink4, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 8 }}>Super Admin Razorpay Key ID</label>
                    <input 
                      value={platformBilling.razorpayKeyId || ''} 
                      onChange={e => setPlatformBilling(p => ({ ...p, razorpayKeyId: e.target.value }))}
                      placeholder="rzp_live_..."
                      style={{ width: '100%', height: 52, borderRadius: 14, border: `2px solid ${T.border}`, padding: '0 16px', fontSize: 14, fontWeight: 700, outline: 'none', transition: 'border-color 0.2s' }} 
                      onFocus={e => e.target.style.borderColor = T.primary}
                      onBlur={e => e.target.style.borderColor = T.border}
                    />
                    <p style={{ fontSize: 11, color: T.ink3, marginTop: 8 }}>Found in your Razorpay Dashboard → Settings → API Keys</p>
                  </div>

                  <div style={{ padding: '24px 0', borderTop: `1px solid ${T.border}`, marginTop: 12 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 800, color: T.ink, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                       <Phone size={14} className="text-primary" /> Meta WhatsApp Cloud API
                    </h3>
                    <div style={{ display: 'grid', gap: 20 }}>
                       <div>
                          <label style={{ fontSize: 10, fontWeight: 800, color: T.ink4, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>WhatsApp Admin Token (Permanent)</label>
                          <input 
                            type="password"
                            value={platformBilling.whatsappToken || ''} 
                            onChange={e => setPlatformBilling(p => ({ ...p, whatsappToken: e.target.value }))}
                            placeholder="EAA... (Paste Token Here)"
                            style={{ width: '100%', height: 52, borderRadius: 14, border: `2px solid ${T.border}`, padding: '0 16px', fontSize: 14, fontWeight: 700, outline: 'none' }} 
                          />
                       </div>
                       <div>
                          <label style={{ fontSize: 10, fontWeight: 800, color: T.ink4, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>WhatsApp Phone Number ID</label>
                          <input 
                            value={platformBilling.whatsappPhoneId || ''} 
                            onChange={e => setPlatformBilling(p => ({ ...p, whatsappPhoneId: e.target.value }))}
                            placeholder="1234567890..."
                            style={{ width: '100%', height: 52, borderRadius: 14, border: `2px solid ${T.border}`, padding: '0 16px', fontSize: 14, fontWeight: 700, outline: 'none' }} 
                          />
                       </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: T.ink4, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: 8 }}>Super Admin Razorpay Key Secret</label>
                    <input 
                      type="password"
                      value={platformBilling.razorpayKeySecret} 
                      onChange={e => setPlatformBilling(p => ({ ...p, razorpayKeySecret: e.target.value }))}
                      placeholder="••••••••••••••••••••"
                      style={{ width: '100%', height: 52, borderRadius: 14, border: `2px solid ${T.border}`, padding: '0 16px', fontSize: 14, fontWeight: 700, outline: 'none', transition: 'border-color 0.2s' }} 
                      onFocus={e => e.target.style.borderColor = T.primary}
                      onBlur={e => e.target.style.borderColor = T.border}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'pricing' && (
            <div className="reveal active" style={{ maxWidth: 900 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>Pricing Templates</h2>
                  <p style={{ fontSize: 13, color: T.ink3, marginTop: 4 }}>Default services new clinics inherit on signup. Clinicians can customize their own.</p>
                </div>
                <button
                  onClick={async () => {
                    if (!db) return;
                    setPricingSaving(true);
                    try {
                      await setDoc(doc(db, 'platform_config', 'pricing'), { templates: pricingTemplates, updatedAt: serverTimestamp() });
                      setPricingSaved(true);
                      setTimeout(() => setPricingSaved(false), 3000);
                    } catch (e) { console.error('Save failed:', e); }
                    setPricingSaving(false);
                  }}
                  style={{ height: 44, padding: '0 24px', borderRadius: 12, background: pricingSaved ? '#10B981' : T.primary, color: T.white, border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 8px 24px ${T.primary}40`, transition: 'all 0.3s' }}
                >
                  {pricingSaving ? <Loader2 size={16} className="animate-spin" /> : pricingSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                  {pricingSaving ? 'Saving...' : pricingSaved ? 'Templates Saved!' : 'Save Templates'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {pricingTemplates.map((svc, i) => (
                  <div key={svc.id || i} style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, padding: 'clamp(20px, 4vw, 32px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: T.primaryLight, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>{i + 1}</div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: T.ink4, textTransform: 'uppercase', letterSpacing: '1px' }}>Service Template {i + 1}</span>
                      </div>
                      {pricingTemplates.length > 1 && (
                        <button onClick={() => setPricingTemplates(prev => prev.filter((_, idx) => idx !== i))} style={{ background: '#FEE2E2', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#DC2626' }}><Trash2 size={14} /></button>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 800, color: T.ink4, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Service Name</label>
                        <input value={svc.name} onChange={e => setPricingTemplates(prev => prev.map((s, idx) => idx === i ? { ...s, name: e.target.value } : s))} style={{ width: '100%', height: 44, borderRadius: 12, border: `1px solid ${T.border}`, padding: '0 14px', fontSize: 14, fontWeight: 700, outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 800, color: T.ink4, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Duration (min)</label>
                        <input type="number" value={svc.duration} onChange={e => setPricingTemplates(prev => prev.map((s, idx) => idx === i ? { ...s, duration: parseInt(e.target.value) } : s))} style={{ width: '100%', height: 44, borderRadius: 12, border: `1px solid ${T.border}`, padding: '0 14px', fontSize: 14, fontWeight: 700, outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 800, color: T.ink4, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Price (₹)</label>
                        <input type="number" value={svc.price} onChange={e => setPricingTemplates(prev => prev.map((s, idx) => idx === i ? { ...s, price: parseInt(e.target.value) } : s))} style={{ width: '100%', height: 44, borderRadius: 12, border: `1px solid ${T.border}`, padding: '0 14px', fontSize: 16, fontWeight: 800, outline: 'none' }} />
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <label style={{ fontSize: 10, fontWeight: 800, color: T.ink4, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Description</label>
                      <input value={svc.description} onChange={e => setPricingTemplates(prev => prev.map((s, idx) => idx === i ? { ...s, description: e.target.value } : s))} style={{ width: '100%', height: 40, borderRadius: 12, border: `1px solid ${T.border}`, padding: '0 14px', fontSize: 13, fontWeight: 500, outline: 'none' }} placeholder="Brief description for patients..." />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setPricingTemplates(prev => [...prev, { id: `custom_${Date.now()}`, name: '', duration: 30, price: 0, description: '' }])}
                  style={{ width: '100%', height: 56, border: `2px dashed ${T.border}`, borderRadius: T.r.lg, background: 'transparent', fontSize: 14, fontWeight: 700, color: T.ink4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}
                >
                  <Plus size={18} /> Add Service Template
                </button>

                <div style={{ background: T.primaryLight, borderRadius: T.r.md, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <Info size={16} style={{ color: T.primary, flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 800, color: T.primary, marginBottom: 4 }}>How Templates Work</p>
                    <p style={{ fontSize: 12, color: T.ink3, lineHeight: 1.6 }}>These templates are the default services assigned to every new clinic upon signup. Clinicians can later customize their own service names, durations, and ₹ prices from their Clinic Settings panel.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="reveal active">
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>Platform Schedule</h2>
                    <p style={{ fontSize: 13, color: T.ink3, marginTop: 4 }}>Master view of all appointments booked across every clinic.</p>
                  </div>
               </div>

               <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                  <div className="table-wrap">
                     <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                        <thead>
                           <tr style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
                              {['Date & Time', 'Clinic', 'Patient', 'Service', 'Status', 'Revenue'].map(h => <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: T.ink3, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</th>)}
                           </tr>
                        </thead>
                        <tbody>
                           {platformBookings.length === 0 ? (
                              <tr>
                                 <td colSpan="6" style={{ padding: '32px 24px', textAlign: 'center', color: T.ink4, fontWeight: 600 }}>No appointments booked yet.</td>
                              </tr>
                           ) : platformBookings.map(b => {
                              // Robust lookup: match by ID or Subdomain
                              const clinic = clinics.find(c => c.id === b.clinicId || c.subdomain === b.clinicId);
                              
                              // Helper for formatting date/times
                              const displayDate = b.date && b.date.toDate ? b.date.toDate().toLocaleDateString('en-IN') : b.date;
                              const displaySlot = b.slot?.label || b.slot || '—';
                              const patientName = b.name || b.patientName || 'Guest Patient';
                              
                              // Logic: Prioritize saved data, fallback to lookup
                              const clinicLabel = b.clinicName || clinic?.clinicName || clinic?.name || 'Unknown Clinic';
                              const rawSubdomain = b.subdomain || clinic?.subdomain;
                              const subdomainLabel = rawSubdomain ? `${rawSubdomain}.onlinept.in` : 'No domain';

                              return (
                                <tr key={b.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                                   <td style={{ padding: '16px 24px' }}>
                                      <p style={{ fontWeight: 800, fontSize: 14 }}>{displayDate}</p>
                                      <p style={{ fontSize: 12, color: T.ink4 }}>{displaySlot}</p>
                                   </td>
                                   <td style={{ padding: '16px 24px' }}>
                                      <p style={{ fontWeight: 700, fontSize: 13, color: T.ink2 }}>{toTitleCase(clinicLabel)}</p>
                                      <p style={{ fontSize: 11, color: T.primary, fontWeight: 700 }}>{subdomainLabel}</p>
                                   </td>
                                   <td style={{ padding: '16px 24px' }}>
                                      <p style={{ fontWeight: 700, fontSize: 14 }}>{toTitleCase(patientName)}</p>
                                      <p style={{ fontSize: 11, color: T.ink4 }}>{b.phone || '—'}</p>
                                   </td>
                                   <td style={{ padding: '16px 24px' }}>
                                      <p style={{ fontWeight: 600, fontSize: 13 }}>{toTitleCase(b.serviceName || 'Consultation')}</p>
                                   </td>
                                   <td style={{ padding: '16px 24px' }}>
                                      <StatusBadge status={b.status} />
                                   </td>
                                   <td style={{ padding: '16px 24px' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                         <p style={{ fontWeight: 800, fontSize: 14, color: b.paymentStatus === 'paid' ? '#10B981' : T.ink }}>
                                            ₹{b.servicePrice || b.amount || b.totalPrice || 0}
                                         </p>
                                         <p style={{ fontSize: 9, fontWeight: 800, color: b.paymentStatus === 'paid' ? '#10B981' : T.ink4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {b.paymentStatus || 'Unpaid'}
                                         </p>
                                      </div>
                                   </td>
                                </tr>
                           )})}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}
          {activeTab === 'users' && (
            <div className="reveal active" style={{ maxWidth: 900 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>Platform Admins</h2>
                    <p style={{ fontSize: 13, color: T.ink3, marginTop: 4 }}>Manage users with Super Admin access to this Command Center.</p>
                  </div>
                  <button style={{ height: 44, padding: '0 20px', borderRadius: 12, background: T.surface, border: `1px solid ${T.border}`, color: T.ink4, fontWeight: 700, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Plus size={18} /> Add Sub-Admin
                  </button>
               </div>

               <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                  <div className="table-wrap">
                     <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                        <thead>
                           <tr style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
                              {['Admin User', 'Role', 'Status', 'Security', 'Actions'].map(h => <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: T.ink3, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</th>)}
                           </tr>
                        </thead>
                        <tbody>
                             <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                <td style={{ padding: '16px 24px' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                      <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, color: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>P</div>
                                      <div>
                                         <p style={{ fontWeight: 800, fontSize: 14, color: T.ink }}>Pakoladiya</p>
                                         <p style={{ fontSize: 12, color: T.ink4 }}>pakoladiya@gmail.com</p>
                                      </div>
                                   </div>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                   <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FEF3C7', color: '#D97706', padding: '4px 10px', borderRadius: 100, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                      <Crown size={12} /> Root Admin
                                   </span>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                   <StatusBadge status="active" />
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10B981', fontSize: 12, fontWeight: 700 }}>
                                      <ShieldAlert size={14} /> Full Access
                                   </div>
                                </td>
                                <td style={{ padding: '16px 24px' }}>
                                   <button 
                                     onClick={handleAdminReset}
                                     style={{ height: 32, padding: '0 12px', borderRadius: 8, background: resetEmailSent ? '#D1FAE5' : T.surface, border: `1px solid ${resetEmailSent ? '#10B981' : T.border}`, color: resetEmailSent ? '#059669' : T.ink3, fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}
                                   >
                                     <Key size={14} /> 
                                     {resetEmailSent ? 'Link Sent!' : 'Reset Password'}
                                   </button>
                                </td>
                             </tr>
                        </tbody>
                     </table>
                  </div>
               </div>

               <div style={{ background: T.primaryLight, borderRadius: T.r.md, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 24 }}>
                  <Key size={18} style={{ color: T.primary, flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: T.primary, marginBottom: 4 }}>Root Architecture</p>
                    <p style={{ fontSize: 12, color: T.ink3, lineHeight: 1.6 }}>The Root Admin identity is securely hardcoded into the platform's configuration (`superAdminConfig.js`). Additional sub-admin support via Firestore roles is part of the future scalability roadmap.</p>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="reveal active" style={{ maxWidth: 900 }}>
               <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>System Settings</h2>
                  <p style={{ fontSize: 13, color: T.ink3, marginTop: 4 }}>Configure global SaaS platform infrastructure, payments, and security.</p>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
                  
                  {/* Gateway Integration */}
                  <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, padding: 'clamp(20px, 4vw, 32px)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <CreditCard size={20} />
                        </div>
                        <div>
                           <h3 style={{ fontSize: 16, fontWeight: 800 }}>Payment Infrastructure</h3>
                           <p style={{ fontSize: 12, color: T.ink4 }}>Razorpay routing and global tax variables.</p>
                        </div>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                        <div>
                           <label style={{ fontSize: 10, fontWeight: 800, color: T.ink4, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Global Platform Fee (%)</label>
                           <input type="text" value="0.0%" disabled style={{ width: '100%', height: 44, borderRadius: 12, border: `1px solid ${T.border}`, padding: '0 14px', fontSize: 14, fontWeight: 800, color: T.ink3, background: T.surface }} />
                        </div>
                        <div>
                           <label style={{ fontSize: 10, fontWeight: 800, color: T.ink4, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Default GST Rate</label>
                           <input type="text" value="18%" disabled style={{ width: '100%', height: 44, borderRadius: 12, border: `1px solid ${T.border}`, padding: '0 14px', fontSize: 14, fontWeight: 800, color: T.ink3, background: T.surface }} />
                        </div>
                     </div>
                     <div style={{ marginTop: 16, padding: '12px 16px', background: '#ECFDF5', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontSize: 12, fontWeight: 700 }}>
                        <CheckCircle2 size={16} /> Razorpay API is securely locked via environment variables.
                     </div>
                  </div>

                  {/* Security & Maintenance */}
                  <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, padding: 'clamp(20px, 4vw, 32px)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <ShieldAlert size={20} />
                        </div>
                        <div>
                           <h3 style={{ fontSize: 16, fontWeight: 800 }}>Platform Security</h3>
                           <p style={{ fontSize: 12, color: T.ink4 }}>Danger zone and system access routing.</p>
                        </div>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: `1px solid ${T.border}`, borderRadius: 12 }}>
                        <div>
                           <p style={{ fontSize: 14, fontWeight: 700 }}>Maintenance Mode</p>
                           <p style={{ fontSize: 12, color: T.ink4 }}>Blocks new signups and disables patient checkouts.</p>
                        </div>
                        <button style={{ width: 48, height: 28, borderRadius: 100, background: T.surface, border: `1px solid ${T.border}`, position: 'relative', cursor: 'not-allowed' }}>
                           <div style={{ width: 20, height: 20, borderRadius: '50%', background: T.ink4, position: 'absolute', top: 3, left: 4 }}></div>
                        </button>
                     </div>
                  </div>

               </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Clinic Details Modal --- */}
      {selectedClinic && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={(e) => { if(e.target === e.currentTarget) setSelectedClinic(null); }}>
          <div style={{ background: T.white, borderRadius: T.r.xl, width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.surface }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: T.primaryLight, color: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
                  {(selectedClinic.clinicName || selectedClinic.name || 'C')[0]}
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800 }}>{toTitleCase(selectedClinic.clinicName || selectedClinic.name)}</h3>
                  <p style={{ fontSize: 12, color: T.ink4 }}>ID: {selectedClinic.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedClinic(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: T.ink3 }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: T.ink4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Physio Name</label>
                  <p style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginTop: 4 }}>{toTitleCase(selectedClinic.physioName)}</p>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: T.ink4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Domain Address</label>
                  <a href={selectedClinic.domain?.includes('.') ? `https://${selectedClinic.domain}` : `https://${selectedClinic.domain || selectedClinic.id}.onlinept.in`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 600, color: T.primary, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                    {selectedClinic.domain || 'Not Setup'} <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: T.ink4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact Information</label>
                <div style={{ background: T.surface, padding: 16, borderRadius: 12, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.ink }}><Mail size={16} color={T.ink4} /> {selectedClinic.email}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.ink }}><Phone size={16} color={T.ink4} /> {selectedClinic.phone}</div>
                  <div style={{ display: 'flex', alignItems: 'start', gap: 8, fontSize: 13, color: T.ink }}><MapPin size={16} color={T.ink4} /> <span style={{ flex: 1 }}>{selectedClinic.address || 'Address not listed.'}</span></div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: T.ink4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Status</label>
                <div style={{ marginTop: 8 }}>
                   <StatusBadge status={selectedClinic.subscriptionStatus} />
                </div>
              </div>
            </div>
            
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, background: T.surface, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedClinic(null)} style={{ padding: '0 20px', height: 40, borderRadius: 10, background: T.white, border: `1px solid ${T.border}`, fontWeight: 700, color: T.ink3, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
