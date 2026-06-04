import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PageTransition, Reveal } from '../components/layout/LuxeMotion';
import { 
  CreditCard, Shield, Lock, CheckCircle2, 
  ArrowLeft, ArrowRight, Loader2, Info, Activity,
  Stethoscope, Zap, Sparkles, AlertCircle
} from 'lucide-react';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { API_BASE } from '@/utils/api';

const T = {
  bg: '#0F172A',
  ink: '#F8FAFC',
  ink2: '#94A3B8',
  glass: 'rgba(30, 41, 59, 0.4)',
  border: 'rgba(255, 255, 255, 0.08)',
};

const Metric = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <span style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
    <span style={{ fontSize: 15, fontWeight: 800, color: color || '#F8FAFC' }}>{value}</span>
  </div>
);

export default function PaymentPage() {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state || {};

  // Hidden form ref — used to auto-submit to Airpay gateway
  const formRef = useRef(null);

  if (Object.keys(bookingData).length === 0 && !bookingId) {
    navigate('/');
    return null;
  }

  const { intakeData } = bookingData;
  
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [clinicData, setClinicData] = useState(null);

  // Airpay form params — populated by create-order response, then form auto-submits
  const [airpayParams, setAirpayParams] = useState(null);
  const [airpayGatewayUrl, setAirpayGatewayUrl] = useState('');

  useEffect(() => {
    async function loadConfig() {
      if (bookingData.clinicId) {
        const cSnap = await getDoc(doc(db, 'clinics', bookingData.clinicId));
        if (cSnap.exists()) setClinicData({ id: cSnap.id, ...cSnap.data() });
      }
    }
    loadConfig();
  }, [bookingData.clinicId]);

  // When airpayParams are set, auto-submit the hidden form to the gateway
  useEffect(() => {
    if (airpayParams && airpayGatewayUrl && formRef.current) {
      formRef.current.submit();
    }
  }, [airpayParams, airpayGatewayUrl]);

  const pColor = clinicData?.primaryColor || '#007AFF';
  
  const fmt = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0';
    return Number(val).toLocaleString('en-IN');
  };

  const totalPrice = bookingData.servicePrice || clinicData?.consultationFee || 0;

  const handlePayment = async () => {
    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const physioId     = clinicData?.uid || clinicData?.ownerId || '';
      const rawPhone     = (intakeData?.personalInfo?.whatsapp || bookingData?.patientPhone || '').replace(/\D/g, '');
      const patientPhone = rawPhone.length === 10 ? `+91${rawPhone}` : rawPhone.length === 12 ? `+${rawPhone}` : rawPhone;
      const patientName  = intakeData?.personalInfo?.fullName || bookingData?.patientName || '';
      const fullName     = patientName.trim();
      const nameParts    = fullName.split(' ');
      const firstName    = nameParts[0] || 'Patient';
      const lastName     = nameParts.slice(1).join(' ') || '';

      // Build the return URL — Airpay will POST back here after payment
      const returnUrl = `${window.location.origin}/payment-return/${bookingId}`;

      // 1. Create a pending booking record so the return page can update it
      const bookingRef = doc(db, 'bookings', bookingId);
      await setDoc(bookingRef, {
        ...bookingData,
        physioId,
        patientPhone,
        patientName,
        clinicId: bookingData.clinicId,
        status: 'pending_payment',
        paymentStatus: 'pending',
        paymentGateway: 'airpay',
        createdAt: serverTimestamp(),
      });

      // 2. Call backend to get signed Airpay params
      const resp = await fetch(`${API_BASE}/api/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          amount: totalPrice,
          buyerFirstName: firstName,
          buyerLastName:  lastName,
          buyerEmail:     intakeData?.personalInfo?.email || 'patient@onlinept.in',
          buyerPhone:     rawPhone.length === 10 ? rawPhone : rawPhone.slice(-10),
          returnUrl,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to initiate payment');
      }

      const data = await resp.json();

      // Mock mode — simulate success without redirecting
      if (data.mode === 'test') {
        await handlePaymentSuccess({
          transactionId: `MOCK_TXN_${Date.now()}`,
          orderId: data.params.orderid,
          physioId,
          patientPhone,
          patientName,
        });
        return;
      }

      // Real mode — set params and let the useEffect auto-submit the form
      setAirpayGatewayUrl(data.gatewayUrl);
      setAirpayParams(data.params);
      // Note: paymentLoading stays true until the page navigates away

    } catch (err) {
      console.error('[Airpay] Payment initiation failed:', err);
      setPaymentError(err.message || 'Payment initiation failed. Please try again.');
      setPaymentLoading(false);
    }
  };

  /**
   * Called in mock mode to complete the booking without a real redirect.
   */
  const handlePaymentSuccess = async ({ transactionId, orderId, physioId, patientPhone, patientName }) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await setDoc(bookingRef, {
        ...bookingData,
        physioId,
        patientPhone,
        patientName,
        clinicId: bookingData.clinicId,
        paymentId: transactionId,
        airpayOrderId: orderId,
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentGateway: 'airpay',
        createdAt: serverTimestamp(),
      });

      // Upsert patient record
      if (physioId && patientPhone) {
        try {
          await addDoc(collection(db, 'patients'), {
            name: patientName,
            phone: patientPhone,
            whatsapp: patientPhone,
            physioId,
            clinicId: bookingData.clinicId,
            age:    intakeData?.personalInfo?.age    || '',
            gender: intakeData?.personalInfo?.gender || '',
            createdAt: serverTimestamp(),
          });
        } catch (pErr) { console.warn('Patient upsert skipped:', pErr); }
      }

      // WhatsApp notification
      try {
        let rawPhone = (intakeData?.personalInfo?.whatsapp || '').replace(/\D/g, '');
        if (rawPhone.length === 10) rawPhone = '91' + rawPhone;
        const formattedPhone = `+${rawPhone}`;
        const clinicSubdomain = clinicData?.subdomain || clinicData?.id || bookingData.clinicId || 'onlinept';

        await fetch(`${API_BASE}/api/appointments/notify-success`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientData: {
              name:              intakeData?.personalInfo?.fullName,
              phone:             formattedPhone,
              subdomain:         clinicSubdomain,
              dateDisplay:       bookingData.dateDisplay || bookingData.date,
              slotLabel:         bookingData.slotLabel || bookingData.slot?.time || '',
              serviceName:       bookingData.serviceName || 'Consultation',
              preferredPlatform: intakeData?.clinicalInfo?.preferredPlatform || 'whatsapp',
              meetingLink:       `https://${clinicSubdomain}.onlinept.in/join/${bookingId}`,
            },
          }),
        });
      } catch (err) { console.warn('[WA] Booking notification non-critical failure:', err); }

      navigate(`/confirmation/${bookingId}`, {
        state: { ...bookingData, paymentId: transactionId },
      });
    } catch (dbErr) {
      console.error('Booking save failed:', dbErr);
      setPaymentError('Appointment confirmed, but failed to save record. Contact support.');
      setPaymentLoading(false);
    }
  };

  return (
    <PageTransition>
      <div style={{ background: '#09090B', color: '#F8FAFC', minHeight: '100vh', fontFamily: "'Manrope', sans-serif" }}>
        
        {/* Background Gradient */}
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: `radial-gradient(circle at bottom right, ${pColor}15 0%, transparent 60%)`, pointerEvents: 'none' }}></div>

        {/* Hidden Airpay form — auto-submitted when airpayParams are set */}
        {airpayParams && airpayGatewayUrl && (
          <form
            ref={formRef}
            method="POST"
            action={airpayGatewayUrl}
            style={{ display: 'none' }}
          >
            {Object.entries(airpayParams).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}
          </form>
        )}

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 650, margin: '0 auto', padding: '80px 24px 120px' }}>
          
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, cursor: 'pointer', color: '#94A3B8' }} onClick={() => navigate(-1)}>
                <ArrowLeft size={18} /> <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Back</span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: `${pColor}20`, color: pColor, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><CreditCard size={32} /></div>
                <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em' }}>Review & <span style={{ color: pColor }}>Checkout</span></h1>
                <p style={{ color: '#94A3B8', marginTop: 12, fontWeight: 500 }}>Confirm your appointment details to proceed with the secure payment.</p>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="glass-card" style={{ padding: '40px', marginBottom: 24 }}>
                <Metric label="Consultation" value={bookingData.serviceName} />
                <Metric label="Date & Time" value={`${bookingData.dateDisplay || bookingData.date} • ${bookingData.slotLabel || bookingData.slot?.time}`} />
                <Metric label="Patient" value={intakeData?.personalInfo?.fullName || 'Patient'} />
                <Metric label="Total Payable" value={`₹${fmt(totalPrice)}`} color={pColor} />
                
                <div style={{ marginTop: 40, padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#94A3B8', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Zap size={16} style={{ color: pColor }} /> Fast Checkout Features
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 10, color: '#64748B', fontSize: 13, fontWeight: 600 }}>
                      <li>Instant appointment confirmation via WhatsApp</li>
                      <li>Receipt will be sent to {intakeData?.personalInfo?.email}</li>
                      <li>HIPAA compliant end-to-end encrypted record</li>
                  </ul>
                </div>
            </div>
          </Reveal>

          {paymentError && (
            <div style={{ padding: '16px 24px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 18, color: '#EF4444', marginBottom: 24, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertCircle size={20} /> {paymentError}
            </div>
          )}

          <Reveal delay={0.3}>
            <div style={{ display: 'grid', gap: 20 }}>
                <button 
                  onClick={handlePayment} disabled={paymentLoading}
                  style={{ 
                    height: 72, background: pColor, color: '#FFF', border: 'none', borderRadius: 24, 
                    fontSize: 18, fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                    boxShadow: `0 20px 50px ${pColor}40`
                  }}
                  className="glow-button"
                >
                  {paymentLoading ? <Loader2 className="animate-spin" /> : <>Pay & Confirm Appointment <ArrowRight size={20} /></>}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#64748B' }}>
                  <Shield size={14} /> <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Secure Payment via Airpay</span>
                </div>
            </div>
          </Reveal>
        </div>

        <footer style={{ padding: '60px 24px', textAlign: 'center', color: '#475569' }}>
           <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Authorized for {clinicData?.clinicName}</p>
        </footer>
      </div>
    </PageTransition>
  );
}
