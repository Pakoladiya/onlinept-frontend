import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailPassword } from '@/firebase/auth';
import clinicConfig from '@/config/clinicConfig';
import Button from '@/components/ui/Button';
import { 
    Eye, 
    EyeOff, 
    Loader2, 
    AlertCircle, 
    ShieldCheck, 
    Sparkles, 
    ArrowRight, 
    CheckCircle2, 
    Activity 
} from 'lucide-react';

/**
 * Luxe PhysioLoginPage — Re-designed for high-end professionalism and brand authority.
 * Features: Mesh gradient background, glassmorphic cards, and premium auth states.
 */
export default function PhysioLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // SEO + Theme Update
  useEffect(() => {
    document.title = `Physio Access | ${clinicConfig.clinicName}`;
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your clinical credentials.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await signInWithEmailPassword(email, password);
      if (user) navigate('/dashboard');
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
        ? 'Invalid clinical credentials.'
        : 'Access denied. Please check your credentials.';
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50 font-sans px-4">
      
      {/* Premium Mesh Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
         <div 
           className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[120px]" 
           style={{ backgroundColor: `${clinicConfig.primaryColor}40` }} 
         />
         <div 
           className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[120px]" 
           style={{ backgroundColor: `${clinicConfig.secondaryColor}30` }} 
         />
      </div>

      <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Branding Cluster */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-white/20 text-[10px] font-black uppercase tracking-widest text-primary mb-8 shadow-sm">
             <ShieldCheck size={14} /> Secure Physio Gateway
          </div>
          <div
            className="w-20 h-20 rounded-[2rem] mx-auto mb-6 flex items-center justify-center text-white shadow-2xl shadow-primary/30 transition-transform hover:scale-105"
            style={{ backgroundColor: clinicConfig.primaryColor }}
          >
            <Activity size={40} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{clinicConfig.clinicName}</h1>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Command Center Access</p>
        </div>

        {/* The Glassmorphic Login Card */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] border border-white shadow-2xl shadow-gray-200/50 p-10 sm:p-14 relative overflow-hidden">
          
          <div className="mb-10 text-left">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Welcome Back</h2>
            <p className="text-sm font-bold text-gray-400">Sign in to manage your clinical schedule and patient rehabs.</p>
          </div>

          {error && (
            <div className="mb-8 flex items-center gap-3 p-5 rounded-[1.5rem] bg-red-50 border border-red-100 text-xs font-black uppercase text-red-500 animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2 text-left">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Clinical Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="physio@example.com"
                className="w-full h-16 px-6 text-sm font-bold rounded-[1.5rem] border-2 border-transparent bg-gray-50 text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-300"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Access Token</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-16 px-6 pr-14 text-sm font-bold rounded-[1.5rem] border-2 border-transparent bg-gray-50 text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-300"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary transition-colors"
                >
                  {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button 
                type="submit" 
                fullWidth 
                disabled={loading} 
                className="h-18 rounded-[1.8rem] shadow-2xl shadow-primary/20 font-black uppercase tracking-widest text-xs"
            >
              {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <Sparkles size={18} className="mr-2" />}
              {loading ? 'Authenticating...' : 'Enter Dashboard'}
            </Button>
          </form>

          {/* Verification Badges */}
          <div className="mt-12 pt-8 border-t border-gray-50 flex items-center justify-center gap-6">
             <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                <CheckCircle2 size={12} className="text-green-500" /> HIPPA Compliant
             </div>
             <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                <CheckCircle2 size={12} className="text-green-500" /> SSL Encrypted
             </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 text-center space-y-4">
             <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                Don't have clinical access? <Link to="/physio-signup" className="text-primary hover:underline ml-1">Create Account</Link>
             </p>
             <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black text-gray-300 hover:text-gray-500 uppercase tracking-widest transition-colors">
                <ArrowRight size={12} className="rotate-180" /> Back to Terminal Home
             </Link>
        </div>
      </div>
    </div>
  );
}
