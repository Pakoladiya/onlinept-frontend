import React, { useState, useEffect } from 'react';
import { onAuth } from '@/firebase/auth';
import { getDocument } from '@/firebase/db';
import { Loader2, ShieldAlert } from 'lucide-react';

/**
 * SuperAdminGuard — Bank-grade security for Master Command Center.
 * Verifies if the authenticated user has the 'super_admin' role in Firestore.
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Authenticating Command Access...</p>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
           <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-red-100">
              <ShieldAlert size={40} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Access Restricted</h2>
              <p className="text-sm font-bold text-gray-400 mt-2 leading-relaxed">
                 You do not have the required clinical authorization level to access the Platform Command Center.
              </p>
           </div>
           <div className="pt-4 flex flex-col gap-3">
              <button 
                onClick={() => window.location.href = '/dashboard-login'}
                className="h-14 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-gray-200"
              >
                Log in as Super Admin
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
              >
                Back to Patient Terminal
              </button>
           </div>
        </div>
      </div>
    );
  }

  return children;
}
