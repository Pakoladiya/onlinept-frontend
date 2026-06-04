import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { API_BASE } from '@/utils/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

/**
 * PaymentReturnPage
 *
 * Airpay redirects the user back to:
 *   /payment-return/:bookingId
 * via a POST request containing the payment result fields.
 *
 * Because browsers deliver the POST body as a form submission (not accessible
 * via JS directly), we read the fields from the URL query string — Airpay also
 * appends them as query params on the return URL for GET-style returns.
 *
 * We then call the backend /api/payments/verify to validate the checksum,
 * update Firestore, and redirect to /confirmation or show an error.
 */
export default function PaymentReturnPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'failed'
  const [message, setMessage] = useState('Verifying your payment…');

  useEffect(() => {
    async function verifyPayment() {
      try {
        // Airpay appends result as query params on the return URL
        const params = Object.fromEntries(new URLSearchParams(window.location.search));

        // Also check if this is a mock return (no real params)
        const isMock = !params.transactionid || params.transactionid.startsWith('MOCK_');

        if (isMock && !params.transactionid) {
          // Fallback: check Firestore directly (mock mode already saved confirmed status)
          const snap = await getDoc(doc(db, 'bookings', bookingId));
          if (snap.exists() && snap.data().status === 'confirmed') {
            setStatus('success');
            setTimeout(() => navigate(`/confirmation/${bookingId}`, { state: snap.data() }), 1500);
          } else {
            setStatus('failed');
            setMessage('Payment could not be verified. Please contact support.');
          }
          return;
        }

        // Call backend to verify checksum
        const resp = await fetch(`${API_BASE}/api/payments/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        const result = await resp.json();

        if (!result.verified || params.status !== 'SUCCESS') {
          setStatus('failed');
          setMessage('Payment was not successful. Please try again or contact support.');
          return;
        }

        // Payment verified — fetch the pending booking and update it
        const bookingSnap = await getDoc(doc(db, 'bookings', bookingId));
        const bookingData = bookingSnap.exists() ? bookingSnap.data() : {};

        await setDoc(doc(db, 'bookings', bookingId), {
          ...bookingData,
          paymentId: result.transactionId || params.transactionid,
          airpayOrderId: params.orderid,
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentGateway: 'airpay',
          confirmedAt: serverTimestamp(),
        }, { merge: true });

        // WhatsApp notification
        try {
          const clinicSubdomain = bookingData?.clinicData?.subdomain || bookingData?.clinicId || 'onlinept';
          let rawPhone = (bookingData?.patientPhone || '').replace(/\D/g, '');
          if (rawPhone.startsWith('91') && rawPhone.length === 12) rawPhone = rawPhone;
          else if (rawPhone.length === 10) rawPhone = '91' + rawPhone;
          const formattedPhone = `+${rawPhone}`;

          await fetch(`${API_BASE}/api/appointments/notify-success`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientData: {
                name:              bookingData.patientName || 'Patient',
                phone:             formattedPhone,
                subdomain:         clinicSubdomain,
                dateDisplay:       bookingData.dateDisplay || bookingData.date,
                slotLabel:         bookingData.slotLabel || bookingData.slot?.time || '',
                serviceName:       bookingData.serviceName || 'Consultation',
                preferredPlatform: 'whatsapp',
                meetingLink:       `https://${clinicSubdomain}.onlinept.in/join/${bookingId}`,
              },
            }),
          });
        } catch (waErr) { console.warn('[WA] Notification non-critical failure:', waErr); }

        setStatus('success');
        setMessage('Payment confirmed! Redirecting…');
        setTimeout(() => navigate(`/confirmation/${bookingId}`, {
          state: { ...bookingData, paymentId: result.transactionId },
        }), 1500);

      } catch (err) {
        console.error('[PaymentReturn] Verification error:', err);
        setStatus('failed');
        setMessage('An error occurred while verifying your payment. Please contact support.');
      }
    }

    verifyPayment();
  }, [bookingId, navigate]);

  const pColor = '#14A3A8';

  return (
    <div style={{
      background: '#09090B', color: '#F8FAFC', minHeight: '100vh',
      fontFamily: "'Manrope', sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 24, padding: 24,
    }}>
      {status === 'verifying' && (
        <>
          <Loader2 size={48} style={{ color: pColor, animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 18, fontWeight: 700, color: '#94A3B8' }}>{message}</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle2 size={64} style={{ color: '#22C55E' }} />
          <p style={{ fontSize: 22, fontWeight: 800 }}>Payment Successful!</p>
          <p style={{ fontSize: 15, color: '#94A3B8' }}>{message}</p>
        </>
      )}
      {status === 'failed' && (
        <>
          <XCircle size={64} style={{ color: '#EF4444' }} />
          <p style={{ fontSize: 22, fontWeight: 800 }}>Payment Failed</p>
          <p style={{ fontSize: 15, color: '#94A3B8', textAlign: 'center', maxWidth: 400 }}>{message}</p>
          <button
            onClick={() => navigate(-2)}
            style={{
              marginTop: 16, padding: '14px 32px', background: pColor, color: '#fff',
              border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </>
      )}
    </div>
  );
}