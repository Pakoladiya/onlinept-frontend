import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { onAuth, signOut } from '@/firebase/auth';
import { getPhysioBookings, getPhysioPatients, blockSlot } from '@/firebase/db';
import clinicConfig from '@/config/clinicConfig';
import { isSuperAdminEmail } from '@/config/superAdminConfig';
import {
  Settings, Clock, LogOut, ChevronRight, Video, Search, X,
  Loader2, Calendar, ShieldCheck, ChevronLeft,
  Users, CalendarCheck, TrendingUp, UserCheck,
  BarChart3, MessageSquare, Crown,
} from 'lucide-react';

// ─── iOS Design Tokens ──────────────────────────────────────────────────────────
const T = {
  primary: '#007AFF',
  primaryDark: '#0055CC',
  primaryLight: '#E8F1FF',
  accent: '#5AC8FA',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9F0A',
  surface: '#F5F5F7',
  surface2: '#E5E5EA',
  white: '#FFFFFF',
  ink: '#1D1D1F',
  ink2: '#3A3A3C',
  ink3: '#636366',
  ink4: '#AEAEB2',
  border: 'rgba(0,0,0,0.08)',
  glass: 'rgba(255,255,255,0.85)',
  blur: 'blur(20px)',
  r: { sm: 10, md: 16, lg: 24, xl: 32 },
};

const TABS = ['Overview', 'Patients', 'Schedule', 'Insights'];

const BLOCK_REASONS = ['Lunch Break', 'Personal Time', 'Emergency Leave', 'Admin / Documentation', 'Weekly Off'];

