import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase/config';

/**
 * PhysioSignUpPage — LEGACY ROUTE (kept for old cached links).
 * All new signups must go through the blue landing page (/).
 * If anyone lands here with ?email= or ?firstName= params (from old PWA cache),
 * transfer the data to sessionStorage and redirect to the new SaaS onboarding.
 */
export default function PhysioSignUpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking'); // 'checking' | 'redirecting'

  useEffect(() => {
    const hasLegacyParams = searchParams.has('email') || searchParams.has('firstName');

    if (!hasLegacyParams) {
      // No legacy params — redirect to home (landing page)
      window.location.replace('/');
      return;
    }

    // Extract form data from old URL params
    const physioName = [searchParams.get('firstName'), searchParams.get('lastName')]
      .filter(Boolean).join(' ').trim();
    const email = searchParams.get('email') || '';
    const clinicName = searchParams.get('clinicName') || '';
    const subdomain = searchParams.get('subdomain') || '';
    const city = searchParams.get('city') || '';
    const qualification = searchParams.get('qualification') || '';

    // Store in sessionStorage for ClinicOnboardingFlow to pick up
    try {
      sessionStorage.setItem('pendingOnboarding', JSON.stringify({
        physioName, email, clinicName, subdomain, city, qualification,
      }));
    } catch {}

    const doRedirect = (uid) => {
      setStatus('redirecting');
      const q = uid ? `?uid=${uid}` : '';
      window.location.replace(`/saas/onboarding${q}`);
    };

    if (auth) {
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub();
        doRedirect(user?.uid || '');
      });
      const timer = setTimeout(() => doRedirect(''), 3000);
      return () => { unsub(); clearTimeout(timer); };
    } else {
      doRedirect('');
    }
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">Redirecting to signup…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-600">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Redirecting to OnlinePT</h2>
        <p className="text-gray-500 text-sm">Taking you to the new clinic signup portal. Please wait…</p>
      </div>
    </div>
  );
}
