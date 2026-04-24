import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

/**
 * /wa/:subdomain
 *
 * Redirect page used by the WhatsApp template "Talk To Clinic" button.
 * Looks up the clinic's stored phone number and opens a wa.me link.
 *
 * Template button URL should be set to:
 *   https://onlinept.in/wa/nijanand
 *   (replace "nijanand" with the clinic's subdomain)
 */
export default function ClinicWhatsAppRedirect() {
  const { subdomain } = useParams();
  const [status, setStatus] = useState('loading'); // loading | redirecting | error

  useEffect(() => {
    async function redirect() {
      if (!subdomain) { setStatus('error'); return; }

      try {
        // Fetch clinic document directly by subdomain (doc ID)
        const snap = await getDoc(doc(db, 'clinics', subdomain));

        if (!snap.exists()) { setStatus('error'); return; }

        const data = snap.data();

        // Phone stored in clinic root or settings
        let phone = data.phone || data.settings?.phone || '';

        // Normalize to digits only then build +91 number
        phone = phone.replace(/\D/g, '');
        if (phone.length === 10) phone = '91' + phone;

        if (!phone) { setStatus('error'); return; }

        const greeting = encodeURIComponent(
          `Hi ${data.clinicName || 'clinic'}, I have a query about my appointment.`
        );

        setStatus('redirecting');

        // Redirect to WhatsApp
        window.location.href = `https://wa.me/${phone}?text=${greeting}`;
      } catch (err) {
        console.error('[WA Redirect]', err);
        setStatus('error');
      }
    }

    redirect();
  }, [subdomain]);

  return (
    <div style={{
      minHeight: '100vh', background: '#0F172A', color: '#F8FAFC',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', fontFamily: "'Manrope', sans-serif", gap: 20,
      textAlign: 'center', padding: 24
    }}>
      {status === 'loading' && (
        <>
          <Loader2 size={36} style={{ color: '#25D366' }} className="animate-spin" />
          <p style={{ fontSize: 16, fontWeight: 600, color: '#94A3B8' }}>
            Looking up clinic contact…
          </p>
        </>
      )}

      {status === 'redirecting' && (
        <>
          <div style={{ fontSize: 48 }}>💬</div>
          <p style={{ fontSize: 18, fontWeight: 700 }}>Opening WhatsApp…</p>
          <p style={{ fontSize: 13, color: '#94A3B8' }}>
            If WhatsApp didn't open,{' '}
            <a
              href={`https://wa.me/${subdomain}`}
              style={{ color: '#25D366', fontWeight: 700 }}
            >
              click here
            </a>
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <p style={{ fontSize: 18, fontWeight: 700 }}>Clinic not found</p>
          <p style={{ fontSize: 13, color: '#94A3B8', maxWidth: 320 }}>
            The clinic "{subdomain}" could not be located. Please go back and
            contact the clinic directly.
          </p>
          <a
            href="/"
            style={{
              marginTop: 16, padding: '12px 28px', borderRadius: 100,
              background: '#25D366', color: '#fff', textDecoration: 'none',
              fontWeight: 700, fontSize: 14
            }}
          >
            Go to OnlinePT.in
          </a>
        </>
      )}
    </div>
  );
}
