import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBooking, rescheduleBooking, isWithinRescheduleWindow } from '@/firebase/db';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  CheckCircle2, Loader2, ChevronRight,
  Clock, Phone, Calendar, MessageSquare, AlertTriangle
} from 'lucide-react';
import SchedulePicker from '@/components/booking/SchedulePicker';
import Button from '@/components/ui/Button';
import axios from 'axios';

const T = {
  primary: '#0D7377',
  primaryLight: '#F0F9F9',
  surface: '#F8FAFC',
  white: '#FFFFFF',
  ink: '#1D1D1F',
  ink2: '#3A3A3C',
  ink3: '#636366',
  ink4: '#AEAEB2',
  border: 'rgba(0,0,0,0.08)',
  shadowLg: '0 20px 60px rgba(0,0,0,0.16)',
  red: '#FF3B30',
  r: { sm: 12, md: 16, lg: 24 },
};

export default function ReschedulePage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [activeClinic, setActiveClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [newDate, setNewDate] = useState(new Date());
  const [newSlot, setNewSlot] = useState(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState('pick'); // 'pick' | 'verify'
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5001');

  useEffect(() => {
    async function load() {
      try {
        const data = await getBooking(bookingId);
        if (!data) { setError('Booking not found.'); return; }
        if (data.rescheduleCount >= 1) {
          setError('This appointment has already been rescheduled once and cannot be moved again per platform policy.');
          setLoading(false);
          return;
        } else if (!isWithinRescheduleWindow(data, 12)) {
          setError('Rescheduling is no longer possible. Appointments can only be moved at least 12 hours before the session. Please contact the clinic for assistance.');
          setLoading(false);
          return;
        }
        setBooking(data);

        const clinicId = data.clinicId || 'nijanand';
        const clinicsRef = collection(db, 'clinics');
        const q = query(clinicsRef, where('subdomain', '==', clinicId));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const cData = snap.docs[0].data();
          setActiveClinic({
            id: snap.docs[0].id,
            ...cData,
            primaryColor: cData.settings?.primaryColor || cData.primaryColor || '#007AFF',
            secondaryColor: cData.settings?.secondaryColor || cData.secondaryColor || '#F6A000',
          });
        } else {
            setActiveClinic({
                clinicName: 'Physiotherapy Clinic',
                primaryColor: '#007AFF',
                secondaryColor: '#F6A000',
                workingHours: { start: '09:00', end: '19:00' }
            });
        }
      } catch (err) {
        console.error('Reschedule Load Error:', err);
        setError('Failed to load appointment details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookingId]);

  const initiateOTP = async () => {
    if (!booking.patientPhone) {
      alert('Patient phone number missing from booking. Please contact the clinic.');
      return;
    }
    setSubmitLoading(true);
    setOtpError('');
    try {
      const res = await axios.post(`${API_BASE}/api/notifications/send-otp`, {
        phone: booking.patientPhone,
        purpose: 'reschedule',
        userName: booking.patientName
      });
      if (res.data.success) {
        setStep('verify');
        setOtpSent(true);
      } else {
        setOtpError(res.data.error || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('[OTP Reschedule Debug]:', err);
      const detail = err.response?.data?.error || err.message;
      setOtpError(`Failed to send OTP: ${detail}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleVerifyAndReschedule = async () => {
    if (!otp) return;
    setSubmitLoading(true);
    setOtpError('');
    try {
      // 1. Verify OTP
      const res = await axios.post(`${API_BASE}/api/notifications/verify-otp`, {
        phone: booking.patientPhone,
        otp
      });

      if (!res.data.success) {
        setOtpError(res.data.error || 'Invalid OTP');
        setSubmitLoading(false);
        return;
      }

      // 2. Perform Reschedule
      await rescheduleBooking(bookingId, { 
        date: newDate.toISOString().split('T')[0], 
        slot: newSlot.id 
      });
      setSuccess(true);
      setTimeout(() => navigate(`/confirmation/${bookingId}`), 3000);
    } catch (err) {
      setOtpError(err.message || 'Reschedule failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const dynamicT = activeClinic ? {
    ...T,
    primary: activeClinic.primaryColor,
    primaryLight: `${activeClinic.primaryColor}15`,
  } : T;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.surface }}>
      <Loader2 className="animate-spin" size={40} color={T.primary} />
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.surface, padding: 20 }}>
      <div style={{ background: T.white, padding: 32, borderRadius: T.r.lg, boxShadow: T.shadowLg, textAlign: 'center', maxWidth: 400 }}>
        <AlertTriangle size={48} color={T.red} style={{ marginBottom: 16, margin: '0 auto' }} />
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Unable to Reschedule</h2>
        <p style={{ color: T.ink3, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{error}</p>
        <button onClick={() => navigate(-1)} style={{ padding: '12px 24px', background: dynamicT.primary, color: 'white', border: 'none', borderRadius: T.r.sm, fontWeight: 700, cursor: 'pointer' }}>Go Back</button>
      </div>
    </div>
  );

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.surface, padding: 20 }}>
      <div style={{ background: T.white, padding: 40, borderRadius: T.r.lg, boxShadow: T.shadowLg, textAlign: 'center', maxWidth: 400 }}>
        <CheckCircle2 size={64} style={{ color: '#34C759', marginBottom: 20, margin: '0 auto' }} />
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Rescheduled Successfully!</h2>
        <p style={{ color: T.ink3, fontSize: 14, lineHeight: 1.6 }}>Your appointment has been moved. Redirecting you...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: T.surface, padding: '40px 20px' }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, padding: 32, boxShadow: T.shadowLg }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: T.ink }}>Reschedule Appointment</h1>
          <p style={{ fontSize: 14, color: T.ink3, marginBottom: 32 }}>Move your session with <strong>{booking.physioName || 'your therapist'}</strong>. You can only do this once.</p>

          <div style={{ background: dynamicT.primaryLight, padding: 20, borderRadius: T.r.sm, marginBottom: 32, borderLeft: `4px solid ${dynamicT.primary}` }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: dynamicT.primary, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 }}>Current Appointment</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>
              {booking.dateDisplay || booking.date} · {typeof booking.slot === 'object'
                ? (booking.slot?.label || booking.slot?.time || booking.slot?.id || '')
                : (booking.slotLabel || booking.slot || '')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {step === 'pick' ? (
              <>
                <div>
                   <label style={{ display: 'block', fontSize: 13, fontWeight: 800, marginBottom: 16, color: T.ink, textTransform: 'uppercase', letterSpacing: 1 }}>Select New Slot</label>
                   <SchedulePicker 
                     clinicConfig={activeClinic}
                     selectedDate={newDate}
                     selectedTime={newSlot}
                     onSelect={(date, time) => {
                       setNewDate(date);
                       setNewSlot(time);
                     }}
                     T={dynamicT}
                   />
                </div>

                <Button
                  onClick={initiateOTP}
                  disabled={!newDate || !newSlot || submitLoading}
                  loading={submitLoading}
                  fullWidth
                  size="lg"
                  style={{ marginTop: 12 }}
                >
                  Confirm Reschedule <ChevronRight size={18} />
                </Button>
              </>
            ) : (
              <div style={{ animation: 'slideUp 0.4s ease-out' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, marginBottom: 16, color: T.ink, textTransform: 'uppercase', letterSpacing: 1 }}>Verify Identity</label>
                <p style={{ fontSize: 14, color: T.ink3, marginBottom: 20 }}>
                  We've sent a 6-digit code to your WhatsApp number <strong>{booking.patientPhone}</strong>.
                </p>
                
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  style={{
                    width: '100%', height: 60, borderRadius: T.r.sm,
                    border: `2px solid ${otpError ? T.red : dynamicT.primary}`,
                    fontSize: 28, fontWeight: 800, textAlign: 'center', letterSpacing: 12,
                    color: T.ink, outline: 'none', marginBottom: 12
                  }}
                />

                {otpError && (
                  <p style={{ color: T.red, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} /> {otpError}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  <Button
                    variant="outline"
                    onClick={() => setStep('pick')}
                    style={{ flex: 1 }}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleVerifyAndReschedule}
                    disabled={otp.length < 6 || submitLoading}
                    loading={submitLoading}
                    style={{ flex: 2 }}
                  >
                    Verify & Reschedule
                  </Button>
                </div>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: T.ink3 }}>
                  Didn't receive it? <span onClick={initiateOTP} style={{ color: dynamicT.primary, fontWeight: 700, cursor: 'pointer' }}>Resend</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
