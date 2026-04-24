import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailPassword, signInWithCustomToken, setAuthPersistence } from '@/firebase/auth';
import { auth } from '@/firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Sparkles, X, KeyRound, Fingerprint, ShieldCheck, MessageSquare, Smartphone } from 'lucide-react';
import { isSuperAdminEmail } from '@/config/superAdminConfig';
import { isBiometricAvailable } from '@/utils/biometricAuth';
import axios from 'axios';

const T = {
  primary: '#0EA5E9', // iOS-style Cyan/Blue
  primaryVibrant: '#38BDF8',
  bg: '#020617', // Deep Midnight
  bgCard: 'rgba(15, 23, 42, 0.6)', 
  surface: 'rgba(255, 255, 255, 0.03)',
  white: '#FFFFFF',
  ink: '#F8FAFC',
  inkSecondary: '#94A3B8',
  border: 'rgba(255, 255, 255, 0.1)',
  glass: 'blur(30px)',
  r: { sm: 12, md: 16, lg: 24, xl: 32 },
};

const API_BASE = import.meta.env.DEV ? 'http://localhost:5001' : '';

export default function PhysioLoginPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState('password'); // 'password' | 'whatsapp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    document.title = 'Physio Access | OnlinePT';
    isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  async function handleLogin(e) {
    if (e) e.preventDefault();
    if (method === 'password') {
      if (!email || !password) { setError('Please enter your email and password.'); return; }
      setLoading(true);
      setError('');
      try {
        await setAuthPersistence(rememberMe);
        const cred = await signInWithEmailPassword(email, password);
        if (cred?.user) {
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
    } else {
      // WhatsApp OTP Verification
      if (!otp) { setError('Please enter the OTP sent to your WhatsApp.'); return; }
      setLoading(true);
      setError('');
      try {
        const res = await axios.post(`${API_BASE}/api/notifications/verify-otp`, { phone, otp });
        if (res.data.success) {
          let firebaseSignedIn = false;
          if (res.data.token) {
            try {
              await signInWithCustomToken(res.data.token);
              firebaseSignedIn = true;
              console.log('[OTP Login] Firebase custom token sign-in successful.');
            } catch (tokenErr) {
              console.warn('[OTP Login] Custom token sign-in failed:', tokenErr.message);
            }
          }

          // Always set whatsapp session flags so PhysioDashboard can allow access
          // even when Firebase custom token isn't available (user not in users collection yet)
          localStorage.setItem('auth_method', 'whatsapp');
          localStorage.setItem('auth_phone', phone);
          localStorage.setItem('whatsapp_session', JSON.stringify({
            phone,
            purpose: res.data.purpose || 'signin',
            userId: res.data.userId || null,
            firebaseSignedIn,
            expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8-hour session
          }));

          const dest = isSuperAdminEmail(email || '') ? '/saas/dashboard' : '/dashboard';
          navigate(dest);
        } else {
          setError(res.data.error || 'Invalid OTP');
        }
      } catch (err) {
        console.error('[OTP Verify Error]:', err);
        const detail = err.response?.data?.error || err.response?.data?.details || err.message;
        setError(`Verification failed: ${detail}`);
      }
      setLoading(false);
    }
  }

  async function sendWhatsAppOTP() {
    if (!phone) { setError('Please enter your WhatsApp number.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE}/api/notifications/send-otp`, { 
        phone, 
        purpose: 'signin',
        userName: 'Physio' 
      });
      if (res.data.success) {
        setOtpSent(true);
      } else {
        setError(res.data.error || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('[OTP Send Debug]:', err);
      const detail = err.response?.data?.error || err.response?.data?.details || err.message;
      setError(`Failed to send OTP: ${detail}`);
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: T.bg, justifyContent: 'center', alignItems: 'center',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: T.ink,
      padding: 20
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        .login-card {
           width: 100%;
           max-width: 400px;
           background: ${T.bgCard};
           backdrop-filter: ${T.glass};
           -webkit-backdrop-filter: ${T.glass};
           border: 1px solid ${T.border};
           border-radius: 32px;
           padding: 40px 32px;
           box-shadow: 0 40px 100px rgba(0,0,0,0.5);
           animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        
        .login-input:focus {
           border-color: ${T.primary} !important;
           background: rgba(255,255,255,0.06) !important;
           box-shadow: 0 0 0 4px ${T.primary}15 !important;
        }
        .btn-primary:active { transform: scale(0.97); opacity: 0.9; }

        .method-tab {
          flex: 1;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid transparent;
          font-size: 13,
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          background: rgba(255,255,255,0.02);
          color: ${T.inkSecondary};
        }
        .method-tab.active {
          background: rgba(255,255,255,0.06);
          border-color: ${T.border};
          color: ${T.ink};
        }
      `}</style>

      {/* Decorative Blob */}
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '40%', background: `radial-gradient(circle, ${T.primary}15 0%, transparent 70%)`, filter: 'blur(60px)', zIndex: 0 }} />

      <div className="login-card" style={{ zIndex: 1, position: 'relative' }}>
          {/* Logo Section */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: `linear-gradient(135deg, ${T.primary}, #0ea5e9)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: `0 12px 24px ${T.primary}30` }}>
              <Sparkles size={32} color="#FFF" />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 4 }}>Physio Access</h1>
            <p style={{ fontSize: 14, color: T.inkSecondary, fontWeight: 500 }}>Secure Command Center Login</p>
          </div>

          {/* Method Switcher */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 16 }}>
            <div 
              className={`method-tab ${method === 'password' ? 'active' : ''}`}
              onClick={() => { setMethod('password'); setError(''); }}
            >
              <Smartphone size={16} /> Password
            </div>
            <div 
              className={`method-tab ${method === 'whatsapp' ? 'active' : ''}`}
              onClick={() => { setMethod('whatsapp'); setError(''); }}
            >
              <MessageSquare size={16} /> WhatsApp
            </div>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {method === 'password' ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: T.inkSecondary, textTransform: 'uppercase', letterSpacing: '1px', marginLeft: 4 }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="physio@onlinept.in"
                    className="login-input"
                    style={{
                      width: '100%', height: 56, padding: '0 20px', borderRadius: 16,
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`,
                      color: T.ink, fontSize: 16, fontWeight: 500, outline: 'none', transition: 'all 0.3s'
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: 4 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: T.inkSecondary, textTransform: 'uppercase', letterSpacing: '1px' }}>Secret Key</label>
                    <button type="button" onClick={() => setForgotMode(true)} style={{ color: T.primary, fontSize: 12, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Forgot?</button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="login-input"
                      style={{
                        width: '100%', height: 56, padding: '0 20px', borderRadius: 16,
                        background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`,
                        color: T.ink, fontSize: 16, fontWeight: 500, outline: 'none', transition: 'all 0.3s'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.inkSecondary, cursor: 'pointer' }}
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: T.inkSecondary, textTransform: 'uppercase', letterSpacing: '1px', marginLeft: 4 }}>WhatsApp Number</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="916356685487"
                      disabled={otpSent}
                      className="login-input"
                      style={{
                        width: '100%', height: 56, padding: '0 20px', borderRadius: 16,
                        background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`,
                        color: T.ink, fontSize: 16, fontWeight: 500, outline: 'none', transition: 'all 0.3s',
                        opacity: otpSent ? 0.6 : 1
                      }}
                      required
                    />
                    {otpSent && (
                      <button 
                        type="button" 
                        onClick={() => { setOtpSent(false); setOtp(''); }}
                        style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Change
                      </button>
                    )}
                  </div>
                </div>

                {otpSent && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'slideUp 0.4s ease-out' }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: T.inkSecondary, textTransform: 'uppercase', letterSpacing: '1px', marginLeft: 4 }}>Enter 6-Digit OTP</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      className="login-input"
                      style={{
                        width: '100%', height: 56, padding: '0 20px', borderRadius: 16,
                        background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`,
                        color: T.ink, fontSize: 24, fontWeight: 800, textAlign: 'center', letterSpacing: '8px', outline: 'none', transition: 'all 0.3s'
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                      required
                    />
                    <button
                      type="button"
                      onClick={sendWhatsAppOTP}
                      style={{ alignSelf: 'flex-end', background: 'none', border: 'none', color: T.inkSecondary, fontSize: 12, cursor: 'pointer', marginTop: 4 }}
                    >
                      Resend OTP
                    </button>
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', cursor: 'pointer' }} onClick={() => setRememberMe(!rememberMe)}>
              <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ width: 18, height: 18, accentColor: T.primary }} id="remember" />
              <label htmlFor="remember" style={{ fontSize: 14, color: T.inkSecondary, fontWeight: 500, cursor: 'pointer' }}>Stay signed in on this device</label>
            </div>

            {error && (
              <div style={{ padding: '14px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 14, color: '#ef4444', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={18} /> {error}
              </div>
            )}

            {!otpSent && method === 'whatsapp' ? (
              <button
                type="button"
                onClick={sendWhatsAppOTP}
                disabled={loading}
                className="btn-primary"
                style={{
                  height: 60, borderRadius: 18, background: T.primary, color: T.white,
                  border: 'none', fontSize: 16, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  boxShadow: `0 12px 32px ${T.primary}40`, transition: 'all 0.3s', marginTop: 12
                }}
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : <>Send OTP <MessageSquare size={20} /></>}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  height: 60, borderRadius: 18, background: T.primary, color: T.white,
                  border: 'none', fontSize: 16, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  boxShadow: `0 12px 32px ${T.primary}40`, transition: 'all 0.3s', marginTop: 12
                }}
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : <>Sign In <ShieldCheck size={20} /></>}
              </button>
            )}
          </form>

          {/* Biometric Integration (Native iOS Feel) */}
          {biometricAvailable && localStorage.getItem('biometric_creds') && method === 'password' && (
            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                onClick={async () => {
                  const { authenticateBiometric } = await import('@/utils/biometricAuth');
                  const creds = JSON.parse(localStorage.getItem('biometric_creds') || '{}');
                  const userIds = Object.keys(creds);
                  if (userIds.length > 0) {
                    const result = await authenticateBiometric(userIds[0]);
                    if (result.success) navigate('/dashboard');
                  }
                }}
                className="btn-primary"
                style={{
                  width: '100%', height: 60, borderRadius: 18,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: T.ink, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, transition: 'all 0.3s'
                }}
              >
                <Fingerprint size={24} style={{ color: T.primary }} /> FaceID Login
              </button>
            </div>
          )}
      </div>

      {/* Simplified Footer */}
      <div style={{ marginTop: 40, textAlign: 'center', opacity: 0.5 }}>
         <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.5px' }}>&copy; 2026 OnlinePT. Secured Clinical Gateway.</p>
      </div>

      {/* Forgot Password Modal */}
      {forgotMode && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
           <div style={{ maxWidth: 400, width: '100%', padding: 40, borderRadius: 32, background: T.bgCard, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                 <h2 style={{ fontSize: 24, fontWeight: 800 }}>Account Recovery</h2>
                 <button onClick={() => setForgotMode(false)} style={{ background: 'none', border: 'none', color: T.inkSecondary, cursor: 'pointer' }}><X size={24} /></button>
              </div>
              
              {!resetSent ? (
                <>
                  <p style={{ fontSize: 15, color: T.inkSecondary, lineHeight: 1.6, marginBottom: 32 }}>
                    Enter your email address to receive an encrypted reset link.
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="physio@onlinept.in"
                    className="login-input"
                    style={{
                      width: '100%', height: 56, padding: '0 20px', borderRadius: 16,
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`,
                      color: T.ink, fontSize: 16, fontWeight: 500, outline: 'none', marginBottom: 24
                    }}
                  />
                  <button
                    onClick={async () => {
                      if (!email) { setResetError('Email is required'); return; }
                      setResetLoading(true); setResetError('');
                      try { await sendPasswordResetEmail(auth, email); setResetSent(true); }
                      catch (err) { setResetError(err.message); }
                      setResetLoading(false);
                    }}
                    style={{
                      width: '100%', height: 60, borderRadius: 16, background: T.primary, color: T.white,
                      border: 'none', fontSize: 16, fontWeight: 800, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
                    }}
                  >
                    {resetLoading ? <Loader2 size={24} className="animate-spin" /> : <>Send Reset Link <KeyRound size={20} /></>}
                  </button>
                  {resetError && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 16, textAlign: 'center' }}>{resetError}</p>}
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                   <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                      <CheckCircle2 size={32} />
                   </div>
                   <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Check your inbox</h3>
                   <p style={{ fontSize: 15, color: T.inkSecondary, lineHeight: 1.6, marginBottom: 32 }}>
                     We've sent a recovery link to <strong>{email}</strong>.
                   </p>
                   <button onClick={() => setForgotMode(false)} style={{ color: T.primary, fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}>Back to login</button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
