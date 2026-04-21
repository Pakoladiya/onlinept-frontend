import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/firebase/config';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuth } from '@/firebase/auth';
import {
  ChevronRight, Check, Star, MessageCircle, Download, Loader2,
  Calendar, Activity, Pill, Send, X, Plus, Trash2,
  CheckCircle2, ThumbsUp, ThumbsDown
} from 'lucide-react';
import Button from '@/components/ui/Button';

const STEPS = [
  { key: 'soap',     label: 'Session Notes',   num: '1' },
  { key: 'vas',      label: 'VAS & HEP',        num: '2' },
  { key: 'nextAppt', label: 'Next Session',     num: '3' },
  { key: 'feedback', label: 'Patient Feedback', num: '4' },
];

const VAS_COLORS = ['#22c55e','#22c55e','#4ade80','#84cc16','#eab308','#eab308','#f97316','#f97316','#ef4444','#ef4444','#dc2626'];
const VAS_LABELS = ['No Pain','Minimal','Minimal','Mild','Mild','Moderate','Moderate','Severe','Severe','Worst Possible','Worst Possible'];
const FREQUENCIES = ['daily','2x/day','3x/day','every other day','3x/week'];

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

function saveToFirestore(bookingId, data) {
  if (!bookingId || !db) return;
  updateDoc(doc(db, 'bookings', bookingId), data).catch(console.error);
}

