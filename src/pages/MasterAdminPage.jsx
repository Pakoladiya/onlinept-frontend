import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuth } from '@/firebase/auth';
import { signOut } from '@/firebase/auth';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  LayoutDashboard, LogOut, Users, Shield,
  Search, CheckCircle2, Clock,
  Globe, Loader2, AlertTriangle,
  Ban, CreditCard, Activity, Calendar
} from 'lucide-react';

const ADMIN_EMAIL = 'pakoladiya@gmail.com';

function getStatusBadge(clinic) {
  const status = clinic.subscriptionStatus === 'pending_approval' ? 'pending_approval' : clinic.status;
  if (status === 'pending_approval') return <Badge style={{ backgroundColor: '#fef08a', color: '#854d0e', borderColor: '#fde047' }} size="sm">Pending Approval</Badge>;
  if (status === 'deactivated') return <Badge variant="error" size="sm">Deactivated</Badge>;
  if (status === 'active' || clinic.subscriptionStatus === 'active') return <Badge variant="success" size="sm">Active</Badge>;
  if (status === 'trial') {
    const ends = clinic.trialEndsAt ? new Date(clinic.trialEndsAt) : null;
    const daysLeft = ends ? Math.ceil((ends - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
    if (daysLeft <= 0) return <Badge variant="error" size="sm">Trial Expired</Badge>;
    return <Badge variant="warning" size="sm">{daysLeft}d left</Badge>;
  }
  if (status === 'expired') return <Badge variant="error" size="sm">Expired</Badge>;
  return <Badge variant="secondary" size="sm">{status || 'Unknown'}</Badge>;
}

function getDaysLeft(trialEndsAt) {
  if (!trialEndsAt) return null;
  const ends = new Date(trialEndsAt);
  return Math.ceil((ends - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MasterAdminPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState([]);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [activeTab, setActiveTab] = useState('clinics'); // 'clinics' or 'transactions'
  const [recentBookings, setRecentBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

    const unsub = onAuth(async (u) => {
      if (!u || u.email !== ADMIN_EMAIL) {
        navigate('/');
        return;
      }
      setUser(u);
      
      // Load Data
      fetchClinics();
      fetchRecentBookings();
    });
    return unsub;
  }, []);

  async function fetchClinics() {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'clinics'));
      setClinics(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Failed to load clinics:', e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecentBookings() {
    try {
      setBookingsLoading(true);
      // Query individual bookings across all clinics
      const snap = await getDocs(collection(db, 'bookings'));
      const sorted = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRecentBookings(sorted);
    } catch (e) {
      console.error('Failed to load bookings:', e);
    } finally {
      setBookingsLoading(false);
    }
  }

  async function toggleStatus(clinic) {
    setTogglingId(clinic.id);
    const effectiveStatus = clinic.subscriptionStatus === 'pending_approval' ? 'pending_approval' : clinic.status;
    const newStatus = (effectiveStatus === 'active' || effectiveStatus === 'trial') ? 'deactivated' : 'active';
    try {
      await updateDoc(doc(db, 'clinics', clinic.id), { status: newStatus, subscriptionStatus: newStatus });
      setClinics((prev) => prev.map((c) => (c.id === clinic.id ? { ...c, status: newStatus, subscriptionStatus: newStatus } : c)));
    } catch (e) {
      console.error('Failed to toggle:', e);
    }
    setTogglingId(null);
  }

  async function approveAndEmail(clinic) {
    setTogglingId(clinic.id);
    try {
      // 1. Approve via Firestore
      await updateDoc(doc(db, 'clinics', clinic.id), { status: 'active', subscriptionStatus: 'active' });
      setClinics((prev) => prev.map((c) => (c.id === clinic.id ? { ...c, status: 'active', subscriptionStatus: 'active' } : c)));
      
      // 2. Open Email Client
      const subject = encodeURIComponent("[URGENT] Your OnlinePT clinic application is granted. Your clinic ready to go.");
      const body = encodeURIComponent(`Hi ${clinic.physioName},\n\nCongratulations! We have successfully verified your clinic details.\nYour clinic (${clinic.clinicName}) is now APPROVED and live.\n\nYou can log in to your dashboard here:\nhttps://${clinic.subdomain}.onlinept.in/dashboard-login\n\nThank you,\nOnlinePT Support Team`);
      window.location.href = `mailto:${clinic.email}?subject=${subject}&body=${body}`;
    } catch (e) {
      console.error('Failed to approve:', e);
    }
    setTogglingId(null);
  }

  const filtered = clinics.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.clinicName?.toLowerCase().includes(q) ||
      c.physioName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.subdomain?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: clinics.length,
    pending: clinics.filter((c) => c.subscriptionStatus === 'pending_approval').length,
    active: clinics.filter((c) => c.status === 'active' || c.subscriptionStatus === 'active').length,
    trial: clinics.filter((c) => c.status === 'trial').length,
    deactivated: clinics.filter((c) => c.status === 'deactivated').length,
    expired: clinics.filter((c) => {
      if (c.status === 'trial' && c.trialEndsAt) return getDaysLeft(c.trialEndsAt) <= 0;
      return false;
    }).length,
  };

  async function handleLogout() {
    await signOut();
    navigate('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 size={24} className="animate-spin" style={{ color: '#007AFF' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Admin Top Bar */}
      <header className="bg-white border-b border-border/70 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#dc262615' }}>
              <Shield size={16} style={{ color: '#dc2626' }} />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary leading-none">OnlinePT Admin</p>
              <p className="text-xs text-text-secondary leading-none mt-0.5">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut size={14} />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Total Clinics', value: stats.total, icon: LayoutDashboard, color: '#3b82f6' },
            { label: 'Pending', value: stats.pending, icon: Shield, color: '#eab308' },
            { label: 'Active', value: stats.active, icon: CheckCircle2, color: '#0066FF' },
            { label: 'On Trial', value: stats.trial, icon: Clock, color: '#f59e0b' },
            { label: 'Deactivated', value: stats.deactivated, icon: Ban, color: '#ef4444' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} padding="p-4" className="flex gap-3 items-start flex-col sm:flex-row">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15' }}>
                <Icon size={14} style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-text-primary">{value}</p>
                <p className="text-[10px] sm:text-xs text-text-secondary truncate">{label}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab('clinics')}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'clinics' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
          >
            <div className="flex items-center justify-center gap-2">
               <Users size={14} /> Clinics ({clinics.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'transactions' ? 'bg-white shadow-sm text-primary' : 'text-gray-400'}`}
          >
            <div className="flex items-center justify-center gap-2">
               <CreditCard size={14} /> Transactions ({recentBookings.filter(b => b.status === 'confirmed').length})
            </div>
          </button>
        </div>

        {activeTab === 'clinics' ? (
          <>
            {/* Search */}
            <div className="mb-4 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Search by clinic name, physio, email or subdomain..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-border bg-white text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Expired warning */}
            {stats.expired > 0 && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/30 text-sm text-error">
                <AlertTriangle size={15} className="shrink-0" />
                <span>
                  {stats.expired} trial{stats.expired > 1 ? 's have' : ' has'} expired. Consider deactivating them.
                </span>
              </div>
            )}
          </>
        ) : null}

        {/* Dynamic Content */}
        {activeTab === 'clinics' ? (
        {filtered.length === 0 ? (
          <Card padding="p-8" className="text-center">
            <Users size={32} className="mx-auto mb-3" style={{ color: '#6b728040' }} />
            <p className="text-sm text-text-secondary">
              {search ? 'No clinics match your search.' : 'No clinics registered yet.'}
            </p>
            {!search && (
              <p className="text-xs text-text-secondary/70 mt-1">
                Share <strong>onlinept.in</strong> with physiotherapists to get started.
              </p>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((clinic) => {
              const daysLeft = getDaysLeft(clinic.trialEndsAt);
              return (
                <Card key={clinic.id} padding="p-4" hover className="transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: clinic.settings?.primaryColor || '#0066FF' }}
                      >
                        {(clinic.physioName || 'P').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-sm font-semibold text-text-primary">{clinic.clinicName}</p>
                          {getStatusBadge(clinic)}
                        </div>
                        <p className="text-xs text-text-secondary mb-1">
                          {clinic.physioName} · {clinic.email}
                          {clinic.passingYear && <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">Graduated {clinic.passingYear}</span>}
                        </p>
                        {clinic.address && (
                          <p className="text-[10px] text-text-secondary/70 flex items-center gap-1 mb-1">
                            <MapPin size={10} /> {clinic.address}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-text-secondary/70 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Globe size={11} />
                            <span className="font-mono">{clinic.subdomain}.onlinept.in</span>
                          </span>
                          {clinic.trialEndsAt && (
                            <span className="inline-flex items-center gap-1">
                              <Clock size={11} />
                              Trial ends {formatDate(clinic.trialEndsAt)}
                              {daysLeft !== null && daysLeft > 0 && (
                                <span className="font-semibold" style={{ color: '#f59e0b' }}>({daysLeft}d)</span>
                              )}
                              {daysLeft !== null && daysLeft <= 0 && (
                                <span className="font-semibold text-error">(expired)</span>
                              )}
                            </span>
                          )}
                          {clinic.createdAt && (
                            <span>Joined {formatDate(clinic.createdAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {clinic.verificationDoc && (
                         <a href={clinic.verificationDoc} target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary underline mr-2">
                           View Cert
                         </a>
                      )}
                      
                      {clinic.subscriptionStatus === 'pending_approval' ? (
                        <button
                          onClick={() => approveAndEmail(clinic)}
                          disabled={togglingId === clinic.id}
                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border text-white transition-colors disabled:opacity-50"
                          style={{ backgroundColor: '#007AFF', borderColor: '#0055CC' }}
                        >
                          {togglingId === clinic.id ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
                          Approve & Email
                        </button>
                      ) : clinic.status !== 'deactivated' ? (
                        <button
                          onClick={() => toggleStatus(clinic)}
                          disabled={togglingId === clinic.id}
                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border text-error transition-colors disabled:opacity-50"
                          style={{ borderColor: '#ef444430', backgroundColor: '#ef444408' }}
                        >
                          {togglingId === clinic.id ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleStatus(clinic)}
                          disabled={togglingId === clinic.id}
                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border text-success transition-colors disabled:opacity-50"
                          style={{ borderColor: '#10b98130', backgroundColor: '#10b98108' }}
                        >
                          {togglingId === clinic.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
        ) : (
          <div className="space-y-4">
            {bookingsLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="animate-spin mx-auto text-primary" size={32} />
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-4">Loading Transactions...</p>
              </div>
            ) : recentBookings.length === 0 ? (
              <Card padding="p-8" className="text-center">
                <CreditCard size={32} className="mx-auto mb-3" style={{ color: '#6b728040' }} />
                <p className="text-sm text-text-secondary">No transactions found across the platform.</p>
              </Card>
            ) : (
              recentBookings.map((booking) => (
                <Card key={booking.id} padding="p-4" hover className="transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary">
                        <Activity size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-black text-gray-900">{booking.name || 'Patient'}</p>
                          {booking.status === 'confirmed' ? (
                            <Badge variant="success" size="sm">Confirmed</Badge>
                          ) : (
                            <Badge variant="secondary" size="sm">{booking.status}</Badge>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest leading-none">
                          {booking.serviceName || 'Consultation'} · {booking.clinicId || 'Platform'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-primary">₹{booking.totalPrice || booking.amount || 0}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {booking.createdAt ? formatDate(booking.createdAt) : 'Pending Date'}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
