import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import clinicConfig from '@/config/clinicConfig';
import {
  User,
  HeartPulse,
  Stethoscope,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Edit2,
  Upload,
} from 'lucide-react';

// ── Zod Schemas per step ────────────────────────────────────────
const step1Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.coerce.number().min(1, 'Enter valid age').max(120),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Select gender' }),
  phone: z.string().min(10, 'Enter valid phone number'),
  email: z.string().email('Enter a valid email').or(z.literal('')),
  city: z.string().default('Surat'),
  state: z.string().default('Gujarat'),
});

const step2Schema = z.object({
  complaint: z.string().min(10, 'Please describe your complaint in at least 10 characters'),
  painAreas: z.array(z.string()).min(1, 'Select at least one pain area'),
  painIntensity: z.coerce.number().min(0).max(10).default(5),
  duration: z.string().min(1, 'Select duration'),
});

const step3Schema = z.object({
  conditions: z.array(z.string()).default([]),
  medications: z.string().default(''),
  prevPhysio: z.enum(['yes', 'no']).default('no'),
  medicalHistory: z.string().default(''),
  uploadedFiles: z.array(z.string()).default([]),
});

const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);

const TOTAL_STEPS = 4;

const STEPS = [
  { label: 'Personal', icon: User },
  { label: 'Complaint', icon: HeartPulse },
  { label: 'History', icon: Stethoscope },
  { label: 'Review', icon: CheckCircle },
];

/**
 * IntakeFormPage — 4-step multi-step intake form.
 * Step 1: Personal details
 * Step 2: Chief complaint + pain body map + VAS slider
 * Step 3: Medical history
 * Step 4: Review all data + confirm
 */
