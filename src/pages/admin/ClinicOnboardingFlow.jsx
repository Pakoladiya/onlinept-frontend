import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { db } from '@/firebase/config';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  CheckCircle2, ChevronRight, Stethoscope, Paintbrush,
  ShieldCheck, Rocket, LayoutTemplate, AlertCircle,
} from 'lucide-react';
import clinicConfig from '@/config/clinicConfig';

// ── simple controlled input ───────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-700 block">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function TextInput({ className = '', ...props }) {
  return (
    <input
      className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
        transition-shadow placeholder-gray-400 ${className}`}
      {...props}
    />
  );
}

export default function ClinicOnboardingFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    physioName: '',
    email: '',
    clinicName: '',
    subdomain: '',
    primaryColor: '#39A900',
    secondaryColor: '#F6A000',
    plan: 'Premium Bundle',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Auto-lowercase + sanitise subdomain as the user types
    if (name === 'subdomain') {
      setFormData((prev) => ({ ...prev, subdomain: value.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  // ── Firebase provisioning ────────────────────────────────────────────────────
  const handleCompleteSignUp = async () => {
    setLoading(true);
    setError('');

    try {
      const clinicId = formData.subdomain; // Use subdomain as unique Firestore doc ID

      if (!db) {
        // Firebase not configured — simulate for dev
        await new Promise((r) => setTimeout(r, 1500));
        setStep(5);
        setLoading(false);
        return;
      }

      await setDoc(doc(collection(db, 'clinics'), clinicId), {
        // Identity
        clinicId,
        clinicName: formData.clinicName,
        physioName: formData.physioName,
        email: formData.email,

        // Routing — used by tenantLoader to resolve this clinic from its domain
        domain: `${clinicId}.physiosaas.com`,
        subdomain: clinicId,

        // Branding
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        tagline: `Expert physiotherapy consultations online`,

        // Subscription
        plan: formData.plan,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionStatus: 'trial',

        // Working defaults (physio can update via their own settings page later)
        workingHours: { start: '09:00', end: '19:00', days: [1, 2, 3, 4, 5, 6] },
        slotDurationMinutes: 30,
        videoMode: 'zoom',
        razorpayEnabled: false,
        currency: 'INR',

        // Audit
        createdAt: serverTimestamp(),
        createdBy: 'master_admin',
      });

      setStep(5);
    } catch (err) {
      console.error('Clinic provisioning failed:', err);
      setError(`Failed to provision clinic: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Step progress indicator ──────────────────────────────────────────────────
  const stepMeta = [
    { n: 1, label: 'Details',  Icon: ShieldCheck },
    { n: 2, label: 'Branding', Icon: Paintbrush },
    { n: 3, label: 'Package',  Icon: LayoutTemplate },
    { n: 4, label: 'Launch',   Icon: Rocket },
  ];

  const Stepper = () => (
    <div className="w-full max-w-3xl flex justify-between mb-12 relative px-4">
      {stepMeta.map(({ n, label, Icon }, idx) => {
        const isActive = step === n;
        const isPast   = step > n;
        return (
          <div key={n} className={`flex flex-col items-center flex-1 ${idx < stepMeta.length - 1 ? 'relative' : ''}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 z-10 bg-white transition-all duration-300
              ${isActive ? 'border-primary text-primary shadow-md scale-110'
                : isPast  ? 'border-green-500 bg-green-50 text-green-600'
                : 'border-gray-200 text-gray-400'}`
            }>
              {isPast ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
            </div>
            <p className={`text-xs mt-2 font-medium ${isActive ? 'text-primary' : 'text-gray-500'}`}>{label}</p>
            {idx < stepMeta.length - 1 && (
              <div
                className={`absolute top-6 h-[2px] transition-all duration-500 ${isPast ? 'bg-green-400' : 'bg-gray-200'}`}
                style={{ left: '50%', right: '-50%', zIndex: 0 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Plan data ────────────────────────────────────────────────────────────────
  const plans = [
    { id: 'Starter',        price: '₹1,999', desc: 'Basic booking & patient management.' },
    { id: 'Pro',            price: '₹3,999', desc: 'Starter + WebRTC Video & EHR.' },
    { id: 'Premium Bundle', price: '₹7,999', desc: 'Everything + WhatsApp & SaaS Whitelabeling.' },
  ];

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            {clinicConfig.clinicName} SaaS
          </span>
        </div>
        <span className="text-sm text-gray-500 font-medium hidden sm:block">Clinic Provisioning Engine</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6">

        {/* Stepper */}
        {step < 5 && <Stepper />}

        <Card className="w-full max-w-2xl shadow-xl border-gray-100 overflow-hidden">

          {/* ── Step 1: Details ── */}
          {step === 1 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Let's set up your clinic.</h2>
              <p className="text-gray-500 text-sm mb-8">Enter your details to generate your white-labeled instance.</p>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Physiotherapist Name">
                    <TextInput name="physioName" value={formData.physioName} onChange={handleChange} placeholder="Dr. Jane Doe" />
                  </Field>
                  <Field label="Work Email">
                    <TextInput type="email" name="email" value={formData.email} onChange={handleChange} placeholder="jane@physio.com" />
                  </Field>
                </div>

                <Field label="Clinic Display Name">
                  <TextInput name="clinicName" value={formData.clinicName} onChange={handleChange} placeholder="e.g. Peak Performance Rehab" />
                </Field>

                <Field label="Choose your Subdomain" hint="Only lowercase letters, numbers, and hyphens allowed.">
                  <div className="flex">
                    <TextInput
                      name="subdomain"
                      value={formData.subdomain}
                      onChange={handleChange}
                      placeholder="peakrehab"
                      className="rounded-r-none flex-1"
                    />
                    <span className="inline-flex items-center px-4 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-gray-500 text-sm whitespace-nowrap">
                      .physiosaas.com
                    </span>
                  </div>
                  {formData.subdomain && (
                    <p className="text-xs text-green-600 flex items-center mt-1.5">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> {formData.subdomain}.physiosaas.com is available
                    </p>
                  )}
                </Field>
              </div>

              <div className="mt-8 flex justify-end pt-6 border-t border-gray-100">
                <Button onClick={handleNext} disabled={!formData.physioName || !formData.clinicName || !formData.subdomain}>
                  Next: Branding <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Branding ── */}
          {step === 2 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Design your portal.</h2>
              <p className="text-gray-500 text-sm mb-8">Choose the brand colors for your clinic's patient-facing app.</p>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { label: 'Primary Color', name: 'primaryColor',   hint: 'Buttons, CTAs, active states' },
                    { label: 'Accent Color',  name: 'secondaryColor', hint: 'Highlights, badges, gradients' },
                  ].map(({ label, name, hint }) => (
                    <Field key={name} label={label} hint={hint}>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          name={name}
                          value={formData[name]}
                          onChange={handleChange}
                          className="w-12 h-12 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                        />
                        <TextInput
                          name={name}
                          value={formData[name]}
                          onChange={handleChange}
                          className="w-32 font-mono"
                          maxLength={7}
                        />
                      </div>
                    </Field>
                  ))}
                </div>

                {/* Live preview */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Live App Preview</p>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    {/* Fake nav */}
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                      <span className="font-bold text-gray-900 text-sm">{formData.clinicName || 'Your Clinic'}</span>
                      <button
                        style={{ backgroundColor: formData.primaryColor }}
                        className="px-3 py-1.5 text-xs text-white font-semibold rounded-md"
                      >
                        Book Now
                      </button>
                    </div>
                    {/* Fake content */}
                    <div className="space-y-2.5 mb-4">
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                    {/* Fake badge */}
                    <div
                      className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: `${formData.secondaryColor}22`, color: formData.secondaryColor }}
                    >
                      Free Consultation
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
                <Button variant="ghost" onClick={handleBack}>Back</Button>
                <Button onClick={handleNext}>Next: Select Package <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Plan ── */}
          {step === 3 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Choose your subscription.</h2>
              <p className="text-gray-500 text-sm mb-8">All plans include a 14-day free trial. No credit card required.</p>

              <div className="space-y-4">
                {plans.map((plan) => {
                  const active = formData.plan === plan.id;
                  return (
                    <label
                      key={plan.id}
                      onClick={() => setFormData((p) => ({ ...p, plan: plan.id }))}
                      className={`flex items-center justify-between p-5 rounded-xl border-2 cursor-pointer transition-all duration-200
                        ${active ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 hover:border-primary/40'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                          ${active ? 'border-primary' : 'border-gray-300'}`}>
                          {active && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                        </div>
                        <div>
                          <h4 className={`font-bold ${active ? 'text-primary' : 'text-gray-900'}`}>{plan.id}</h4>
                          <p className="text-sm text-gray-500 mt-0.5">{plan.desc}</p>
                        </div>
                      </div>
                      <p className="font-bold text-gray-900 ml-4 flex-shrink-0">
                        {plan.price}<span className="text-sm font-normal text-gray-500">/mo</span>
                      </p>
                    </label>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
                <Button variant="ghost" onClick={handleBack}>Back</Button>
                <Button onClick={handleNext}>Review & Launch <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          )}

          {/* ── Step 4: Confirm & Launch ── */}
          {step === 4 && (
            <div className="p-8">
              <div className="text-center mb-8">
                <Rocket className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Ready for Liftoff!</h2>
                <p className="text-gray-500">Review everything and claim your free trial.</p>
              </div>

              {/* Summary card */}
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-6 mb-8 max-w-sm mx-auto space-y-3 text-sm">
                {[
                  { label: 'Clinic',     value: formData.clinicName },
                  { label: 'Physio',     value: formData.physioName },
                  { label: 'Email',      value: formData.email },
                  { label: 'Subdomain',  value: `${formData.subdomain}.physiosaas.com` },
                  { label: 'Plan',       value: formData.plan },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="font-semibold text-gray-700">{label}</span>
                    <span className="text-gray-600 text-right max-w-[55%] truncate">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-700">Theme</span>
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full border shadow-sm" style={{ backgroundColor: formData.primaryColor }} />
                    <div className="w-5 h-5 rounded-full border shadow-sm" style={{ backgroundColor: formData.secondaryColor }} />
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex flex-col items-center gap-3">
                <Button
                  size="lg"
                  className="w-full max-w-sm text-lg shadow-xl shadow-primary/20"
                  onClick={handleCompleteSignUp}
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Provisioning Clinic...' : 'Claim 14-Day Free Trial 🚀'}
                </Button>
                <Button variant="ghost" onClick={handleBack} disabled={loading}>Back to Edit</Button>
              </div>
            </div>
          )}

          {/* ── Step 5: Success ── */}
          {step === 5 && (
            <div className="p-10 text-center">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Clinic Created!</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Welcome, <strong>{formData.physioName}</strong>! Your white-labeled clinic portal is now live.
                Credentials have been sent to <strong>{formData.email}</strong>.
              </p>

              <div className="bg-gray-50 inline-block px-6 py-4 rounded-xl border border-gray-200 mb-8">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1.5">Your Portal URL</p>
                <a
                  href={`/?tenant=${formData.subdomain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-bold text-base hover:underline"
                >
                  https://{formData.subdomain}.physiosaas.com
                </a>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" onClick={() => navigate('/admin')}>Go to Master Dashboard</Button>
                <Button size="lg" variant="outline" onClick={() => { setStep(1); setFormData({ physioName:'', email:'', clinicName:'', subdomain:'', primaryColor:'#39A900', secondaryColor:'#F6A000', plan:'Premium Bundle' }); }}>
                  Onboard Another Clinic
                </Button>
              </div>
            </div>
          )}

        </Card>
      </main>
    </div>
  );
}