// ── Step Indicator ─────────────────────────────────────────────────────────────
function StepIndicator({ currentStep, completedSteps, onStepClick }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-14">
      {STEPS.map((step, i) => {
        const isDone = completedSteps.includes(step.key);
        const isActive = currentStep === step.key;
        return (
          <React.Fragment key={step.key}>
            <button
              onClick={() => isDone && onStepClick(step.key)}
              className={`flex flex-col items-center gap-2 transition-all ${isDone ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40' :
                isDone ? 'bg-green-500 text-white' :
                'bg-gray-800 text-gray-500'
              }`}>
                {isDone && !isActive ? <Check size={16} /> : step.num}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-blue-400' : 'text-gray-500'}`}>{step.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-12 sm:w-20 mx-2 transition-all ${isDone ? 'bg-green-500' : 'bg-gray-800'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── SOAP Notes Step ─────────────────────────────────────────────────────────────
function SOAPStep({ sessionData, onUpdate, onNext }) {
  const [notes, setNotes] = useState({
    subjective: sessionData?.notes?.subjective || '',
    objective:   sessionData?.notes?.objective   || '',
    assessment:  sessionData?.notes?.assessment  || '',
    plan:        sessionData?.notes?.plan        || '',
  });

  const saveNotes = useCallback(
    debounce((updated) => {
      saveToFirestore(sessionData?.bookingId, { notes: updated });
      onUpdate({ notes: updated });
    }, 1000),
    [sessionData?.bookingId]
  );

  function update(field, val) {
    const updated = { ...notes, [field]: val };
    setNotes(updated);
    saveNotes(updated);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-white mb-2">Session Notes</h2>
        <p className="text-gray-400 font-medium">Document the SOAP assessment for this session</p>
      </div>

      {[
        { key: 'subjective', label: 'Subjective', color: '#3b82f6', desc: 'Patient-reported symptoms, pain history, duration, aggravating/relieving factors' },
        { key: 'objective',  label: 'Objective',   color: '#8b5cf6', desc: 'ROM measurements, strength tests, posture observations, special tests' },
        { key: 'assessment', label: 'Assessment', color: '#ec4899', desc: 'Clinical impression, diagnosis, prognosis, functional limitations' },
        { key: 'plan',       label: 'Plan',       color: '#10b981', desc: 'Treatment plan, goals, home advice, follow-up schedule' },
      ].map(({ key, label, color, desc }) => (
        <div key={key} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <h3 className="font-black text-white text-sm uppercase tracking-wider">{label}</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">{desc}</p>
          <textarea
            value={notes[key]}
            onChange={e => update(key, e.target.value)}
            rows={5}
            placeholder={`Enter ${label.toLowerCase()} notes...`}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-5 py-4 text-white text-sm leading-relaxed outline-none focus:border-blue-500/40 transition-all resize-none placeholder-gray-700"
          />
        </div>
      ))}

      <div className="flex justify-end pt-4">
        <Button onClick={onNext} className="h-14 px-10 rounded-2xl font-black shadow-lg">
          Next <ChevronRight size={18} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ── VAS + HEP Step ─────────────────────────────────────────────────────────────
function VASSHEPStep({ sessionData, onUpdate, onNext }) {
  const [vasScore, setVasScore]       = useState(sessionData?.vasScore ?? 0);
  const [hepEnabled, setHepEnabled]     = useState((sessionData?.hep?.length ?? 0) > 0);
  const [hep, setHep]                  = useState(sessionData?.hep || []);
  const [showLib, setShowLib]         = useState(false);
  const [exercises, setExercises]     = useState([]);
  const [showCustom, setShowCustom]   = useState(false);
  const [customForm, setCustomForm]   = useState({ name:'', description:'', videoUrl:'', bodyPart:'' });
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    if (showLib && sessionData?.clinicId) {
      fetch(`/api/storage/files/${sessionData.clinicId}?type=exercises`)
        .then(r => r.json().catch(() => ({ files: [] })))
        .then(d => setExercises(d.files || []))
        .catch(() => setExercises([]));
    }
  }, [showLib, sessionData?.clinicId]);

  const saveHep = useCallback(
    debounce((updated, vas) => {
      setSaving(true);
      saveToFirestore(sessionData?.bookingId, { hep: updated, vasScore: vas ?? vasScore });
      setSaving(false);
      onUpdate({ hep: updated, vasScore: vas ?? vasScore });
    }, 1000),
    [sessionData?.bookingId]
  );

  function addExercise(ex) {
    saveHep([...hep, {
      exerciseId: ex.fileId || ex.id || Date.now().toString(),
      name: ex.name, sets: 3, reps: 10, frequency: 'daily', notes: '', isCustom: false,
    }], vasScore);
  }

  function updateHepItem(i, field, val) {
    const updated = [...hep];
    updated[i] = { ...updated[i], [field]: val };
    saveHep(updated, vasScore);
  }

  function removeHepItem(i) {
    saveHep(hep.filter((_, idx) => idx !== i), vasScore);
  }

  function addCustomExercise() {
    if (!customForm.name) return;
    saveHep([...hep, {
      exerciseId: `custom_${Date.now()}`,
      name: customForm.name, description: customForm.description,
      videoUrl: customForm.videoUrl, bodyPart: customForm.bodyPart,
      sets: 3, reps: 10, frequency: 'daily', notes: '', isCustom: true,
    }], vasScore);
    setCustomForm({ name:'', description:'', videoUrl:'', bodyPart:'' });
    setShowCustom(false);
  }

  function handleVasChange(v) {
    setVasScore(v);
    saveHep(hep, v);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-white mb-2">Pain & Exercises</h2>
        <p className="text-gray-400 font-medium">Record pain level and assign home exercises</p>
      </div>

      {/* VAS Scale */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
        <h3 className="font-black text-sm uppercase tracking-wider text-gray-400 mb-5 flex items-center gap-2">
          <Activity size={16} /> Pain Score (VAS)
        </h3>

        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full text-5xl font-black mb-4"
            style={{ backgroundColor: VAS_COLORS[vasScore] + '20', color: VAS_COLORS[vasScore] }}
          >
            {vasScore}
          </div>
          <p className="text-lg font-bold" style={{ color: VAS_COLORS[vasScore] }}>{VAS_LABELS[vasScore]}</p>
        </div>

        <div className="relative">
          <input
            type="range" min="0" max="10" value={vasScore}
            onChange={e => handleVasChange(parseInt(e.target.value))}
            className="w-full h-3 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, #22c55e 0%, #dc2626 100%)` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 font-black uppercase mt-2">
          <span>No Pain</span>
          <span>Worst Pain</span>
        </div>
      </div>

      {/* HEP */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-sm uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <Pill size={16} /> Home Exercise Program
          </h3>
          <button onClick={() => { setHepEnabled(!hepEnabled); if (!hepEnabled) saveHep([], vasScore); }} className="flex items-center gap-2">
            <div className={`w-12 h-6 rounded-full relative transition-all ${hepEnabled ? 'bg-blue-500' : 'bg-gray-700'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${hepEnabled ? 'translate-x-6' : ''}`} />
            </div>
            <span className="text-xs font-bold text-gray-400">{hepEnabled ? 'On' : 'Off'}</span>
          </button>
        </div>

        {hepEnabled && (
          <div className="space-y-4">
            <Button onClick={() => setShowLib(!showLib)} variant="outline" className="h-11 rounded-xl font-black text-xs border-gray-700">
              <Plus size={14} className="mr-1" /> Select from Library ({exercises.length})
            </Button>

            {showLib && (
              <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto p-4 bg-gray-800/30 rounded-xl">
                {exercises.length === 0 ? (
                  <p className="text-xs text-gray-500 col-span-2 text-center py-4">No exercises in library. Upload some first.</p>
                ) : exercises.map(ex => (
                  <button key={ex.fileId} onClick={() => addExercise(ex)}
                    className="p-3 bg-gray-900 border border-gray-700 rounded-xl text-left hover:border-blue-500/50 transition-all">
                    <p className="font-bold text-white text-xs mb-1 truncate">{ex.name}</p>
                    {ex.bodyPart && <span className="text-[10px] text-blue-400 uppercase font-black">{ex.bodyPart}</span>}
                  </button>
                ))}
              </div>
            )}

            {/* HEP list */}
            {hep.map((item, i) => (
              <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm mb-1">{item.name}</p>
                    {item.isCustom && item.description && <p className="text-xs text-gray-500 mb-2">{item.description}</p>}
                  </div>
                  <button onClick={() => removeHepItem(i)} className="text-red-400 hover:text-red-300 shrink-0"><Trash2 size={14} /></button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Sets</label>
                    <input type="number" value={item.sets} onChange={e => updateHepItem(i, 'sets', parseInt(e.target.value) || 0)}
                      className="w-full h-10 bg-gray-900 border border-gray-700 rounded-lg px-3 text-sm font-bold text-white text-center outline-none" min="1" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Reps</label>
                    <input type="number" value={item.reps} onChange={e => updateHepItem(i, 'reps', parseInt(e.target.value) || 0)}
                      className="w-full h-10 bg-gray-900 border border-gray-700 rounded-lg px-3 text-sm font-bold text-white text-center outline-none" min="1" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Frequency</label>
                    <select value={item.frequency} onChange={e => updateHepItem(i, 'frequency', e.target.value)}
                      className="w-full h-10 bg-gray-900 border border-gray-700 rounded-lg px-2 text-xs font-bold text-white outline-none">
                      {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Notes</label>
                  <input value={item.notes || ''} onChange={e => updateHepItem(i, 'notes', e.target.value)}
                    className="w-full h-10 bg-gray-900 border border-gray-700 rounded-lg px-3 text-sm font-medium text-white outline-none" placeholder="e.g. Keep back straight..." />
                </div>
              </div>
            ))}

            {!showCustom ? (
              <button onClick={() => setShowCustom(true)} className="w-full py-3 border-2 border-dashed border-gray-700 rounded-xl text-gray-400 text-xs font-bold hover:border-gray-600 transition-all">
                <Plus size={14} className="inline mr-1" /> Create Custom Exercise
              </button>
            ) : (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <h4 className="font-bold text-sm text-white">Custom Exercise</h4>
                  <button onClick={() => setShowCustom(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
                </div>
                <input value={customForm.name} onChange={e => setCustomForm({...customForm, name: e.target.value})} placeholder="Exercise name" className="w-full h-10 bg-gray-900 border border-gray-700 rounded-lg px-3 text-sm font-bold text-white outline-none" />
                <input value={customForm.description} onChange={e => setCustomForm({...customForm, description: e.target.value})} placeholder="Description" className="w-full h-10 bg-gray-900 border border-gray-700 rounded-lg px-3 text-sm font-medium text-white outline-none" />
                <input value={customForm.videoUrl} onChange={e => setCustomForm({...customForm, videoUrl: e.target.value})} placeholder="Video URL (YouTube/Direct)" className="w-full h-10 bg-gray-900 border border-gray-700 rounded-lg px-3 text-sm font-medium text-white outline-none" />
                <select value={customForm.bodyPart} onChange={e => setCustomForm({...customForm, bodyPart: e.target.value})} className="w-full h-10 bg-gray-900 border border-gray-700 rounded-lg px-3 text-sm font-bold text-white outline-none">
                  <option value="">Body part</option>
                  {['neck','shoulder','back','knee','ankle','hip','wrist','general'].map(b => <option key={b}>{b}</option>)}
                </select>
                <Button onClick={addCustomExercise} className="h-10 rounded-xl font-black text-xs w-full">Add Exercise</Button>
              </div>
            )}

            {saving && <div className="text-center text-xs text-gray-500 flex items-center justify-center gap-2"><Loader2 size={12} className="animate-spin" /> Saving...</div>}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button onClick={() => onUpdate({ vasScore })} variant="ghost" className="h-14 px-8 rounded-2xl font-black text-gray-400">Back</Button>
        <Button onClick={onNext} className="h-14 px-10 rounded-2xl font-black shadow-lg">Next <ChevronRight size={18} className="ml-1" /></Button>
      </div>
    </div>
  );
}

// ── Next Appointment Step ──────────────────────────────────────────────────────
function NextApptStep({ sessionData, onUpdate, onNext, onBack }) {
  const [bookEnabled, setBookEnabled] = useState(!!sessionData?.nextBookingId);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(sessionData?.nextBooking || null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingNow, setBookingNow] = useState(false);

  const today = new Date();
  const days = [];
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(d);
  }

  async function loadSlots(date) {
    setLoadingSlots(true);
    setSelectedSlot(null);
    setSlots([]);
    try {
      const res = await fetch(`/api/slots?clinicId=${sessionData?.clinicId}&date=${date.toISOString().split('T')[0]}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
      }
    } catch {
      setSlots(['09:00','10:00','11:00','14:00','15:00','16:00','17:00']);
    }
    setLoadingSlots(false);
  }

  async function confirmBooking() {
    if (!selectedDate || !selectedSlot) return;
    setBookingNow(true);
    try {
      const res = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: sessionData?.patientName || 'Patient',
          date: selectedDate, time: selectedSlot,
          clinicId: sessionData?.clinicId,
          serviceName: 'Follow-up Session',
          parentBookingId: sessionData?.bookingId,
        }),
      });
      const data = await res.json();
      if (data.booking) {
        setBooking(data.booking);
        saveToFirestore(sessionData?.bookingId, { nextBookingId: data.booking.id });
        onUpdate({ nextBookingId: data.booking.id, nextBooking: data.booking });
      }
    } catch (err) {
      const fake = { id: `bk_${Date.now()}`, date: selectedDate, time: selectedSlot };
      setBooking(fake);
      onUpdate({ nextBookingId: fake.id, nextBooking: fake });
    }
    setBookingNow(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-white mb-2">Book Follow-up</h2>
        <p className="text-gray-400 font-medium">Schedule the next appointment for this patient</p>
      </div>

      <div className="flex items-center justify-center gap-3 mb-2">
        <button onClick={() => setBookEnabled(!bookEnabled)} className="flex items-center gap-2">
          <div className={`w-12 h-6 rounded-full relative transition-all ${bookEnabled ? 'bg-blue-500' : 'bg-gray-700'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${bookEnabled ? 'translate-x-6' : ''}`} />
          </div>
          <span className="text-sm font-bold text-gray-300">{bookEnabled ? 'Yes, book a follow-up' : 'No follow-up needed'}</span>
        </button>
      </div>

      {bookEnabled && !booking && (
        <>
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-black text-sm uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <Calendar size={16} /> Select Date
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-48 overflow-y-auto">
              {days.map((d, i) => {
                const dateStr = d.toISOString().split('T')[0];
                return (
                  <button key={i} onClick={() => { setSelectedDate(dateStr); loadSlots(d); }}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                      selectedDate === dateStr ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}>
                    {d.toLocaleDateString('en-IN', { weekday: 'short' })}<br />
                    <span className="text-sm">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDate && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
              <h3 className="font-black text-sm uppercase tracking-wider text-gray-400 mb-4">Available Times</h3>
              {loadingSlots ? (
                <div className="flex justify-center py-6"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
              ) : slots.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No slots available</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map(slot => (
                    <button key={slot} onClick={() => setSelectedSlot(slot)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        selectedSlot === slot ? 'bg-green-600 text-white shadow-lg shadow-green-600/30' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}>
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedDate && selectedSlot && (
            <Button onClick={confirmBooking} disabled={bookingNow} className="w-full h-14 rounded-2xl font-black shadow-xl">
              {bookingNow ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Calendar size={18} className="mr-2" />}
              Confirm — {selectedDate} at {selectedSlot}
            </Button>
          )}
        </>
      )}

      {booking && (
        <div className="bg-green-900/20 border border-green-800 rounded-2xl p-6 text-center">
          <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
          <h3 className="text-xl font-black text-green-300 mb-2">Follow-up Booked!</h3>
          <p className="text-green-400/70 font-medium">{booking.date} at {booking.time}</p>
          {booking.id && <p className="text-xs text-green-400/50 mt-1">ID: {booking.id}</p>}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button onClick={onBack} variant="ghost" className="h-14 px-8 rounded-2xl font-black text-gray-400">Back</Button>
        <Button onClick={onNext} className="h-14 px-10 rounded-2xl font-black shadow-lg">Next <ChevronRight size={18} className="ml-1" /></Button>
      </div>
    </div>
  );
}

// ── Feedback Step ──────────────────────────────────────────────────────────────
function FeedbackStep({ sessionData, onUpdate, onBack, onFinish }) {
  const [rating, setRating] = useState(sessionData?.feedbackRating || 0);
  const [text, setText] = useState(sessionData?.feedbackText || '');
  const [recommend, setRecommend] = useState(sessionData?.recommend ?? null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    const updates = { feedbackRating: rating, feedbackText: text, recommend };
    saveToFirestore(sessionData?.bookingId, updates);
    onUpdate(updates);
    onFinish();
    setSubmitting(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-white mb-2">Patient Feedback</h2>
        <p className="text-gray-400 font-medium">Collect patient experience after the session</p>
      </div>

      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 text-center">
        <h3 className="font-black text-sm uppercase tracking-wider text-gray-400 mb-5">How was your experience?</h3>
        <div className="flex justify-center gap-3 mb-4">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setRating(n)} className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110">
              <Star size={28} fill={n <= rating ? '#f59e0b' : 'transparent'} color={n <= rating ? '#f59e0b' : '#374151'} />
            </button>
          ))}
        </div>
        <p className="text-sm font-bold text-gray-500">
          {rating === 0 ? 'Tap to rate' : rating === 5 ? 'Excellent!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : 'Needs Improvement'}
        </p>
      </div>

      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
        <h3 className="font-black text-sm uppercase tracking-wider text-gray-400 mb-4">Any feedback?</h3>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder="Share your experience..."
          className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-5 py-4 text-white text-sm leading-relaxed outline-none focus:border-blue-500/40 transition-all resize-none placeholder-gray-700" />
      </div>

      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
        <h3 className="font-black text-sm uppercase tracking-wider text-gray-400 mb-4 text-center">Would you recommend us?</h3>
        <div className="flex justify-center gap-6">
          <button onClick={() => setRecommend(true)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm transition-all ${recommend === true ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            <ThumbsUp size={20} /> Yes
          </button>
          <button onClick={() => setRecommend(false)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm transition-all ${recommend === false ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            <ThumbsDown size={20} /> No
          </button>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button onClick={onBack} variant="ghost" className="h-14 px-8 rounded-2xl font-black text-gray-400">Back</Button>
        <Button onClick={submit} disabled={submitting} className="h-14 px-10 rounded-2xl font-black shadow-lg">
          {submitting ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Check size={18} className="mr-2" />}
          Complete Session
        </Button>
      </div>
    </div>
  );
}

// ── Session Complete Screen ─────────────────────────────────────────────────────
function SessionComplete({ sessionData, onDone }) {
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  const sessionDate = sessionData?.date || new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  const physioName  = sessionData?.physioName || 'Your Physio';
  const clinicName  = sessionData?.clinicName || 'OnlinePT';
  const patientName = sessionData?.patientName || 'Patient';
  const vas = sessionData?.vasScore;
  const hepCount = sessionData?.hep?.length || 0;
  const nextBooking = sessionData?.nextBooking;

  const parts = [
    `Hi ${patientName}! Thank you for your session with ${physioName} at ${clinicName} on ${sessionDate}.`,
  ];
  if (vas !== undefined) parts.push(`\nPain Score (VAS): ${vas}/10`);
  if (hepCount > 0) parts.push(`\nHome Exercises Assigned: ${hepCount}`);
  if (nextBooking) parts.push(`\nNext Appointment: ${nextBooking.date} at ${nextBooking.time}`);
  parts.push(`\n\nComplete your exercises as instructed. Get well soon!`);
  const waMsg = parts.join('');

  async function generatePdf() {
    setGeneratingPdf(true);
    try {
      const res = await fetch('/api/storage/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: sessionData?.clinicId, bookingId: sessionData?.bookingId }),
      });
      const data = await res.json();
      if (data.url) setPdfUrl(data.url);
    } catch (err) { console.error('PDF error:', err); }
    setGeneratingPdf(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-green-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Session Complete!</h2>
        <p className="text-gray-400 font-medium">Here's a summary of what was recorded.</p>
      </div>

      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center"><Calendar size={20} className="text-blue-400" /></div>
          <div>
            <p className="font-bold text-white">{sessionDate}</p>
            <p className="text-sm text-gray-400">{patientName} • {physioName}</p>
          </div>
        </div>
        <div className="h-px bg-gray-800" />
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-800/50 rounded-xl">
            <p className="text-3xl font-black text-blue-400">{vas !== undefined ? vas : '—'}</p>
            <p className="text-[10px] font-black uppercase text-gray-500 mt-1">VAS Score</p>
          </div>
          <div className="text-center p-4 bg-gray-800/50 rounded-xl">
            <p className="text-3xl font-black text-green-400">{hepCount}</p>
            <p className="text-[10px] font-black uppercase text-gray-500 mt-1">Exercises</p>
          </div>
        </div>
        {nextBooking && (
          <div className="p-4 bg-green-900/10 border border-green-800/50 rounded-xl text-center">
            <p className="text-sm font-bold text-green-400">Next: {nextBooking.date} at {nextBooking.time}</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <a href={`https://wa.me/?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noopener noreferrer">
          <Button className="w-full h-14 rounded-2xl font-black shadow-lg bg-green-600">
            <MessageCircle size={18} className="mr-2" /> Send Summary via WhatsApp
          </Button>
        </a>
        <Button onClick={generatePdf} disabled={generatingPdf} variant="outline" className="w-full h-14 rounded-2xl font-black border-gray-700">
          {generatingPdf ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Download size={18} className="mr-2" />}
          Generate PDF Summary
        </Button>
        {pdfUrl && (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full h-12 rounded-2xl font-black text-sm border-gray-700">
              <Download size={14} className="mr-2" /> Download PDF
            </Button>
          </a>
        )}
        <Button onClick={onDone} variant="ghost" className="w-full h-12 rounded-2xl font-black text-gray-400">
          Done — Return to Dashboard
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PostSessionPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [clinicId, setClinicId] = useState(null);
  const [clinicData, setClinicData] = useState({});
  const [sessionData, setSessionData] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState('soap');
  const [completedSteps, setCompletedSteps] = useState([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const unsub = onAuth(async (u) => {
      if (!u) { navigate('/dashboard-login'); return; }
      setUser(u);

      if (db && bookingId) {
        const [bookingSnap, clinicSnap] = await Promise.all([
          getDoc(doc(db, 'bookings', bookingId)),
          getDocs(query(collection(db, 'clinics'), where('uid', '==', u.uid))),
        ]);

        if (bookingSnap.exists()) {
          const bd = bookingSnap.data();
          setSessionData({ ...bd, bookingId });
          if (bd.notes?.subjective || bd.notes?.objective) setCompletedSteps(prev => [...new Set([...prev, 'soap'])]);
          if (bd.vasScore !== undefined || bd.hep?.length) setCompletedSteps(prev => [...new Set([...prev, 'vas'])]);
          if (bd.nextBookingId) setCompletedSteps(prev => [...new Set([...prev, 'nextAppt'])]);
          if (bd.feedbackRating) setCompletedSteps(prev => [...new Set([...prev, 'feedback'])]);
        }
        if (!clinicSnap.empty) {
          const cd = clinicSnap.docs[0].data();
          setClinicId(clinicSnap.docs[0].id);
          setClinicData(cd);
          setSessionData(prev => ({ ...prev, clinicId: clinicSnap.docs[0].id, physioName: cd.physioName, clinicName: cd.clinicName }));
        }
      }
      setLoading(false);
    });
    return unsub;
  }, [bookingId]);

  function handleStepComplete(stepKey) {
    setCompletedSteps(prev => [...new Set([...prev, stepKey])]);
    const idx = STEPS.findIndex(s => s.key === stepKey);
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].key);
  }

  function handleDataUpdate(updates) {
    setSessionData(prev => ({ ...prev, ...updates }));
  }

  function goToStep(key) { setCurrentStep(key); }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
        <p className="text-gray-400 font-medium">Loading session...</p>
      </div>
    </div>
  );

  if (finished) return (
    <div className="min-h-screen bg-gray-950 pt-10">
      <div className="max-w-3xl mx-auto px-4">
        <SessionComplete sessionData={sessionData} onDone={() => navigate('/dashboard')} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white pt-8 pb-20 px-4">
      {/* Logo */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white">
          {clinicData.clinicName?.charAt(0) || 'P'}
        </div>
        <div>
          <p className="font-black text-sm text-white">{clinicData.clinicName}</p>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Post-Session</p>
        </div>
      </div>

      <StepIndicator currentStep={currentStep} completedSteps={completedSteps} onStepClick={goToStep} />

      {currentStep === 'soap'     && <SOAPStep     sessionData={sessionData} onUpdate={handleDataUpdate} onNext={() => handleStepComplete('soap')} />}
      {currentStep === 'vas'      && <VASSHEPStep   sessionData={sessionData} onUpdate={handleDataUpdate} onNext={() => handleStepComplete('vas')} />}
      {currentStep === 'nextAppt' && <NextApptStep  sessionData={sessionData} onUpdate={handleDataUpdate} onNext={() => handleStepComplete('nextAppt')} onBack={() => goToStep('vas')} />}
      {currentStep === 'feedback' && <FeedbackStep  sessionData={sessionData} onUpdate={handleDataUpdate} onBack={() => goToStep('nextAppt')} onFinish={() => setFinished(true)} />}
    </div>
  );
}