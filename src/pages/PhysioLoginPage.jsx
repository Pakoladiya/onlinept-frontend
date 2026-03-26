import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailPassword } from '@/firebase/auth';
import clinicConfig from '@/config/clinicConfig';
import Button from '@/components/ui/Button';
import { Eye, EyeOff, Loader, AlertCircle } from 'lucide-react';

export default function PhysioLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await signInWithEmailPassword(email, password);
      if (user) navigate('/dashboard');
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
        ? 'Invalid email or password.'
        : err.code === 'auth/invalid-email'
        ? 'Please enter a valid email address.'
        : 'Login failed. Please try again.';
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl"
            style={{ backgroundColor: clinicConfig.primaryColor }}
          >
            P
          </div>
          <h1 className="text-xl font-bold text-text-primary">{clinicConfig.clinicName}</h1>
          <p className="text-sm text-text-secondary mt-1">Physiotherapist Portal</p>
        </div>

        {/* Card */}
        <div className="bg-background rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary mb-6">Sign In</h2>

          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/30 text-sm text-error">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-text-secondary uppercase tracking-wide mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="physio@clinic.com"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary transition-colors"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary transition-colors"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? <Loader size={16} className="animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-text-secondary mt-4">
          Need access? Contact {clinicConfig.email}
        </p>
      </div>
    </div>
  );
}
