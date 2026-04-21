import { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { onAuth } from '@/firebase/auth';
import { getPhysioPatients, saveHEP } from '@/firebase/db';
import {
  Search,
  Plus,
  X,
  Activity,
  Dumbbell,
  Send,
  Loader2,
  Sparkles,
  Trash2,
  CheckCircle2
} from 'lucide-react';

/**
 * Luxe HEPBuilder — "Clinical Rehab Architect" with Firestore persistence.
 */

const toTitleCase = (str) => {
  if (!str) return '';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const EXERCISES = [
  { id: 'e1', name: 'Cat-Cow Stretch', category: 'Mobility', description: 'Kneel on hands and knees. Arch back up then dip down gently.', target: 'Lower back', sets: 3, reps: '10' },
  { id: 'e2', name: 'Knee to Chest', category: 'Mobility', description: 'Lie on back. Hug one knee to chest, hold 30s. Switch sides.', target: 'Lower back, hips', sets: 3, reps: '8 each' },
  { id: 'e3', name: 'Lumbar Rotation', category: 'Mobility', description: 'Lie on back, knees bent. Rotate knees side to side slowly.', target: 'Lumbar spine', sets: 2, reps: '10 each' },
  { id: 'e4', name: 'Glute Bridge', category: 'Strength', description: 'Lie on back, knees bent. Lift hips off floor, squeeze glutes at top.', target: 'Glutes, core', sets: 3, reps: '15' },
  { id: 'e5', name: 'Clamshell', category: 'Strength', description: 'Lie on side, knees bent 90deg. Lift top knee keeping feet together.', target: 'Hip abductors', sets: 3, reps: '15 each' },
  { id: 'e6', name: 'Bird Dog', category: 'Core', description: 'On hands and knees. Extend opposite arm and leg. Keep back flat.', target: 'Core stability', sets: 3, reps: '10 each' },
  { id: 'e7', name: 'Side Plank', category: 'Core', description: 'Lie on side, prop on forearm. Lift hips, hold body straight.', target: 'Obliques', sets: 3, reps: '30s hold' },
  { id: 'e8', name: 'Dead Bug', category: 'Core', description: 'Lie on back, arms up. Lower opposite arm and leg slowly.', target: 'Core, coordination', sets: 3, reps: '10 each' },
  { id: 'e9', name: 'Straight Leg Raise', category: 'Strength', description: 'Lie on back. Lift straight leg to height of opposite knee.', target: 'Quadriceps', sets: 3, reps: '15 each' },
  { id: 'e10', name: 'Wall Squat', category: 'Strength', description: 'Stand with back against wall. Slide down to 90 degrees. Hold.', target: 'Quadriceps', sets: 3, reps: '10' },
  { id: 'e11', name: 'Cervical Retraction', category: 'Neck', description: 'Sit tall. Pull chin straight back like making a double chin.', target: 'Neck posture', sets: 3, reps: '10' },
  { id: 'e12', name: 'Chin Tucks', category: 'Neck', description: 'Look straight ahead. Nod head down, holding 5s. Repeat.', target: 'Deep neck flexors', sets: 3, reps: '10' },
  { id: 'e13', name: 'Shoulder Pendulum', category: 'Mobility', description: 'Lean forward, arm dangling. Circle arm slowly.', target: 'Shoulder mobility', sets: 2, reps: '30s each' },
  { id: 'e14', name: 'Ankle Alphabet', category: 'Mobility', description: 'Trace alphabet A-Z with big toe while seated.', target: 'Ankle ROM', sets: 2, reps: 'Full A-Z' },
  { id: 'e15', name: 'Piriformis Stretch', category: 'Stretch', description: 'Figure-4 stretch: cross ankle over knee. Lean forward.', target: 'Piriformis, glutes', sets: 3, reps: '30s each' },
  { id: 'e16', name: 'Hamstring Stretch', category: 'Stretch', description: 'Standing, extend one leg forward. Reach for toes.', target: 'Hamstrings', sets: 2, reps: '30s each' },
  { id: 'e17', name: 'Calf Stretch', category: 'Stretch', description: 'Step back with one leg. Press heel down against floor.', target: 'Calf muscles', sets: 2, reps: '30s each' },
  { id: 'e18', name: 'Quad Set', category: 'Strength', description: 'Lie on stomach. Tighten thigh muscle, press knee down.', target: 'Quadriceps', sets: 3, reps: '10 holds' },
];

const CATEGORIES = ['All', 'Mobility', 'Strength', 'Core', 'Neck', 'Stretch'];

export default function HEPBuilderPage() {
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [patient, setPatient] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onAuth(async (u) => {
      setUser(u);
      if (u) {
        const pts = await getPhysioPatients(u.uid);
        setPatients(pts || []);
      }
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => EXERCISES.filter(e => {
    const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.target.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'All' || e.category === category;
    return matchesSearch && matchesCat;
  }), [search, category]);

  const handleAdd = (ex) => {
    if (selected.find(s => s.id === ex.id)) return;
    setSelected([...selected, ex]);
    setSaved(false);
  };

  const handleRemove = (id) => {
    setSelected(selected.filter(s => s.id !== id));
    setSaved(false);
  };

  const handleSaveAndShare = async () => {
    if (!patient || selected.length === 0) return;
    setSaving(true);
    try {
      if (user && selectedPatientId) {
        await saveHEP(selectedPatientId, {
          exercises: selected,
          patientName: patient,
          physioName: 'OnlinePT',
          clinicName: 'OnlinePT',
        });
      }
      const text = `*Home Exercise Plan from OnlinePT*\n\n` +
        `Dr. OnlinePT\n\n` +
        selected.map((e, i) => `${i + 1}. ${e.name}\n   ${e.sets} sets x ${e.reps}\n   ${e.description}`).join('\n\n') +
        `\n\n_Please perform these exercises as instructed. Contact us if you have any questions._`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      setSaved(true);
    } catch (err) {
      console.error('Failed to save HEP:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper className="bg-gray-50/50 min-h-screen">
      <div className="max-w-4xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-10 duration-700">

        {/* Header Suite */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
            <div>
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full text-[10px] font-black uppercase tracking-widest text-primary mb-4 border border-primary/10">
                  <Activity size={12} /> Clinical Rehab Architect
               </div>
               <h1 className="text-4xl font-black text-gray-900 tracking-tight">HEP Builder</h1>
               <p className="text-gray-400 font-bold mt-1">Design precision exercise programs</p>
            </div>
            {selected.length > 0 && (
               <Button
                 onClick={handleSaveAndShare}
                 disabled={saving || !patient}
                 className="h-16 px-8 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/20 font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95"
               >
                 {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                 {saved ? 'Sent!' : 'Save & Send via WhatsApp'}
               </Button>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

           {/* Left: Exercise Library */}
           <div className="lg:col-span-2 space-y-6">
              {/* Search */}
              <div className="relative group">
                 <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors"><Search size={20} /></div>
                 <input
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   placeholder="Search exercises..."
                   className="w-full h-16 bg-white border-2 border-transparent rounded-[2rem] pl-16 pr-8 font-bold text-gray-900 shadow-xl shadow-gray-200/50 focus:border-primary/20 outline-none transition-all"
                 />
              </div>

              {/* Category Filters */}
              <div className="flex gap-2 flex-wrap">
                 {CATEGORIES.map(cat => (
                   <button
                     key={cat}
                     onClick={() => setCategory(cat)}
                     className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                       category === cat
                         ? 'bg-primary text-white shadow-lg'
                         : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'
                     }`}
                   >
                     {cat}
                   </button>
                 ))}
              </div>

              {/* Exercise Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {filtered.map(ex => {
                   const isSelected = !!selected.find(s => s.id === ex.id);
                   return (
                     <Card key={ex.id} className={`p-6 rounded-[2.5rem] border-none shadow-xl bg-white group cursor-pointer transition-all ${
                       isSelected ? 'ring-2 ring-primary ring-offset-2 opacity-60' : 'hover:translate-y-[-4px]'
                     }`}>
                       <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                            isSelected ? 'bg-primary text-white' : 'bg-gray-50 text-primary group-hover:bg-primary group-hover:text-white'
                          }`}>
                             {isSelected ? <CheckCircle2 size={22} /> : <Dumbbell size={22} />}
                          </div>
                          <Badge variant="default" className="rounded-xl px-3 py-1 font-black uppercase text-[9px]">{ex.category}</Badge>
                       </div>
                       <h3 className="text-lg font-black text-gray-900 tracking-tight mb-1">{ex.name}</h3>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{ex.target}</p>
                       <p className="text-[10px] text-gray-300 mb-4 leading-relaxed">{ex.description}</p>
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-gray-400 uppercase">{ex.sets}x{ex.reps}</span>
                          <Button
                            onClick={() => isSelected ? handleRemove(ex.id) : handleAdd(ex)}
                            variant={isSelected ? 'outline' : 'outline'}
                            className={`h-10 rounded-2xl font-black text-[10px] uppercase transition-all ${
                              isSelected ? 'border-red-200 text-red-400 hover:bg-red-50 hover:border-red-300' : 'border-primary/30 text-primary hover:bg-primary hover:text-white'
                            }`}
                          >
                            {isSelected ? 'Remove' : 'Add'} <Plus size={12} className="ml-1" />
                          </Button>
                       </div>
                     </Card>
                   );
                 })}
                 {filtered.length === 0 && (
                   <div className="col-span-full text-center py-12 text-gray-400 font-bold">No exercises found</div>
                 )}
              </div>
           </div>

           {/* Right: Active Program Side-Panel */}
           <div className="space-y-6">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-[.3em] pl-4 border-l-2 border-primary">Live Program ({selected.length})</p>

              <Card className="p-8 rounded-[3rem] border-none shadow-2xl shadow-gray-200 bg-white min-h-[350px]">
                  {selected.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-16 text-center opacity-30">
                        <Sparkles size={48} className="mb-4 text-gray-300" />
                        <p className="text-xs font-black uppercase tracking-widest">Selected List Empty</p>
                        <p className="text-[10px] text-gray-400 mt-2">Add exercises from the library</p>
                     </div>
                  ) : (
                     <div className="space-y-4">
                        {selected.map((s, i) => (
                           <div key={s.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">{i + 1}</div>
                                 <div className="text-left">
                                    <p className="text-xs font-black text-gray-900">{s.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{s.sets}x{s.reps}</p>
                                 </div>
                              </div>
                              <button onClick={() => handleRemove(s.id)} className="text-gray-200 hover:text-red-500 transition-colors p-1">
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        ))}

                        <div className="pt-6 border-t border-gray-100 space-y-3">
                           <div className="space-y-1 text-left">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Assign to Patient</p>
                              {patients.length > 0 ? (
                                <select
                                  value={selectedPatientId}
                                  onChange={e => {
                                    const p = patients.find(pt => pt.id === e.target.value);
                                    setSelectedPatientId(e.target.value);
                                    setPatient(p?.name || '');
                                  }}
                                  className="w-full h-12 px-4 font-bold bg-gray-50 rounded-xl border-none text-xs outline-none"
                                >
                                  <option value="">Select patient...</option>
                                  {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.name || p.phone || p.id}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  value={patient}
                                  onChange={e => setPatient(toTitleCase(e.target.value))}
                                  placeholder="Patient Name"
                                  className="w-full h-12 px-4 font-bold bg-gray-50 rounded-xl border-none text-xs outline-none"
                                />
                              )}
                           </div>
                        </div>

                        <div className="pt-4 flex flex-col items-center">
                           <div className="w-14 h-14 rounded-[2rem] bg-blue-50 flex items-center justify-center text-blue-500 mb-3">
                              <CheckCircle2 size={28} />
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-[.2em] text-gray-400 text-center">
                              {saved ? 'Saved & Sent!' : 'Clinical Verified Plan'}
                           </p>
                        </div>
                     </div>
                  )}
              </Card>
           </div>

        </div>
      </div>
    </PageWrapper>
  );
}
