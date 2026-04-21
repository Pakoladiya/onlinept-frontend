import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailPassword } from '@/firebase/auth';
import { auth } from '@/firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Sparkles, X, KeyRound } from 'lucide-react';
import { isSuperAdminEmail } from '@/config/superAdminConfig';
import { isBiometricAvailable } from '@/utils/biometricAuth';

const IOS = {
  primary: '#007AFF',
  primaryDark: '#0055CC',
  primaryLight: '#E8F1FF',
  accent: '#5AC8FA',
  surface: '#F5F5F7',
  white: '#FFFFFF',
  ink: '#1D1D1F',
  ink2: '#3A3A3C',
  ink3: '#636366',
  ink4: '#AEAEB2',
  border: 'rgba(0,0,0,0.08)',
  glass: 'rgba(255,255,255,0.80)',
  blur: 'blur(20px)',
  r: { sm: 12, md: 20, lg: 28, xl: 40 },
};

export default function PhysioLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    document.title = 'Physio Access | OnlinePT';
    isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      const cred = await signInWithEmailPassword(email, password);
      if (cred?.user) {
        // Offer biometric enrollment if not already registered
        try {
          const { registerBiometric } = await import('@/utils/biometricAuth');
          const available = await isBiometricAvailable();
          if (available) {
            const creds = JSON.parse(localStorage.getItem('biometric_creds') || '{}');
            if (!creds[cred.user.uid]) {
              await registerBiometric(cred.user.uid, email);
            }
          }
        } catch {}
        // Silently detect super admin by email
        navigate(isSuperAdminEmail(email) ? '/saas/dashboard' : '/dashboard');
      }
    } catch (err) {
      const invalidCodes = [
        'auth/user-not-found',
        'auth/wrong-password',
        'auth/invalid-credential',
        'auth/invalid-email',
      ];
      setError(invalidCodes.includes(err.code)
        ? 'Invalid email or password. Please try again.'
        : `Access denied: ${err.message}`);
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,122,255,0.08) 0%, transparent 70%), ${IOS.surface}`,
      padding: 24, fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        @keyframes fadeUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: none; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { border-color: ${IOS.primary} !important; box-shadow: 0 0 0 3px ${IOS.primaryLight} !important; background: ${IOS.white} !important; }
      `}</style>

      <div style={{ width: '100%', maxWidth: 440, animation: 'fadeUp 0.6s ease both' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="OnlinePT" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: '50%', marginBottom: 16 }} />
          <h1 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 28, fontWeight: 800, color: IOS.ink, letterSpacing: '-0.5px' }}>
            Online<span style={{ color: IOS.primary }}>PT</span>
          </h1>
          <p style={{ fontSize: 13, color: IOS.ink4, fontWeight: 500, marginTop: 4 }}>Physio Dashboard Access</p>
        </div>

        {/* Card */}
        <div style={{
          background: IOS.white,
          borderRadius: IOS.r.xl,
          boxShadow: `0 8px 30px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)`,
          border: `1px solid ${IOS.border}`,
          padding: 32,
        }}>
          <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 20, fontWeight: 800, color: IOS.ink, marginBottom: 4 }}>Welcome Back</h2>
          <p style={{ fontSize: 14, color: IOS.ink3, marginBottom: 28 }}>Sign in to manage your page and patients.</p>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: IOS.r.md, padding: '12px 16px',
              fontSize: 13, color: '#DC2626', fontWeight: 500,
              marginBottom: 20,
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: IOS.ink2, marginBottom: 8, letterSpacing: '0.2px' }}>Email Address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email Address" autoComplete="email"
                style={{
                  width: '100%', height: 52,
                  padding: '0 18px',
                  background: IOS.surface,
                  border: `1.5px solid ${IOS.border}`,
                  borderRadius: IOS.r.md,
                  fontSize: 15, fontFamily: "'DM Sans', sans-serif",
                  color: IOS.ink, outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: IOS.ink2, letterSpacing: '0.2px' }}>Password</label>
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, color: IOS.primary,
                    fontFamily: "'DM Sans', sans-serif",
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password"
                  style={{
                    width: '100%', height: 52,
                    padding: '0 50px 0 18px',
                    background: IOS.surface,
                    border: `1.5px solid ${IOS.border}`,
                    borderRadius: IOS.r.md,
                    fontSize: 15, fontFamily: "'DM Sans', sans-serif",
                    color: IOS.ink, outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: IOS.ink4, display: 'flex', alignItems: 'center',
                }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', height: 52,
                background: loading ? IOS.primary + '80' : `linear-gradient(135deg, ${IOS.primary}, ${IOS.accent})`,
                color: IOS.white, border: 'none', borderRadius: IOS.r.md,
                fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: `0 4px 16px ${IOS.primary}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 4,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'none'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              ) : (
                <>Enter Dashboard <Sparkles size={16} /></>
              )}
            </button>
          </form>

          {/* Trust badges */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
            marginTop: 24, paddingTop: 20,
            borderTop: `1px solid ${IOS.border}`,
          }}>
            {['HIPAA Ready', 'SSL Encrypted', 'Firebase Auth'].map(label => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: IOS.ink4, fontWeight: 500 }}>
                <CheckCircle2 size={12} style={{ color: IOS.primary }} /> {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Biometric Login ─────────────────────────────────────────────────── */}
        {biometricAvailable && localStorage.getItem('biometric_creds') && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              type="button"
              onClick={async () => {
                const { authenticateBiometric } = await import('@/utils/biometricAuth');
                const creds = JSON.parse(localStorage.getItem('biometric_creds') || '{}');
                const userIds = Object.keys(creds);
                if (userIds.length === 0) return;
                const result = await authenticateBiometric(userIds[0]);
                if (result.success) {
                  navigate('/dashboard');
                }
              }}
              style={{
                width: '100%', height: 52,
                background: IOS.surface, border: `1.5px solid ${IOS.border}`, borderRadius: IOS.r.md,
                fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                color: IOS.primary, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={IOS.primary} strokeWidth="2">
                <rect x="5" y="11" width="14" height="10" rx="3"/>
                <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
              </svg>
              Use Face ID / Fingerprint
            </button>
          </div>
        )}

        {/* ── Forgot Password Modal ──────────────────────────────────────────── */}
        {forgotMode && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24, animation: 'fadeUp 0.3s ease both',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setForgotMode(false); }}
          >
            <div style={{
              background: IOS.white, borderRadius: IOS.r.xl,
              padding: 32, width: '100%', maxWidth: 400,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: IOS.primaryLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <KeyRound size={18} style={{ color: IOS.primary }} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 17, fontWeight: 800, color: IOS.ink }}>
                      Reset Password
                    </h3>
                    <p style={{ fontSize: 11, color: IOS.ink4 }}>We'll send you a reset link</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setForgotMode(false); setResetSent(false); setResetError(''); }}
                  style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: IOS.surface, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: IOS.ink3,
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {resetSent ? (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 28,
                    background: IOS.primaryLight, border: `2px solid ${IOS.primary}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <CheckCircle2 size={28} style={{ color: IOS.primary }} />
                  </div>
                  <h4 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16, fontWeight: 800, color: IOS.ink, marginBottom: 8 }}>
                    Check your email
                  </h4>
                  <p style={{ fontSize: 13, color: IOS.ink3, lineHeight: 1.5, marginBottom: 20 }}>
                    We sent a password reset link to <strong style={{ color: IOS.ink }}>{email}</strong>.<br />
                    Click the link in the email to reset your password.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setForgotMode(false); setResetSent(false); }}
                    style={{
                      width: '100%', height: 48,
                      background: IOS.surface, border: `1.5px solid ${IOS.border}`,
                      borderRadius: IOS.r.md, fontSize: 14, fontWeight: 600,
                      color: IOS.ink, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <>
                  {resetError && (
                    <div style={{
                      background: '#FEF2F2', border: '1px solid #FECACA',
                      borderRadius: IOS.r.md, padding: '10px 14px',
                      fontSize: 12, color: '#DC2626', fontWeight: 500,
                      marginBottom: 16,
                    }}>
                      {resetError}
                    </div>
                  )}
                  <p style={{ fontSize: 13, color: IOS.ink3, marginBottom: 16, lineHeight: 1.5 }}>
                    Enter your registered email address and we'll send you a link to reset your password.
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email Address"
                    autoComplete="email"
                    style={{
                      width: '100%', height: 52,
                      padding: '0 18px',
                      background: IOS.surface,
                      border: `1.5px solid ${IOS.border}`,
                      borderRadius: IOS.r.md,
                      fontSize: 15, fontFamily: "'DM Sans', sans-serif",
                      color: IOS.ink, outline: 'none',
                      marginBottom: 14,
                    }}
                  />
                  <button
                    type="button"
                    disabled={resetLoading || !email}
                    onClick={async () => {
                      if (!email) { setResetError('Please enter your email address.'); return; }
                      setResetLoading(true);
                      setResetError('');
                      try {
                        await sendPasswordResetEmail(auth, email);
                        setResetSent(true);
                      } catch (err) {
                        if (err.code === 'auth/user-not-found') {
                          // Still show success to prevent email enumeration
                          setResetSent(true);
                        } else {
                          setResetError('Failed to send reset email. Please try again.');
                        }
                      }
                      setResetLoading(false);
                    }}
                    style={{
                      width: '100%', height: 52,
                      background: resetLoading || !email ? IOS.primaryLight : `linear-gradient(135deg, ${IOS.primary}, ${IOS.accent})`,
                      color: resetLoading || !email ? IOS.primary : IOS.white,
                      border: 'none', borderRadius: IOS.r.md,
                      fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                      cursor: resetLoading || !email ? 'not-allowed' : 'pointer',
                      boxShadow: !resetLoading && email ? `0 4px 16px ${IOS.primary}30` : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'transform 0.15s',
                    }}
                    onMouseDown={e => { if (!resetLoading && email) e.currentTarget.style.transform = 'scale(0.98)'; }}
                    onMouseUp={e => e.currentTarget.style.transform = 'none'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    {resetLoading ? (
                      <><Loader2 size={16} className="animate-spin" /> Sending...</>
                    ) : (
                      <><KeyRound size={16} /> Send Reset Link</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer links */}
        <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, color: IOS.ink3 }}>
            Don't have an account?{' '}
            <Link to="/physio-signup" style={{ color: IOS.primary, fontWeight: 600, textDecoration: 'none' }}>
              Create Account
            </Link>
          </p>
          <Link to="/" style={{ fontSize: 12, color: IOS.ink4, textDecoration: 'none', fontWeight: 500 }}>
            ← Back to OnlinePT
          </Link>
        </div>
      </div>
    </div>
  );
}
