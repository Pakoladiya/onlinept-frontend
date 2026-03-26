import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import clinicConfig from '@/config/clinicConfig';
import { whatsappLink } from '@/utils/whatsapp';
import {
  Search,
  Filter,
  Plus,
  Minus,
  Check,
  X,
  Share2,
  Download,
  ChevronRight,
  Clock,
  Repeat,
  PlayCircle,
  Activity,
  Dumbbell,
  Heart,
} from 'lucide-react';

const EXERCISES = [
  // Stretches
  { id: 'e1', name: 'Cat-Cow Stretch', category: 'Stretches', description: 'Kneel on hands and knees. Arch back up (cat) then dip down (cow).', target: 'Lower back mobility', sets: 3, reps: '10', duration: null, imageColor: '#39A900' },
  { id: 'e2', name: 'Hamstring Stretch', category: 'Stretches', description: 'Sit with one leg extended. Reach toward toes while keeping back straight.', target: 'Hamstrings', sets: 3, reps: '30 sec hold', duration: null, imageColor: '#39A900' },
  { id: 'e3', name: 'Piriformis Stretch', category: 'Stretches', description: 'Lie on back. Cross one ankle over opposite knee. Pull thigh toward chest.', target: 'Piriformis / glutes', sets: 3, reps: '30 sec hold', duration: null, imageColor: '#39A900' },
  { id: 'e4', name: 'Chin Tucks', category: 'Stretches', description: 'Lie on back. Pull chin toward chest, flattening neck against floor.', target: 'Cervical spine', sets: 3, reps: '10', duration: null, imageColor: '#39A900' },
  { id: 'e5', name: 'Thoracic Extension', category: 'Stretches', description: 'Place foam roller or rolled towel behind upper back. Arch over it gently.', target: 'Thoracic spine', sets: 3, reps: '10', duration: null, imageColor: '#39A900' },
  { id: 'e6', name: 'Hip Flexor Stretch', category: 'Stretches', description: 'Kneel on one knee. Push hips forward, keeping torso upright.', target: 'Hip flexors', sets: 3, reps: '30 sec hold', duration: null, imageColor: '#39A900' },
  { id: 'e7', name: 'Calf Stretch', category: 'Stretches', description: 'Stand facing a wall. Step one foot back, keep heel down, lean forward.', target: 'Calves', sets: 3, reps: '30 sec hold', duration: null, imageColor: '#39A900' },
  { id: 'e8', name: 'Shoulder Stretch', category: 'Stretches', description: 'Cross arm across chest. Use other hand to deepen stretch.', target: 'Posterior shoulder', sets: 3, reps: '30 sec hold', duration: null, imageColor: '#39A900' },
  // Strengthening
  { id: 'e9', name: 'Bridge Exercise', category: 'Strengthening', description: 'Lie on back, knees bent. Lift hips off floor, squeeze glutes at top.', target: 'Glutes, core', sets: 3, reps: '12', duration: null, imageColor: '#F6A000' },
  { id: 'e10', name: 'Clamshell', category: 'Strengthening', description: 'Lie on side, knees bent 90°. Keep feet together, lift top knee.', target: 'Hip abductors', sets: 3, reps: '15 each side', duration: null, imageColor: '#F6A000' },
  { id: 'e11', name: 'Quad Sets', category: 'Strengthening', description: 'Sit or lie with leg straight. Tighten thigh muscle, press knee down.', target: 'Quadriceps', sets: 3, reps: '15', duration: null, imageColor: '#F6A000' },
  { id: 'e12', name: 'Side Plank', category: 'Strengthening', description: 'Lie on side, prop on forearm. Lift hips off floor, hold body straight.', target: 'Core, obliques', sets: 3, reps: '20–30 sec', duration: null, imageColor: '#F6A000' },
  { id: 'e13', name: 'Bird-Dog', category: 'Strengthening', description: 'On all fours, extend opposite arm and leg. Keep back flat.', target: 'Core, back extensors', sets: 3, reps: '10 each side', duration: null, imageColor: '#F6A000' },
  { id: 'e14', name: 'Gluteal Sets', category: 'Strengthening', description: 'Lying or standing, squeeze buttocks together firmly. Hold 5 sec.', target: 'Gluteal muscles', sets: 3, reps: '15', duration: null, imageColor: '#F6A000' },
  { id: 'e15', name: 'Heel Raises', category: 'Strengthening', description: 'Stand holding a wall/chair. Rise onto toes, lower slowly.', target: 'Ankle dorsiflexors', sets: 3, reps: '15', duration: null, imageColor: '#F6A000' },
  { id: 'e16', name: 'Wall Sit', category: 'Strengthening', description: 'Lean against wall with knees at 90°. Hold position.', target: 'Quadriceps endurance', sets: 3, reps: null, duration: '30–45 sec', imageColor: '#F6A000' },
  { id: 'e17', name: 'Straight Leg Raise', category: 'Strengthening', description: 'Lie on back, one knee bent. Lift straight leg to height of bent knee.', target: 'Hip flexors, quads', sets: 3, reps: '12 each leg', duration: null, imageColor: '#F6A000' },
  { id: 'e18', name: 'Scapular Squeeze', category: 'Strengthening', description: 'Squeeze shoulder blades together behind back. Hold 5 sec.', target: 'Scapular stabilizers', sets: 3, reps: '15', duration: null, imageColor: '#F6A000' },
  { id: 'e19', name: 'Terminal Knee Extension', category: 'Strengthening', description: 'Sit with leg supported. Push knee into rolled towel, straightening leg.', target: 'VMO / quads', sets: 3, reps: '15', duration: null, imageColor: '#F6A000' },
  { id: 'e20', name: 'Monster Walk', category: 'Strengthening', description: 'With band around thighs, walk sideways keeping tension on band.', target: 'Hip abductors', sets: 3, reps: '10 steps each way', duration: null, imageColor: '#F6A000' },
  // Cardio / Low Impact
  { id: 'e21', name: 'Stationary Cycling', category: 'Cardio', description: 'Light cycling at low resistance. Keep upright posture.', target: 'Cardiovascular fitness', sets: 1, reps: null, duration: '10–20 min' , imageColor: '#6366f1' },
  { id: 'e22', name: 'Walking', category: 'Cardio', description: ' brisk walking. Start with 10 min, increase gradually.', target: 'General fitness', sets: 1, reps: null, duration: '20–30 min', imageColor: '#6366f1' },
  { id: 'e23', name: 'Step Touch', category: 'Cardio', description: 'Step side to side in rhythm. Hold chair for support if needed.', target: 'Balance, cardio', sets: 1, reps: null, duration: '5–10 min', imageColor: '#6366f1' },
  // Balance
  { id: 'e24', name: 'Single Leg Stand', category: 'Balance', description: 'Stand on one leg (near wall/chair for support). Hold 30 sec.', target: 'Balance, proprioception', sets: 3, reps: '30 sec each leg', duration: null, imageColor: '#10b981' },
  { id: 'e25', name: 'Heel-Toe Walk', category: 'Balance', description: 'Walk in a straight line placing heel directly in front of opposite toe.', target: 'Gait balance', sets: 3, reps: '20 steps', duration: null, imageColor: '#10b981' },
  { id: 'e26', name: 'Mini Squat on Bosu', category: 'Balance', description: 'Stand on Bosu ball (flat side up). Perform small squats maintaining balance.', target: 'Dynamic balance, quads', sets: 3, reps: '10', duration: null, imageColor: '#10b981' },
  { id: 'e27', name: 'Tandem Stance', category: 'Balance', description: 'Stand with heel of one foot directly in front of other foot.', target: 'Static balance', sets: 3, reps: '30 sec hold', duration: null, imageColor: '#10b981' },
  // Posture
  { id: 'e28', name: 'Chin Retraction', category: 'Posture', description: 'Sit tall. Pull chin straight back (like making a double chin).', target: 'Cervical posture', sets: 3, reps: '10', duration: null, imageColor: '#f59e0b' },
  { id: 'e29', name: 'Wall Angels', category: 'Posture', description: 'Stand against wall. Move arms up/down like snow angels keeping back and arms touching wall.', target: 'Thoracic mobility, posture', sets: 3, reps: '10', duration: null, imageColor: '#f59e0b' },
  { id: 'e30', name: 'Doorway Stretch', category: 'Posture', description: 'Place forearms on doorframe. Step through and lean forward to stretch chest.', target: 'Pectoral muscles', sets: 3, reps: '30 sec hold', duration: null, imageColor: '#f59e0b' },
];

