import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { Loader2, ArrowRight, Activity, Zap, Sparkles, X } from 'lucide-react';

/**
 * PhysioSignUpPage — LEGACY ROUTE (renovated for Luxe Midnight theme).
 * All new signups should go through the main landing page, but legacy links
 * carrying parameters are handled here with a premium transition.
 */

const T = {
  bg: '#0B0F1A',
  bgCard: 'rgba(30, 41, 59, 0.4)',
  glass: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  ink: '#F8FAFC',
  ink2: '#94A3B8',
  ink3: '#64748B',
  primary: '#14A3A8',
  white: '#FFFFFF',
  blur: 'blur(24px)',
  r: { md: 20, lg: 32 },
};

export default function PhysioSignUpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking'); // 'checking' | 'redirecting'

  useEffect(() => {
    document.title = 'Joining Network | OnlinePT';
    const hasLegacyParams = searchParams.has('email') || searchParams.has('firstName');

    if (!hasLegacyParams) {
      window.location.replace('/');
      return;
    }

    const physioName = [searchParams.get('firstName'), searchParams.get('lastName')]
      .filter(Boolean).join(' ').trim();
    const email = searchParams.get('email') || '';
    const clinicName = searchParams.get('clinicName') || '';
    const subdomain = searchParams.get('subdomain') || '';
    const city = searchParams.get('city') || '';
    const qualification = searchParams.get('qualification') || '';

    try {
      sessionStorage.setItem('pendingOnboarding', JSON.stringify({
        physioName, email, clinicName, subdomain, city, qualification,
      }));
    } catch {}

    const doRedirect = (uid) => {
      setStatus('redirecting');
      const q = uid ? `?uid=${uid}` : '';
      setTimeout(() => {
        window.location.replace(`/saas/onboarding${q}`);
      }, 1500); // Aesthetic delay
    };

    if (auth) {
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub();
        doRedirect(user?.uid || '');
      });
      const timer = setTimeout(() => doRedirect(''), 5000);
      return () => { unsub(); clearTimeout(timer); };
    } else {
      doRedirect('');
    }
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `radial-gradient(circle at 50% 0%, ${T.primary}15 0%, transparent 50%), ${T.bg}`,
      padding: 24, fontFamily: "'DM Sans', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@800&family=DM+Sans:wght@400;500;700&display=swap');
        @keyframes orbit { 
          from { transform: rotate(0deg) translateX(40px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(40px) rotate(-360deg); }
        }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
      
      <div style={{ 
        width: '100%', maxWidth: 440, textAlign: 'center',
        animation: 'fadeInScale 0.8s cubic-bezier(0.16, 1, 0.3, 1) both'
      }}>
        
        {/* Animated Brand Core */}
        <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 40px' }}>
          <div style={{ 
            position: 'absolute', inset: 0, borderRadius: '50%', 
            background: `linear-gradient(135deg, ${T.primary}, #0D9488)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 20px 40px ${T.primary}30`, zIndex: 2,
            animation: 'float 4s ease-in-out infinite'
          }}>
            <Activity size={48} color="white" />
          </div>
          <div style={{ 
            position: 'absolute', top: '50%', left: '50%', width: 12, height: 12,
            background: T.primary, borderRadius: '50%', zIndex: 1,
            animation: 'orbit 3s linear infinite', opacity: 0.6
          }} />
          <div style={{ 
            position: 'absolute', top: '50%', left: '50%', width: 8, height: 8,
            background: '#8B5CF6', borderRadius: '50%', zIndex: 1,
            animation: 'orbit 5s linear infinite reverse', opacity: 0.4
          }} />
        </div>

        <h1 style={{ 
          fontFamily: "'Manrope', sans-serif", fontSize: 32, fontWeight: 800, 
          color: T.ink, letterSpacing: '-1px', marginBottom: 16 
        }}>
          Online<span style={{ color: T.primary }}>PT</span>
        </h1>

        <div style={{ 
          background: T.bgCard, borderRadius: T.r.lg, border: `1px solid ${T.glassBorder}`,
          padding: 40, backdropFilter: T.blur, boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
          position: 'relative', overflow: 'hidden'
        }}>
           <div style={{ position: 'absolute', top: -100, right: -100, width: 200, height: 200, background: `${T.primary}05`, borderRadius: '50%' }} />
           
           <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ 
                display: 'inline-flex', alignItems: 'center', gap: 8, 
                background: 'rgba(20, 163, 168, 0.1)', padding: '8px 16px', borderRadius: 100,
                color: T.primary, fontSize: 12, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '1px', marginBottom: 24
              }}>
                <Zap size={14} /> Synchronizing Credentials
              </div>
              
              <h2 style={{ fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 12 }}>
                Redirecting to Portal
              </h2>
              <p style={{ fontSize: 15, color: T.ink2, lineHeight: 1.6, marginBottom: 32 }}>
                We're preparing your clinical workspace. <br />
                Your previous data has been securely transferred.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <div style={{ position: 'relative' }}>
                  <Loader2 className="animate-spin" color={T.primary} size={32} />
                  <Sparkles size={14} color={T.primary} style={{ position: 'absolute', top: -8, right: -8, animation: 'float 3s infinite' }} />
                </div>
                
                <p style={{ fontSize: 13, color: T.ink3, fontWeight: 600, letterSpacing: '0.5px' }}>
                  Please wait a moment…
                </p>
              </div>
           </div>
        </div>

        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center', gap: 32 }}>
           <Link to="/" style={{ color: T.ink3, textDecoration: 'none', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
             <X size={16} /> Cancel
           </Link>
           <span style={{ height: 20, width: 1, background: T.glassBorder }} />
           <Link to="/help" style={{ color: T.ink3, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Help Center</Link>
        </div>

      </div>
    </div>
  );
}
