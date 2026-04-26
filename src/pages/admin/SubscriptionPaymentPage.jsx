import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { db } from '@/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  CreditCard, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  ShieldAlert,
  Crown
} from 'lucide-react';
import { API_BASE } from '@/utils/api';

/**
 * SubscriptionPaymentPage — For Clinicians to pay Super Admin platform fees.
 * Follows iOS 17+ HIG style with a premium "SaaS SaaS" aesthetic.
 */
export default function SubscriptionPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan = 'Growth', price = 999, clinicId } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [platformKey, setPlatformKey] = useState('');
  const [error, setError] = useState('');

  // 1. Fetch Platform Admin's Razorpay Key
  useEffect(() => {
    const fetchPlatformKey = async () => {
      try {
        const platformDoc = await getDoc(doc(db, 'platform_config', 'billing'));
        if (platformDoc.exists()) {
          setPlatformKey(platformDoc.data().razorpayKeyId);
        } else {
          // Fallback to Env if doc not found
          setPlatformKey(import.meta.env.VITE_PLATFORM_RAZORPAY_KEY_ID || 'rzp_test_platform_dummy');
        }
      } catch (e) {
        console.error('Error fetching platform billing config:', e);
      } finally {
        setPageLoading(false);
      }
    };
    fetchPlatformKey();
  }, []);

  const handleSubscriptionPayment = async () => {
    if (!clinicId) {
      setError('Clinic context missing. Please re-login.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create Subscription on Backend
      const response = await fetch(`${API_BASE}/api/subscriptions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: import.meta.env.VITE_RAZORPAY_PLAN_ID || 'plan_O3vU9Xm8XfX8X8', // Placeholder or use dynamic
          clinicId,
          customerEmail: '', // Prefill if available
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to initialize subscription');

      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: 'OnlinePT Platform',
        description: `${plan} Plan Subscription`,
        handler: async (paymentResp) => {
          // Verify on backend
          const verifyUrl = `${API_BASE}/api/subscriptions/verify`;
          const verifyResp = await fetch(verifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayPaymentId: paymentResp.razorpay_payment_id,
              razorpaySubscriptionId: paymentResp.razorpay_subscription_id,
              razorpaySignature: paymentResp.razorpay_signature
            }),
          });
          
          if (!verifyResp.ok) throw new Error('Payment verification failed');

          // Update clinic's subscription status in Firestore
          const clinicRef = doc(db, 'clinics', clinicId);
          await updateDoc(clinicRef, {
            subscriptionStatus: 'active',
            subscriptionTier: plan,
            razorpaySubscriptionId: paymentResp.razorpay_subscription_id,
            subscriptionExpiry: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000), // Next cycle
          });

          navigate('/admin/dashboard', { 
            state: { message: 'Subscription activated! Your recurring billing is set up.', type: 'success' } 
          });
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#007AFF',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setError(`Payment failed: ${resp.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (e) {
      setError(e.message || 'Could not initialize subscription.');
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <PageWrapper className="bg-gray-50/50 min-h-screen">
      <div className="max-w-2xl mx-auto py-16 px-6 animate-fade-in-up">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-widest mb-6">
            <ShieldCheck size={14} /> Platform Security Verified
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">Upgrade Your Practice</h1>
          <p className="text-gray-500 font-medium">Powering digital physiotherapy across India.</p>
        </div>

        <div className="grid md:grid-cols-5 gap-8 items-start">
          {/* Order Summary */}
          <div className="md:col-span-3">
            <Card className="ios-card p-0 overflow-hidden">
              <div className="p-8 bg-white">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900">{plan} Plan</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Platform Subscription</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-gray-900">₹{price}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">per month</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {['Custom Subdomain', 'Unlimited Patients', 'Razorpay Integration', 'Priority Support'].map(f => (
                    <div key={f} className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                      <CheckCircle2 size={18} className="text-green-500" /> {f}
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-8 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total to Pay Now</span>
                  <span className="text-3xl font-black text-primary">₹{price}</span>
                </div>
              </div>

              <div className="p-8 bg-gray-50 flex flex-col gap-4">
                <Button 
                  onClick={handleSubscriptionPayment}
                  loading={loading}
                  className="h-16 w-full rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20"
                >
                  Pay with Razorpay <ArrowRight size={18} className="ml-2" />
                </Button>
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 italic">
                    <ShieldAlert size={14} /> {error}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Trust Panel */}
          <div className="md:col-span-2 space-y-6">
            <Card className="ios-card bg-gray-900 p-6 text-white text-center">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown size={24} className="text-yellow-400" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-widest mb-2">Verified Clinic</h4>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">Join 500+ clinics scaling their practice on the OnlinePT network.</p>
            </Card>

            <div className="p-4 rounded-3xl border border-gray-200 space-y-4">
              <div className="flex items-center gap-3 opacity-60">
                 <div className="p-2 bg-gray-100 rounded-lg"><CreditCard size={14} /></div>
                 <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">100% Secure Checkout</p>
              </div>
              <div className="flex items-center gap-3 opacity-60">
                 <div className="p-2 bg-gray-100 rounded-lg"><ShieldCheck size={14} /></div>
                 <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Verified by Razorpay</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button onClick={() => navigate(-1)} className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors">
            Cancel and Return
          </button>
        </div>

      </div>
    </PageWrapper>
  );
}