const CATEGORIES = ['All', 'Stretches', 'Strengthening', 'Cardio', 'Balance', 'Posture'];
const CATEGORY_ICONS = { Stretches: Activity, Strengthening: Dumbbell, Cardio: Heart, Balance: PlayCircle, Posture: Clock };

function ExerciseCard({ exercise, onAdd }) {
  const [sets, setSets] = useState(exercise.sets || 3);
  const [reps, setReps] = useState(exercise.reps || '');
  const [duration, setDuration] = useState(exercise.duration || '');

  return (
    <Card className="flex items-start gap-3">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${exercise.imageColor}15` }}
      >
        <Dumbbell size={20} style={{ color: exercise.imageColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-text-primary text-sm">{exercise.name}</p>
            <p className="text-xs text-text-secondary mt-0.5">{exercise.target}</p>
          </div>
          <Badge variant="default" size="xs">{exercise.category}</Badge>
        </div>
        <p className="text-xs text-text-secondary mt-2">{exercise.description}</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setSets((s) => Math.max(1, s - 1))} className="w-6 h-6 rounded flex items-center justify-center bg-surface border border-border hover:border-primary"><Minus size={12} /></button>
            <span className="text-xs font-medium w-5 text-center">{sets}</span>
            <button onClick={() => setSets((s) => s + 1)} className="w-6 h-6 rounded flex items-center justify-center bg-surface border border-border hover:border-primary"><Plus size={12} /></button>
            <span className="text-xs text-text-secondary ml-1">sets</span>
          </div>
          {exercise.reps && (
            <div className="flex items-center gap-1">
              <input
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-16 px-2 py-1 text-xs rounded border border-border bg-surface text-text-primary text-center focus:outline-none focus:border-primary"
              />
              <span className="text-xs text-text-secondary">reps</span>
            </div>
          )}
          {exercise.duration && (
            <div className="flex items-center gap-1">
              <input
                value={duration || exercise.duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-16 px-2 py-1 text-xs rounded border border-border bg-surface text-text-primary text-center focus:outline-none focus:border-primary"
              />
            </div>
          )}
        </div>
      </div>
      <button
        onClick={() => onAdd({ ...exercise, sets, reps: reps || exercise.reps, duration: duration || exercise.duration })}
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
        style={{ backgroundColor: `${clinicConfig.primaryColor}15`, color: clinicConfig.primaryColor }}
      >
        <Plus size={15} />
      </button>
    </Card>
  );
}

export default function HEPBuilderPage() {
  const navigate = useNavigate();
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [patientName, setPatientName] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = useMemo(() => {
    return EXERCISES.filter((e) => {
      const matchCat = category === 'All' || e.category === category;
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, category]);

  const addExercise = (ex) => {
    setSelectedExercises((prev) => {
      if (prev.find((e) => e.id === ex.id)) return prev;
      return [...prev, { ...ex }];
    });
  };

  const removeExercise = (id) => {
    setSelectedExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const generateText = () => {
    const lines = [
      `Home Exercise Program — ${clinicConfig.clinicName}`,
      `Physiotherapist: ${clinicConfig.physioName}`,
      `Patient: ${patientName || 'Patient'}`,
      `Date: ${new Date().toLocaleDateString('en-IN')}`,
      '',
      'YOUR EXERCISES:',
      ...selectedExercises.map((e, i) =>
        `${i + 1}. ${e.name}\n   ${e.sets} sets × ${e.reps || e.duration || '—'}\n   Target: ${e.target}`
      ),
      '',
      notes ? `NOTES:\n${notes}` : '',
      '',
      `Generated by ${clinicConfig.clinicName} · ${clinicConfig.physioName}`,
    ];
    return lines.filter(Boolean).join('\n');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <PageWrapper>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-text-primary">HEP Builder</h1>
        <p className="text-sm text-text-secondary mt-1">Create and assign home exercise programs</p>
      </div>

      {/* Assigned exercises */}
      {selectedExercises.length > 0 && (
        <Card className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-text-primary">
              Assigned Exercises ({selectedExercises.length})
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShareWhatsApp}>
                <Share2 size={14} /> WhatsApp
              </Button>
              <Button size="sm" onClick={() => {
                const text = generateText();
                navigator.clipboard.writeText(text);
              }}>
                Copy to Clipboard
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {selectedExercises.map((ex, i) => (
              <div key={ex.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: clinicConfig.primaryColor }}>{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{ex.name}</p>
                  <p className="text-xs text-text-secondary">{ex.sets} sets × {ex.reps || ex.duration}</p>
                </div>
                <button onClick={() => removeExercise(ex.id)} className="text-text-secondary hover:text-error">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          {notes && (
            <div className="mt-3 p-3 rounded-lg bg-surface text-xs text-text-secondary italic">
              Notes: {notes}
            </div>
          )}
        </Card>
      )}

      {/* Patient info */}
      <Card className="mb-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-wide mb-1 block">Patient Name</label>
            <input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter patient name"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-wide mb-1 block">Physio Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Stop if pain > 5/10"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </Card>

      {/* Search & filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border bg-surface text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat];
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${category === cat ? 'text-white' : 'text-text-secondary bg-surface border border-border hover:border-primary'}`}
              style={category === cat ? { backgroundColor: clinicConfig.primaryColor } : {}}
            >
              {Icon && <Icon size={12} />}
              {cat}
            </button>
          );
        })}
      </div>

      {/* Exercise library */}
      <div className="space-y-3">
        {filtered.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} onAdd={addExercise} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Dumbbell size={32} className="text-text-secondary mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No exercises found.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
