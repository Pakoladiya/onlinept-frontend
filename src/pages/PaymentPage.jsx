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

  if (Object.keys(bookingData).length === 0 && !bookingId) {
    navigate('/');
    return null;
  }

  const { intakeData } = bookingData;
  
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [clinicData, setClinicData] = useState(null);
  const [razorpayKey, setRazorpayKey] = useState('');

  useEffect(() => {
    async function loadConfig() {
      // 1. Fetch Clinic Details
      if (bookingData.clinicId) {
        const cSnap = await getDoc(doc(db, 'clinics', bookingData.clinicId));
        if (cSnap.exists()) setClinicData({ id: cSnap.id, ...cSnap.data() });
      }
      // 2. Fetch Razorpay Public Key from SuperAdmin
      const bSnap = await getDoc(doc(db, 'platform_config', 'billing'));
      if (bSnap.exists()) {
        setRazorpayKey(bSnap.data().razorpayKeyId);
      }
    }
    loadConfig();
  }, [bookingData.clinicId]);

  const pColor = clinicData?.primaryColor || '#007AFF';
  const totalPrice = bookingData.servicePrice || 0;

  const handlePayment = async () => {
    if (!razorpayKey) {
      alert('Payment processing is currently unavailable. Please try again later.');
      return;
    }

    setPaymentLoading(true);
    setPaymentError(null);

    const options = {
      key: razorpayKey,
      amount: totalPrice * 100,
      currency: 'INR',
      name: clinicData?.clinicName || 'OnlinePT',
      description: `Consultation: ${bookingData.serviceName}`,
      image: clinicData?.logoUrl || '/logo.png',
      handler: async function (response) {
        try {
          // ── The physioId is the clinic owner's Firebase UID — required by the dashboard query
          const physioId = clinicData?.uid || clinicData?.ownerId || '';
          const patientPhone = intakeData?.personalInfo?.whatsapp || bookingData?.patientPhone || '';
          const patientName  = intakeData?.personalInfo?.fullName  || bookingData?.patientName  || '';

          // 1. Save booking with physioId so dashboard can find it
          const bookingRef = doc(db, 'bookings', bookingId);
          await setDoc(bookingRef, {
            ...bookingData,
            physioId,                                       // ← KEY FIX: lets dashboard query work
            patientPhone,                                   // ← for follow-up search
            patientName,
            clinicId: bookingData.clinicId,
            paymentId: response.razorpay_payment_id,
            status: 'confirmed',
            paymentStatus: 'paid',
            createdAt: serverTimestamp(),
          });

          // 2. Upsert patient record so Patients tab count goes up
          if (physioId && patientPhone) {
            try {
              const patsRef = collection(db, 'patients');
              await addDoc(patsRef, {
                name: patientName,
                phone: patientPhone,
                whatsapp: patientPhone,
                physioId,
                clinicId: bookingData.clinicId,
                age: intakeData?.personalInfo?.age || '',
                gender: intakeData?.personalInfo?.gender || '',
                createdAt: serverTimestamp(),
              });
            } catch (pErr) { console.warn('Patient upsert skipped:', pErr); }
          }

          // ── Dispatch Notifications ───────────────────────────
          try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const bSnap = await getDoc(doc(db, 'platform_config', 'billing'));
            const config = bSnap.exists() ? bSnap.data() : {};

            await fetch(`${API_BASE}/appointments/notify-success`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                 patientData: {
                    name: intakeData.personalInfo.fullName,
                    phone: intakeData.personalInfo.whatsapp,
                    clinicName: clinicData?.clinicName || 'OnlinePT',
                    dateDisplay: bookingData.dateDisplay || bookingData.date,
                    slotLabel: bookingData.slotLabel || (bookingData.slot?.time),
                    meetingLink: `https://onlinept.in/join/${bookingId}`,
                    intakeSummary: `
*Patient:* ${intakeData.personalInfo.fullName}
*Age/Gen:* ${intakeData.personalInfo.age} / ${intakeData.personalInfo.gender}
*Occupation:* ${intakeData.personalInfo.occupation || 'N/A'}
*Chief Complaint / Paining Area:* ${intakeData.clinicalInfo.primaryComplaint}
*Duration:* ${intakeData.clinicalInfo.duration}
*History:* ${intakeData.clinicalInfo.medicalHistory || 'None'}
`.trim()
                 },
                 therapistPhone: clinicData?.whatsappNumber || '',
                 whatsappToken: config.whatsappToken,
                 whatsappPhoneId: config.whatsappPhoneId
              })
            });
          } catch (err) { console.warn('Notification non-critical failure:', err); }

          navigate(`/confirmation/${bookingId}`, { 
            state: { ...bookingData, paymentId: response.razorpay_payment_id } 
          });
        } catch (dbErr) {
          console.error('Booking save failed:', dbErr);
          setPaymentError('Appointment confirmed, but failed to save record. Contact support.');
        }
      },
      prefill: {
        name: intakeData.personalInfo.fullName,
        email: intakeData.personalInfo.email,
        contact: intakeData.personalInfo.whatsapp
      },
      theme: { color: pColor }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (resp) {
      setPaymentError(`Payment failed: ${resp.error.description}`);
      setPaymentLoading(false);
    });
    rzp.open();
  };

  return (
    <PageTransition>
      <div style={{ background: '#09090B', color: '#F8FAFC', minHeight: '100vh', fontFamily: "'Manrope', sans-serif" }}>
        
        {/* Background Gradient */}
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: `radial-gradient(circle at bottom right, ${pColor}15 0%, transparent 60%)`, pointerEvents: 'none' }}></div>

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
                <Metric label="Total Payable" value={`₹${totalPrice}`} color={pColor} />
                
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
                  <Shield size={14} /> <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Secure 256-bit Payment</span>
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
