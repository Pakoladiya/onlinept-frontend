import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '@/firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import Button from '@/components/ui/Button';
import { 
    Eye, 
    EyeOff, 
    Loader2, 
    AlertCircle, 
    Zap, 
    Video, 
    CalendarCheck, 
    ShieldCheck, 
    Sparkles, 
    CheckCircle2, 
    ArrowLeft, 
    Star, 
    Globe, 
    Smartphone, 
    LayoutDashboard,
    Activity,
    Lock
} from 'lucide-react';

/**
 * Luxe PhysioSignUpPage — Designed to convert 1%ers into long-term subscribers.
 * Features: High-impact features column, REAL-TIME subdomain visualizer, and Elite SaaS aesthetics.
 */

const features = [
  { icon: Video, title: 'HD Consultations', desc: 'WhatsApp or Zoom integration' },
  { icon: CalendarCheck, title: 'Smart Auto-Slots', desc: 'Patients book 24/7' },
  { icon: Smartphone, title: 'Branded App', desc: 'Your own custom subdomain' },
  { icon: ShieldCheck, title: 'HIPPA Level Security', desc: 'Patient data stay safe' }
];

export default function PhysioSignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    physioName: '',
    clinicName: '',
    email: '',
    password: '',
    subdomain: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key, val) => {
    if (key === 'clinicName') {
      setForm((f) => ({
        ...f,
        clinicName: val,
        subdomain: val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }));
    } else {
      setForm((f) => ({ ...f, [key]: val }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.physioName || !form.clinicName || !form.email || !form.password) {
      setError('Please provide all clinical details.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const cred = await signUp(form.email, form.password);
      // Try to write clinic doc, but don't block signup if it fails
      try {
        await setDoc(doc(db, 'clinics', form.subdomain || form.email.split('@')[0]), {
          uid: cred.user.uid,
          physioName: form.physioName,
          clinicName: form.clinicName,
          subdomain: form.subdomain,
          email: form.email,
          status: 'trial',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: serverTimestamp(),
          settings: { primaryColor: '#007AFF', secondaryColor: '#F6A000', videoMode: 'whatsapp' }
        });
      } catch (dbErr) {
        console.warn('Clinic doc write failed (non-blocking):', dbErr.code, dbErr.message);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup error:', err.code, err.message);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else {
        setError(`Registration failed: ${err.code || err.message}`);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white relative overflow-hidden selection:bg-primary selection:text-white">
      
      {/* ── Left Column: Trust & Authority ───────────────── */}
      <div className="hidden lg:flex flex-col justify-between p-20 bg-gray-50 relative overflow-hidden">
         {/* Mesh Background */}
         <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
            <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[100px] bg-primary/30" />
            <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[100px] bg-orange-400/20" />
         </div>

         <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors mb-16">
               <ArrowLeft size={14} /> Back to Terminal Home
            </Link>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-6 shadow-sm">
                <Zap size={10} className="fill-blue-600" /> Start your 14-Day Elite Trial
            </div>
            
            <h1 className="text-6xl font-black text-gray-900 leading-tight tracking-tighter mb-8">
               Your Own <span className="text-primary italic">Clinic</span>. <br />
               Your Own Branding.
            </h1>
            
            <p className="text-lg font-bold text-gray-400 max-w-md leading-relaxed mb-12">
               Join 500+ physiotherapists across India who have ditched manual scheduling for an automated, high-conversion practice.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-4">
                {features.map((f, i) => (
                   <div key={i} className="p-6 bg-white rounded-[2rem] shadow-sm border border-gray-100/50 hover:shadow-xl hover:translate-y-[-4px] transition-all">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary mb-4">
                         <f.icon size={20} />
                      </div>
                      <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">{f.title}</p>
                      <p className="text-[10px] font-bold text-gray-400">{f.desc}</p>
                   </div>
                ))}
            </div>
         </div>

         {/* Bottom Trust */}
         <div className="relative z-10 flex items-center gap-6 mt-20">
             <div className="flex -space-x-3">
                {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200" />)}
             </div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Trusted by Top rated <br /> Surgeons & Clinical Leads
             </p>
         </div>
      </div>

      {/* ── Right Column: Sign-Up Form ──────────────────── */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-20 bg-white">
          <div className="w-full max-w-md animate-in slide-in-from-right-10 duration-700">
             
             <div className="mb-10 lg:hidden">
                <Link to="/" className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20 mb-6">
                   <Activity size={24} />
                </Link>
             </div>

             <div className="mb-12">
                <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Create Clinic Portal</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Takes less than 30 seconds</p>
             </div>

             {error && (
                <div className="mb-8 p-5 bg-red-50 border border-red-100 rounded-[1.5rem] flex items-center gap-3 text-xs font-black uppercase text-red-500 animate-in shake duration-300">
                   <AlertCircle size={16} /> {error}
                </div>
             )}

             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Physio Name</label>
                       <input 
                         value={form.physioName}
                         onChange={e => update('physioName', e.target.value)}
                         className="w-full h-14 px-5 font-bold bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all placeholder:text-gray-300"
                         placeholder="Full Name"
                       />
                   </div>
                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Clinic Name</label>
                       <input
                         value={form.clinicName}
                         onChange={e => update('clinicName', e.target.value)}
                         className="w-full h-14 px-5 font-bold bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all placeholder:text-gray-300"
                         placeholder="Clinic Name"
                       />
                   </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Secure Link Preview</label>
                    <div className="flex items-center h-14 bg-gray-50 rounded-2xl px-5 border-2 border-transparent focus-within:border-primary/20 focus-within:bg-white transition-all">
                       <input 
                         value={form.subdomain}
                         onChange={e => update('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                         className="flex-1 bg-transparent font-bold outline-none placeholder:text-gray-300 text-sm"
                         placeholder="Your Subdomain"
                       />
                       <span className="text-xs font-black text-primary uppercase tracking-tighter">.onlinept.in</span>
                    </div>
                    <p className="px-5 text-[9px] font-bold text-gray-300 uppercase">Your Patients visit: {form.subdomain || 'link'}.onlinept.in</p>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Login Email</label>
                    <input 
                      type="email"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      className="w-full h-14 px-5 font-bold bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all placeholder:text-gray-300"
                      placeholder="Email Address"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Password</label>
                    <div className="relative">
                       <input 
                         type={showPw ? 'text' : 'password'}
                         value={form.password}
                         onChange={e => update('password', e.target.value)}
                         className="w-full h-14 px-5 font-bold bg-gray-50 rounded-2xl border-2 border-transparent focus:border-primary/20 focus:bg-white outline-none transition-all placeholder:text-gray-300"
                         placeholder="Choose Password"
                       />
                       <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary transition-colors">
                          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                       </button>
                    </div>
                </div>

                <Button fullWidth type="submit" disabled={loading} className="h-16 rounded-2xl shadow-xl shadow-primary/20 font-black uppercase tracking-[0.2em] text-xs">
                   {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Sparkles size={18} className="mr-2" />}
                   {loading ? 'Booting Portal...' : 'Initialize Clinic'}
                </Button>
             </form>

             <div className="mt-10 text-center">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                   Join the Elite 1% <Link to="/dashboard-login" className="text-primary hover:underline ml-1">SignIn Instead</Link>
                </p>
             </div>

             <div className="mt-12 flex items-center justify-center gap-6 opacity-40 grayscale">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase"><ShieldCheck size={12} /> Encrypted</div>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase"><Lock size={12} /> HIPAA</div>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase"><Activity size={12} /> Real-Time</div>
             </div>

          </div>
      </div>

    </div>
  );
}