export default function IntakeFormPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(location.state || {});
  const [selectedPainAreas, setSelectedPainAreas] = useState(formData.painAreas || []);
  const [selectedConditions, setSelectedConditions] = useState(formData.conditions || []);
  const [painIntensity, setPainIntensity] = useState(formData.painIntensity || 5);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
  } = useForm({
    resolver: zodResolver(step === 4 ? fullSchema : [step1Schema, step2Schema, step3Schema][step - 1]),
    defaultValues: formData,
    mode: 'onBlur',
  });

  // ── Pain body map hotspots ────────────────────────────────
  const bodyHotspots = [
    { id: 'neck', x: 50, y: 18, label: 'Neck' },
    { id: 'shoulder_l', x: 35, y: 28, label: 'Left Shoulder' },
    { id: 'shoulder_r', x: 65, y: 28, label: 'Right Shoulder' },
    { id: 'upper_back', x: 50, y: 33, label: 'Upper Back' },
    { id: 'lower_back', x: 50, y: 44, label: 'Lower Back' },
    { id: 'wrist_l', x: 20, y: 42, label: 'Left Wrist' },
    { id: 'wrist_r', x: 80, y: 42, label: 'Right Wrist' },
    { id: 'hip_l', x: 38, y: 52, label: 'Left Hip' },
    { id: 'hip_r', x: 62, y: 52, label: 'Right Hip' },
    { id: 'knee_l', x: 40, y: 65, label: 'Left Knee' },
    { id: 'knee_r', x: 60, y: 65, label: 'Right Knee' },
    { id: 'ankle_l', x: 40, y: 82, label: 'Left Ankle' },
    { id: 'ankle_r', x: 60, y: 82, label: 'Right Ankle' },
    { id: 'elbow_l', x: 28, y: 35, label: 'Left Elbow' },
    { id: 'elbow_r', x: 72, y: 35, label: 'Right Elbow' },
  ];

  const togglePainArea = (id, label) => {
    setSelectedPainAreas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleCondition = (id) => {
    setSelectedConditions((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) === id : [...prev, id]
    );
  };

  const goNext = async () => {
    // Validate only this step's fields
    const stepFields = {
      1: ['name', 'age', 'gender', 'phone', 'email'],
      2: ['complaint', 'duration'],
      3: [], // step 3 has no required inputs
    };
    const fieldsToValidate = stepFields[step] || [];
    const valid = fieldsToValidate.length === 0 || await trigger(fieldsToValidate);
    if (!valid) return;
    const values = getValues();
    setFormData((prev) => ({
      ...prev,
      ...values,
      painAreas: selectedPainAreas,
      painIntensity,
      conditions: selectedConditions,
    }));
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const onConfirm = async (data) => {
    const finalData = { ...formData, ...data, painAreas: selectedPainAreas, painIntensity, conditions: selectedConditions };
    // TODO: Save to Firestore bookings/{bookingId}/intake
    navigate(`/payment/${bookingId}`, { state: { ...location.state, ...finalData } });
  };

  const painLabels = ['0 — No Pain', '1–3 — Mild', '4–6 — Moderate', '7–9 — Severe', '10 — Worst'];
  const painColors = ['#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444'];

  const VASColor = painColors[Math.min(Math.floor(painIntensity / 2.5), 4)];

  const durationOptions = ['Less than 1 week', '1–4 weeks', '1–3 months', '3–6 months', 'More than 6 months'];
  const medicalConditions = [
    { id: 'diabetes', label: 'Diabetes' },
    { id: 'bp', label: 'High BP' },
    { id: 'thyroid', label: 'Thyroid' },
    { id: 'surgery', label: 'Past Surgery' },
    { id: 'fracture', label: 'Fracture' },
    { id: 'heart', label: 'Heart Condition' },
    { id: 'other', label: 'Other' },
  ];

  return (
    <PageWrapper>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-secondary">
            Step {step} of {TOTAL_STEPS}
          </span>
          <span className="text-xs text-text-secondary font-medium">
            {STEPS[step - 1]?.label}
          </span>
        </div>
        <div className="flex gap-1">
          {[...Array(TOTAL_STEPS)].map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full transition-all duration-300"
              style={{ backgroundColor: i < step ? clinicConfig.primaryColor : 'var(--color-border)' }}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onConfirm)}>
        {/* ── STEP 1: Personal Details ─────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="mb-2">
              <h1 className="text-2xl font-bold text-text-primary">Personal Details</h1>
              <p className="text-sm text-text-secondary mt-1">Tell us about yourself</p>
            </div>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <User size={18} style={{ color: clinicConfig.primaryColor }} />
                <h2 className="font-semibold text-text-primary">Basic Information</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  placeholder="Enter your full name"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Input
                  label="Age *"
                  type="number"
                  placeholder="e.g. 35"
                  error={errors.age?.message}
                  {...register('age')}
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-text-primary mb-1.5 block">Gender *</label>
                <div className="flex gap-3">
                  {[{ val: 'male', label: 'Male' }, { val: 'female', label: 'Female' }, { val: 'other', label: 'Other' }].map(({ val, label }) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value={val}
                        className="sr-only peer"
                        {...register('gender')}
                      />
                      <span className="px-4 py-2 rounded-button text-sm border border-border peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary-light cursor-pointer transition-all select-none">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.gender && <span className="text-sm text-error mt-1 block">{errors.gender.message}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Input
                  label="Phone Number *"
                  type="tel"
                  placeholder="+91 98XXX XXXXX"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Input label="City" placeholder="Surat" {...register('city')} />
                <Input label="State" placeholder="Gujarat" {...register('state')} />
              </div>
            </Card>

            <Button type="button" size="lg" fullWidth onClick={goNext}>
              Next: Describe Your Complaint <ChevronRight size={18} />
            </Button>
          </div>
        )}

        {/* ── STEP 2: Chief Complaint ─────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="mb-2">
              <h1 className="text-2xl font-bold text-text-primary">Your Complaint</h1>
              <p className="text-sm text-text-secondary mt-1">Help your physio understand your issue</p>
            </div>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <HeartPulse size={18} style={{ color: clinicConfig.primaryColor }} />
                <h2 className="font-semibold text-text-primary">Pain Location — Tap on the body</h2>
              </div>

              {/* Body Map */}
              <div className="relative flex justify-center mb-4">
                <div className="relative flex items-center gap-2">
                  {/* Right label — viewer's left = patient's right */}
                  <span
                    className="text-xs text-text-secondary font-medium whitespace-nowrap"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  >
                    Right
                  </span>

                  {/* Body figure */}
                  <div className="relative w-40">
                    <svg viewBox="0 0 100 100" className="w-full" xmlns="http://www.w3.org/2000/svg">
                      <ellipse cx="50" cy="12" rx="8" ry="9" fill="#d1d5db" />
                      <path d="M50 21 C35 21, 28 28, 26 35 L22 42 L28 42 L26 55 C26 58, 30 62, 38 62 L38 80 C38 82, 40 84, 42 84 L42 98 L44 98 L44 84 L46 84 L46 98 L48 98 L48 84 L50 84 L50 98 L52 98 L52 84 L54 84 L54 98 L56 98 L56 84 L58 84 L58 82 L62 62 C70 62, 74 58, 74 55 L72 42 L78 42 L74 35 C72 28, 65 21, 50 21Z" fill="#e5e7eb" />
                      <path d="M30 30 C20 30, 16 38, 16 46 L16 50 L18 50 L18 60 C18 62, 16 64, 14 64 L12 64 L12 48 L14 42 L18 42" fill="#e5e7eb" />
                      <path d="M70 30 C80 30, 84 38, 84 46 L84 50 L82 50 L82 60 C82 62, 84 64, 86 64 L88 64 L88 48 L86 42 L82 42" fill="#e5e7eb" />
                    </svg>
                    {bodyHotspots.map(({ id, x, y, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => togglePainArea(id, label)}
                        title={label}
                        className="absolute w-4 h-4 rounded-full border-2 border-white transition-all duration-150"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: selectedPainAreas.includes(id) ? clinicConfig.primaryColor : '#9ca3af',
                          scale: selectedPainAreas.includes(id) ? '1.3' : '1',
                        }}
                      />
                    ))}
                  </div>

                  {/* Left label — viewer's right = patient's left */}
                  <span
                    className="text-xs text-text-secondary font-medium whitespace-nowrap"
                    style={{ writingMode: 'vertical-rl' }}
                  >
                    Left
                  </span>
                </div>
              </div>

              {selectedPainAreas.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedPainAreas.map((id) => {
                    const hs = bodyHotspots.find((h) => h.id === id);
                    return (
                      <span
                        key={id}
                        className="text-xs px-2 py-1 rounded-full text-white"
                        style={{ backgroundColor: clinicConfig.primaryColor }}
                      >
                        {hs?.label}
                      </span>
                    );
                  })}
                </div>
              )}

              {selectedPainAreas.length === 0 && (
                <p className="text-xs text-text-secondary text-center mb-3">
                  Tap the body to mark pain areas
                </p>
              )}
            </Card>

            {/* Pain Intensity Slider */}
            <Card>
              <label className="text-sm font-medium text-text-primary mb-3 block">
                Pain Intensity (0–10)
              </label>

              {/* VAS scale: row of 11 clickable circles */}
              <div className="flex items-center justify-between gap-1 mb-3">
                {Array.from({ length: 11 }, (_, i) => {
                  const color = painColors[Math.min(Math.floor(i / 2.5), 4)];
                  const isSelected = painIntensity === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPainIntensity(i)}
                      title={String(i)}
                      className="flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-150"
                      style={{
                        borderColor: isSelected ? color : '#d1d5db',
                        backgroundColor: isSelected ? color : 'transparent',
                        color: isSelected ? '#fff' : '#9ca3af',
                        scale: isSelected ? '1.2' : '1',
                      }}
                    >
                      {i}
                    </button>
                  );
                })}
              </div>

              {/* Selected value label */}
              <div className="flex items-center justify-center gap-2">
                <span
                  className="text-2xl font-bold"
                  style={{ color: VASColor }}
                >
                  {painIntensity}
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: VASColor }}
                >
                  / 10
                </span>
              </div>
              <p className="text-xs text-center mt-1" style={{ color: VASColor }}>
                {painLabels[Math.min(Math.floor(painIntensity / 2.5), 4)]}
              </p>
              <input type="hidden" {...register('painIntensity')} value={painIntensity} />
              <input
                type="hidden"
                value={JSON.stringify(selectedPainAreas)}
                {...register('painAreas')}
              />
            </Card>

            {/* Duration */}
            <Card>
              <label className="text-sm font-medium text-text-primary mb-3 block">
                Duration of Problem *
              </label>
              <div className="flex flex-wrap gap-2">
                {durationOptions.map((d) => (
                  <label key={d} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      value={d}
                      className="sr-only peer"
                      {...register('duration')}
                    />
                    <span className="px-3 py-2 rounded-button text-sm border border-border peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary-light cursor-pointer transition-all select-none">
                      {d}
                    </span>
                  </label>
                ))}
              </div>
              {errors.duration && <span className="text-sm text-error mt-1 block">{errors.duration.message}</span>}
            </Card>

            {/* Complaint description */}
            <Card>
              <label className="text-sm font-medium text-text-primary mb-1.5 block">
                Describe Your Complaint * <span className="text-xs text-text-secondary font-normal">(min 10 chars)</span>
              </label>
              <textarea
                rows={4}
                placeholder="Describe your main concern — when did it start, what makes it better or worse..."
                className="w-full px-4 py-3 rounded-input bg-white border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                {...register('complaint')}
              />
              {errors.complaint && <span className="text-sm text-error mt-1 block">{errors.complaint.message}</span>}
            </Card>

            <div className="flex gap-3">
              <Button type="button" variant="outline" size="lg" onClick={goBack}>
                <ChevronLeft size={18} /> Back
              </Button>
              <Button type="button" size="lg" fullWidth onClick={goNext}>
                Next: Medical History <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Medical History ─────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="mb-2">
              <h1 className="text-2xl font-bold text-text-primary">Medical History</h1>
              <p className="text-sm text-text-secondary mt-1">Optional but helps your physio</p>
            </div>

            <Card>
              <h2 className="font-semibold text-text-primary mb-3">Existing Conditions</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {medicalConditions.map(({ id, label }) => (
                  <label key={id} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      value={id}
                      className="sr-only peer"
                      checked={selectedConditions.includes(id)}
                      onChange={() => toggleCondition(id)}
                    />
                    <span className="px-3 py-1.5 rounded-full text-sm border border-border peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary-light cursor-pointer transition-all select-none">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
              <input type="hidden" value={JSON.stringify(selectedConditions)} {...register('conditions')} />

              <label className="text-sm font-medium text-text-primary mb-1.5 block">
                Current Medications (optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g., Metformin 500mg, Thyronorm 50mcg..."
                className="w-full px-4 py-3 rounded-input bg-white border border-border text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                {...register('medications')}
              />
            </Card>

            <Card>
              <h2 className="font-semibold text-text-primary mb-3">Previous Physiotherapy?</h2>
              <div className="flex gap-3">
                {[{ val: 'yes', label: 'Yes' }, { val: 'no', label: 'No' }].map(({ val, label }) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="radio"
                      value={val}
                      className="sr-only peer"
                      {...register('prevPhysio')}
                    />
                    <span className="flex-1 text-center py-3 rounded-button text-sm border border-border peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary-light cursor-pointer transition-all select-none font-medium">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="font-semibold text-text-primary mb-3">Upload Reports (optional)</h2>
              <div className="border-2 border-dashed border-border rounded-card p-6 text-center hover:border-primary transition-colors cursor-pointer">
                <Upload size={24} className="mx-auto mb-2 text-text-secondary" />
                <p className="text-sm text-text-secondary">Tap to upload MRI, X-ray, or blood reports</p>
                <p className="text-xs text-text-secondary mt-1">JPG, PNG, PDF — max 10MB each</p>
                <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf" className="hidden" />
              </div>
            </Card>

            <div className="flex gap-3">
              <Button type="button" variant="outline" size="lg" onClick={goBack}>
                <ChevronLeft size={18} /> Back
              </Button>
              <Button type="button" size="lg" fullWidth onClick={goNext}>
                Review Details <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Review ─────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="mb-2">
              <h1 className="text-2xl font-bold text-text-primary">Review Your Details</h1>
              <p className="text-sm text-text-secondary mt-1">Make sure everything looks right</p>
            </div>

            {/* Personal */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <User size={16} style={{ color: clinicConfig.primaryColor }} />
                  <h2 className="font-semibold text-text-primary text-sm">Personal Details</h2>
                </div>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-primary flex items-center gap-1">
                  <Edit2 size={12} /> Edit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-text-secondary">Name</span><p className="font-medium text-text-primary">{formData.name || getValues('name')}</p></div>
                <div><span className="text-text-secondary">Age / Gender</span><p className="font-medium text-text-primary">{formData.age || getValues('age')} / {formData.gender || getValues('gender')}</p></div>
                <div><span className="text-text-secondary">Phone</span><p className="font-medium text-text-primary">{formData.phone || getValues('phone')}</p></div>
                <div><span className="text-text-secondary">Email</span><p className="font-medium text-text-primary">{formData.email || getValues('email') || '—'}</p></div>
              </div>
            </Card>

            {/* Complaint */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HeartPulse size={16} style={{ color: clinicConfig.primaryColor }} />
                  <h2 className="font-semibold text-text-primary text-sm">Complaint</h2>
                </div>
                <button type="button" onClick={() => setStep(2)} className="text-xs text-primary flex items-center gap-1">
                  <Edit2 size={12} /> Edit
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex flex-wrap gap-1.5">
                  {selectedPainAreas.map((id) => {
                    const hs = bodyHotspots.find((h) => h.id === id);
                    return (
                      <span key={id} className="px-2 py-0.5 rounded-full text-xs text-white" style={{ backgroundColor: clinicConfig.primaryColor }}>
                        {hs?.label}
                      </span>
                    );
                  })}
                </div>
                <div><span className="text-text-secondary">Pain Level:</span> <strong>{painIntensity}/10</strong></div>
                <div><span className="text-text-secondary">Duration:</span> <strong>{formData.duration || getValues('duration')}</strong></div>
                <div><span className="text-text-secondary">Complaint:</span> <p className="text-text-primary">{formData.complaint || getValues('complaint')}</p></div>
              </div>
            </Card>

            {/* Medical History */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Stethoscope size={16} style={{ color: clinicConfig.primaryColor }} />
                  <h2 className="font-semibold text-text-primary text-sm">Medical History</h2>
                </div>
                <button type="button" onClick={() => setStep(3)} className="text-xs text-primary flex items-center gap-1">
                  <Edit2 size={12} /> Edit
                </button>
              </div>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-text-secondary">Conditions:</span>{' '}
                  <span className="text-text-primary">{selectedConditions.length > 0 ? selectedConditions.join(', ') : 'None'}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Medications:</span>{' '}
                  <span className="text-text-primary">{formData.medications || getValues('medications') || 'None'}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Prev Physio:</span>{' '}
                  <span className="text-text-primary capitalize">{formData.prevPhysio || getValues('prevPhysio')}</span>
                </div>
              </div>
            </Card>

            <div className="flex gap-3 p-4 rounded-card bg-primary-light border border-primary/20">
              <AlertCircle size={18} style={{ color: clinicConfig.primaryColor }} className="mt-0.5 shrink-0" />
              <p className="text-sm text-text-secondary">
                Your information is kept strictly confidential and used only for your consultation.
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" size="lg" onClick={goBack}>
                <ChevronLeft size={18} /> Back
              </Button>
              <Button
                type="button"
                size="lg"
                fullWidth
                onClick={() => navigate(`/payment/${bookingId}`, { state: { ...location.state, ...formData } })}
              >
                Proceed to Payment <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        )}
      </form>
    </PageWrapper>
  );
}
