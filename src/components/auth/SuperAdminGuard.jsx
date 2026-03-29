import React, { useState, useEffect } from 'react';
import { onAuth } from '@/firebase/auth';
import { getDocument } from '@/firebase/db';
import { isSuperAdminEmail } from '@/config/superAdminConfig';
import { Loader2, ShieldAlert } from 'lucide-react';

/**
 * SuperAdminGuard — Bank-grade security for Master Command Center.
 * Verifies if the authenticated user has the 'super_admin' role in Firestore,
 * OR if their email matches the configured super admin email.
 */
export default function SuperAdminGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuth(async (user) => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        // Silently check by email first (the primary super admin)
        if (isSuperAdminEmail(user.email)) {
          setIsAdmin(true);
          setLoading(false);
          return;
        }
        // Handshake with Firestore to verify role
        const userData = await getDocument('users', user.uid);
        if (userData && userData.role === 'super_admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Super Admin Handshake Failed:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', flexDirection: 'column', gap: 16 }}>
        <Loader2 size={40} className="animate-spin" style={{ color: '#0D7377' }} />
        <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '2px', textTransform: 'uppercase' }}>Authenticating Command Access...</p>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', padding: 24 }}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center', animation: 'scaleIn 0.4s ease both' }}>
           <div style={{
              width: 80, height: 80, borderRadius: '2rem',
              background: 'rgba(239,68,68,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              border: '1px solid rgba(239,68,68,0.3)',
           }}>
              <ShieldAlert size={40} style={{ color: '#EF4444' }} />
           </div>
           <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 28, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.5px', marginBottom: 12 }}>
                Access Restricted
              </h2>
              <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.6 }}>
                 You do not have the required authorization level to access the Platform Command Center.
              </p>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => window.location.href = '/dashboard-login'}
                style={{
                  height: 52, background: `linear-gradient(135deg, #0D7377, #14A3A8)`,
                  color: 'white', border: 'none', borderRadius: 14,
                  fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', width: '100%',
                  boxShadow: '0 8px 24px rgba(13,115,119,0.4)',
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: '0.5px',
                }}
              >
                Log in as Super Admin
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  background: 'none', border: 'none',
                  fontSize: 13, color: '#64748B',
                  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
              >
                ← Back to Patient Site
              </button>
           </div>
        </div>
        <style>{`
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
          @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        `}</style>
      </div>
    );
  }

  return children;
}
