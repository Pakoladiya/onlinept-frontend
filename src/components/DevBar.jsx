import React, { useState, useEffect } from 'react';
import { Globe, Shield, Terminal, Zap, ChevronRight, X } from 'lucide-react';

/**
 * DevBar — A premium floating utility for engineers.
 * Only appears on localhost. Helps toggle between Master Platform and Clinic Portals.
 */
export default function DevBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  const currentUrl = new URL(window.location.href);
  const isClinic = currentUrl.searchParams.has('dev') || currentUrl.searchParams.has('tenant');

  const toggleDev = () => {
    if (isClinic) {
      currentUrl.searchParams.delete('dev');
      currentUrl.searchParams.delete('tenant');
    } else {
      currentUrl.searchParams.set('dev', '1');
    }
    window.location.href = currentUrl.toString();
  };

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12,
    }}>
      {isExpanded && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 24,
          padding: 20, width: 280, boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
          color: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
               <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: '#38BDF8' }}>Offline Lab</p>
               <h4 style={{ fontSize: 16, fontWeight: 800 }}>Dev Control</h4>
            </div>
            <button onClick={() => setIsExpanded(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X size={18} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button 
              onClick={toggleDev}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                background: isClinic ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                border: isClinic ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 16, width: '100%', textAlign: 'left', cursor: 'pointer', color: 'inherit',
                transition: 'all 0.2s'
              }}
            >
              <Globe size={18} color={isClinic ? '#38BDF8' : '#94A3B8'} />
              <div style={{ flex: 1 }}>
                 <p style={{ fontSize: 13, fontWeight: 700 }}>{isClinic ? 'Clinic View' : 'Master Platform'}</p>
                 <p style={{ fontSize: 11, color: '#94A3B8' }}>{isClinic ? 'Viewing individual clinic flow' : 'Platform landing / login'}</p>
              </div>
              <Zap size={14} color={isClinic ? '#38BDF8' : 'transparent'} />
            </button>

            <button 
              onClick={() => { localStorage.setItem('dev_auth', '1'); window.location.reload(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 16, width: '100%', textAlign: 'left', cursor: 'pointer', color: 'inherit'
              }}
            >
              <Shield size={18} color="#10B981" />
              <div>
                 <p style={{ fontSize: 13, fontWeight: 700 }}>Force Auth</p>
                 <p style={{ fontSize: 11, color: '#94A3B8' }}>Bypass clinic & super admin logins</p>
              </div>
            </button>
          </div>

          <div style={{ marginTop: 24, padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
             <p style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}><Terminal size={12} /> Local: <span style={{ color: '#F1F5F9' }}>{window.location.pathname}</span></p>
          </div>
        </div>
      )}

      {!isExpanded && (
        <button 
          onClick={() => setIsExpanded(true)}
          style={{
            width: 56, height: 56, borderRadius: '50%', background: '#0F172A',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)', transition: 'all 0.3s'
          }}
        >
          <Zap size={24} color="#38BDF8" fill="#38BDF8" style={{ filter: 'drop-shadow(0 0 8px #38BDF8)' }} />
        </button>
      )}

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
