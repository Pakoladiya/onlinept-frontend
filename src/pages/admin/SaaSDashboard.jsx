import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import {
  Users, Calendar, Activity, TrendingUp, Plus,
  Settings, LogOut, Menu, X, Crown,
  Clock, UserX, Trash2, ExternalLink,
  Globe, Loader2,
} from 'lucide-react';

// ─── Design Tokens ──────────────────────────────────────────────────────────────
const T = {
  sidebar: '#0F172A',
  sidebarHover: '#1E293B',
  sidebarActive: '#1D4ED8',
  sidebarText: '#94A3B8',
  sidebarTextBright: '#F1F5F9',
  primary: '#007AFF',
  primaryLight: '#E8F1FF',
  accent: '#0055CC',
  surface: '#F8FAFC',
  white: '#FFFFFF',
  ink: '#1D1D1F',
  ink2: '#3A3A3C',
  ink3: '#636366',
  ink4: '#AEAEB2',
  border: 'rgba(0,0,0,0.06)',
  shadowSm: '0 2px 8px rgba(0,0,0,0.06)',
  shadowMd: '0 8px 24px rgba(0,0,0,0.10)',
  blue: '#007AFF',
  yellow: '#F59E0B',
  red: '#EF4444',
  r: { sm: 10, md: 14, lg: 20 },
};

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'clinics', label: 'Clinics', icon: Globe },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, trend, color, bg }) {
  return (
    <div style={{
      background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`,
      padding: 24, boxShadow: T.shadowSm,
      display: 'flex', flexDirection: 'column', gap: 16,
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = T.shadowMd; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = T.shadowSm; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} style={{ color }} />
        </div>
        {trend && (
          <span style={{
            fontSize: 12, fontWeight: 600, color: T.blue,
            background: '#E8F1FF', padding: '2px 8px', borderRadius: 20,
          }}>↑ {trend}</span>
        )}
      </div>
      <div>
        <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 32, fontWeight: 800, color: T.ink, lineHeight: 1, letterSpacing: '-1px' }}>
          {value}
        </p>
        <p style={{ fontSize: 13, color: T.ink3, marginTop: 4, fontWeight: 500 }}>{title}</p>
      </div>
    </div>
  );
}

// ─── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    active: { color: T.blue, bg: '#E8F1FF', label: 'Active' },
    pending: { color: T.yellow, bg: '#FEF3C7', label: 'Pending' },
    pending_approval: { color: T.yellow, bg: '#FEF3C7', label: 'Pending Approval' },
    confirmed: { color: T.blue, bg: '#DBEAFE', label: 'Confirmed' },
    completed: { color: T.blue, bg: '#E8F1FF', label: 'Completed' },
    suspended: { color: T.red, bg: '#FEE2E2', label: 'Suspended' },
    rejected: { color: T.red, bg: '#FEE2E2', label: 'Rejected' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color: s.color,
      background: s.bg, padding: '3px 10px', borderRadius: 20,
      textTransform: 'uppercase', letterSpacing: '0.3px',
    }}>
      {s.label}
    </span>
  );
}

// ─── Confirm Dialog ─────────────────────────────────────────────────────────────
function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div style={{
        background: T.white, borderRadius: T.r.lg, padding: 32, maxWidth: 400, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'scaleIn 0.3s ease both',
      }}>
        <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 18, fontWeight: 800, color: T.ink, marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 14, color: T.ink3, lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{
            flex: 1, height: 44, background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: T.r.sm, fontSize: 14, fontWeight: 600, color: T.ink2,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, height: 44, background: danger ? T.red : T.primary,
            color: T.white, border: 'none', borderRadius: T.r.sm,
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: `0 4px 12px ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(0,122,255,0.3)'}`,
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ activeTab, onTab, collapsed, onSignOut }) {
  return (
    <aside style={{
      width: collapsed ? 72 : 240,
      minHeight: '100vh', background: T.sidebar,
      display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, bottom: 0,
      zIndex: 100, transition: 'width 0.3s',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        height: 64, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {!collapsed && (
          <div>
            <p style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 16, color: T.sidebarTextBright, lineHeight: 1.1 }}>OnlinePT</p>
            <p style={{ fontSize: 10, color: T.sidebarText, fontWeight: 500 }}>Platform Control</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTab(id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: collapsed ? '12px' : '12px 14px',
              background: activeTab === id ? T.sidebarActive : 'transparent',
              border: 'none', borderRadius: T.r.sm,
              cursor: 'pointer', width: '100%',
              color: activeTab === id ? T.white : T.sidebarText,
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14,
              transition: 'background 0.15s',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            onMouseEnter={e => { if (activeTab !== id) e.currentTarget.style.background = T.sidebarHover; }}
            onMouseLeave={e => { if (activeTab !== id) e.currentTarget.style.background = 'transparent'; }}
          >
            <Icon size={20} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={onSignOut}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: collapsed ? '12px' : '12px 14px',
            background: 'transparent', border: 'none', borderRadius: T.r.sm,
            cursor: 'pointer', width: '100%',
            color: T.sidebarText, fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600, fontSize: 14,
            transition: 'background 0.15s',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={20} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Table Row Helper ──────────────────────────────────────────────────────────
function ActionButton({ onClick, label, bg, color, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        background: bg, color, border: 'none', borderRadius: 6,
        fontSize: 11, fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {Icon && <Icon size={12} />} {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SaaSDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [appointments, setAppointments] = useState([
    { id: 1, patient: 'Priya Sharma', phone: '98765 43210', service: 'Physiotherapy', date: 'Mar 29, 2026', slot: 'Morning', status: 'pending' },
    { id: 2, patient: 'Rahul Verma', phone: '98234 56789', service: 'Sports Rehab', date: 'Mar 29, 2026', slot: 'Afternoon', status: 'confirmed' },
    { id: 3, patient: 'Anita Desai', phone: '97654 32109', service: 'Spine Care', date: 'Mar 28, 2026', slot: 'Morning', status: 'completed' },
    { id: 4, patient: 'Vikram Patel', phone: '96543 21098', service: 'Joint Pain', date: 'Mar 28, 2026', slot: 'Evening', status: 'pending' },
    { id: 5, patient: 'Sunita Rao', phone: '95432 10987', service: 'Trigger Point Therapy', date: 'Mar 27, 2026', slot: 'Afternoon', status: 'completed' },
  ]);
  const [users, setUsers] = useState([
    { id: 1, name: 'Dr. Aruna Koladiya', email: 'pakoladiya@gmail.com', role: 'super_admin', status: 'active', joined: 'Jan 2025' },
    { id: 2, name: 'Dr. Kiran Patel', email: 'kiran@spinecare.in', role: 'physio', status: 'active', joined: 'Feb 2025' },
    { id: 3, name: 'Dr. Meera Singh', email: 'meera@movewell.com', role: 'physio', status: 'active', joined: 'Mar 2025' },
    { id: 4, name: 'Dr. Ajay Kumar', email: 'ajay@cityphysio.com', role: 'physio', status: 'pending', joined: 'Mar 2026' },
  ]);

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    try {
      const unsub = onSnapshot(collection(db, 'clinics'), (snap) => {
        setClinics(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }, () => setLoading(false));
      return () => unsub();
    } catch { setLoading(false); }
  }, []);

  const handleSignOut = async () => {
    const { signOut } = await import('@/firebase/auth');
    await signOut();
    navigate('/dashboard-login');
  };

  const updateAppointmentStatus = (id, status) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setConfirmDialog(null);
  };

  const deleteAppointment = (id) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    setConfirmDialog(null);
  };

  const approveClinic = async (clinicId) => {
    try {
      if (db) await updateDoc(doc(db, 'clinics', clinicId), { subscriptionStatus: 'active' });
      else setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, subscriptionStatus: 'active' } : c));
    } catch (err) {
      console.error('Approve clinic failed:', err);
    }
    setConfirmDialog(null);
  };

  const rejectClinic = async (clinicId) => {
    try {
      if (db) await updateDoc(doc(db, 'clinics', clinicId), { subscriptionStatus: 'rejected' });
      else setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, subscriptionStatus: 'rejected' } : c));
    } catch (err) {
      console.error('Reject clinic failed:', err);
    }
    setConfirmDialog(null);
  };

  const filteredAppointments = appointments.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search && !a.patient.toLowerCase().includes(search.toLowerCase()) && !a.phone.includes(search)) return false;
    return true;
  });

  const filteredUsers = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { title: 'Total Appointments', value: '1,284', icon: Calendar, trend: '12%', color: T.primary, bg: T.primaryLight },
    { title: "Today's Appointments", value: '18', icon: Clock, trend: '5%', color: '#F59E0B', bg: '#FEF3C7' },
    { title: 'Total Patients', value: '4,521', icon: Users, trend: '8%', color: '#3B82F6', bg: '#DBEAFE' },
    { title: 'Pending Reviews', value: '23', icon: Activity, trend: null, color: '#EF4444', bg: '#FEE2E2' },
  ];

  const sidebarWidth = sidebarCollapsed ? 72 : 240;

  const tableHeaderStyle = (extra = {}) => ({
    padding: '14px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: T.ink3, textTransform: 'uppercase', letterSpacing: '0.5px',
    background: T.surface, ...extra,
  });

  const tableCellStyle = { padding: '14px 20px', fontSize: 13, color: T.ink3 };
  const tableRowStyle = (id) => ({
    borderTop: `1px solid ${T.border}`, transition: 'background 0.15s',
    cursor: 'default',
  });

  const pageTitle = NAV_ITEMS.find(n => n.id === activeTab)?.label || 'Dashboard';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", background: T.surface }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        tr:hover td { background: #F8FAFC !important; }
        @media (max-width: 768px) {
          aside { display: none !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: sidebarWidth, transition: 'margin-left 0.3s', minHeight: '100vh' }}>
        {/* Header */}
        <header style={{
          background: T.white, borderBottom: `1px solid ${T.border}`,
          padding: '0 28px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: T.surface, border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: T.ink3,
              }}
            >
              {sidebarCollapsed ? <Menu size={18} /> : <X size={18} />}
            </button>
            <h1 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 18, fontWeight: 800, color: T.ink, lineHeight: 1.1 }}>
              {pageTitle}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Super Admin Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `linear-gradient(135deg, #F59E0B, #D97706)`,
              color: '#fff', padding: '4px 12px', borderRadius: 20,
              fontSize: 11, fontWeight: 700,
              boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
            }}>
              <Crown size={11} /> Super Admin
            </div>
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.white, fontFamily: "'Manrope', sans-serif",
              fontWeight: 800, fontSize: 14,
            }}>A</div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: 28 }}>

          {/* ═══ DASHBOARD TAB ═══ */}
          {activeTab === 'dashboard' && (
            <div style={{ animation: 'fadeUp 0.4s ease both' }}>
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                {stats.map(s => <StatCard key={s.title} {...s} />)}
              </div>

              {/* Pending Enrollments */}
              {(() => {
                const pending = clinics.filter(c => c.subscriptionStatus === 'pending_approval');
                if (pending.length === 0) return null;
                return (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: T.r.lg, padding: '20px 24px', marginBottom: 28 }}>
                    <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 16, color: '#92400E', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                      Pending Enrollments ({pending.length})
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {pending.map(c => (
                        <div key={c.id} style={{ background: '#fff', border: '1px solid #FDE68A', borderRadius: T.r.md, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <p style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{c.clinicName || c.name}</p>
                            <p style={{ fontSize: 12, color: T.ink4, marginTop: 2 }}>{c.physioName || ''} &bull; {c.email || ''}</p>
                            <p style={{ fontSize: 11, color: T.ink4, marginTop: 2, fontFamily: 'monospace' }}>{c.domain}</p>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <ActionButton label="Approve" onClick={() => setConfirmDialog({ title: 'Approve Clinic Enrollment', message: `Approve enrollment for ${c.clinicName || c.name}? Their clinic portal will be activated.`, onConfirm: () => approveClinic(c.id), onCancel: () => setConfirmDialog(null), confirmLabel: 'Approve Enrollment' })} bg="#D1FAE5" color="#007AFF" />
                            <ActionButton label="Reject" onClick={() => setConfirmDialog({ title: 'Reject Clinic Enrollment', message: `Reject enrollment for ${c.clinicName || c.name}? This will deny their access.`, onConfirm: () => rejectClinic(c.id), onCancel: () => setConfirmDialog(null), confirmLabel: 'Reject Enrollment', danger: true })} bg="#FEE2E2" color="#DC2626" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Recent Appointments */}
              <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, overflow: 'hidden', marginBottom: 28 }}>
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 16, color: T.ink }}>Recent Appointments</h2>
                  <button onClick={() => setActiveTab('appointments')} style={{ fontSize: 13, fontWeight: 600, color: T.primary, background: 'none', border: 'none', cursor: 'pointer' }}>
                    View All →
                  </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Patient', 'Service', 'Date', 'Slot', 'Status', 'Actions'].map(h => <th key={h} style={tableHeaderStyle()}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {appointments.slice(0, 4).map(a => (
                      <tr key={a.id} style={tableRowStyle(a.id)}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: T.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary, fontWeight: 700, fontSize: 13 }}>{a.patient.charAt(0)}</div>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{a.patient}</p>
                              <p style={{ fontSize: 11, color: T.ink4 }}>{a.phone}</p>
                            </div>
                          </div>
                        </td>
                        <td style={tableCellStyle}>{a.service}</td>
                        <td style={tableCellStyle}>{a.date}</td>
                        <td style={tableCellStyle}>{a.slot}</td>
                        <td style={{ padding: '14px 20px' }}><StatusBadge status={a.status} /></td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {a.status === 'pending' && <ActionButton label="Confirm" onClick={() => updateAppointmentStatus(a.id, 'confirmed')} bg="#DBEAFE" color="#2563EB" />}
                            {a.status === 'confirmed' && <ActionButton label="Complete" onClick={() => updateAppointmentStatus(a.id, 'completed')} bg="#D1FAE5" color="#007AFF" />}
                            <ActionButton label="" onClick={() => setConfirmDialog({ title: 'Delete Appointment', message: `Delete appointment for ${a.patient}?`, onConfirm: () => deleteAppointment(a.id), onCancel: () => setConfirmDialog(null), confirmLabel: 'Delete', danger: true })} bg="#FEE2E2" color="#DC2626" icon={Trash2} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Active Clinics */}
              <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 16, color: T.ink }}>Active Clinics ({clinics.length})</h2>
                  <button onClick={() => setActiveTab('clinics')} style={{ fontSize: 13, fontWeight: 600, color: T.primary, background: 'none', border: 'none', cursor: 'pointer' }}>Manage →</button>
                </div>
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}><Loader2 size={24} className="animate-spin" style={{ color: T.primary }} /></div>
                ) : clinics.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: T.ink3 }}>
                    <Globe size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontSize: 14 }}>No clinics registered yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: 20 }}>
                    {clinics.slice(0, 6).map(c => (
                      <div key={c.id} style={{ padding: 16, background: T.surface, borderRadius: T.r.md, border: `1px solid ${T.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white, fontWeight: 800 }}>{(c.clinicName || c.name || 'C').charAt(0)}</div>
                          <StatusBadge status={c.subscriptionStatus || 'active'} />
                        </div>
                        <p style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{c.clinicName || c.name}</p>
                        <p style={{ fontSize: 11, color: T.ink4, marginTop: 2 }}>{c.domain}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ APPOINTMENTS TAB ═══ */}
          {activeTab === 'appointments' && (
            <div style={{ animation: 'fadeUp 0.4s ease both' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search by patient name or phone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    flex: 1, minWidth: 240, height: 44, padding: '0 16px',
                    background: T.white, border: `1px solid ${T.border}`,
                    borderRadius: T.r.sm, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                    color: T.ink, outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  {['all', 'pending', 'confirmed', 'completed'].map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      style={{
                        padding: '8px 16px', height: 36,
                        background: statusFilter === s ? T.primary : T.white,
                        color: statusFilter === s ? T.white : T.ink3,
                        border: `1px solid ${statusFilter === s ? T.primary : T.border}`,
                        borderRadius: T.r.sm, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        textTransform: 'capitalize',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Patient', 'Phone', 'Service', 'Date', 'Slot', 'Status', 'Actions'].map(h => <th key={h} style={tableHeaderStyle()}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: T.ink3, fontSize: 14 }}>No appointments found</td></tr>
                    ) : filteredAppointments.map(a => (
                      <tr key={a.id} style={tableRowStyle(a.id)}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: T.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary, fontWeight: 700, fontSize: 13 }}>{a.patient.charAt(0)}</div>
                            <p style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{a.patient}</p>
                          </div>
                        </td>
                        <td style={tableCellStyle}>{a.phone}</td>
                        <td style={{ padding: '14px 20px', fontSize: 13, color: T.ink2 }}>{a.service}</td>
                        <td style={tableCellStyle}>{a.date}</td>
                        <td style={tableCellStyle}>{a.slot}</td>
                        <td style={{ padding: '14px 20px' }}><StatusBadge status={a.status} /></td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {a.status === 'pending' && <ActionButton label="Confirm" onClick={() => updateAppointmentStatus(a.id, 'confirmed')} bg="#DBEAFE" color="#2563EB" />}
                            {a.status === 'confirmed' && <ActionButton label="Complete" onClick={() => updateAppointmentStatus(a.id, 'completed')} bg="#D1FAE5" color="#007AFF" />}
                            <ActionButton label="" onClick={() => setConfirmDialog({ title: 'Delete Appointment', message: 'This action cannot be undone.', onConfirm: () => deleteAppointment(a.id), onCancel: () => setConfirmDialog(null), confirmLabel: 'Delete', danger: true })} bg="#FEE2E2" color="#DC2626" icon={Trash2} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ CLINICS TAB ═══ */}
          {activeTab === 'clinics' && (
            <div style={{ animation: 'fadeUp 0.4s ease both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 20, color: T.ink }}>All Clinics ({clinics.length})</h2>
                <button
                  onClick={() => navigate('/saas/onboarding')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
                    color: T.white, border: 'none', borderRadius: T.r.sm,
                    padding: '10px 20px', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    boxShadow: `0 4px 16px rgba(0,122,255,0.3)`,
                  }}
                >
                  <Plus size={16} /> Onboard Clinic
                </button>
              </div>
              <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}><Loader2 size={28} className="animate-spin" style={{ color: T.primary }} /></div>
                ) : clinics.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: T.ink3 }}>
                    <Globe size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No clinics yet</p>
                    <p style={{ fontSize: 13 }}>Onboard your first clinic to get started.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>{['Clinic', 'Domain', 'Plan', 'Patients', 'Status', 'Actions'].map(h => <th key={h} style={tableHeaderStyle()}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {clinics.map(c => (
                        <tr key={c.id} style={tableRowStyle(c.id)}>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.white, fontWeight: 800 }}>{(c.clinicName || c.name || 'C').charAt(0)}</div>
                              <p style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{c.clinicName || c.name}</p>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: 13, color: T.primary, fontFamily: 'monospace' }}>{c.domain}</td>
                          <td style={tableCellStyle}>{c.plan || 'Free'}</td>
                          <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: T.ink }}>{c.patients || 0}</td>
                          <td style={{ padding: '14px 20px' }}><StatusBadge status={c.subscriptionStatus || 'active'} /></td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <ActionButton label="Visit" onClick={() => window.open(`https://${c.domain}`, '_blank')} bg={T.surface} color={T.ink3} icon={ExternalLink} />
                              <ActionButton label="Suspend" onClick={() => setConfirmDialog({ title: 'Suspend Clinic', message: 'Suspend this clinic? Their portal will be taken offline.', onConfirm: () => setConfirmDialog(null), onCancel: () => setConfirmDialog(null), confirmLabel: 'Suspend' })} bg="#FEF3C7" color="#D97706" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ═══ USERS TAB ═══ */}
          {activeTab === 'users' && (
            <div style={{ animation: 'fadeUp 0.4s ease both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 20, color: T.ink }}>User Management ({users.length})</h2>
              </div>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', maxWidth: 400, height: 44, padding: '0 16px',
                  background: T.white, border: `1px solid ${T.border}`,
                  borderRadius: T.r.sm, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                  color: T.ink, outline: 'none', marginBottom: 20,
                }}
              />
              <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => <th key={h} style={tableHeaderStyle()}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} style={tableRowStyle(u.id)}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%',
                              background: u.role === 'super_admin' ? `linear-gradient(135deg, #F59E0B, #D97706)` : `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: T.white, fontWeight: 800, fontSize: 14,
                            }}>
                              {u.name.split(' ').map(n => n.charAt(0)).slice(0, 2).join('')}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: 14, color: T.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                                {u.name}
                                {u.role === 'super_admin' && <Crown size={12} style={{ color: '#F59E0B' }} />}
                              </p>
                              <p style={{ fontSize: 11, color: T.ink4 }}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            color: u.role === 'super_admin' ? '#D97706' : T.primary,
                            background: u.role === 'super_admin' ? '#FEF3C7' : T.primaryLight,
                            padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase',
                          }}>
                            {u.role === 'super_admin' ? 'Super Admin' : 'Physio'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}><StatusBadge status={u.status} /></td>
                        <td style={tableCellStyle}>{u.joined}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {u.role !== 'super_admin' && (
                              <>
                                {u.status === 'pending' && <ActionButton label="Approve" onClick={() => setUsers(prev => prev.map(us => us.id === u.id ? { ...us, status: 'active' } : us))} bg="#D1FAE5" color="#007AFF" />}
                                <ActionButton label="Remove" onClick={() => setConfirmDialog({ title: 'Remove User', message: `Are you sure you want to remove ${u.name}? This cannot be undone.`, onConfirm: () => { setUsers(prev => prev.filter(us => us.id !== u.id)); setConfirmDialog(null); }, onCancel: () => setConfirmDialog(null), confirmLabel: 'Remove User', danger: true })} bg="#FEE2E2" color="#DC2626" icon={UserX} />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ SETTINGS TAB ═══ */}
          {activeTab === 'settings' && (
            <div style={{ animation: 'fadeUp 0.4s ease both', maxWidth: 600 }}>
              <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 20, color: T.ink, marginBottom: 24 }}>Platform Settings</h2>
              <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, padding: 28 }}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.ink2, marginBottom: 8 }}>Super Admin Email</label>
                  <input type="email" value="pakoladiya@gmail.com" readOnly style={{
                    width: '100%', height: 48, padding: '0 16px',
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: T.r.sm, fontSize: 14, color: T.ink,
                    fontFamily: "'DM Sans', sans-serif",
                  }} />
                  <p style={{ fontSize: 11, color: T.ink4, marginTop: 6 }}>Configure via <code>VITE_SUPER_ADMIN_EMAIL</code> env variable.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button style={{
                    padding: '10px 24px', background: T.primary, color: T.white,
                    border: 'none', borderRadius: T.r.sm, fontSize: 14, fontWeight: 700,
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    boxShadow: `0 4px 12px rgba(0,122,255,0.3)`,
                  }}>Save Changes</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
          confirmLabel={confirmDialog.confirmLabel}
          danger={confirmDialog.danger}
        />
      )}
    </div>
  );
}
