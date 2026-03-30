import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { onAuth } from '@/firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { updateClinicConfig } from '@/config/clinicConfig';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { uploadFile } from '@/firebase/storage';
import {
  ArrowLeft, Save, Check, Upload,
  Image, User, Palette, Video,
  Globe, Phone, Mail, MapPin,
  Loader2, AlertCircle, CheckCircle2, X, ChevronRight
} from 'lucide-react';

// ─── Color Palettes ────────────────────────────────────────────────────────────
const COLOR_PALETTES = [
  { name: 'Forest Fresh',    primary: '#007AFF', secondary: '#F6A000' },
  { name: 'Ocean Calm',      primary: '#0066CC', secondary: '#00B4D8' },
  { name: 'Sunset Warmth',   primary: '#E85D04', secondary: '#FFBA08' },
  { name: 'Royal Purple',    primary: '#7C3AED', secondary: '#A78BFA' },
  { name: 'Rose Gold',       primary: '#BE185D', secondary: '#F9A8D4' },
  { name: 'Midnight Slate',   primary: '#1E293B', secondary: '#38BDF8' },
  { name: 'Teal Zen',       primary: '#0D9488', secondary: '#5EEAD4' },
  { name: 'Crimson Medical', primary: '#DC2626', secondary: '#FCA5A5' },
  { name: 'Earth Brown',     primary: '#78350F', secondary: '#D97706' },
  { name: 'Minimal Black',   primary: '#111827', secondary: '#6B7280' },
  { name: 'Teal Dark',       primary: '#134E4A', secondary: '#2DD4BF' },
  { name: 'Indigo Pro',      primary: '#4338CA', secondary: '#818CF8' },
];

