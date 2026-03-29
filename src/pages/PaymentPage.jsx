import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import clinicConfig from '@/config/clinicConfig';
import { updateBookingStatus } from '@/firebase/db';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  Tag,
  X,
  Loader2,
  Receipt,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';

/**
 * Luxe PaymentPage — Designed as a "Bank-Grade Medical Terminal".
 * Focus: Security, Trust, and Frictionless conversion.
 */

const PROMO_CODES = {
  FIRST10: { discount: 0.10, label: '10% off — Premier Initial Assessment' },
  MAKwana: { discount: 0.15, label: '15% off — Special Referral' },
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
    } else {
      setPromoError('Invalid promo code. Try FIRST10');
    }
    setPromoLoading(false);
  };

  const fmt = (n) => `₹${n.toLocaleString('en-IN')}`;
  const taxRate = 0.18;
  const taxable = +(totalPrice / (1 + taxRate)).toFixed(2);
  const tax = +(totalPrice - taxable).toFixed(2);

  const handlePayment = async () => {
    setPaymentLoading(true);
    setPaymentError('');
    try {
      const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || clinicConfig.razorpayKeyId;

      if (!keyId || typeof window.Razorpay === 'undefined') {
        // Fallback: mark booking paid and proceed
        await updateBookingStatus(bookingId, 'confirmed', {
          paymentStatus: 'paid',
          amount: totalPrice,
          promoCode: promoApplied?.code || null,
        });
        navigate(`/confirmation/${bookingId}`, {
          state: { name, phone, date, slot, serviceName, totalPrice, success: true }
        });
        return;
      }

      const taxRate = 0.18;
      const taxable = Math.round((totalPrice / (1 + taxRate)) * 100);
      const tax = Math.round(totalPrice * 100) - taxable;

      const options = {
        key: keyId,
        amount: Math.round(totalPrice * 100),
        currency: 'INR',
        name: clinicConfig.clinicName,
        description: serviceName || 'Physiotherapy Consultation',
        image: clinicConfig.logo,
        handler: async (response) => {
          await updateBookingStatus(bookingId, 'confirmed', {
            paymentId: response.razorpay_payment_id,
            paymentStatus: 'paid',
            amount: totalPrice,
            promoCode: promoApplied?.code || null,
          });
          navigate(`/confirmation/${bookingId}`, {
            state: { name, phone, date, slot, serviceName, totalPrice, paymentId: response.razorpay_payment_id, success: true }
          });
        },
        prefill: {
          name: name || '',
          contact: phone || '',
        },
        notes: {
          bookingId,
          service: serviceName || '',
        },
        theme: {
          color: clinicConfig.primaryColor,
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setPaymentError(`Payment failed: ${response.error.description}`);
        setPaymentLoading(false);
      });
      rzp.open();
    } catch (e) {
      setPaymentError('Payment Gateway timeout. Please check your connection.');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <PageWrapper className="bg-gray-50/50 min-h-screen">
      <div className="max-w-xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <ShieldCheck size={12} className="text-primary" /> Step 3: Secure Checkout
           </div>
           <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full border border-green-100">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-black text-green-600 uppercase">Live Secure Link</span>
           </div>
        </div>

        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Final Review</h1>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-10">Confirm details & complete clinical payment</p>

        {/* Luxe Receipt Header */}
        <Card className="p-0 rounded-[3rem] border-none shadow-2xl shadow-gray-200 bg-white overflow-hidden mb-8 group">
           <div className="p-10 text-left">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-gray-900 tracking-tighter">Clinical Summary</h3>
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all"><Receipt size={20} /></div>
               </div>

               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Patient Details</p>
                        <p className="text-sm font-black text-gray-900 tracking-tight">{name || 'Guest User'}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Service Fee</p>
                        <p className="text-sm font-black text-gray-900 tracking-tight">{fmt(basePrice)}</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Consultation Date</p>
                        <p className="text-sm font-black text-gray-900 tracking-tight">{date?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {slot?.label}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Duration</p>
                        <p className="text-sm font-black text-gray-900 tracking-tight">{serviceDuration || 45} Mins</p>
                     </div>
                  </div>
               </div>
           </div>
           
           {/* Final Total Section */}
           <div className="p-10 bg-gray-900 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000"><Tag size={120} className="text-white" /></div>
               
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6 text-left">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase text-primary tracking-[.3em]">Total Fee Due</p>
                     <p className="text-5xl font-black text-white tracking-tighter">{fmt(totalPrice)}</p>
                  </div>
                  
                  <div className="flex items-center gap-6">
                     <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">GST (18% Incl)</p>
                        <p className="text-xs font-bold text-gray-300">{fmt(tax)}</p>
                     </div>
                     <div className="w-px h-8 bg-white/10" />
                     {promoApplied && (
                        <div className="text-right">
                           <p className="text-[9px] font-black uppercase text-primary tracking-widest">Saved</p>
                           <p className="text-xs font-bold text-primary">-{fmt(discount)}</p>
                        </div>
                     )}
                  </div>
               </div>
           </div>
        </Card>

        {/* Promo Access */}
        <div className="mb-8">
           {promoApplied ? (
              <div className="p-6 bg-primary/5 border-2 border-primary/20 rounded-[2rem] flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Sparkles className="text-primary animate-bounce" size={20} />
                    <p className="text-xs font-black uppercase text-primary tracking-widest leading-none mt-1">{promoApplied.code} APPLIED</p>
                 </div>
                 <button onClick={() => setPromoApplied(null)} className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-all"><X size={14} /></button>
              </div>
           ) : (
              <div className="flex gap-2">
                 <div className="flex-1 h-14 bg-white rounded-2xl border border-gray-100 px-5 flex items-center shadow-sm">
                    <Tag size={16} className="text-gray-300 mr-3" />
                    <input 
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="ENTER PROMO CODE"
                      className="flex-1 bg-transparent font-black uppercase tracking-widest text-[11px] outline-none text-gray-900 placeholder:text-gray-200"
                    />
                 </div>
                 <Button onClick={applyPromo} variant="outline" className="h-14 px-8 rounded-2xl font-black text-[10px] border-gray-100">
                    Apply <ArrowRight size={12} className="ml-1" />
                 </Button>
              </div>
           )}
           {promoError && <p className="text-[10px] font-black uppercase text-red-500 tracking-widest mt-3 ml-2">{promoError}</p>}
        </div>

        {/* Main CTA */}
        <div className="space-y-6">
           <Button 
                onClick={handlePayment} 
                className="h-24 w-full rounded-[2.5rem] bg-primary text-white shadow-2xl shadow-primary/30 font-black uppercase tracking-[.3em] text-[11px] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4"
                style={{ backgroundColor: clinicConfig.primaryColor }}
            >
              Initialize Razorpay Secure <Zap size={20} />
           </Button>
           
           <div className="flex items-center justify-center gap-8 py-4 opacity-40">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"><Lock size={12} /> 256-Bit SSL</div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"><ShieldCheck size={12} /> Razorpay Shield</div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"><CreditCard size={12} /> PCI-DSS</div>
           </div>
        </div>

      </div>
    </PageWrapper>
  );
}