// ─── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div style={{
      background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`,
      padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: T.primaryLight,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p style={{
          fontFamily: "'Manrope', sans-serif", fontSize: 28, fontWeight: 800,
          color: T.ink, lineHeight: 1, letterSpacing: '-0.5px',
        }}>
          {value ?? '—'}
        </p>
        <p style={{ fontSize: 12, fontWeight: 500, color: T.ink3, marginTop: 4 }}>{label}</p>
      </div>
    </div>
  );
}

// ─── Patient Card ──────────────────────────────────────────────────────────────
function PatientCard({ patient, onClick }) {
  const initials = (patient.name || 'P').charAt(0).toUpperCase();
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', background: T.white, borderRadius: T.r.lg,
        border: `1px solid ${T.border}`, padding: 16,
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer', textAlign: 'left',
        transition: 'transform 0.15s, box-shadow 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; e.currentTarget.style.boxShadow = 'none'; }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16, fontWeight: 800, color: '#fff' }}>
          {initials}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 700, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {patient.name || 'Patient'}
        </p>
        <p style={{ fontSize: 11, color: T.ink3, marginTop: 2 }}>
          {patient.city || '—'} · {patient.age ? `${patient.age} yrs` : '—'}
        </p>
      </div>
      <ChevronRight size={16} style={{ color: T.ink4, flexShrink: 0 }} />
    </button>
  );
}

// ─── Booking Row ───────────────────────────────────────────────────────────────
function BookingRow({ booking }) {
  const isBlocked = booking.status === 'blocked';
  return (
    <div style={{
      background: isBlocked ? '#FEF2F2' : T.white,
      borderRadius: T.r.md, border: `1px solid ${isBlocked ? '#FECACA' : T.border}`,
      padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: isBlocked ? '#FEE2E2' : T.primaryLight,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {isBlocked
          ? <ShieldCheck size={18} style={{ color: T.red }} />
          : <CalendarCheck size={18} style={{ color: T.primary }} />
        }
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: isBlocked ? '#991B1B' : T.ink }}>
          {booking.patientName || booking.patient || (isBlocked ? booking.reason : 'Booking')}
        </p>
        <p style={{ fontSize: 11, color: T.ink3, marginTop: 2 }}>
          {booking.slotLabel || booking.slot || '—'} · {booking.serviceName || booking.type || 'Session'}
        </p>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700,
        color: isBlocked ? T.red : T.green,
        background: isBlocked ? '#FEE2E2' : '#D1FAE5',
        padding: '3px 8px', borderRadius: 20,
        textTransform: 'uppercase', letterSpacing: '0.3px',
      }}>
        {isBlocked ? 'Blocked' : (booking.status || 'Active')}
      </span>
    </div>
  );
}

// ─── Monthly Calendar (iOS Style) ──────────────────────────────────────────────
function CalendarView({ bookings, month, onDayClick, selectedDay }) {
  const today = new Date();

  const calData = useMemo(() => {
    const year = month.getFullYear();
    const monthIdx = month.getMonth();
    const firstDay = new Date(year, monthIdx, 1).getDay();
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, monthIdx, 0).getDate();

    const bookingMap = {};
    (bookings || []).forEach(b => {
      const d = b.date instanceof Date
        ? b.date.toISOString().split('T')[0]
        : String(b.date || '').split('T')[0];
      bookingMap[d] = (bookingMap[d] || 0) + 1;
    });

    const todayStr = today.toISOString().split('T')[0];

    const cells = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: daysInPrevMonth - i, otherMonth: true, date: null, dow: (7 - i) % 7, isPast: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = (firstDay + d - 1) % 7;
      const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = today.getFullYear() === year && today.getMonth() === monthIdx && today.getDate() === d;
      const isPast = dateStr < todayStr;
      cells.push({ day: d, otherMonth: false, date: dateStr, isToday, isPast, count: bookingMap[dateStr] || 0, dow });
    }
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, otherMonth: true, date: null, dow: (firstDay + daysInMonth + d - 1) % 7, isPast: false });
    }
    return cells;
  }, [month, bookings]);

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{
      background: T.white,
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    }}>
      {/* iOS-style header — month name only, navigation handled externally */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '20px 16px 12px',
      }}>
        <div style={{ width: 28, flexShrink: 0 }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h3 style={{
            fontFamily: "'-apple-system', 'SF Pro Display', system-ui, sans-serif",
            fontSize: 17, fontWeight: 600, color: T.ink,
            letterSpacing: '-0.2px',
          }}>
            {MONTH_NAMES[month.getMonth()]} {month.getFullYear()}
          </h3>
        </div>
        <div style={{ width: 28, flexShrink: 0 }} />
      </div>

      {/* iOS day names — no border, orange for weekends */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        padding: '0 8px',
      }}>
        {DAY_NAMES.map(d => {
          const isWeekend = d === 'Sat' || d === 'Sun';
          return (
            <div key={d} style={{
              textAlign: 'center',
              fontSize: 11, fontWeight: 500,
              color: isWeekend ? '#FF9500' : T.ink3,
              fontFamily: "'-apple-system', 'SF Pro Text', system-ui, sans-serif",
              padding: '6px 0 8px',
              letterSpacing: '0.3px',
            }}>
              {d}
            </div>
          );
        })}
      </div>

      {/* iOS calendar grid — no visible grid lines, week rows separated by subtle bg */}
      <div style={{ padding: '0 8px 16px' }}>
        {([0,1,2,3,4,5]).map(week => {
          const weekCells = calData.slice(week * 7, week * 7 + 7);
          return (
            <div key={week} style={{
              display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
              marginBottom: 2,
            }}>
              {weekCells.map((cell, i) => {
                const isSelected = selectedDay && cell.date === selectedDay;
                const isWeekend = cell.dow === 0 || cell.dow === 6;
                const cellSize = 38;
                return (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    height: cellSize, position: 'relative',
                  }}>
                    <button
                      onClick={() => {
                        if (cell.otherMonth || !cell.date || cell.isPast) return;
                        onDayClick && onDayClick(cell.date);
                      }}
                      disabled={cell.otherMonth || !cell.date || cell.isPast}
                      style={{
                        width: cellSize, height: cellSize,
                        borderRadius: '50%',
                        border: 'none', cursor: cell.otherMonth || cell.isPast ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent',
                        transition: 'background 0.15s',
                        position: 'relative',
                        padding: 0,
                      }}
                      onMouseEnter={e => {
                        if (!isSelected && !cell.isToday && !cell.otherMonth && !cell.isPast) {
                          e.currentTarget.style.background = T.surface;
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected && !cell.isToday && !cell.otherMonth && !cell.isPast) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {/* Today ring */}
                      {cell.isToday && !isSelected && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          borderRadius: '50%',
                          border: `2px solid ${T.primary}`,
                        }} />
                      )}
                      <span style={{
                        fontSize: 15, fontWeight: 500,
                        fontFamily: "'-apple-system', 'SF Pro Text', system-ui, sans-serif",
                        color: isSelected
                          ? '#fff'
                          : cell.otherMonth
                            ? T.ink4
                            : cell.isPast
                              ? '#C7C7CC'
                              : cell.isToday
                                ? T.primary
                                : isWeekend
                                  ? '#FF9500'
                                : T.ink,
                        lineHeight: 1,
                        zIndex: 1,
                      }}>
                        {cell.day}
                      </span>
                      {/* Selected fill */}
                      {isSelected && (
                        <div style={{
                          position: 'absolute', inset: 2,
                          borderRadius: '50%',
                          background: T.primary,
                        }} />
                      )}
                    </button>
                    {/* Booking dot */}
                    {cell.count > 0 && !isSelected && (
                      <div style={{
                        position: 'absolute', bottom: 3,
                        width: 4, height: 4, borderRadius: 2,
                        background: T.primary,
                      }} />
                    )}
                    {cell.count > 0 && isSelected && (
                      <div style={{
                        position: 'absolute', bottom: 3,
                        width: 4, height: 4, borderRadius: 2,
                        background: '#fff',
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Pill Button ────────────────────────────────────────────────────────────────
function PillTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 20,
        border: 'none', cursor: 'pointer',
        fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
        background: active ? T.primary : 'transparent',
        color: active ? '#fff' : T.ink3,
        transition: 'background 0.2s, color 0.2s',
      }}
    >
      {label}
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PhysioDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [bookings, setBookings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockLoading, setBlockLoading] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());
  const [calDay, setCalDay] = useState(null);

  useEffect(() => {
    const unsub = onAuth(async (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) { navigate('/dashboard-login'); return; }

      setDataLoading(true);
      try {
        const [loadedBookings, loadedPatients] = await Promise.all([
          getPhysioBookings(u.uid),
          getPhysioPatients(u.uid),
        ]);
        setBookings(loadedBookings || []);
        setPatients(loadedPatients || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setDataLoading(false);
      }
    });
    return unsub;
  }, [navigate]);

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.surface }}>
        <Loader2 size={24} className="animate-spin" style={{ color: T.primary }} />
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const isSuper = isSuperAdminEmail(user?.email);

  // Redirect super admin to SaaS dashboard
  useEffect(() => {
    if (isSuper) navigate('/saas/dashboard');
  }, [isSuper, navigate]);

  const todayBookings = bookings.filter(b => {
    const bDate = b.date instanceof Date
      ? b.date.toISOString().split('T')[0]
      : String(b.date || '').split('T')[0];
    return bDate === today;
  });
  const upcomingBookings = todayBookings.filter(b => b.status === 'upcoming' || b.status === 'pending');
  const nextApt = upcomingBookings[0];

  const filteredPatients = patients.filter(p =>
    !patientSearch ||
    (p.name || '').toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.phone || '').includes(patientSearch)
  );

  async function handleBlockSlot() {
    if (!blockReason || !user) return;
    setBlockLoading(true);
    try {
      await blockSlot(user.uid, today, { reason: blockReason, status: 'blocked' });
      setBlockModalOpen(false);
      setBlockReason('');
    } catch (err) {
      console.error('Failed to block slot:', err);
    }
    setBlockLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: none; } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes scaleIn { from { opacity:0; transform: scale(0.96); } to { opacity:1; transform: scale(1); } }
      `}</style>

      {/* ── Sticky Header ────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: logo + greeting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 800, color: T.ink, lineHeight: 1.1 }}>
                  Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, Dr. {clinicConfig.physioName}
                </p>
                {isSuper && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: '#fff', padding: '2px 8px', borderRadius: 20,
                    fontSize: 10, fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(245,158,11,0.4)',
                  }}>
                    <Crown size={10} />
                    Super Admin
                  </div>
                )}
              </div>
              <p style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>● OnlinePT Active</p>
            </div>
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => navigate('/settings')}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: T.surface, border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.surface2}
              onMouseLeave={e => e.currentTarget.style.background = T.surface}
              title="Settings"
            >
              <Settings size={16} style={{ color: T.ink3 }} />
            </button>
            <button
              onClick={() => navigate('/admin')}
              style={{
                height: 36, padding: '0 14px',
                background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: `0 2px 8px ${T.primary}30`,
                transition: 'transform 0.15s',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              title="Edit My Page"
            >
              <Settings size={13} />
              Edit Page
            </button>
            <button
              onClick={async () => { await signOut(); navigate('/'); }}
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: T.surface, border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
              onMouseLeave={e => e.currentTarget.style.background = T.surface}
              title="Sign Out"
            >
              <LogOut size={15} style={{ color: T.ink3 }} />
            </button>
          </div>
        </div>

        {/* ── Pill Tab Bar ───────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 12px', display: 'flex', gap: 4 }}>
          {TABS.map(tab => (
            <PillTab key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
          ))}
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        {/* ── OVERVIEW TAB ───────────────────────────────────────────────────── */}
        {activeTab === 'Overview' && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
              <StatCard label="Today Sessions" value={todayBookings.length} icon={Calendar} color={T.primary} />
              <StatCard label="Active Patients" value={patients.length} icon={UserCheck} color={T.green} />
              <StatCard label="Upcoming" value={upcomingBookings.length} icon={Clock} color={T.orange} />
              <StatCard label="Total Bookings" value={bookings.length} icon={TrendingUp} color="#7C3AED" />
            </div>

            {/* Next Up Hero + Queue */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
              {/* Next Appointment Card */}
              <div style={{
                background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
                borderRadius: T.r.xl, padding: 28,
                position: 'relative', overflow: 'hidden',
                boxShadow: `0 8px 32px ${T.primary}30`,
              }}>
                {/* Background decoration */}
                <div style={{
                  position: 'absolute', right: -20, top: -20,
                  width: 180, height: 180, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                }} />
                <div style={{
                  position: 'absolute', right: 40, bottom: -40,
                  width: 120, height: 120, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                }} />

                {nextApt ? (
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: '#fff', animation: 'pulse 2s infinite' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Next Appointment
                      </span>
                    </div>

                    <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {nextApt.serviceName || 'Consultation'}
                    </p>
                    <h2 style={{
                      fontFamily: "'Manrope', sans-serif",
                      fontSize: 36, fontWeight: 800, color: '#fff',
                      letterSpacing: '-0.5px', lineHeight: 1.1,
                      marginBottom: 12,
                    }}>
                      {nextApt.patientName || 'Patient'}
                    </h2>

                    <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{nextApt.slotLabel || nextApt.slot || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Video size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                          {nextApt.videoMode === 'zoom' ? 'Zoom' : nextApt.videoMode === 'meet' ? 'Google Meet' : 'WhatsApp'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button style={{
                        height: 44, padding: '0 20px',
                        background: T.white, color: T.primary,
                        border: 'none', borderRadius: 22,
                        fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        transition: 'transform 0.15s',
                      }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Video size={14} /> Join Now
                      </button>
                      <button style={{
                        height: 44, padding: '0 20px',
                        background: 'rgba(255,255,255,0.15)', color: '#fff',
                        border: '1px solid rgba(255,255,255,0.25)', borderRadius: 22,
                        fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                      >
                        <MessageSquare size={14} /> Message
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '20px 0' }}>
                    <Calendar size={48} style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 12 }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                      No upcoming appointments today
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                      Enjoy your day — or share your booking link with patients
                    </p>
                  </div>
                )}
              </div>

              {/* Patient Queue */}
              <div style={{
                background: T.white, borderRadius: T.r.lg,
                border: `1px solid ${T.border}`, padding: 20,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 700, color: T.ink }}>
                    Patient Queue
                  </h3>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: T.primary,
                    background: T.primaryLight, padding: '3px 10px', borderRadius: 20,
                  }}>
                    {upcomingBookings.length} today
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {upcomingBookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: T.ink4 }}>
                      <Users size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
                      <p style={{ fontSize: 12, fontWeight: 500 }}>No patients in queue</p>
                    </div>
                  ) : (
                    upcomingBookings.slice(0, 6).map((apt, i) => (
                      <button
                        key={apt.id || i}
                        onClick={() => {
                          const p = patients.find(pt => pt.id === apt.patientId);
                          if (p) setSelectedPatient(p);
                        }}
                        style={{
                          width: '100%', background: T.surface, borderRadius: T.r.md,
                          border: `1px solid ${T.border}`, padding: '10px 12px',
                          display: 'flex', alignItems: 'center', gap: 10,
                          cursor: 'pointer', textAlign: 'left',
                          transition: 'transform 0.15s, background 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = T.surface2; e.currentTarget.style.transform = 'translateX(2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.transform = 'translateX(0)'; }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: T.primaryLight,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: T.primary }}>
                            {(apt.patientName || 'P')[0]}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {apt.patientName || 'Patient'}
                          </p>
                          <p style={{ fontSize: 10, color: T.ink3 }}>{apt.slotLabel || apt.slot || '—'}</p>
                        </div>
                        <ChevronRight size={13} style={{ color: T.ink4 }} />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PATIENTS TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'Patients' && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            {/* Search Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: T.white, borderRadius: T.r.md,
              border: `1px solid ${T.border}`, padding: '0 16px',
              marginBottom: 20, height: 52,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <Search size={18} style={{ color: T.ink4 }} />
              <input
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
                placeholder="Search patients by name or phone..."
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                  color: T.ink, background: 'transparent',
                }}
              />
              {patientSearch && (
                <button onClick={() => setPatientSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  <X size={16} style={{ color: T.ink4 }} />
                </button>
              )}
            </div>

            {/* Patient Grid */}
            {dataLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <Loader2 size={24} className="animate-spin" style={{ color: T.primary }} />
              </div>
            ) : filteredPatients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: T.ink4 }}>
                <Users size={48} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                  {patientSearch ? 'No patients found' : 'No patients yet'}
                </p>
                <p style={{ fontSize: 13, color: T.ink3 }}>
                  {patientSearch ? 'Try a different search term' : 'Patient records will appear here after bookings'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {filteredPatients.map(p => (
                  <PatientCard
                    key={p.id}
                    patient={p}
                    onClick={() => setSelectedPatient(p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SCHEDULE TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'Schedule' && (
          <div style={{ animation: 'fadeUp 0.3s ease', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
            {/* Monthly Calendar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Month Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: T.white, border: `1px solid ${T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surface}
                  onMouseLeave={e => e.currentTarget.style.background = T.white}
                >
                  <ChevronLeft size={16} style={{ color: T.ink2 }} />
                </button>
                <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16, fontWeight: 800, color: T.ink }}>
                  {['January','February','March','April','May','June','July','August','September','October','November','December'][calMonth.getMonth()]} {calMonth.getFullYear()}
                </h3>
                <button
                  onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: T.white, border: `1px solid ${T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surface}
                  onMouseLeave={e => e.currentTarget.style.background = T.white}
                >
                  <ChevronRight size={16} style={{ color: T.ink2 }} />
                </button>
              </div>
              <CalendarView
                bookings={bookings}
                month={calMonth}
                selectedDay={calDay}
                onDayClick={setCalDay}
              />
            </div>

            {/* Day's Slots */}
            <div style={{
              background: T.white, borderRadius: T.r.lg,
              border: `1px solid ${T.border}`, padding: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 700, color: T.ink }}>
                  {calDay
                    ? new Date(calDay).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : "Today's Slots"}
                </h3>
                <button
                  onClick={() => setBlockModalOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 20,
                    border: `1px solid ${T.border}`, background: T.surface,
                    fontSize: 11, fontWeight: 600, color: T.ink2,
                    fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#FECACA'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.borderColor = T.border; }}
                >
                  <ShieldCheck size={12} style={{ color: T.red }} />
                  Block Slot
                </button>
              </div>

              {dataLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                  <Loader2 size={20} className="animate-spin" style={{ color: T.primary }} />
                </div>
              ) : (() => {
                const dayBookings = calDay
                  ? bookings.filter(b => {
                      const d = b.date instanceof Date
                        ? b.date.toISOString().split('T')[0]
                        : String(b.date || '').split('T')[0];
                      return d === calDay;
                    })
                  : todayBookings;
                return dayBookings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: T.ink4 }}>
                    <CalendarCheck size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <p style={{ fontSize: 12, fontWeight: 500 }}>
                      {calDay ? 'No bookings on this day' : 'No bookings for today'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {dayBookings.map(apt => (
                      <BookingRow key={apt.id} booking={apt} />
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── INSIGHTS TAB ───────────────────────────────────────────────────── */}
        {activeTab === 'Insights' && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {[
                {
                  icon: TrendingUp,
                  color: T.primary,
                  bg: T.primaryLight,
                  title: 'Growth Analytics',
                  desc: 'Revenue, patient trends, and practice growth metrics — all in one view.',
                  soon: 'Charts and reports coming soon',
                },
                {
                  icon: BarChart3,
                  color: '#7C3AED',
                  bg: '#EDE9FE',
                  title: 'Recovery Insights',
                  desc: 'Track treatment outcomes and patient recovery progress over time.',
                  soon: 'Outcome tracking coming soon',
                },
              ].map((card, i) => (
                <div key={i} style={{
                  background: T.white,
                  borderRadius: 18,
                  border: `1px solid ${T.border}`,
                  overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                }}>
                  {/* iOS-style card header */}
                  <div style={{
                    padding: '20px 20px 0',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: card.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <card.icon size={22} style={{ color: card.color }} />
                    </div>
                    <div>
                      <h3 style={{
                        fontFamily: "'-apple-system', 'SF Pro Display', system-ui, sans-serif",
                        fontSize: 17, fontWeight: 600, color: T.ink,
                      }}>
                        {card.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ padding: '12px 20px' }}>
                    <p style={{
                      fontSize: 13, color: T.ink3,
                      fontFamily: "'-apple-system', 'SF Pro Text', system-ui, sans-serif",
                      lineHeight: 1.5,
                    }}>
                      {card.desc}
                    </p>
                  </div>

                  {/* Placeholder chart area */}
                  <div style={{
                    margin: '0 20px 20px',
                    background: T.surface,
                    borderRadius: 12,
                    height: 120,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 6,
                  }}>
                    <div style={{
                      display: 'flex', gap: 6, alignItems: 'flex-end',
                    }}>
                      {[40, 65, 45, 80, 55, 90, 70].map((h, j) => (
                        <div key={j} style={{
                          width: 24, height: h,
                          background: `linear-gradient(180deg, ${card.color}40, ${card.color}20)`,
                          borderRadius: '4px 4px 0 0',
                        }} />
                      ))}
                    </div>
                    <p style={{
                      fontSize: 11, color: T.ink4, fontWeight: 500,
                      fontFamily: "'-apple-system', 'SF Pro Text', system-ui, sans-serif",
                      marginTop: 4,
                    }}>
                      {card.soon}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Patient Detail Modal ─────────────────────────────────────────────── */}
      {selectedPatient && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setSelectedPatient(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', animation: 'fadeIn 0.2s ease' }}
          />

          {/* Modal */}
          <div style={{
            position: 'relative', zIndex: 1,
            background: T.white, borderRadius: T.r.xl,
            width: '100%', maxWidth: 480,
            maxHeight: '85vh', overflowY: 'auto',
            animation: 'scaleIn 0.25s ease',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
          }}>
            {/* Header */}
            <div style={{
              padding: '24px 24px 0',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 22, fontWeight: 800, color: '#fff' }}>
                    {(selectedPatient.name || 'P')[0]}
                  </span>
                </div>
                <div>
                  <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 20, fontWeight: 800, color: T.ink }}>
                    {selectedPatient.name}
                  </h2>
                  <p style={{ fontSize: 12, color: T.ink3, marginTop: 2 }}>
                    {selectedPatient.city || '—'} · {selectedPatient.age ? `${selectedPatient.age} yrs` : '—'} · {selectedPatient.gender || '—'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: T.surface, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.background = T.surface}
              >
                <X size={16} style={{ color: T.ink3 }} />
              </button>
            </div>

            {/* Info Cards */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{
                  background: T.surface, borderRadius: T.r.md,
                  padding: 14, border: `1px solid ${T.border}`,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: T.ink3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Phone</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{selectedPatient.phone || '—'}</p>
                </div>
                <div style={{
                  background: T.surface, borderRadius: T.r.md,
                  padding: 14, border: `1px solid ${T.border}`,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: T.ink3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Status</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: T.green }}>{selectedPatient.status || 'Active'}</p>
                </div>
              </div>

              {/* SOAP Notes */}
              <div style={{
                background: T.surface, borderRadius: T.r.md,
                padding: 16, border: `1px solid ${T.border}`,
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.ink2, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                  SOAP Notes
                </p>
                {['Subjective', 'Objective', 'Assessment', 'Plan'].map(key => (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: T.ink3, textTransform: 'uppercase', marginBottom: 2 }}>{key}</p>
                    <p style={{ fontSize: 13, color: T.ink2, lineHeight: 1.5 }}>
                      {(selectedPatient.soap?.[key.toLowerCase()] || 'No notes recorded yet')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Block Slot Modal ─────────────────────────────────────────────────── */}
      {blockModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div
            onClick={() => { setBlockModalOpen(false); setBlockReason(''); }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', animation: 'fadeIn 0.2s ease' }}
          />

          <div style={{
            position: 'relative', zIndex: 1,
            background: T.white, borderRadius: T.r.xl,
            width: '100%', maxWidth: 420,
            animation: 'scaleIn 0.25s ease',
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#FEF2F2', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <ShieldCheck size={22} style={{ color: T.red }} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 17, fontWeight: 800, color: T.ink, marginBottom: 4 }}>
                  Block a Time Slot
                </h3>
                <p style={{ fontSize: 12, color: T.ink3, lineHeight: 1.4 }}>
                  This will mark the slot as unavailable for all patients.
                </p>
              </div>
              <button
                onClick={() => { setBlockModalOpen(false); setBlockReason(''); }}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: T.surface, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={14} style={{ color: T.ink3 }} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.ink2, marginBottom: 8 }}>
                Reason for blocking
              </label>
              <select
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                style={{
                  width: '100%', height: 48, padding: '0 14px',
                  background: T.surface, border: `1.5px solid ${T.border}`,
                  borderRadius: T.r.md, fontSize: 14,
                  fontFamily: "'DM Sans', sans-serif", color: T.ink,
                  outline: 'none', cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = T.primary}
                onBlur={e => e.target.style.borderColor = T.border}
              >
                <option value="">Select a reason...</option>
                {BLOCK_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setBlockModalOpen(false); setBlockReason(''); }}
                style={{
                  flex: 1, height: 48, borderRadius: T.r.md,
                  border: `1.5px solid ${T.border}`, background: T.white,
                  fontSize: 14, fontWeight: 600, color: T.ink2,
                  fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBlockSlot}
                disabled={!blockReason || blockLoading}
                style={{
                  flex: 1, height: 48, borderRadius: T.r.md,
                  border: 'none',
                  background: !blockReason ? T.surface2 : T.red,
                  color: !blockReason ? T.ink4 : '#fff',
                  fontSize: 14, fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: !blockReason ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.15s, transform 0.15s',
                  boxShadow: !blockReason ? 'none' : `0 4px 12px rgba(255,59,48,0.3)`,
                }}
                onMouseDown={e => { if (blockReason) e.currentTarget.style.transform = 'scale(0.98)'; }}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {blockLoading ? <Loader2 size={16} className="animate-spin" /> : 'Block Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
