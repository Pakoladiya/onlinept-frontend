import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import clinicConfig from '@/config/clinicConfig';
import { openInvoice } from '@/utils/generateInvoice';
import {
  CreditCard,
  CalendarCheck,
  Clock,
  User,
  ShieldCheck,
  Lock,
  Tag,
  X,
  Check,
  Download,
  Loader,
  AlertCircle,
  Receipt,
} from 'lucide-react';

const PROMO_CODES = {
  FIRST10: { discount: 0.10, label: '10% off — First consultation' },
  HEALTH20: { discount: 0.20, label: '20% off — Health special' },
  MAKwana: { discount: 0.15, label: '15% off — Makwana family' },
};

export default function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    date,
    slot,
    name,
    phone,
    serviceName,
    servicePrice,
    serviceDuration,
  } = location.state || {};

  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const basePrice = typeof servicePrice === 'number' ? servicePrice : parseFloat(servicePrice) || clinicConfig.consultationFee;
  const discount = promoApplied ? Math.round(basePrice * promoApplied.discount) : 0;
  const totalPrice = basePrice - discount;

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    await new Promise((r) => setTimeout(r, 600));
    const code = promoInput.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      setPromoApplied({ ...PROMO_CODES[code], code });
      setPromoError('');
    } else {
      setPromoError('Invalid promo code. Try FIRST10 for 10% off.');
    }
    setPromoLoading(false);
  };

  const removePromo = () => {
    setPromoApplied(null);
    setPromoInput('');
  };

  const handlePayment = async () => {
    if (!clinicConfig.razorpayEnabled) {
      navigate(`/confirmation/${bookingId}`, { state: { ...location.state, paid: false } });
      return;
    }

    setPaymentLoading(true);
    setPaymentError('');

    try {
      // 1. Create order on backend
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          amount: totalPrice * 100,
          currency: clinicConfig.currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order creation failed');

      // 2. Open Razorpay
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = async () => {
        const rzp = new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: data.currency,
          name: clinicConfig.clinicName,
          description: serviceName || 'Physiotherapy Consultation',
          order_id: data.orderId,
          prefill: {
            name: name || '',
            phone: phone || '',
          },
          handler: async (response) => {
            // 3. Verify signature on backend
            const verifyRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                bookingId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.verified) {
              navigate(`/confirmation/${bookingId}`, { state: { ...location.state, paid: true, paymentId: response.razorpay_payment_id } });
            } else {
              setPaymentError('Payment verification failed. Please contact us.');
            }
          },
        });
        rzp.on('payment.failed', (details) => {
          setPaymentError(`Payment failed: ${details.error.description}. Please try again.`);
          setPaymentLoading(false);
        });
        rzp.open();
      };
      document.body.appendChild(script);
    } catch (err) {
      setPaymentError(err.message || 'Payment initialization failed. Please try again.');
      setPaymentLoading(false);
    }
  };

  const handleDemoConfirm = () => {
    navigate(`/confirmation/${bookingId}`, { state: { ...location.state, paid: false, discount, promoCode: promoApplied?.code } });
  };

  const handleInvoice = () => {
    openInvoice({
      clinicName: clinicConfig.clinicName,
      clinicAddress: clinicConfig.address,
      phone: clinicConfig.phone,
      email: clinicConfig.email,
      gstNumber: clinicConfig.gstNumber,
      physioName: clinicConfig.physioName,
      qualifications: clinicConfig.qualifications,
      patientName: name,
      serviceName: serviceName || 'Physiotherapy Consultation',
      servicePrice: totalPrice,
      bookingId,
      date,
      paymentId: null,
    });
  };

  const fmt = (n) => {
    const num = typeof n === 'number' && !isNaN(n) ? n : 0;
    return `${clinicConfig.currency === 'INR' ? '₹' : clinicConfig.currency}${num.toLocaleString('en-IN')}`;
  };
  const taxRate = 0.18;
  const taxable = +(totalPrice / (1 + taxRate)).toFixed(2);
  const tax = +(totalPrice - taxable).toFixed(2);

  return (
    <PageWrapper>
      <div className="mb-6">
        <Badge variant="primary" size="sm" className="mb-2">Step 3 of 3</Badge>
        <h1 className="text-2xl font-bold text-text-primary">Review & Pay</h1>
        <p className="text-sm text-text-secondary mt-1">
          Confirm your booking details and complete payment
        </p>
      </div>

      {/* Booking Summary */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text-primary">Booking Summary</h2>
          <button onClick={handleInvoice} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Receipt size={12} /> Invoice
          </button>
        </div>
        <div className="space-y-3">
          {[
            { icon: User, label: 'Patient', value: name || '—' },
            { icon: CalendarCheck, label: 'Date', value: date ? date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
            { icon: Clock, label: 'Time', value: slot?.label ? `${slot.label} · ${serviceDuration || 30} min` : '—' },
            { icon: Tag, label: 'Service', value: serviceName || 'Consultation' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon size={16} style={{ color: clinicConfig.primaryColor }} className="shrink-0" />
              <div>
                <p className="text-xs text-text-secondary">{label}</p>
                <p className="text-sm font-medium text-text-primary">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Promo Code */}
      <Card className="mb-4">
        <h2 className="font-semibold text-text-primary mb-3">Promo Code</h2>
        {promoApplied ? (
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${clinicConfig.primaryColor}10`, border: `1px solid ${clinicConfig.primaryColor}40` }}>
            <div>
              <p className="text-sm font-medium text-text-primary">{promoApplied.code} applied</p>
              <p className="text-xs text-text-secondary">{promoApplied.label}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: clinicConfig.primaryColor }}>-{fmt(discount)}</span>
              <button onClick={removePromo} className="text-text-secondary hover:text-error"><X size={16} /></button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              <input
                type="text"
                value={promoInput}
                onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                placeholder="e.g. FIRST10"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary"
              />
            </div>
            <Button variant="outline" onClick={applyPromo} disabled={!promoInput.trim() || promoLoading}>
              {promoLoading ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
              Apply
            </Button>
          </div>
        )}
        {promoError && (
          <p className="mt-2 text-xs text-error flex items-center gap-1"><AlertCircle size={12} />{promoError}</p>
        )}
      </Card>

      {/* Price Breakdown */}
      <Card className="mb-6" style={{ borderColor: clinicConfig.primaryColor }}>
        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">{serviceName || 'Consultation Fee'}</span>
            <span className="text-text-primary">{fmt(basePrice)}</span>
          </div>
          {promoApplied && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Promo ({promoApplied.code})</span>
              <span className="font-medium" style={{ color: clinicConfig.primaryColor }}>-{fmt(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-text-secondary">
            <span>GST (18%)</span>
            <span>{fmt(tax)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
            <span className="text-text-primary">Total</span>
            <span className="text-text-primary">{fmt(totalPrice)}</span>
          </div>
        </div>
        <div className="text-xs text-text-secondary border-t border-border/70 pt-3 space-y-1">
          <p>• {serviceDuration || 30}-minute video consultation</p>
          <p>• Personalized assessment &amp; advice</p>
          <p>• Follow-up guidance included</p>
        </div>
      </Card>

      {/* Payment Error */}
      {paymentError && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-error/10 border border-error/30 text-sm text-error">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {paymentError}
        </div>
      )}

      {/* Pay Button */}
      {clinicConfig.razorpayEnabled ? (
        <Button size="lg" fullWidth onClick={handlePayment} disabled={paymentLoading}>
          {paymentLoading ? <Loader size={18} className="animate-spin" /> : <CreditCard size={18} />}
          {paymentLoading ? 'Processing...' : `Pay ${fmt(totalPrice)}`}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-3 p-4 rounded-lg bg-surface border border-border/50 text-sm">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-sm"
              style={{ backgroundColor: clinicConfig.primaryColor }}
            >
              ₹
            </div>
            <div>
              <p className="font-medium text-text-primary mb-0.5">Demo Mode — Razorpay not configured</p>
              <p className="text-text-secondary">Click below to simulate payment and see the full booking flow.</p>
            </div>
          </div>
          <Button size="lg" fullWidth onClick={handleDemoConfirm}>
            Simulate Payment & Confirm Booking
          </Button>
        </div>
      )}

      {/* Security badges */}
      <div className="mt-5 flex items-center justify-center gap-4">
        {[
          { icon: Lock, label: '256-bit SSL' },
          { icon: ShieldCheck, label: 'Razorpay Secure' },
          { icon: CreditCard, label: 'PCI Compliant' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Icon size={13} />
            {label}
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-text-secondary mt-2">
        {clinicConfig.clinicName} · {clinicConfig.email}
      </p>
    </PageWrapper>
  );
}
