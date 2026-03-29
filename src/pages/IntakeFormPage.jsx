import React, { useState, useEffect } from 'react';
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
import { useLanguage } from '@/context/LanguageContext';
import { saveIntakeData } from '@/firebase/db';
import { 
    Phone, 
    Mail, 
    Sparkles, 
    Globe, 
    ChevronDown, 
    Home, 
    Video, 
    PlusCircle, 
    MessageCircle, 
    CalendarCheck, 
    MapPin,
    Calendar,
    ShieldCheck,
    CheckCircle2,
    User,
    HeartPulse,
    Stethoscope,
    AlertCircle,
    ChevronRight,
    ChevronLeft,
    CheckCircle,
    Edit2,
    Upload,
    Activity,
    Flame,
    Clock,
    UserCircle,
    Plus
} from 'lucide-react';

/**
 * Premium IntakeFormPage — Designed as a "Dashing Assessment Journey".
 * Features: Icon-based choices, enhanced Body Map, and premium progress tracking.
 */

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
  { label: 'Profile', icon: UserCircle },
  { label: 'Assessment', icon: Activity },
  { label: 'History', icon: Stethoscope },
  { label: 'Confirm', icon: ShieldCheck },
];

export default function IntakeFormPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setLanguage } = useLanguage();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(location.state || {});
  const [selectedPainAreas, setSelectedPainAreas] = useState(formData.painAreas || []);
  const [selectedConditions, setSelectedConditions] = useState(formData.conditions || []);
  const [painIntensity, setPainIntensity] = useState(formData.painIntensity || 5);

  // SEO Meta Update
  useEffect(() => {
    document.title = `Assessment | Physio On Web`;
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(step === 4 ? fullSchema : [step1Schema, step2Schema, step3Schema][step - 1]),
    defaultValues: formData,
    mode: 'onBlur',
  });

  const gender = watch('gender');
  const duration = watch('duration');
  const prevPhysio = watch('prevPhysio');

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
  ];

  const medicalConditions = [
    { id: 'diabetes', label: 'Diabetes', icon: '🩸' },
    { id: 'bp', label: 'High BP', icon: '💓' },
    { id: 'thyroid', label: 'Thyroid', icon: '🦋' },
    { id: 'surgery', label: 'Past Surgery', icon: '🏥' },
    { id: 'heart', label: 'Heart Issue', icon: '🫀' },
    { id: 'fracture', label: 'Recent Fracture', icon: '🦴' },
  ];

  const goNext = async () => {
    const stepFields = {
      1: ['name', 'age', 'gender', 'phone', 'email'],
      2: ['complaint', 'duration'],
      3: [],
    };
    const valid = await trigger(stepFields[step] || []);
    if (!valid) return;
    
    setFormData(prev => ({ ...prev, ...getValues(), painAreas: selectedPainAreas, painIntensity, conditions: selectedConditions }));
    if (step < TOTAL_STEPS) setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const onConfirm = async (data) => {
    const fullData = {
      ...location.state,
      ...formData,
      ...data,
      painAreas: selectedPainAreas,
      conditions: selectedConditions,
      painIntensity,
    };

    await saveIntakeData(bookingId, {
      ...fullData,
      soap: {
        subjective: fullData.complaint || '',
        painAreas: selectedPainAreas,
        painIntensity,
        duration: fullData.duration,
        conditions: selectedConditions,
        medications: fullData.medications,
        prevPhysio: fullData.prevPhysio,
        medicalHistory: fullData.medicalHistory,
      },
    });

    navigate(`/payment/${bookingId}`, { state: fullData });
  };

  // ── Audio Recording Logic ────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
           if (prev >= 60) {
             stopRecording();
             return 60;
           }
           return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioURL(URL.createObjectURL(blob));
        setValue('medicalHistory', 'Audio history recorded.');
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <PageWrapper className="bg-gray-50/50 min-h-screen">
      <div className="max-w-4xl mx-auto py-6 px-6">
        
        {/* Progress Header */}
        <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2 items-center">
                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        {React.createElement(STEPS[step-1].icon, { size: 20 })}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">{STEPS[step-1].label} Assessment</p>
                        <p className="text-xl font-black text-gray-900 tracking-tight">Step {step} of 4</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-primary">{Math.round((step/4)*100)}% Complete</p>
                </div>
            </div>
            <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={`flex-1 h-2 rounded-full transition-all duration-500 ${i <= step ? 'bg-primary shadow-sm' : 'bg-gray-200/50'}`}
                    />
                ))}
            </div>
        </div>

        <form onSubmit={handleSubmit(onConfirm)}>
          
          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-500 text-left">
               <Card className="p-8 rounded-[2.5rem] border-none shadow-2xl shadow-gray-200/50 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-gray-400 ml-1 tracking-widest">Full Name</label>
                        <input {...register('name')} placeholder="e.g. Rahul Sharma" className="w-full h-16 bg-gray-50 rounded-[1.5rem] px-6 font-bold text-gray-900 focus:bg-white border-2 border-transparent focus:border-primary/20 outline-none transition-all" />
                        {errors.name && <p className="text-[10px] text-red-500 font-black uppercase pl-2">{errors.name.message}</p>}
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-gray-400 ml-1 tracking-widest">Your Age</label>
                        <input type="number" {...register('age')} placeholder="e.g. 32" className="w-full h-16 bg-gray-50 rounded-[1.5rem] px-6 font-bold text-gray-900 focus:bg-white border-2 border-transparent focus:border-primary/20 outline-none transition-all" />
                        {errors.age && <p className="text-[10px] text-red-500 font-black uppercase pl-2">{errors.age.message}</p>}
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[11px] font-black uppercase text-gray-400 ml-1 tracking-widest">Gender Identity</label>
                     <div className="grid grid-cols-3 gap-4">
                        {['male', 'female', 'other'].map(g => (
                            <button 
                              key={g} 
                              type="button" 
                              onClick={() => setValue('gender', g)}
                              className={`h-20 rounded-[1.8rem] border-2 transition-all font-black uppercase tracking-widest text-[10px]
                                ${gender === g ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}
                            >
                                {g}
                            </button>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-50">
                     <div className="space-y-2">
                         <label className="text-[11px] font-black uppercase text-gray-400 ml-1 tracking-widest">WhatsApp Number</label>
                         <input {...register('phone')} placeholder="+91 99XXX XXXXX" className="w-full h-16 bg-gray-50 rounded-[1.5rem] px-6 font-bold text-gray-900" />
                     </div>
                     <div className="space-y-2">
                         <label className="text-[11px] font-black uppercase text-gray-400 ml-1 tracking-widest">Contact Email</label>
                         <input {...register('email')} placeholder="you@example.com" className="w-full h-16 bg-gray-50 rounded-[1.5rem] px-6 font-bold text-gray-900" />
                     </div>
                  </div>
               </Card>

               <Button type="button" size="lg" fullWidth onClick={goNext} className="h-18 rounded-[2rem] shadow-2xl shadow-primary/20 font-black uppercase tracking-[0.2em] text-xs">
                  Next: Physical Assessment <ChevronRight className="ml-2" />
               </Button>
            </div>
          )}

          {/* STEP 2: Assessment (Body Map + VAS) */}
          {step === 2 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500 text-left">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                   
                   <div className="lg:col-span-4 shrink-0">
                      <Card className="p-6 rounded-[2.5rem] border-none shadow-2xl shadow-gray-200/50 bg-white">
                         <div className="relative w-full aspect-[2/3] py-4 bg-gray-50 rounded-[2rem] flex justify-center border border-gray-100 group">
                             <svg viewBox="0 0 100 100" className="w-full opacity-30 group-hover:opacity-50 transition-opacity">
                               <path d="M50 8c4 0 7 3 7 7s-3 7-7 7-7-3-7-7 3-7 7-7zm0 15c-6 0-11 3-14 8-1 2-2 4-2 7v10c0 1 1 3 2 4l3 5c1 1 2 1 3 0l2-4c1-2 2-3 4-3s3 1 4 3l2 4c1 1 2 1 3 0l3-5c1-1 2-3 2-4V30c0-3-1-5-2-7-3-5-8-8-14-8zm-5 35c-2 0-4 2-4 4v20c0 4 3 8 7 8 4 0 7-4 7-8V62c0-2-2-4-4-4h-6z" fill="currentColor" />
                             </svg>
                             {bodyHotspots.map(h => (
                                 <button
                                   key={h.id}
                                   type="button"
                                   onClick={() => setSelectedPainAreas(p => p.includes(h.id) ? p.filter(x => x !== h.id) : [...p, h.id])}
                                   className={`absolute w-5 h-5 rounded-full border-2 border-white transition-all shadow-md
                                     ${selectedPainAreas.includes(h.id) ? 'bg-primary scale-125 rotate-45' : 'bg-gray-300 scale-100'}`}
                                   style={{ left: `${h.x}%`, top: `${h.y}%`, transform: 'translate(-50%, -50%)' }}
                                 />
                             ))}
                         </div>
                      </Card>
                   </div>
                   
                   <div className="lg:col-span-8 flex flex-col gap-6">
                      <Card className="p-8 rounded-[2rem] border-none shadow-xl bg-white flex-1 flex flex-col justify-center">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0"><Flame size={16} /></div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none">Assessment Points</h2>
                         </div>
                         <div className="flex flex-wrap gap-1.5 overflow-hidden max-h-20">
                             {selectedPainAreas.map(id => (
                                 <Badge key={id} variant="primary" className="py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none">
                                     {bodyHotspots.find(h => h.id === id)?.label}
                                 </Badge>
                             ))}
                             {selectedPainAreas.length === 0 && <span className="text-[9px] font-black uppercase text-gray-300">No Areas Selected</span>}
                         </div>
                      </Card>

                      <Card className="p-8 rounded-[2rem] shadow-xl border-none text-left bg-white">
                         <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4 block">Pain Intensity (0-10)</label>
                         <div className="flex items-end justify-between gap-1 mb-4">
                               {[0,1,2,3,4,5,6,7,8,9,10].map(v => (
                                   <button 
                                     key={v} 
                                     type="button" 
                                     onClick={() => setPainIntensity(v)}
                                     className={`flex-1 h-2 rounded-full transition-all duration-300
                                       ${painIntensity === v ? 'h-4 bg-primary shadow-lg' : 'bg-gray-100 hover:bg-gray-200'}`}
                                   />
                               ))}
                         </div>
                         <div className="flex items-center justify-between font-black text-gray-900 leading-none">
                            <span className="text-4xl text-primary">{painIntensity}</span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-300">Intensity Level</span>
                         </div>
                      </Card>
                   </div>

                   <div className="lg:col-span-12">
                      <Card className="p-8 rounded-[2rem] shadow-xl border-none text-left bg-white">
                         <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4 block">Duration of Pain</label>
                         <div className="flex flex-wrap gap-2">
                            {['< 1 Week', '1-4 Weeks', '1-3 Mos', '3-6 Mos', '6+ Mos'].map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setValue('duration', opt)}
                                  className={`flex-1 min-w-[100px] py-3 rounded-xl text-[9px] font-black uppercase transition-all border-2
                                    ${duration === opt ? 'bg-primary border-primary text-white shadow-xl' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                         </div>
                      </Card>
                   </div>

                   <Card className="lg:col-span-12 p-10 rounded-[3rem] shadow-xl border-none text-left">
                       <div className="flex items-center gap-3 mb-6">
                           <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Edit2 size={18} /></div>
                           <h2 className="text-xl font-black text-gray-900">Explain in Detail</h2>
                       </div>
                       <textarea 
                         {...register('complaint')}
                         placeholder="Describe your pain: What movements make it worse? What time of day is best/worst?"
                         className="w-full bg-gray-50 rounded-[1.5rem] p-6 font-bold text-gray-900 min-h-[150px] border-none outline-none focus:bg-white focus:border-2 focus:border-primary/20 transition-all"
                       />
                   </Card>
                </div>

                <div className="flex gap-4">
                   <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)} className="h-18 px-8 rounded-[2rem] border-gray-200">
                      <ChevronLeft />
                   </Button>
                   <Button type="button" size="lg" fullWidth onClick={goNext} className="h-18 rounded-[2rem] shadow-2xl shadow-primary/20 font-black uppercase tracking-[0.2em] text-xs">
                      Next: Medical History <ChevronRight className="ml-2" />
                   </Button>
                </div>
             </div>
          )}

          {/* STEP 3: History */}
          {step === 3 && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500 text-left">
                <Card className="p-10 rounded-[3rem] shadow-xl border-none space-y-10">
                   <div className="space-y-6">
                      <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">Clinical Conditions</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                         {medicalConditions.map(c => (
                            <button
                               key={c.id}
                               type="button"
                               onClick={() => setSelectedConditions(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                               className={`h-28 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-2
                                 ${selectedConditions.includes(c.id) ? 'bg-primary border-primary text-white shadow-xl' : 'bg-gray-50 border-transparent text-gray-400'}`}
                            >
                                <span className="text-2xl">{c.icon}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">{c.label}</span>
                            </button>
                         ))}
                         <button type="button" className="h-28 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 gap-2">
                            <Plus size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Other</span>
                         </button>
                      </div>
                   </div>

                   <div className="space-y-2 pt-8 border-t border-gray-50">
                      <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">Previous Physiotherapy?</label>
                      <div className="flex gap-4">
                         {['yes', 'no'].map(opt => (
                             <button
                               key={opt}
                               type="button"
                               onClick={() => setValue('prevPhysio', opt)}
                               className={`flex-1 h-16 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all
                                 ${prevPhysio === opt ? 'bg-primary text-white shadow-xl' : 'bg-gray-50 text-gray-400'}`}
                             >
                                 {opt}
                             </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-4 pt-8 border-t border-gray-50 text-center">
                      <label className="text-xs font-black uppercase text-gray-400 tracking-widest block mb-4">Dictate or Write Medical History</label>
                      <div className="flex flex-col items-center gap-4 mb-6">
                        {!isRecording ? (
                          <button
                            type="button"
                            onClick={startRecording}
                            className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-lg hover:shadow-red-100 transition-all border-2 border-red-100 animate-pulse"
                          >
                            <Activity size={24} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={stopRecording}
                            className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-2xl animate-pulse"
                          >
                            <div className="w-5 h-5 bg-white rounded-sm" />
                          </button>
                        )}
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {isRecording ? `Recording... ${recordingTime}s / 60s` : audioURL ? 'Audio History Captured' : 'Tap to Record History (Max 1 min)'}
                          </p>
                          {isRecording && (
                             <div className="w-full max-w-[200px] h-1 bg-gray-100 rounded-full overflow-hidden mt-2">
                                <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${(recordingTime/60)*100}%` }} />
                             </div>
                          )}
                          {audioURL && <audio src={audioURL} controls className="h-10 w-full max-w-xs" />}
                      </div>

                      <textarea 
                        {...register('medicalHistory')} 
                        placeholder="Or type any relevant medical history, past surgeries, or allergies..." 
                        className="w-full bg-gray-50 rounded-[1.5rem] p-6 font-bold text-gray-900 border-none min-h-[100px]" 
                      />
                   </div>
                </Card>

                <div className="flex gap-4">
                   <Button type="button" variant="outline" size="lg" onClick={() => setStep(2)} className="h-18 px-8 rounded-[2rem] border-gray-200">
                      <ChevronLeft />
                   </Button>
                   <Button type="button" size="lg" fullWidth onClick={goNext} className="h-18 rounded-[2rem] shadow-2xl shadow-primary/20 font-black uppercase tracking-[0.2em] text-xs">
                      Final Review <ChevronRight className="ml-2" />
                   </Button>
                </div>
             </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
             <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 text-left">
                <Card className="p-0 rounded-[3.5rem] overflow-hidden border-none shadow-2xl shadow-gray-200/50 bg-white">
                   <div className="p-10 bg-gray-900 text-white flex items-center justify-between">
                      <div>
                         <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Assessment Complete</p>
                         <h2 className="text-3xl font-black">Review Details</h2>
                      </div>
                      <div className="w-16 h-16 rounded-[2rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
                         <ShieldCheck size={32} />
                      </div>
                   </div>
                   
                   <div className="p-10 space-y-10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                         <div>
                            <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest mb-2 flex items-center gap-2">
                               <User size={12} className="text-primary" /> Profile Details
                            </p>
                            <p className="text-xl font-black text-gray-900">{formData.name}</p>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{formData.age} Yrs · {formData.gender}</p>
                         </div>
                         <div className="text-right sm:text-left">
                            <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest mb-2 flex items-center gap-2 justify-end sm:justify-start">
                               <MapPin size={12} className="text-primary" /> Location
                            </p>
                            <p className="text-xl font-black text-gray-900">{formData.city}</p>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{formData.state}</p>
                         </div>
                      </div>

                      <div className="pt-10 border-t border-gray-50">
                         <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest mb-6 flex items-center gap-2">
                            <HeartPulse size={12} className="text-primary" /> Assessment Summary
                         </p>
                         <div className="bg-gray-50 rounded-[2.5rem] p-8 space-y-6">
                            <div>
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Primary Pain Areas</p>
                               <div className="flex flex-wrap gap-2">
                                  {selectedPainAreas.map(id => (
                                     <span key={id} className="px-4 py-2 bg-white rounded-xl text-[10px] font-black text-primary shadow-sm border border-gray-100 uppercase tracking-widest">
                                        {bodyHotspots.find(h => h.id === id)?.label}
                                     </span>
                                  ))}
                               </div>
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pain Intensity</p>
                               <div className="flex items-center gap-2">
                                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                     <div className="h-full bg-primary" style={{ width: `${painIntensity*10}%` }} />
                                  </div>
                                  <span className="text-xl font-black text-gray-900">{painIntensity}/10</span>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </Card>

                <div className="p-8 bg-yellow-50 rounded-[2.5rem] border border-yellow-100 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-yellow-600 shrink-0"><AlertCircle size={20} /></div>
                    <div>
                       <p className="text-xs font-black text-yellow-800 uppercase tracking-widest mb-1">Final Checklist</p>
                       <p className="text-[11px] text-yellow-700/80 font-bold leading-relaxed">By clicking proceed, you confirm that the diagnostic data above is accurate to the best of your knowledge.</p>
                    </div>
                </div>

                <div className="flex gap-4">
                   <Button type="button" variant="outline" size="lg" onClick={() => setStep(3)} className="h-18 px-8 rounded-[2rem] border-gray-200">
                      <ChevronLeft />
                   </Button>
                   <Button type="submit" size="lg" fullWidth className="h-18 rounded-[2.5rem] shadow-2xl shadow-primary/30 font-black uppercase tracking-[0.2em] text-xs">
                      Lock Details & Pay <ChevronRight className="ml-2" />
                   </Button>
                </div>
             </div>
          )}

        </form>
      </div>
    </PageWrapper>
  );
}
