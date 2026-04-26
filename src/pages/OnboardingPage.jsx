import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Loader,
  Stethoscope,
  Palette,
  Video,
  Clock,
  Zap,
  Calendar,
  Shield,
  CreditCard,
} from 'lucide-react';

const B = { primary: '#007AFF', dark: '#0055CC', light: '#E8F1FF', accent: '#5AC8FA' };

const STEPS = [
  { id: 'clinic', label: 'Clinic Info', icon: Stethoscope },
  { id: 'services', label: 'Services', icon: Zap },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'features', label: 'Features', icon: Zap },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'hours', label: 'Hours', icon: Clock },
  { id: 'payouts', label: 'Payouts', icon: CreditCard },
  { id: 'terms', label: 'Terms', icon: Shield },
];

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const [data, setData] = useState({
    clinicName: 'OnlinePT',
    physioName: '',
    qualifications: '',
    experience: '',
    phone: '',
    email: '',
    address: '',
    services: [
      { id: 'initial', name: 'Initial Consultation', duration: 45, price: 500, description: 'Comprehensive initial physiotherapy assessment and consultation.' },
      { id: 'followup', name: 'Follow-up Session', duration: 30, price: 300, description: 'Review progress and continue treatment plan.' },
      { id: 'report', name: 'Report Review', duration: 20, price: 200, description: 'Review medical reports and imaging.' },
    ],
    primaryColor: B.primary,
    secondaryColor: B.accent,
    features: { payments: true, hepBuilder: true, soapNotes: true, invoicing: true, analytics: true },
    videoMode: 'whatsapp',
    workingHours: {
      schedule: {
        0: { isOpen: false, shifts: [] }, 
        1: { isOpen: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }] }, 
        2: { isOpen: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }] }, 
        3: { isOpen: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }] }, 
        4: { isOpen: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }] }, 
        5: { isOpen: true, shifts: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }] }, 
        6: { isOpen: true, shifts: [{ start: '09:00', end: '13:00' }] },
      },
    },
    payoutDetails: {
      accountHolder: '',
      bankName: '',
      accountNumber: '',
      ifsc: '',
      pan: '',
      upiId: '', // BHIM / UPI ID
    },
    hasAgreedToTerms: false,
  });

  useEffect(() => {
    const pending = sessionStorage.getItem('pendingOnboarding');
    if (pending) {
      try {
        const parsed = JSON.parse(pending);
        setData(d => ({
          ...d,
          ...parsed,
          clinicName: parsed.clinicName || d.clinicName,
          physioName: parsed.physioName || d.physioName,
          email: parsed.email || d.email,
          phone: parsed.phone || d.phone
        }));
      } catch (err) {
        console.error('Error parsing pending onboarding data:', err);
      }
    }
  }, []);

  const update = (key, val) => setData((d) => ({ ...d, [key]: val }));

  const updateService = (idx, field, val) => {
    setData((d) => {
      const services = [...d.services];
      services[idx] = { ...services[idx], [field]: val };
      return { ...d, services };
    });
  };

  const addService = () => {
    setData((d) => ({
      ...d,
      services: [...d.services, { id: `svc_${Date.now()}`, name: '', duration: 30, price: 0, description: '' }],
    }));
  };

  const removeService = (idx) => {
    setData((d) => ({ ...d, services: d.services.filter((_, i) => i !== idx) }));
  };

  const handleDayToggle = (dayId, isOpen) => {
    setData(p => ({
      ...p,
      workingHours: {
        ...p.workingHours,
        schedule: {
          ...p.workingHours.schedule,
          [dayId]: { 
            isOpen, 
            shifts: isOpen ? [{ start: '09:00', end: '13:00' }] : [] 
          }
        }
      }
    }));
  };

  const handleShiftChange = (dayId, shiftIdx, field, val) => {
    setData(p => {
      const shifts = [...p.workingHours.schedule[dayId].shifts];
      shifts[shiftIdx] = { ...shifts[shiftIdx], [field]: val };
      return {
        ...p,
        workingHours: {
          ...p.workingHours,
          schedule: {
            ...p.workingHours.schedule,
            [dayId]: { ...p.workingHours.schedule[dayId], shifts }
          }
        }
      };
    });
  };

  const addShift = (dayId) => {
    setData(p => {
      const shifts = [...p.workingHours.schedule[dayId].shifts, { start: '16:00', end: '20:00' }];
      return {
        ...p,
        workingHours: {
          ...p.workingHours,
          schedule: {
            ...p.workingHours.schedule,
            [dayId]: { ...p.workingHours.schedule[dayId], shifts }
          }
        }
      };
    });
  };

  const removeShift = (dayId, shiftIdx) => {
    setData(p => {
      const shifts = p.workingHours.schedule[dayId].shifts.filter((_, i) => i !== shiftIdx);
      return {
        ...p,
        workingHours: {
          ...p.workingHours,
          schedule: {
            ...p.workingHours.schedule,
            [dayId]: { ...p.workingHours.schedule[dayId], shifts }
          }
        }
      };
    });
  };

  const handleFinish = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    // In production: POST to backend to persist config
    localStorage.setItem('clinic_configured', 'true');
    setSaving(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: `${data.primaryColor}20` }}>
            <Check size={40} style={{ color: data.primaryColor }} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Setup Complete!</h1>
          <p className="text-sm text-text-secondary mb-8">
            {data.clinicName} is now configured. Your white-label PWA is ready.
          </p>
          <Button fullWidth onClick={() => navigate('/')}>
            Go to Your App
          </Button>
        </div>
      </div>
    );
  }

  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen bg-surface px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="/onlinept-logo-v3.png" 
            alt="OnlinePT"
            style={{ width: 64, height: 64, objectFit: 'contain', margin: '0 auto 16px' }} 
          />
          <h1 className="text-xl font-bold text-text-primary">Setup Your Clinic</h1>
          <p className="text-sm text-text-secondary mt-1">Step {step + 1} of {STEPS.length} — {currentStep.label}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className="flex-1 h-1.5 rounded-full transition-colors"
              style={{ backgroundColor: i <= step ? data.primaryColor : 'var(--color-border, #e5e7eb)' }}
            />
          ))}
        </div>

        {/* Step content */}
        <Card className="mb-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-text-primary">Clinic Information</h2>
              {[
                { key: 'clinicName', label: 'Clinic Name', placeholder: 'e.g. OnlinePT Clinic' },
                { key: 'physioName', label: 'Physiotherapist Name', placeholder: 'e.g. Dr. Jiten Makwana' },
                { key: 'qualifications', label: 'Qualifications', placeholder: 'e.g. BPT, MIAP' },
                { key: 'experience', label: 'Experience', placeholder: 'e.g. 8+ years' },
                { key: 'phone', label: 'Phone', placeholder: 'e.g. +91 98765 43210', type: 'tel' },
                { key: 'email', label: 'Email', placeholder: 'e.g. info@clinic.com', type: 'email' },
                { key: 'address', label: 'Address', placeholder: 'e.g. 123 Main Street, Surat' },
              ].map(({ key, label, placeholder, type = 'text' }) => (
                <div key={key}>
                  <label className="text-xs text-text-secondary tracking-wide mb-1 block">{label}</label>
                  <input
                    type={type}
                    value={data[key]}
                    onChange={(e) => update(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-text-primary">Services</h2>
                <Button variant="outline" size="sm" onClick={addService}><Plus size={14} /> Add</Button>
              </div>
              {data.services.map((svc, idx) => (
                <div key={svc.id} className="p-4 rounded-xl border border-border bg-surface space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary font-medium">Service {idx + 1}</span>
                    <button onClick={() => removeService(idx)} className="text-text-secondary hover:text-error"><Trash2 size={14} /></button>
                  </div>
                  <input
                    value={svc.name}
                    onChange={(e) => updateService(idx, 'name', e.target.value)}
                    placeholder="Service Name"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-text-secondary mb-1 block">Duration (min)</label>
                      <input
                        type="number"
                        value={svc.duration}
                        onChange={(e) => updateService(idx, 'duration', parseInt(e.target.value) || 30)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary mb-1 block">Price (₹)</label>
                      <input
                        type="number"
                        value={svc.price}
                        onChange={(e) => updateService(idx, 'price', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <textarea
                    value={svc.description}
                    onChange={(e) => updateService(idx, 'description', e.target.value)}
                    placeholder="Brief Description"
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary resize-none"
                  />
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="font-semibold text-text-primary">Branding</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-secondary uppercase tracking-wide mb-2 block">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={data.primaryColor}
                      onChange={(e) => update('primaryColor', e.target.value)}
                      className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <input
                      value={data.primaryColor}
                      onChange={(e) => update('primaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                  <p className="text-xs text-text-secondary mt-1">Used for buttons, highlights, accents</p>
                </div>
                <div>
                  <label className="text-xs text-text-secondary uppercase tracking-wide mb-2 block">Secondary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={data.secondaryColor}
                      onChange={(e) => update('secondaryColor', e.target.value)}
                      className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <input
                      value={data.secondaryColor}
                      onChange={(e) => update('secondaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                  <p className="text-xs text-text-secondary mt-1">Used for secondary accents</p>
                </div>
              </div>
              {/* Color preview */}
              <div>
                <label className="text-xs text-text-secondary uppercase tracking-wide mb-2 block">Preview</label>
                <div className="flex gap-2">
                  <div className="flex-1 h-10 rounded-lg" style={{ backgroundColor: data.primaryColor }} />
                  <div className="flex-1 h-10 rounded-lg" style={{ backgroundColor: data.secondaryColor }} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-text-primary">Features</h2>
              {[
                { key: 'payments', label: 'Online Payments', desc: 'Collect consultation fees via Razorpay' },
                { key: 'hepBuilder', label: 'HEP Builder', desc: 'Create and share home exercise programs' },
                { key: 'soapNotes', label: 'SOAP Notes', desc: 'Document patient sessions with SOAP notes' },
                { key: 'invoicing', label: 'Invoicing', desc: 'Generate PDF invoices for patients' },
                { key: 'analytics', label: 'Analytics', desc: 'View patient volume and revenue charts' },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface hover:border-primary/50 transition-colors cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{label}</p>
                    <p className="text-xs text-text-secondary">{desc}</p>
                  </div>
                  <div
                    onClick={() => update('features', { ...data.features, [key]: !data.features[key] })}
                    className="w-11 h-6 rounded-full transition-colors relative cursor-pointer"
                    style={{ backgroundColor: data.features[key] ? data.primaryColor : 'var(--color-border, #e5e7eb)' }}
                  >
                    <div
                      className="w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform"
                      style={{ transform: data.features[key] ? 'translateX(22px)' : 'translateX(2px)' }}
                    />
                  </div>
                </label>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-text-primary">Video Consultation Platform</h2>
              <p className="text-sm text-text-secondary">Choose how patients will join their video consultations.</p>
              {[
                { value: 'zoom', label: 'Zoom Meeting', desc: 'Industry standard video conferencing. Requires Zoom account + Server-to-Server OAuth.' },
                { value: 'meet', label: 'Google Meet', desc: 'Browser-based. Requires Google Cloud OAuth setup.' },
                { value: 'whatsapp', label: 'WhatsApp Video Call', desc: 'Simplest option — patient calls clinic WhatsApp number.' },
              ].map(({ value, label, desc }) => (
                <label
                  key={value}
                  className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors"
                  style={{
                    borderColor: data.videoMode === value ? data.primaryColor : 'var(--color-border, #e5e7eb)',
                    backgroundColor: data.videoMode === value ? `${data.primaryColor}08` : 'transparent',
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: data.videoMode === value ? data.primaryColor : 'var(--color-border)' }}
                  >
                    {data.videoMode === value && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.primaryColor }} />}
                  </div>
                  <div onClick={() => update('videoMode', value)} className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{label}</p>
                    <p className="text-xs text-text-secondary">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-text-primary">Clinic Hours</h2>
              <p className="text-sm text-text-secondary">Setup your shifts. Supports split timings.</p>
              <div className="space-y-3 mt-2">
                {[
                  {id: 1, name: 'Monday'}, {id: 2, name: 'Tuesday'}, {id: 3, name: 'Wednesday'},
                  {id: 4, name: 'Thursday'}, {id: 5, name: 'Friday'}, {id: 6, name: 'Saturday'},
                  {id: 0, name: 'Sunday'}
                ].map(day => {
                   const conf = data.workingHours.schedule[day.id];
                   return (
                     <div key={day.id} className="flex flex-col sm:flex-row sm:items-start gap-2 p-3 bg-surface border border-border rounded-lg">
                       <div className="flex items-center gap-2 w-28 mt-1.5">
                         <input type="checkbox" checked={conf.isOpen} onChange={e => handleDayToggle(day.id, e.target.checked)} className="rounded border-border text-primary" />
                         <span className="text-sm font-semibold text-text-primary">{day.name}</span>
                       </div>
                       
                       {conf.isOpen ? (
                         <div className="flex flex-col gap-2 flex-1">
                           {conf.shifts.map((shift, idx) => (
                              <div key={idx} className="flex items-center gap-2 flex-wrap">
                                 <span className="text-xs text-text-secondary w-12">{idx === 0 ? 'Shift 1' : 'Shift 2'}</span>
                                 <input type="time" value={shift.start} onChange={e => handleShiftChange(day.id, idx, 'start', e.target.value)} className="text-xs p-1 px-2 border rounded border-border" />
                                 <span className="text-text-secondary text-xs">to</span>
                                 <input type="time" value={shift.end} onChange={e => handleShiftChange(day.id, idx, 'end', e.target.value)} className="text-xs p-1 px-2 border rounded border-border" />
                                 {idx === 1 && (
                                   <button type="button" onClick={() => removeShift(day.id, idx)} className="text-error hover:opacity-80 p-1 rounded">
                                      <Trash2 size={12} />
                                   </button>
                                 )}
                                 {idx === 0 && conf.shifts.length === 1 && (
                                   <button type="button" onClick={() => addShift(day.id)} className="text-primary hover:opacity-80 p-1 rounded text-xs font-semibold">+ Add Noon Break</button>
                                 )}
                              </div>
                           ))}
                         </div>
                       ) : (
                         <span className="text-sm text-text-secondary italic mt-1.5">Closed</span>
                       )}
                     </div>
                   )
                })}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CreditCard size={20} />
                </div>
                <h2 className="font-bold text-text-primary text-lg">Payout Details</h2>
              </div>
              <p className="text-sm text-text-secondary mb-4">Provide your details to receive payments within 24 hours of session completion.</p>
              
              <div className="space-y-4">
                {[
                  { key: 'accountHolder', label: 'Account Holder Name', placeholder: 'As per bank records' },
                  { key: 'bankName', label: 'Bank Name', placeholder: 'e.g. HDFC Bank' },
                  { key: 'accountNumber', label: 'Account Number', placeholder: 'Your bank account number' },
                  { key: 'ifsc', label: 'IFSC Code', placeholder: 'e.g. HDFC0001234' },
                  { key: 'pan', label: 'PAN Number', placeholder: 'For TDS compliance' },
                  { key: 'upiId', label: 'BHIM / UPI ID', placeholder: 'e.g. doctor@upi', highlight: true },
                ].map(({ key, label, placeholder, highlight }) => (
                  <div key={key}>
                    <label className="text-[10px] text-text-secondary uppercase tracking-widest mb-1 block font-bold">
                      {label} {highlight && <span style={{ color: data.primaryColor }}>(Fast Payout)</span>}
                    </label>
                    <input
                      type="text"
                      value={data.payoutDetails[key]}
                      onChange={(e) => setData(prev => ({ 
                        ...prev, 
                        payoutDetails: { ...prev.payoutDetails, [key]: e.target.value.toUpperCase() } 
                      }))}
                      placeholder={placeholder}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary transition-all"
                      style={{ borderLeft: highlight ? `3px solid ${data.primaryColor}` : undefined }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Shield size={20} />
                </div>
                <h2 className="font-bold text-text-primary text-lg">Terms & Conditions</h2>
              </div>
              
              <div className="p-4 bg-surface-variant border border-border rounded-xl space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar" style={{ background: 'rgba(0,0,0,0.02)', fontSize: '13px', lineHeight: '1.6' }}>
                <section>
                  <h3 className="font-bold text-text-primary mb-1">1. Security Deposit & Cancellations</h3>
                  <p className="text-text-secondary">
                    A security deposit of <strong>₹500/-</strong> will be maintained with OnlinePT. This deposit is used to compensate patients with a full refund in cases where a consultation is cancelled by the therapist or the clinic.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-text-primary mb-1">2. Platform & Transaction Fees</h3>
                  <p className="text-text-secondary">
                    A platform/gateway fee of <strong>2%</strong> (levied by Razorpay) will be borne by the subdomain holder (Clinic/Therapist). This fee is deducted at the source from the consultation charges paid by the patient.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-text-primary mb-1">3. Payout Schedule</h3>
                  <p className="text-text-secondary">
                    Consultation fees will be credited to the therapist's registered bank account within <strong>24 hours of successful completion</strong> of the online consultation. Please note that payouts are triggered by session completion, not by the time of booking.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-text-primary mb-1">4. Professional Conduct</h3>
                  <p className="text-text-secondary">
                    Therapists must ensure a stable internet connection and a professional environment for video consultations. OnlinePT reserves the right to suspend subdomains in case of repeated patient complaints or unethical behavior.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-text-primary mb-1">5. Data Privacy</h3>
                  <p className="text-text-secondary">
                    All patient data and consultation records are encrypted. Therapists are responsible for maintaining patient confidentiality as per standard medical ethics.
                  </p>
                </section>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-black/5 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={data.hasAgreedToTerms} 
                    onChange={e => update('hasAgreedToTerms', e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-border text-primary" 
                  />
                  <span className="text-sm text-text-primary font-medium">
                    I have read and I agree to the platform's financial terms and operating conditions.
                  </span>
                </label>

                <div className="flex gap-3">
                  <button 
                    onClick={() => update('hasAgreedToTerms', true)}
                    style={{ 
                      flex: 1, height: 48, borderRadius: 12, 
                      background: data.hasAgreedToTerms ? data.primaryColor : 'rgba(0,0,0,0.05)', 
                      color: data.hasAgreedToTerms ? '#fff' : 'var(--text-secondary)',
                      border: 'none', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    I Agree
                  </button>
                  <button 
                    onClick={() => {
                      update('hasAgreedToTerms', false);
                      alert('You must agree to the terms to continue with the clinic setup.');
                    }}
                    style={{ 
                      flex: 1, height: 48, borderRadius: 12, 
                      background: 'transparent', 
                      color: '#EF4444',
                      border: '1px solid #EF444430', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    I Disagree
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft size={16} /> Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => navigate('/')}>Skip</Button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <Button 
              onClick={() => {
                if (currentStep.id === 'terms' && !data.hasAgreedToTerms) {
                  alert('Please agree to the terms and conditions to proceed.');
                  return;
                }
                setStep((s) => s + 1);
              }}
            >
              Next <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving || (currentStep.id === 'terms' && !data.hasAgreedToTerms)}>
              {saving ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
              {saving ? 'Saving...' : 'Finish Setup'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