// ─── Palette Picker ────────────────────────────────────────────────────────────
function PalettePicker({ primary, secondary, onApply }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <label className="text-xs text-text-secondary uppercase tracking-wide block">Quick Palette</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-surface rounded-xl border border-border hover:border-primary/50 transition-all"
      >
        <div className="flex gap-1">
          <div className="w-6 h-6 rounded" style={{ backgroundColor: primary }} />
          <div className="w-6 h-6 rounded" style={{ backgroundColor: secondary }} />
        </div>
        <span className="text-xs font-semibold text-text-secondary flex-1 text-left">Choose Palette</span>
        <ChevronRight size={14} className={`text-text-secondary transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="bg-white rounded-2xl border border-border shadow-xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Preset Palettes</p>
            <button onClick={() => setOpen(false)} className="text-text-secondary hover:text-text-primary"><X size={12} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {COLOR_PALETTES.map((p) => (
              <button
                key={p.name}
                onClick={() => { onApply(p.primary, p.secondary); setOpen(false); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all hover:shadow-md ${
                  p.primary === primary && p.secondary === secondary
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-surface/50 hover:border-gray-200'
                }`}
              >
                <div className="flex gap-0.5 shrink-0">
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: p.primary }} />
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: p.secondary }} />
                </div>
                <span className="text-[10px] font-bold text-text-secondary text-left leading-tight">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ColorPicker({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-text-secondary uppercase tracking-wide mb-1.5 block">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg border border-border cursor-pointer shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary font-mono focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}

function ImageUpload({ label, value, onChange, path, clinicId, aspect }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('File must be under 5MB'); return; }
    setUploading(true);
    setError('');
    try {
      const url = await uploadFile(file, `clinics/${clinicId}/${path}`);
      onChange(url);
    } catch (err) {
      setError('Upload failed. Try again.');
    }
    setUploading(false);
  }

  return (
    <div>
      <label className="text-xs text-text-secondary uppercase tracking-wide mb-1.5 block">{label}</label>
      <div
        className="relative rounded-xl border-2 border-dashed border-border overflow-hidden flex items-center justify-center bg-surface cursor-pointer hover:border-primary/50 transition-colors"
        style={{ aspectRatio: aspect || '16/9' }}
      >
        {value ? (
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-text-secondary/50">
            <Image size={24} />
            <span className="text-xs">Click to upload</span>
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" />
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-white" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [settings, setSettings] = useState({
    physioName: '',
    clinicName: '',
    phone: '',
    email: '',
    address: '',
    logo: '',
    coverPhoto: '',
    physioPhoto: '',
    primaryColor: '#007AFF',
    secondaryColor: '#F6A000',
    videoMode: 'whatsapp',
    zoomLink: '',
  });

  useEffect(() => {
    const unsub = onAuth(async (u) => {
      if (!u) { navigate('/dashboard-login'); return; }
      setUser(u);
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const snap = await getDocs(query(collection(db, 'clinics'), where('uid', '==', u.uid)));
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setClinicId(snap.docs[0].id);
          setSettings((s) => ({
            ...s,
            physioName: data.physioName || '',
            clinicName: data.clinicName || '',
            email: data.email || u.email || '',
            phone: data.phone || '',
            address: data.address || '',
            logo: data.settings?.logo || '',
            coverPhoto: data.settings?.coverPhoto || '',
            physioPhoto: data.settings?.physioPhoto || '',
            primaryColor: data.settings?.primaryColor || '#007AFF',
            secondaryColor: data.settings?.secondaryColor || '#F6A000',
            videoMode: data.settings?.videoMode || 'whatsapp',
            zoomLink: data.settings?.zoomLink || '',
          }));
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function handleSave() {
    if (!clinicId) return;
    setSaving(true);
    setError('');
    try {
      await updateDoc(doc(db, 'clinics', clinicId), {
        physioName: settings.physioName,
        clinicName: settings.clinicName,
        email: settings.email,
        phone: settings.phone,
        address: settings.address,
        settings: {
          logo: settings.logo,
          coverPhoto: settings.coverPhoto,
          physioPhoto: settings.physioPhoto,
          primaryColor: settings.primaryColor,
          secondaryColor: settings.secondaryColor,
          videoMode: settings.videoMode,
          zoomLink: settings.zoomLink,
        },
      });
      // Apply locally so changes show immediately
      updateClinicConfig({
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        clinicName: settings.clinicName,
        physioName: settings.physioName,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        videoMode: settings.videoMode,
        meetLink: settings.zoomLink,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError('Failed to save. Please try again.');
    }
    setSaving(false);
  }

  function update(key, val) {
    setSettings((s) => ({ ...s, [key]: val }));
  }

  function applyPalette(primary, secondary) {
    setSettings((s) => ({ ...s, primaryColor: primary, secondaryColor: secondary }));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="bg-white border-b border-border/70 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                <CheckCircle2 size={14} /> Saved!
              </span>
            )}
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Clinic Settings</h1>
          <p className="text-sm text-text-secondary mt-0.5">Customize your branding and consultation setup</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Brand Identity */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${settings.primaryColor}15` }}>
              <Image size={16} style={{ color: settings.primaryColor }} />
            </div>
            <h2 className="font-semibold text-text-primary">Brand Identity</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <ImageUpload label="Clinic Logo" value={settings.logo} onChange={(v) => update('logo', v)} path="logo" clinicId={clinicId} aspect="1/1" />
            <ImageUpload label="Cover Photo" value={settings.coverPhoto} onChange={(v) => update('coverPhoto', v)} path="cover" clinicId={clinicId} aspect="16/9" />
          </div>
          <div className="mt-4">
            <ImageUpload label="Physio Photo" value={settings.physioPhoto} onChange={(v) => update('physioPhoto', v)} path="physio" clinicId={clinicId} aspect="1/1" />
          </div>
        </Card>

        {/* Brand Colors */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${settings.primaryColor}15` }}>
              <Palette size={16} style={{ color: settings.primaryColor }} />
            </div>
            <h2 className="font-semibold text-text-primary">Brand Colors</h2>
          </div>
          {/* Palette Presets */}
          <div className="mb-4">
            <PalettePicker
              primary={settings.primaryColor}
              secondary={settings.secondaryColor}
              onApply={applyPalette}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <ColorPicker label="Primary Color" value={settings.primaryColor} onChange={(v) => update('primaryColor', v)} />
            <ColorPicker label="Accent Color" value={settings.secondaryColor} onChange={(v) => update('secondaryColor', v)} />
          </div>
          {/* Preview */}
          <div className="mt-4 flex gap-3 items-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: settings.primaryColor }}>
              {settings.clinicName.charAt(0) || 'C'}
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: settings.secondaryColor }}>
              {settings.clinicName.charAt(0) || 'C'}
            </div>
            <span className="text-xs text-text-secondary/70">Color Preview</span>
          </div>
        </Card>

        {/* Clinic Information */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${settings.primaryColor}15` }}>
              <User size={16} style={{ color: settings.primaryColor }} />
            </div>
            <h2 className="font-semibold text-text-primary">Clinic Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary uppercase tracking-wide mb-1.5 block">Physio Name</label>
              <input value={settings.physioName} onChange={(e) => update('physioName', e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase tracking-wide mb-1.5 block">Clinic Name</label>
              <input value={settings.clinicName} onChange={(e) => update('clinicName', e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase tracking-wide mb-1.5 block">Email</label>
              <input type="email" value={settings.email} onChange={(e) => update('email', e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase tracking-wide mb-1.5 block">Phone</label>
              <input value={settings.phone} onChange={(e) => update('phone', e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase tracking-wide mb-1.5 block">Address</label>
              <input value={settings.address} onChange={(e) => update('address', e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary" />
            </div>
          </div>
        </Card>

        {/* Video Consultation */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${settings.primaryColor}15` }}>
              <Video size={16} style={{ color: settings.primaryColor }} />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">Video Consultation</h2>
              <p className="text-xs text-text-secondary">Choose how patients join your sessions</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { id: 'whatsapp', label: 'WhatsApp Video', desc: 'Share your WhatsApp number — patient calls you directly', icon: '1' },
              { id: 'zoom', label: 'Zoom Meeting', desc: 'Patient joins via your Zoom meeting link', icon: '2' },
            ].map((opt) => (
              <label
                key={opt.id}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${settings.videoMode === opt.id ? 'border-primary' : 'border-border hover:border-primary/40'}`}
                style={settings.videoMode === opt.id ? { backgroundColor: `${settings.primaryColor}08` } : {}}
              >
                <input type="radio" name="videoMode" value={opt.id} checked={settings.videoMode === opt.id} onChange={() => update('videoMode', opt.id)} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white" style={{ backgroundColor: settings.primaryColor }}>{opt.icon}</div>
                    <p className="text-sm font-semibold text-text-primary">{opt.label}</p>
                    {settings.videoMode === opt.id && <Badge variant="primary" size="sm">Selected</Badge>}
                  </div>
                  <p className="text-xs text-text-secondary">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
          {settings.videoMode === 'zoom' && (
            <div className="mt-4">
              <label className="text-xs text-text-secondary uppercase tracking-wide mb-1.5 block">Zoom Meeting Link</label>
              <input type="url" value={settings.zoomLink} onChange={(e) => update('zoomLink', e.target.value)} placeholder="https://us02web.zoom.us/j/..." className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary" />
              <p className="text-xs text-text-secondary/70 mt-1">Paste your recurring Zoom meeting link. Share the same link with all patients.</p>
            </div>
          )}
          {settings.videoMode === 'whatsapp' && (
            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-xs text-blue-700 font-medium">WhatsApp video is free and works instantly. Your patients will see your WhatsApp number when they book.</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
