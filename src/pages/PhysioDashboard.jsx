import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import clinicConfig from '@/config/clinicConfig';
import { onAuth, signOut } from '@/firebase/auth';
import {
  CalendarCheck,
  Users,
  BarChart3,
  Settings,
  Clock,
  LogOut,
  Bell,
  ChevronRight,
  Video,
  Phone,
  Search,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Loader,
  Activity,
  TrendingUp,
  Wallet,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Save,
  AlertCircle,
  MessageCircle,
  Check,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_PATIENTS = [
  { id: 'p1', name: 'Rajesh Kumar', phone: '9876543210', age: 45, gender: 'Male', city: 'Surat', lastVisit: '2026-03-20', nextVisit: '2026-03-27', status: 'active', services: ['Initial Consultation'], soap: { subjective: 'Lower back pain for 3 weeks. No trauma. Pain 6/10.', objective: 'Lumbar ROM limited flexion 40°. Positive SLR 70°. Core weak.', assessment: 'Lumbar radiculopathy, likely disc bulge L4-L5.', plan: 'Core strengthening, McKenzie extension protocol, 6 sessions.' } },
  { id: 'p2', name: 'Priya Mehta', phone: '9876543211', age: 32, gender: 'Female', city: 'Surat', lastVisit: '2026-03-18', nextVisit: '2026-03-25', status: 'active', services: ['Follow-up Session'], soap: { subjective: 'Knee pain after running. Improving with exercises.', objective: 'Patellar tracking normal. Strength 4/5 quads.', assessment: 'Patellofemoral pain syndrome, improving.', plan: 'Continue quads strengthening, agility drills.' } },
  { id: 'p3', name: 'Amit Shah', phone: '9876543212', age: 55, gender: 'Male', city: 'Navsari', lastVisit: '2026-03-15', nextVisit: null, status: 'discharged', services: ['Report Review'], soap: { subjective: 'Post stroke recovery. Reviewed MRI.', objective: 'Left side hemiparesis. Ashworth 2.', assessment: 'Post-stroke spastic hemiparesis.', plan: 'Continue PT 3x/week. BOTOX consideration.' } },
  { id: 'p4', name: 'Sunita Desai', phone: '9876543213', age: 28, gender: 'Female', city: 'Surat', lastVisit: '2026-03-22', nextVisit: '2026-03-29', status: 'active', services: ['Initial Consultation'], soap: { subjective: 'Neck pain and headache. Office worker. 2 months.', objective: 'Cervical extension limited. Upper trapezius tight.', assessment: 'Tech neck / postural neck pain.', plan: 'Posture correction, cervical mobs, ergonomic advice.' } },
  { id: 'p5', name: 'Vikram Joshi', phone: '9876543214', age: 60, gender: 'Male', city: 'Surat', lastVisit: '2026-03-19', nextVisit: null, status: 'active', services: ['Follow-up Session'], soap: { subjective: 'Frozen shoulder, right. Stage 2.', objective: 'External rotation 20°, abduction 80°.', assessment: 'Adhesive capsulitis stage 2.', plan: 'Capsular stretching, intra-articular injection referral.' } },
];

const MOCK_APPOINTMENTS = [
  { id: 'b1', patient: 'Rajesh Kumar', time: '09:00 AM', duration: 45, status: 'completed', type: 'Initial Consultation', mode: 'zoom' },
  { id: 'b2', patient: 'Priya Mehta', time: '10:00 AM', duration: 30, status: 'in_progress', type: 'Follow-up Session', mode: 'zoom' },
  { id: 'b3', patient: 'Amit Shah', time: '11:00 AM', duration: 20, status: 'upcoming', type: 'Report Review', mode: 'meet' },
  { id: 'b4', patient: 'Sunita Desai', time: '12:00 PM', duration: 45, status: 'upcoming', type: 'Initial Consultation', mode: 'whatsapp' },
  { id: 'b5', patient: 'Vikram Joshi', time: '02:00 PM', duration: 30, status: 'upcoming', type: 'Follow-up Session', mode: 'zoom' },
  { id: 'b6', patient: 'Neha Patel', time: '03:00 PM', duration: 45, status: 'upcoming', type: 'Initial Consultation', mode: 'zoom' },
  { id: 'b7', patient: 'Ankit Shah', time: '04:00 PM', duration: 30, status: 'upcoming', type: 'Follow-up Session', mode: 'meet' },
];

const WEEKLY_DATA = [
  { day: 'Mon', patients: 6, revenue: 2400 },
  { day: 'Tue', patients: 8, revenue: 3200 },
  { day: 'Wed', patients: 5, revenue: 2000 },
  { day: 'Thu', patients: 9, revenue: 3600 },
  { day: 'Fri', patients: 7, revenue: 2800 },
  { day: 'Sat', patients: 4, revenue: 1600 },
  { day: 'Sun', patients: 0, revenue: 0 },
];

const STATUS_VARIANTS = { completed: 'success', in_progress: 'primary', upcoming: 'default', cancelled: 'error' };
const STATUS_LABELS = { completed: 'Done', in_progress: 'In Session', upcoming: 'Upcoming', cancelled: 'Cancelled' };
const TABS = ['Today', 'Patients', 'Slots', 'Analytics', 'Settings'];

// ─── Patient Modal ────────────────────────────────────────────────────────────
function PatientModal({ patient, onClose, onSave }) {
  const [soap, setSoap] = useState(patient?.soap || {});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    onSave({ ...patient, soap });
    setSaving(false);
    setEditing(false);
  };

  const updateSoap = (field, val) => setSoap((s) => ({ ...s, [field]: val }));

  if (!patient) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-background rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-semibold text-text-primary">{patient.name}</h2>
            <p className="text-xs text-text-secondary mt-0.5">{patient.gender}, {patient.age} yrs · {patient.city}</p>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors"><X size={20} /></button>
        </div>

        {/* Patient info */}
        <div className="px-5 py-4 border-b border-border">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Phone', value: patient.phone },
              { label: 'Last Visit', value: patient.lastVisit },
              { label: 'Next Visit', value: patient.nextVisit || 'Not scheduled' },
              { label: 'Status', value: patient.status },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-text-secondary uppercase tracking-wide">{label}</p>
                <p className="text-sm font-medium text-text-primary">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SOAP Notes */}
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">SOAP Notes</h3>
            {!editing ? (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}><Edit2 size={14} /> Edit</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X size={14} /> Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                  Save
                </Button>
              </div>
            )}
          </div>
          {[
            { key: 'subjective', label: 'S — Subjective', placeholder: "Patient's symptoms and history...", rows: 3 },
            { key: 'objective', label: 'O — Objective', placeholder: 'Clinical findings, ROM, strength...', rows: 3 },
            { key: 'assessment', label: 'A — Assessment', placeholder: 'Diagnosis and clinical reasoning...', rows: 2 },
            { key: 'plan', label: 'P — Plan', placeholder: 'Treatment plan and next steps...', rows: 3 },
          ].map(({ key, label, placeholder, rows }) => (
            <div key={key}>
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1 block">{label}</label>
              {editing ? (
                <textarea
                  value={soap[key] || ''}
                  onChange={(e) => updateSoap(key, e.target.value)}
                  placeholder={placeholder}
                  rows={rows}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary resize-none"
                />
              ) : (
                <p className={`text-sm text-text-primary ${!soap[key] ? 'italic text-text-secondary/60' : ''}`}>
                  {soap[key] || <span className="italic text-text-secondary/60">Not recorded</span>}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <Button variant="outline" fullWidth onClick={() => window.open(`tel:${patient.phone}`)}>
            <Phone size={15} /> Call Patient
          </Button>
          <Button fullWidth onClick={() => window.open(`https://wa.me/91${patient.phone.replace(/\D/g, '')}`, '_blank')}>
            <MessageCircle size={15} /> WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Slot Management ─────────────────────────────────────────────────────────
function SlotsTab({ clinicId }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [blocked, setBlocked] = useState(new Set());
  const [booked, setBooked] = useState(new Set(['09:00', '10:00', '14:00']));

  const dateStr = viewDate.toISOString().split('T')[0];
  const slots = useMemo(() => {
    const out = [];
    let [h, m] = clinicConfig.workingHours.start.split(':').map(Number);
    const [endH, endM] = clinicConfig.workingHours.end.split(':').map(Number);
    while (h < endH || (h === endH && m <= endM)) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      out.push(time);
      m += clinicConfig.slotDurationMinutes || 30;
      if (m >= 60) { h += Math.floor(m / 60); m %= 60; }
    }
    return out;
  }, []);

  const toggleBlock = (time) => {
    setBlocked((b) => {
      const n = new Set(b);
      n.has(time) ? n.delete(time) : n.add(time);
      return n;
    });
  };

  const prevDay = () => { const d = new Date(viewDate); d.setDate(d.getDate() - 1); setViewDate(d); };
  const nextDay = () => { const d = new Date(viewDate); d.setDate(d.getDate() + 1); setViewDate(d); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary">Manage Slots</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={prevDay}><ChevronLeft size={16} /></Button>
          <span className="text-sm font-medium text-text-primary min-w-[140px] text-center">
            {viewDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <Button variant="ghost" size="sm" onClick={nextDay}><ChevronRightIcon size={16} /></Button>
        </div>
      </div>
      <Card padding={false}>
        <div className="divide-y divide-border">
          {slots.map((time) => {
            const isBlocked = blocked.has(time);
            const isBooked = booked.has(time);
            return (
              <div key={time} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-text-primary w-16">{time}</span>
                <div className="flex gap-2">
                  <Badge variant={isBooked ? 'error' : isBlocked ? 'warning' : 'success'} size="sm">
                    {isBooked ? 'Booked' : isBlocked ? 'Blocked' : 'Available'}
                  </Badge>
                  {!isBooked && (
                    <button
                      onClick={() => toggleBlock(time)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${isBlocked ? 'border-success text-success hover:bg-success/10' : 'border-warning text-warning hover:bg-warning/10'}`}
                    >
                      {isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const totalPatients = MOCK_PATIENTS.filter((p) => p.status === 'active').length;
  const todayCount = MOCK_APPOINTMENTS.filter((a) => a.status !== 'cancelled').length;
  const weekRevenue = WEEKLY_DATA.reduce((s, d) => s + d.revenue, 0);
  const avgPatients = Math.round(WEEKLY_DATA.reduce((s, d) => s + d.patients, 0) / 6);

  const monthData = [
    { month: 'Oct', patients: 18, revenue: 7200 },
    { month: 'Nov', patients: 22, revenue: 8800 },
    { month: 'Dec', patients: 19, revenue: 7600 },
    { month: 'Jan', patients: 25, revenue: 10000 },
    { month: 'Feb', patients: 28, revenue: 11200 },
    { month: 'Mar', patients: 31, revenue: 12400 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Active Patients', value: totalPatients, icon: Users, color: clinicConfig.primaryColor },
          { label: 'Today\'s Sessions', value: todayCount, icon: CalendarCheck, color: clinicConfig.secondaryColor },
          { label: 'Weekly Revenue', value: `₹${(weekRevenue / 1000).toFixed(1)}k`, icon: Wallet, color: '#10b981' },
          { label: 'Avg Patients/Day', value: avgPatients, icon: TrendingUp, color: '#6366f1' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} padding={false} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                <Icon size={15} style={{ color }} />
              </div>
            </div>
            <p className="text-xl font-bold text-text-primary">{value}</p>
            <p className="text-xs text-text-secondary">{label}</p>
          </Card>
        ))}
      </div>

      {/* Weekly chart placeholder (simple bar visualization) */}
      <Card>
        <h3 className="font-semibold text-text-primary mb-4">This Week — Patients per Day</h3>
        <div className="flex items-end gap-2 h-32">
          {WEEKLY_DATA.map(({ day, patients }) => {
            const max = Math.max(...WEEKLY_DATA.map((d) => d.patients), 1);
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-text-primary">{patients}</span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${Math.max((patients / max) * 96, 4)}px`,
                    backgroundColor: clinicConfig.primaryColor,
                    opacity: 0.7 + (patients / max) * 0.3,
                  }}
                />
                <span className="text-xs text-text-secondary">{day}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Monthly trend */}
      <Card>
        <h3 className="font-semibold text-text-primary mb-4">Monthly Patient Volume</h3>
        <div className="space-y-2">
          {monthData.map(({ month, patients, revenue }) => (
            <div key={month} className="flex items-center gap-3">
              <span className="text-xs text-text-secondary w-8">{month}</span>
              <div className="flex-1 h-6 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full flex items-center justify-end pr-2 transition-all"
                  style={{
                    width: `${(patients / 35) * 100}%`,
                    backgroundColor: clinicConfig.primaryColor,
                    opacity: 0.8,
                  }}
                >
                  <span className="text-xs font-medium text-white">{patients}</span>
                </div>
              </div>
              <span className="text-xs text-text-secondary w-14 text-right">₹{(revenue / 1000).toFixed(0)}k</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <Card hover className="cursor-pointer border-dashed" onClick={() => navigate('/settings')}>
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${clinicConfig.primaryColor}15` }}
          >
            <Settings size={22} style={{ color: clinicConfig.primaryColor }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-text-primary">Clinic Settings</p>
            <p className="text-sm text-text-secondary">Logo, branding, photos, video mode & more</p>
          </div>
          <ChevronRight size={18} className="text-text-secondary" />
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-text-primary mb-3">Quick Info</h3>
        <div className="space-y-3">
          {[
            { label: 'Clinic', value: clinicConfig.clinicName },
            { label: 'Physio', value: clinicConfig.physioName },
            { label: 'Video Mode', value: clinicConfig.videoMode === 'zoom' ? 'Zoom Meeting' : 'WhatsApp Video' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-text-secondary uppercase tracking-wide">{label}</span>
              <span className="text-sm font-medium text-text-primary">{value}</span>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          fullWidth
          className="mt-4"
          onClick={() => navigate('/settings')}
        >
          <Settings size={14} /> Edit in Settings
        </Button>
      </Card>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function PhysioDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Today');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);

  useEffect(() => {
    const unsub = onAuth((u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) navigate('/dashboard-login');
    });
    return unsub;
  }, [navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handlePatientSave = (updated) => {
    setSelectedPatient(null);
  };

  const filteredPatients = MOCK_PATIENTS.filter((p) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.phone.includes(patientSearch) ||
    p.city.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handleStartSession = (apt) => {
    setAppointments((list) => list.map((a) => a.id === apt.id ? { ...a, status: 'in_progress' } : a));
  };

  const handleEndSession = (apt) => {
    setAppointments((list) => list.map((a) => a.id === apt.id ? { ...a, status: 'completed' } : a));
  };

  if (authLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageWrapper>
    );
  }

  if (!user) return null;

  const todayApts = appointments.filter((a) => a.status !== 'cancelled');
  const completedToday = todayApts.filter((a) => a.status === 'completed').length;
  const stats = [
    { label: "Today's Sessions", value: todayApts.length, icon: CalendarCheck, color: clinicConfig.primaryColor },
    { label: 'Completed', value: completedToday, icon: Activity, color: '#10b981' },
    { label: 'Active Patients', value: MOCK_PATIENTS.filter((p) => p.status === 'active').length, icon: Users, color: '#6366f1' },
    { label: 'This Week', value: '39', icon: TrendingUp, color: clinicConfig.secondaryColor },
  ];

  return (
    <PageWrapper>
      {selectedPatient && (
        <PatientModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} onSave={handlePatientSave} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut size={16} /> Sign Out
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} padding={false} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                <Icon size={15} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className="text-xs text-text-secondary">{label}</p>
          </Card>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-surface rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-background text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Today */}
      {activeTab === 'Today' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-text-primary">Today's Schedule</h2>
            <span className="text-xs text-text-secondary">{todayApts.length} appointments</span>
          </div>
          {todayApts.length === 0 ? (
            <Card className="text-center py-8">
              <Calendar size={32} className="text-text-secondary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">No appointments today.</p>
            </Card>
          ) : (
            todayApts.map((apt) => (
              <Card key={apt.id} hover className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                    style={{ backgroundColor: apt.status === 'completed' ? '#10b981' : clinicConfig.primaryColor }}
                  >
                    {apt.patient.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{apt.patient}</p>
                    <p className="text-xs text-text-secondary">{apt.time} · {apt.duration} min · {apt.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANTS[apt.status]} size="sm">
                    {STATUS_LABELS[apt.status]}
                  </Badge>
                  {apt.status === 'upcoming' && (
                    <Button variant="outline" size="sm" onClick={() => handleStartSession(apt)}>
                      <Video size={13} /> Start
                    </Button>
                  )}
                  {apt.status === 'in_progress' && (
                    <Button size="sm" onClick={() => handleEndSession(apt)}>
                      End Session
                    </Button>
                  )}
                  {apt.status !== 'in_progress' && (
                    <button onClick={() => setSelectedPatient(MOCK_PATIENTS.find((p) => p.name === apt.patient))} className="text-xs text-primary hover:underline ml-1">
                      View
                    </button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab: Patients */}
      {activeTab === 'Patients' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            <input
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Search patients by name, phone, or city..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border bg-surface text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            {filteredPatients.map((patient) => (
              <Card key={patient.id} hover className="flex items-center justify-between cursor-pointer" onClick={() => setSelectedPatient(patient)}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                    style={{ backgroundColor: clinicConfig.primaryColor }}
                  >
                    {patient.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{patient.name}</p>
                    <p className="text-xs text-text-secondary">{patient.gender}, {patient.age} · {patient.city} · Last: {patient.lastVisit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={patient.status === 'active' ? 'success' : 'default'} size="sm">
                    {patient.status}
                  </Badge>
                  <ChevronRight size={16} className="text-text-secondary" />
                </div>
              </Card>
            ))}
          </div>
          {filteredPatients.length === 0 && (
            <div className="text-center py-8">
              <Users size={32} className="text-text-secondary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">No patients found.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Slots */}
      {activeTab === 'Slots' && <SlotsTab clinicId={clinicConfig.clinicId} />}

      {/* Tab: Analytics */}
      {activeTab === 'Analytics' && <AnalyticsTab />}

      {/* Tab: Settings */}
      {activeTab === 'Settings' && <SettingsTab />}
    </PageWrapper>
  );
}
