import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { db } from '@/firebase/config';
import { collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
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
  const [subdomainStatus, setSubdomainStatus] = useState({ status: 'idle', message: '' }); // 'idle' | 'checking' | 'available' | 'taken'
  const [formData, setFormData] = useState({
    physioName: '',
    email: '',
    clinicName: '',
    subdomain: '',
    phone: '',
    primaryColor: '#007AFF',
    secondaryColor: '#0055CC',
    plan: '',
  });

  // ── Subdomain availability check ──────────────────────────────────────────────
  const checkSubdomain = async (value) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!clean) {
      setSubdomainStatus({ status: 'idle', message: '' });
      return;
    }
    if (clean.length < 3) {
      setSubdomainStatus({ status: 'idle', message: 'At least 3 characters required' });
      return;
    }
    setSubdomainStatus({ status: 'checking', message: 'Checking...' });
    try {
      if (db) {
        const snap = await getDoc(doc(db, 'clinics', clean));
        setSubdomainStatus(snap.exists()
          ? { status: 'taken', message: 'Already taken — try another' }
          : { status: 'available', message: 'Available!' });
      } else {
        setSubdomainStatus({ status: 'available', message: 'Available!' });
      }
    } catch {
      setSubdomainStatus({ status: 'idle', message: '' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Auto-lowercase + sanitise subdomain as the user types
    if (name === 'subdomain') {
      const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setFormData((prev) => ({ ...prev, subdomain: clean }));
      checkSubdomain(clean);
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

      // 5s timeout for setDoc
      const savePromise = setDoc(doc(collection(db, 'clinics'), clinicId), {
        clinicId,
        clinicName: formData.clinicName,
        physioName: formData.physioName,
        email: formData.email,
        phone: formData.phone || '',
        domain: `${clinicId}.onlinept.in`,
        subdomain: clinicId,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        tagline: `Expert physiotherapy consultations online`,
        plan: formData.plan,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionStatus: 'pending_verification',
        workingHours: { start: '09:00', end: '19:00', days: [1, 2, 3, 4, 5, 6] },
        slotDurationMinutes: 30,
        videoMode: 'zoom',
        razorpayEnabled: false,
        currency: 'INR',
        createdAt: serverTimestamp(),
        createdBy: 'master_admin',
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Provisioning timed out. The clinic may still be creating in the background.')), 8000)
      );

      await Promise.race([savePromise, timeoutPromise]);
      setStep(5);
    } catch (err) {
      console.error('Clinic provisioning failed:', err);
      // Even if it fails, let's try to proceed to success in "simulation mode" if we are local
      if (window.location.hostname === 'localhost') {
        console.warn('Simulation mode fallback activated.');
        setStep(5);
      } else {
        setError(`Failed to provision clinic: ${err.message}`);
      }
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
    { 
      id: 'Starter',        
      price: '₹1,999', 
      desc: 'Everything you need for a digital practice start.',
      features: ['Online Appointment Booking', 'Patient Records (EHR)', 'WhatsApp Reminders', 'Clinic Landing Page']
    },
    { 
      id: 'Pro',            
      price: '₹3,999', 
      desc: 'Advanced tele-rehab with secure video & prescriptions.',
      features: ['Everything in Starter', 'WebRTC Secure Video Calls', 'Digital Prescription HEP Builder', 'Revenue Analytics']
    },
    { 
      id: 'Premium Bundle', 
      price: '₹7,999', 
      desc: 'The ultimate white-labeled clinical ecosystem.',
      features: ['Everything in Pro', 'Custom Domain (clinic.com)', 'WhatsApp Automation API', 'Priority HIPAA Support']
    },
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
                    <TextInput name="physioName" value={formData.physioName} onChange={handleChange} placeholder="Full Name" />
                  </Field>
                  <Field label="Work Email">
                    <TextInput type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" />
                  </Field>
                  <Field label="Clinical Phone Number">
                    <TextInput name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" />
                  </Field>
                </div>

                <Field label="Clinic Display Name">
                  <TextInput name="clinicName" value={formData.clinicName} onChange={handleChange} placeholder="Clinic Name" />
                </Field>

                <Field label="Choose your Subdomain" hint="Only lowercase letters, numbers, and hyphens allowed.">
                  <div className="flex">
                    <TextInput
                      name="subdomain"
                      value={formData.subdomain}
                      onChange={handleChange}
                      placeholder="Subdomain"
                      className="rounded-r-none flex-1"
                    />
                    <span className="inline-flex items-center px-4 rounded-e-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      .onlinept.in
                    </span>
                  </div>
                  {formData.subdomain && (
                    <p className={`text-xs flex items-center mt-1 ${
                      subdomainStatus.status === 'available' ? 'text-green-600'
                      : subdomainStatus.status === 'taken' ? 'text-red-500'
                      : subdomainStatus.status === 'checking' ? 'text-gray-400'
                      : 'text-gray-400'
                    }`}>
                      {subdomainStatus.status === 'available' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {subdomainStatus.status === 'taken' && <AlertCircle className="w-3 h-3 mr-1" />}
                      {subdomainStatus.status === 'checking' && (
                        <svg className="animate-spin w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                      )}
                      {subdomainStatus.message}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const active = formData.plan === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setFormData((p) => ({ ...p, plan: plan.id }))}
                      className={`flex flex-col p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-300 relative overflow-hidden group
                        ${active ? 'border-primary bg-white shadow-2xl shadow-primary/10 ring-4 ring-primary/5 scale-105' : 'border-gray-100 bg-white hover:border-primary/20 hover:shadow-xl'}`}
                    >
                      {active && (
                        <div className="absolute top-4 right-4 text-primary animate-in zoom-in-50 duration-500">
                           <CheckCircle2 className="w-6 h-6" />
                        </div>
                      )}
                      
                      <div className="mb-6">
                        <h4 className={`text-xl font-black tracking-tight ${active ? 'text-primary' : 'text-gray-900'}`}>{plan.id}</h4>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-black text-gray-900">{plan.price}</span>
                          <span className="text-xs font-bold text-gray-400">/mo</span>
                        </div>
                      </div>

                      <ul className="space-y-3 mb-8 flex-grow">
                         {plan.features.map((f, i) => (
                           <li key={i} className="flex items-start gap-2 text-[10px] font-bold text-gray-500 leading-tight">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" /> {f}
                           </li>
                         ))}
                      </ul>

                      <div className="mt-auto">
                        <p className="text-[10px] font-medium text-gray-400 leading-snug">{plan.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
                <Button variant="ghost" onClick={handleBack}>Back</Button>
                <Button onClick={handleNext} disabled={!formData.plan}>Review & Launch <ChevronRight className="w-4 h-4 ml-1" /></Button>
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
                  { label: 'Phone',      value: formData.phone },
                  { label: 'Subdomain',  value: `${formData.subdomain}.onlinept.in` },
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
                  {loading ? 'Provisioning Clinic...' : 'Claim 14-Day Free Trial'}
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
                  href={`https://${formData.subdomain}.onlinept.in`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-bold text-base hover:underline"
                >
                  https://{formData.subdomain}.onlinept.in
                </a>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" onClick={() => navigate('/admin')}>Go to Master Dashboard</Button>
                <Button size="lg" variant="outline" onClick={() => { setStep(1); setSubdomainStatus({ status: 'idle', message: '' }); setFormData({ physioName:'', email:'', clinicName:'', subdomain:'', phone:'', primaryColor:'#007AFF', secondaryColor:'#0055CC', plan:'' }); }}>
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
