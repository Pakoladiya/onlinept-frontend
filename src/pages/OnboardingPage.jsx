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
} from 'lucide-react';

const B = { primary: '#007AFF', dark: '#0055CC', light: '#E8F1FF', accent: '#5AC8FA' };

const STEPS = [
  { id: 'clinic', label: 'Clinic Info', icon: Stethoscope },
  { id: 'services', label: 'Services', icon: Zap },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'features', label: 'Features', icon: Zap },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'hours', label: 'Hours', icon: Clock },
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
    workingHours: { days: [1, 2, 3, 4, 5], start: '09:00', end: '18:00' },
  });

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

  const toggleDay = (val) => {
    setData((d) => {
      const days = d.workingHours.days.includes(val)
        ? d.workingHours.days.filter((x) => x !== val)
        : [...d.workingHours.days, val];
      return { ...d, workingHours: { ...d.workingHours, days } };
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
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl"
            style={{ backgroundColor: data.primaryColor }}
          >
            P
          </div>
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
                  <label className="text-xs text-text-secondary uppercase tracking-wide mb-1 block">{label}</label>
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
                    placeholder="Service name"
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
                    placeholder="Brief description"
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
            <div className="space-y-5">
              <h2 className="font-semibold text-text-primary">Working Hours</h2>
              <div>
                <label className="text-xs text-text-secondary uppercase tracking-wide mb-2 block">Active Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => toggleDay(value)}
                      className="w-10 h-10 rounded-full text-xs font-medium border transition-colors"
                      style={data.workingHours.days.includes(value) ? { backgroundColor: data.primaryColor, borderColor: data.primaryColor, color: 'white' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary uppercase tracking-wide mb-1 block">Start Time</label>
                  <input
                    type="time"
                    value={data.workingHours.start}
                    onChange={(e) => update('workingHours', { ...data.workingHours, start: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary uppercase tracking-wide mb-1 block">End Time</label>
                  <input
                    type="time"
                    value={data.workingHours.end}
                    onChange={(e) => update('workingHours', { ...data.workingHours, end: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border">
                <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Clinic Schedule</p>
                <p className="text-sm text-text-primary font-medium">
                  {data.workingHours.days.length === 0 ? 'No days selected' :
                    `${data.workingHours.start} – ${data.workingHours.end} on ${data.workingHours.days.map((d) => DAYS.find((x) => x.value === d)?.label).join(', ')}`}
                </p>
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
            <Button onClick={() => setStep((s) => s + 1)}>
              Next <ArrowRight size={16} />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving}>
              {saving ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
              {saving ? 'Saving...' : 'Finish Setup'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
