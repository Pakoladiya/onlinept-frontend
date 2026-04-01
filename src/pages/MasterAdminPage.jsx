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
  Ban
} from 'lucide-react';

const ADMIN_EMAIL = 'pakoladiya@gmail.com';

function getStatusBadge(status, trialEndsAt) {
  if (status === 'deactivated') return <Badge variant="error" size="sm">Deactivated</Badge>;
  if (status === 'active') return <Badge variant="success" size="sm">Active</Badge>;
  if (status === 'trial') {
    const ends = trialEndsAt ? new Date(trialEndsAt) : null;
    const daysLeft = ends ? Math.ceil((ends - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
    if (daysLeft <= 0) return <Badge variant="error" size="sm">Trial Expired</Badge>;
    return <Badge variant="warning" size="sm">{daysLeft}d left</Badge>;
  }
  if (status === 'expired') return <Badge variant="error" size="sm">Expired</Badge>;
  return <Badge variant="secondary" size="sm">{status}</Badge>;
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

  useEffect(() => {
    const unsub = onAuth(async (u) => {
      if (!u || u.email !== ADMIN_EMAIL) {
        navigate('/');
        return;
      }
      setUser(u);
      try {
        const snap = await getDocs(collection(db, 'clinics'));
        setClinics(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('Failed to load clinics:', e);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function toggleStatus(clinic) {
    setTogglingId(clinic.id);
    const newStatus = clinic.status === 'active' ? 'deactivated' : 'active';
    try {
      await updateDoc(doc(db, 'clinics', clinic.id), { status: newStatus });
      setClinics((prev) => prev.map((c) => (c.id === clinic.id ? { ...c, status: newStatus } : c)));
    } catch (e) {
      console.error('Failed to toggle:', e);
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
    active: clinics.filter((c) => c.status === 'active').length,
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Clinics', value: stats.total, icon: LayoutDashboard, color: '#3b82f6' },
            { label: 'Active', value: stats.active, icon: CheckCircle2, color: '#0066FF' },
            { label: 'On Trial', value: stats.trial, icon: Clock, color: '#f59e0b' },
            { label: 'Deactivated', value: stats.deactivated, icon: Ban, color: '#ef4444' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} padding="p-4" className="flex gap-3 items-start">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15' }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{value}</p>
                <p className="text-xs text-text-secondary">{label}</p>
              </div>
            </Card>
          ))}
        </div>

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

        {/* Clinics list */}
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
                          {getStatusBadge(clinic.status, clinic.trialEndsAt)}
                        </div>
                        <p className="text-xs text-text-secondary mb-1">
                          {clinic.physioName} · {clinic.email}
                        </p>
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
                    <div className="shrink-0">
                      {clinic.status !== 'deactivated' ? (
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
            })}
          </div>
        )}
      </main>
    </div>
  );
}
