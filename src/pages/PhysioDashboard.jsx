import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import clinicConfig from '@/config/clinicConfig';
import { onAuth, signOut } from '@/firebase/auth';
import { getPhysioBookings, getPhysioPatients, blockSlot } from '@/firebase/db';
import {
  Settings,
  Clock,
  LogOut,
  ChevronRight,
  Video,
  Search,
  X,
  Loader2,
  Activity,
  TrendingUp,
  Wallet,
  Calendar,
  Plus,
  ShieldCheck,
  LayoutDashboard,
  AlertCircle,
  Check,
  Zap,
  Sparkles,
} from 'lucide-react';

/**
 * Luxe PhysioDashboard — "High-End Command Center" with real Firestore data.
 */

const TABS = ['Command Center', 'Patient List', 'Schedule', 'Insights'];

const BLOCK_REASONS = ['Lunch Break', 'Personal Time', 'Emergency Leave', 'Admin / Documentation', 'Weekly Off'];

export default function PhysioDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Command Center');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [bookings, setBookings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');

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

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => {
    const bDate = b.date instanceof Date
      ? b.date.toISOString().split('T')[0]
      : String(b.date || '').split('T')[0];
    return bDate === today;
  });
  const upcomingBookings = todayBookings.filter(b => b.status === 'upcoming' || b.status === 'pending');
  const nextApt = upcomingBookings[0];

  return (
    <>
    <PageWrapper className="bg-gray-50/50 min-h-screen">
      <div className="max-w-6xl mx-auto py-10 px-6 overflow-hidden">
        
        {/* Elite Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div className="text-left">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full text-[10px] font-black uppercase tracking-widest text-green-600 mb-4 border border-green-100">
                  <Activity size={10} /> Clinical Platform Online
               </div>
               <h1 className="text-4xl font-black text-gray-900 tracking-tight">Clinic Overview</h1>
               <p className="text-gray-400 font-bold mt-1">Logged in as: <span className="text-gray-900">Dr. {clinicConfig.physioName}</span></p>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={() => navigate('/settings')} className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-primary transition-all shadow-sm">
                  <Settings size={20} />
               </button>
               <button onClick={async () => { await signOut(); navigate('/'); }} className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shadow-sm">
                  <LogOut size={20} />
               </button>
            </div>
        </div>

        {/* Command Center Tabs */}
        <div className="flex gap-2 bg-white p-2 rounded-[2rem] shadow-sm border border-gray-100 mb-10 overflow-x-auto scrollbar-hide">
            {TABS.map(t => (
                <button 
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 min-w-[120px] py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all
                    ${activeTab === t ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                    {t}
                </button>
            ))}
        </div>

        {activeTab === 'Command Center' && (
           <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-500">
              
              {/* RE-DESIGNED STATS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                    { label: 'Today Sessions', value: todayBookings.length || '0', icon: Calendar, color: 'text-primary', bg: 'bg-blue-50' },
                    { label: 'Active Patients', value: patients.length || '0', icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Upcoming', value: upcomingBookings.length || '0', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Total Bookings', value: bookings.length || '0', icon: Wallet, color: 'text-orange-600', bg: 'bg-orange-50' }
                 ].map((s, i) => (
                    <Card key={i} className="p-6 rounded-[2.5rem] border-none shadow-xl shadow-gray-200/50 bg-white">
                       <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-4`}><s.icon size={22} /></div>
                       <p className="text-3xl font-black text-gray-900 tabular-nums tracking-tighter text-left">{s.value}</p>
                       <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1 text-left">{s.label}</p>
                    </Card>
                 ))}
              </div>

              {/* NEXT UP HERO (THE COMMANDER) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 text-left">
                 
                 <div className="lg:col-span-2">
                    <Card className="p-0 rounded-[3.5rem] bg-gray-900 border-none shadow-2xl shadow-gray-900/40 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                          <LayoutDashboard size={200} className="text-white" />
                       </div>
                       
                       <div className="p-12 relative z-20">
                          <div className="flex items-center gap-3 mb-8">
                             <div className="px-4 py-2 bg-primary/20 rounded-full border border-primary/30 flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                 <span className="text-[10px] font-black text-primary uppercase tracking-widest">Next Up: In 15 Mins</span>
                             </div>
                          </div>
                          
                          {nextApt ? (
                             <div className="space-y-10">
                                <div className="space-y-2">
                                   <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">{nextApt.serviceName || 'Consultation'}</p>
                                   <h2 className="text-5xl font-black text-white tracking-tight">{nextApt.patientName || 'Patient'}</h2>
                                   <div className="flex items-center gap-6 pt-2 text-left">
                                      <div className="flex items-center gap-2 text-gray-300 font-bold"><Clock size={16} /> {nextApt.slotLabel || nextApt.slot || '—'}</div>
                                      <div className="flex items-center gap-2 text-gray-300 font-bold"><Video size={16} /> {nextApt.videoMode === 'zoom' ? 'Zoom' : nextApt.videoMode === 'meet' ? 'Google Meet' : 'WhatsApp'}</div>
                                   </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                   <Button className="h-20 px-10 rounded-[2rem] bg-primary text-white shadow-2xl shadow-primary/30 font-black uppercase tracking-widest text-xs">
                                      Join Consultation Now <Video className="ml-3" />
                                   </Button>
                                   <Button variant="ghost" className="h-20 px-8 rounded-[2rem] bg-white/5 text-white hover:bg-white/10 font-bold transition-all">
                                      Review Reports
                                   </Button>
                                </div>
                             </div>
                          ) : (
                             <p className="text-gray-400 font-bold">No upcoming appointments scheduled for today.</p>
                          )}
                       </div>
                    </Card>
                 </div>

                 <div className="space-y-6 text-left">
                    <p className="text-xs font-black uppercase text-gray-400 tracking-widest pl-4 border-l-2 border-primary">Patient Queue</p>
                    <div className="space-y-4">
                       {upcomingBookings.filter(a => a.id !== nextApt?.id).map((apt) => (
                           <Card key={apt.id} className="p-4 rounded-[1.8rem] border-none shadow-sm bg-white flex items-center justify-between hover:scale-[1.02] transition-transform cursor-pointer">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-xs text-gray-900">
                                    {(apt.patientName || 'P')[0]}
                                 </div>
                                 <div className="text-left">
                                    <p className="text-sm font-black text-gray-900">{apt.patientName || 'Patient'}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{apt.slotLabel || apt.slot || ''}</p>
                                 </div>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                                 <ChevronRight size={16} />
                              </div>
                           </Card>
                       ))}
                    </div>
                 </div>

              </div>
           </div>
        )}

        {activeTab === 'Patient List' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500 text-left">
              <div className="relative">
                 <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-400"><Search size={22} /></div>
                 <input 
                   value={patientSearch}
                   onChange={e => setPatientSearch(e.target.value)}
                   placeholder="Universal Search: Scan patient records..."
                   className="w-full h-20 bg-white rounded-[2.5rem] pl-16 pr-8 font-bold text-gray-900 border-none shadow-xl shadow-gray-200/50 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {dataLoading ? (
                    <div className="col-span-full flex items-center justify-center py-20">
                       <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                 ) : patients.length === 0 ? (
                    <div className="col-span-full text-center py-20">
                       <p className="text-gray-400 font-bold">No patients found. Patient records will appear here after bookings.</p>
                    </div>
                 ) : (
                    patients
                       .filter(p =>
                         !patientSearch ||
                         (p.name || '').toLowerCase().includes(patientSearch.toLowerCase()) ||
                         (p.phone || '').includes(patientSearch)
                       )
                       .map(p => (
                          <Card key={p.id} className="p-0 rounded-[3rem] border-none shadow-xl shadow-gray-100 bg-white overflow-hidden group hover:translate-y-[-4px] transition-all">
                             <div className="p-8 text-left">
                                <div className="flex items-center justify-between mb-6">
                                   <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-primary font-black text-xl">{(p.name || 'P')[0]}</div>
                                   <Badge variant="success" className="rounded-xl px-4 py-1 font-black uppercase text-[10px]">{p.status || 'Active'}</Badge>
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-1">{p.name || 'Patient'}</h3>
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{(p.city || 'Surat')} · {p.age || '—'} Yrs · {(p.gender || '')}</p>
                             </div>
                             <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                                  <div className="text-left">
                                     <p className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">Phone</p>
                                     <p className="text-[11px] font-bold text-gray-600">{p.phone || '—'}</p>
                                  </div>
                                  <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedPatient(p)}
                                      className="bg-white rounded-xl shadow-sm h-10 px-4 hover:bg-primary hover:text-white transition-colors"
                                  >
                                     View Profile <ChevronRight size={14} className="ml-1" />
                                  </Button>
                             </div>
                          </Card>
                       ))
                 )}
              </div>
           </div>
        )}

        {activeTab === 'Schedule' && (
           <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex flex-col md:flex-row gap-6">
                 <div className="flex-1 space-y-6">
                     <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-xl shadow-gray-100 flex flex-col items-center justify-center min-h-[400px]">
                        <Calendar size={64} className="text-gray-200 mb-6" />
                        <h3 className="text-xl font-black text-gray-900 mb-2 text-center">Master Schedule</h3>
                        <p className="text-sm font-bold text-gray-400 text-center max-w-xs">Interactive calendar view coming in v2.</p>
                     </Card>
                 </div>
                 <div className="md:w-80 space-y-6 text-left">
                     <div className="flex items-center justify-between pl-4 border-l-2 border-primary">
                        <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Active Slots</p>
                        <Button variant="ghost" size="sm" onClick={() => setBlockModalOpen(true)}>
                           <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Block Slot
                        </Button>
                     </div>
                     <div className="space-y-4">
                        {dataLoading ? (
                           <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                        ) : todayBookings.length === 0 ? (
                           <p className="text-center text-gray-400 font-bold text-xs py-8">No bookings for today</p>
                        ) : (
                           todayBookings.map((apt) => (
                              <Card key={apt.id} className={`p-4 rounded-[1.8rem] border-none shadow-sm flex items-center gap-4 ${apt.status === 'blocked' ? 'bg-red-50 opacity-80' : 'bg-white'}`}>
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${apt.status === 'blocked' ? 'bg-red-100 text-red-600' : 'bg-primary/5 text-primary'}`}>
                                    {apt.status === 'blocked' ? '❌' : (apt.slotLabel || apt.slot || '—').split(' ')[0]}
                                 </div>
                                 <div className="text-left flex-1">
                                    <p className={`text-sm font-black ${apt.status === 'blocked' ? 'text-red-900' : 'text-gray-900'}`}>{apt.patientName || apt.patient || apt.status}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{apt.serviceName || apt.type || apt.status}</p>
                                 </div>
                              </Card>
                           ))
                        )}
                     </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'Insights' && (
           <div className="space-y-10 animate-in fade-in slide-in-from-top-10 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                 <Card className="p-10 rounded-[3rem] bg-white border-none shadow-xl shadow-gray-100 flex flex-col items-center justify-center min-h-[350px]">
                    <TrendingUp size={48} className="text-gray-200 mb-6" />
                    <h3 className="text-lg font-black text-gray-900 mb-1">Growth Analytics</h3>
                    <p className="text-xs font-bold text-gray-400 text-center uppercase tracking-widest">Revenue charts coming soon</p>
                 </Card>
                 <Card className="p-10 rounded-[3rem] bg-white border-none shadow-xl shadow-gray-100 flex flex-col items-center justify-center min-h-[350px]">
                    <BarChart3 size={48} className="text-gray-200 mb-6" />
                    <h3 className="text-lg font-black text-gray-900 mb-1">Recovery Success</h3>
                    <p className="text-xs font-bold text-gray-400 text-center uppercase tracking-widest">Assessment insights coming soon</p>
                 </Card>
              </div>
           </div>
        )}

        {selectedPatient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
             <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl" onClick={() => setSelectedPatient(null)}></div>
             <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3.5rem] bg-white border-none shadow-2xl p-10 sm:p-16 relative z-[110] animate-in zoom-in-95 duration-300">
                <button 
                   onClick={() => setSelectedPatient(null)}
                   className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"
                >
                   <X size={24} />
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-8 mb-12 text-left">
                   <div className="w-24 h-24 rounded-[2.5rem] bg-primary flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-primary/20">
                      {selectedPatient.name[0]}
                   </div>
                   <div className="text-center sm:text-left">
                      <h2 className="text-3xl font-black text-gray-900 tracking-tight">{selectedPatient.name}</h2>
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">{selectedPatient.gender} · {selectedPatient.age} Yrs · {selectedPatient.city}</p>
                   </div>
                </div>

                <div className="space-y-8 text-left">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-gray-50 rounded-[2rem]">
                         <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Status</p>
                         <p className="text-lg font-black text-green-600 uppercase">Active Rehab</p>
                      </div>
                      <div className="p-6 bg-gray-50 rounded-[2rem]">
                         <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Last Seen</p>
                         <p className="text-lg font-black text-gray-900">{selectedPatient.lastVisit}</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <p className="text-xs font-black uppercase text-gray-400 tracking-widest border-l-2 border-primary pl-4">Clinical SOAP Notes</p>
                      <div className="space-y-6">
                         {[
                           { k: 'Subjective', v: selectedPatient.soap.subjective },
                           { k: 'Objective', v: selectedPatient.soap.objective },
                           { k: 'Assessment', v: selectedPatient.soap.assessment },
                           { k: 'Plan', v: selectedPatient.soap.plan },
                         ].map(item => (
                           <div key={item.k} className="space-y-1">
                              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{item.k}</p>
                              <p className="text-sm font-bold text-gray-700 leading-relaxed">{item.v}</p>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </Card>
          </div>
        )}

      </div>
    </PageWrapper>

      {/* ── Block Slot Modal ── */}
      {blockModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl" onClick={() => { setBlockModalOpen(false); setBlockReason(''); }} />
          <Card className="relative w-full max-w-md rounded-[2.5rem] bg-white border-none shadow-2xl p-10 z-[110] animate-in zoom-in-95 duration-300">
            <button
              onClick={() => { setBlockModalOpen(false); setBlockReason(''); }}
              className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"
            >
              <X size={18} />
            </button>

            <div className="text-left space-y-6">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
                <ShieldCheck size={24} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Block a Time Slot</h2>
                <p className="text-sm text-gray-400 font-medium mt-1">This slot will be marked unavailable for all patients.</p>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-gray-400 tracking-widest block">Reason</label>
                <select
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  className="w-full h-14 bg-gray-50 rounded-xl px-5 font-bold border border-gray-100 outline-none focus:border-primary/50 transition-all"
                >
                  <option value="">Select a reason...</option>
                  {BLOCK_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {blockReason === '' && (
                  <input
                    value={blockReason}
                    onChange={e => setBlockReason(e.target.value)}
                    placeholder="Or type a custom reason..."
                    className="w-full h-14 bg-gray-50 rounded-xl px-5 font-bold border border-gray-100 outline-none focus:border-primary/50 transition-all"
                  />
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl font-black"
                  onClick={() => { setBlockModalOpen(false); setBlockReason(''); }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-14 rounded-2xl bg-red-500 text-white shadow-xl shadow-red-100 font-black"
                  disabled={!blockReason}
                  onClick={async () => {
                    if (!blockReason || !user) return;
                    try {
                      await blockSlot(user.uid, today, { reason: blockReason, status: 'blocked' });
                      setBlockModalOpen(false);
                      setBlockReason('');
                    } catch (err) {
                      console.error('Failed to block slot:', err);
                    }
                  }}
                >
                  Block Slot
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
