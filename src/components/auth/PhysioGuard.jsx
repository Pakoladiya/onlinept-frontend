import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuth } from '@/firebase/auth';
import { getClinicByOwner } from '@/firebase/db';
import { Loader2 } from 'lucide-react';

/**
 * PhysioGuard — Ensures the user is authenticated before accessing physio-only routes.
 *
 * Dev bypass: run localStorage.setItem('dev_auth', '1') in browser console, OR
 *             add ?skip=1 to the URL (persists via sessionStorage)
 */
export default function PhysioGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    // Store skip flag so it survives the redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('skip') === '1') {
      sessionStorage.setItem('dev_skip_auth', '1');
    }

    const devSkip = sessionStorage.getItem('dev_skip_auth') === '1'
      || localStorage.getItem('dev_auth') === '1';

    if (devSkip) {
      setIsAuthed(true);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuth(async (user) => {
      if (user) {
        setIsAuthed(true);
        try {
          const clinic = await getClinicByOwner(user.uid);
          if (clinic?.subscriptionStatus === 'pending_approval') {
            setIsPending(true);
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setIsAuthed(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Authenticating...</p>
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/dashboard-login" replace />;
  }

  if (isPending) {
    return <Navigate to="/saas/pending" replace />;
  }

  return children;
}
