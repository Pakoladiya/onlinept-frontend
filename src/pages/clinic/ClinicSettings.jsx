import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuth } from '@/firebase/auth';
import { updateClinicConfig } from '@/config/clinicConfig';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Palette,
  User,
  Briefcase,
  Save,
  Image as ImageIcon,
  Plus,
  Trash2,
  ChevronRight,
  Loader2,
  CheckCircle2,
  MapPin,
  Mail,
  Phone as PhoneIcon,
  HelpCircle,
  Video,
  ShieldCheck,
  Globe,
  X,
} from 'lucide-react';

// ─── Color Palettes ────────────────────────────────────────────────────────────
const COLOR_PALETTES = [
  // Name, primary color, secondary color, preview label
  { name: 'Forest Fresh',      primary: '#007AFF', secondary: '#F6A000' },
  { name: 'Ocean Calm',       primary: '#0066CC', secondary: '#00B4D8' },
  { name: 'Sunset Warmth',    primary: '#E85D04', secondary: '#FFBA08' },
  { name: 'Royal Purple',     primary: '#7C3AED', secondary: '#A78BFA' },
  { name: 'Rose Gold',        primary: '#BE185D', secondary: '#F9A8D4' },
  { name: 'Midnight Slate',   primary: '#1E293B', secondary: '#38BDF8' },
  { name: 'Teal Zen',         primary: '#0D9488', secondary: '#5EEAD4' },
  { name: 'Crimson Medical',  primary: '#DC2626', secondary: '#FCA5A5' },
  { name: 'Earth Brown',      primary: '#78350F', secondary: '#D97706' },
  { name: 'Minimal White',    primary: '#111827', secondary: '#6B7280' },
  { name: 'Teal Dark',       primary: '#134E4A', secondary: '#2DD4BF' },
  { name: 'Indigo Pro',       primary: '#4338CA', secondary: '#818CF8' },
];

// ─── Title Case Helper ─────────────────────────────────────────────────────────
function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

// ─── Color Swatch Button ───────────────────────────────────────────────────────
function ColorSwatch({ color, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-lg transition-all ${selected ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-105'}`}
      style={{ backgroundColor: color }}
      title={color}
    />
  );
}

// ─── Palette Picker ────────────────────────────────────────────────────────────
function PalettePicker({ label, primaryColor, secondaryColor, onApply }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <label className="text-xs font-black uppercase text-gray-400 ml-1 flex items-center gap-1.5">
        {label}
      </label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary/40 transition-all"
      >
        <div className="flex gap-1">
          <div className="w-6 h-6 rounded-md" style={{ backgroundColor: primaryColor }} />
          <div className="w-6 h-6 rounded-md" style={{ backgroundColor: secondaryColor }} />
        </div>
        <span className="text-xs font-bold text-gray-500 flex-1 text-left">Choose Palette</span>
        <ChevronRight size={14} className={`text-gray-300 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Preset Palettes</p>
            <button onClick={() => setOpen(false)} className="text-gray-300 hover:text-gray-500"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {COLOR_PALETTES.map((palette) => (
              <button
                key={palette.name}
                onClick={() => {
                  onApply(palette.primary, palette.secondary);
                  setOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all hover:shadow-md ${
                  palette.primary === primaryColor && palette.secondary === secondaryColor
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                }`}
              >
                <div className="flex gap-0.5 shrink-0">
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: palette.primary }} />
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: palette.secondary }} />
                </div>
                <span className="text-[10px] font-bold text-gray-600 text-left leading-tight">{palette.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClinicSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [formData, setFormData] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuth(async (u) => {
      if (!u) { navigate('/dashboard-login'); return; }
      setUser(u);
      await loadClinic(u);
    });
    return unsub;
  }, []);

  async function loadClinic(u) {
    if (!db) {
      setFormData({ primaryColor: '#007AFF', secondaryColor: '#F6A000', videoMode: 'whatsapp', razorpayEnabled: false, consultationFee: 500 });
      setLoading(false);
      return;
    }
    try {
      const snap = await getDocs(query(collection(db, 'clinics'), where('uid', '==', u.uid)));
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const id = snap.docs[0].id;
        setClinicId(id);
        setFormData(data);
      } else {
        // Fallback: use defaults
        setFormData({ primaryColor: '#007AFF', secondaryColor: '#F6A000', videoMode: 'whatsapp', razorpayEnabled: false, consultationFee: 500 });
      }
    } catch (err) {
      console.error('Error loading clinic:', err);
      setFormData({ primaryColor: '#007AFF', secondaryColor: '#F6A000', videoMode: 'whatsapp', razorpayEnabled: false, consultationFee: 500 });
    }
    setLoading(false);
  }

  const handleSave = async () => {
    if (!clinicId || !db) return;
    setSaving(true);
    setErrorMsg('');
    setSuccess(false);
    try {
      await updateDoc(doc(db, 'clinics', clinicId), formData);
      // Apply theme changes locally so they take effect immediately
      updateClinicConfig({
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        clinicName: formData.clinicName,
        physioName: formData.physioName,
        phone: formData.phone,
        whatsappNumber: formData.whatsapp || formData.whatsappNumber,
        whatsappMessagePrefill: formData.whatsappMessagePrefill,
        videoMode: formData.videoMode,
        meetLink: formData.meetLink,
        email: formData.email,
        address: formData.address,
        mapUrl: formData.mapUrl,
        tagline: formData.tagline,
        googleReviewUrl: formData.googleReviewUrl,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setErrorMsg('Failed to save. Please try again.');
    }
    setSaving(false);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const applyPalette = (primary, secondary) => {
    setFormData(prev => ({ ...prev, primaryColor: primary, secondaryColor: secondary }));
  };

  const updateListItem = (listKey, index, field, value) => {
    const newList = [...(formData[listKey] || [])];
    newList[index] = { ...newList[index], [field]: value };
    updateField(listKey, newList);
  };

  const addListItem = (listKey, newItem) => {
    updateField(listKey, [...(formData[listKey] || []), newItem]);
  };

  const removeListItem = (listKey, index) => {
    const newList = [...(formData[listKey] || [])];
    newList.splice(index, 1);
    updateField(listKey, newList);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-10 pb-20 px-4">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex justify-between items-end border-b border-gray-200 pb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Clinic Personalization</h1>
            <p className="text-gray-500 font-medium mt-1">
              Customizing portal for: <span className="text-primary font-bold">{formData.clinicName || 'Your Clinic'}</span>
            </p>
          </div>
          <Button
            className="h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 min-w-[160px]"
            onClick={handleSave}
            disabled={saving || !clinicId}
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : success ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {saving ? 'Syncing...' : success ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold">
            <ShieldCheck size={16} />
            {errorMsg}
            <button onClick={() => setErrorMsg('')} className="ml-auto text-red-300 hover:text-red-500"><X size={14} /></button>
          </div>
        )}

        {/* ── Branding & Identity ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-gray-400 font-black uppercase tracking-[0.2em] text-xs">
            <Palette className="w-4 h-4" /> Visual Identity & Branding
          </div>
          <Card className="p-8 rounded-[2rem] bg-white space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 text-left">
                <label className="text-xs font-black uppercase text-gray-400 ml-1 flex items-center gap-1.5">
                  Clinic Name
                  <HelpCircle size={12} className="text-gray-300 cursor-help" />
                </label>
                <input
                  value={formData.clinicName || ''}
                  onChange={e => updateField('clinicName', e.target.value)}
                  className="w-full h-14 bg-gray-50 rounded-xl px-5 font-bold outline-none border border-gray-100 focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-black uppercase text-gray-400 ml-1 flex items-center gap-1.5">
                  Tagline
                  <HelpCircle size={12} className="text-gray-300 cursor-help" />
                </label>
                <input
                  value={formData.tagline || ''}
                  onChange={e => updateField('tagline', e.target.value)}
                  className="w-full h-14 bg-gray-50 rounded-xl px-5 font-bold outline-none border border-gray-100 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Color Palettes */}
            <div className="pt-6 border-t border-gray-50 space-y-4">
              <PalettePicker
                label="Brand Color Palette"
                primaryColor={formData.primaryColor || '#007AFF'}
                secondaryColor={formData.secondaryColor || '#F6A000'}
                onApply={applyPalette}
              />

              {/* Manual Override */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 text-left">
                  <label className="text-xs font-black uppercase text-gray-400 ml-1 flex items-center gap-1.5">
                    Primary Color
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: formData.primaryColor || '#007AFF' }} />
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.primaryColor || '#007AFF'}
                      onChange={e => updateField('primaryColor', e.target.value)}
                      className="w-14 h-14 rounded-xl border border-gray-100 cursor-pointer"
                    />
                    <input
                      value={formData.primaryColor || '#007AFF'}
                      onChange={e => updateField('primaryColor', e.target.value)}
                      className="flex-1 h-14 bg-gray-50 rounded-xl px-5 font-mono font-bold uppercase border border-gray-100 focus:border-primary/50 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-xs font-black uppercase text-gray-400 ml-1 flex items-center gap-1.5">
                    Secondary Color
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: formData.secondaryColor || '#F6A000' }} />
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.secondaryColor || '#F6A000'}
                      onChange={e => updateField('secondaryColor', e.target.value)}
                      className="w-14 h-14 rounded-xl border border-gray-100 cursor-pointer"
                    />
                    <input
                      value={formData.secondaryColor || '#F6A000'}
                      onChange={e => updateField('secondaryColor', e.target.value)}
                      className="flex-1 h-14 bg-gray-50 rounded-xl px-5 font-mono font-bold uppercase border border-gray-100 focus:border-primary/50 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ── Payment Gateway ─── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400 font-black uppercase tracking-[0.2em] text-xs">
              <Briefcase className="w-4 h-4" /> Payment Gateway (Razorpay)
            </div>
            <button
              onClick={() => updateField('razorpayEnabled', !formData.razorpayEnabled)}
              className={`w-12 h-6 rounded-full relative transition-all duration-300 ${formData.razorpayEnabled ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${formData.razorpayEnabled ? 'translate-x-6' : ''}`} />
            </button>
          </div>
          <Card className={`p-10 rounded-[2rem] bg-white border-2 transition-all ${formData.razorpayEnabled ? 'border-indigo-100' : 'border-gray-100 opacity-60'}`}>
            <div className="flex flex-col md:flex-row gap-10">
              {/* Razorpay Logo - using inline SVG for reliability */}
              <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 300 100" className="w-14" xmlns="http://www.w3.org/2000/svg" aria-label="Razorpay">
                  <rect fill="#0066FF" width="300" height="100" rx="8"/>
                  <text x="20" y="62" fontFamily="Arial Black, sans-serif" fontSize="36" fontWeight="900" fill="white">Razorpay</text>
                  <text x="148" y="78" fontFamily="Arial, sans-serif" fontSize="10" fill="#0066FF" fontWeight="bold">SUPPORTED</text>
                </svg>
              </div>
              <div className="flex-1 space-y-8 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2">
                      Key Id
                      <span className="p-1 px-2 rounded-md bg-indigo-50 text-indigo-500 font-bold text-[9px]">Settings &rarr; Api Keys</span>
                    </label>
                    <input
                      type="password"
                      value={formData.razorpayKeyId || ''}
                      onChange={e => updateField('razorpayKeyId', e.target.value)}
                      className="w-full h-14 bg-gray-50 rounded-xl px-5 text-sm font-mono font-bold border border-gray-100 focus:border-indigo-200 outline-none transition-all"
                      placeholder="rzp_live_..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400">Key Secret</label>
                    <input
                      type="password"
                      value={formData.razorpayKeySecret || ''}
                      onChange={e => updateField('razorpayKeySecret', e.target.value)}
                      className="w-full h-14 bg-gray-50 rounded-xl px-5 text-sm font-mono font-bold border border-gray-100 focus:border-indigo-200 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                  <ShieldCheck className="text-indigo-600 w-5 h-5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-indigo-700 uppercase">Direct Settlements</p>
                    <p className="text-xs text-indigo-600 font-medium">Patients pay upfront during booking. Funds are settled daily into your linked bank account by Razorpay.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ── Consultation Platform ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-gray-400 font-black uppercase tracking-[0.2em] text-xs">
            <Video className="w-4 h-4" /> Consultation Platform
          </div>
          <Card className="p-8 rounded-[2rem] bg-white space-y-8 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400">Default Mode</label>
                <select
                  value={formData.videoMode || 'whatsapp'}
                  onChange={e => updateField('videoMode', e.target.value)}
                  className="w-full h-14 bg-gray-50 rounded-xl px-5 font-bold outline-none appearance-none border border-gray-100 focus:border-primary/50 transition-all"
                >
                  <option value="whatsapp">WhatsApp Video</option>
                  <option value="zoom">Zoom Personal Room</option>
                  <option value="meet">Google Meet</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400">Permanent Link</label>
                <input
                  value={formData.meetLink || ''}
                  onChange={e => updateField('meetLink', e.target.value)}
                  className="w-full h-14 bg-gray-50 rounded-xl px-5 font-bold border border-gray-100 focus:border-primary/50 outline-none transition-all"
                  placeholder="Paste your link here..."
                />
              </div>
            </div>
            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
              <HelpCircle className="text-blue-500 w-5 h-5 shrink-0" />
              <div className="space-y-2">
                <p className="text-[10px] font-black text-blue-700 uppercase">How To Get Your Zoom Link</p>
                <ul className="text-[11px] text-blue-600 font-medium space-y-1 list-disc pl-4">
                  <li>Open Zoom App &rarr; Click <b>Meetings</b> at the top.</li>
                  <li>Copy the <b>Personal Meeting ID (Pmi)</b> link.</li>
                  <li>Paste it into the box above. Patients will use this one link for all their sessions.</li>
                </ul>
              </div>
            </div>
          </Card>
        </section>

        {/* ── Professional Fees & Pricing ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-gray-400 font-black uppercase tracking-[0.2em] text-xs">
            <span className="text-lg">💰</span> Professional Fees & Pricing
          </div>
          <Card className="p-8 rounded-[2rem] bg-white space-y-8 text-left border-2 border-blue-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400 flex items-center gap-2">
                  Consultation Fee (INR)
                  <span className="p-1 px-2 rounded-md bg-blue-50 text-blue-600 font-bold text-[9px]">Per Session</span>
                </label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">₹</div>
                   <input
                     type="number"
                     value={formData.consultationFee || 500}
                     onChange={e => updateField('consultationFee', parseInt(e.target.value))}
                     className="w-full h-14 bg-gray-50 rounded-xl pl-10 pr-5 font-black text-xl outline-none border border-gray-100 focus:border-blue-500/50 transition-all shadow-sm"
                     placeholder="500"
                   />
                </div>
              </div>
              <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                <ShieldCheck className="text-blue-600 w-5 h-5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-blue-700 uppercase">Automated Billing</p>
                  <p className="text-xs text-blue-600 font-medium leading-relaxed">
                    This amount will be displayed to your patients on your booking page and collected via Razorpay securely.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ── Profile & Contact ─── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-gray-400 font-black uppercase tracking-[0.2em] text-xs">
            <User className="w-4 h-4" /> Personal Profile
          </div>
          <Card className="p-8 rounded-[2rem] bg-white space-y-8 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2 text-left">
                <label className="text-xs font-black uppercase text-gray-400 ml-1">Physio Name</label>
                <input
                  value={formData.physioName || ''}
                  onChange={e => updateField('physioName', e.target.value)}
                  className="w-full h-14 bg-gray-50 rounded-xl px-5 font-bold outline-none border border-gray-100 focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-black uppercase text-gray-400 ml-1">Qualifications</label>
                <input
                  value={formData.qualifications || ''}
                  onChange={e => updateField('qualifications', e.target.value)}
                  className="w-full h-14 bg-gray-50 rounded-xl px-5 font-bold outline-none border border-gray-100 focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-black uppercase text-gray-400 ml-1">Years of Experience</label>
                <input
                  value={formData.experience || ''}
                  onChange={e => updateField('experience', e.target.value)}
                  placeholder="e.g. 12+ Years"
                  className="w-full h-14 bg-gray-50 rounded-xl px-5 font-bold outline-none border border-gray-100 focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-black uppercase text-gray-400 ml-1">Phone</label>
                <input
                  value={formData.phone || ''}
                  onChange={e => updateField('phone', e.target.value)}
                  className="w-full h-14 bg-gray-50 rounded-xl px-5 font-bold outline-none border border-gray-100 focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-black uppercase text-gray-400 ml-1">WhatsApp Number</label>
                <input
                  value={formData.whatsapp || ''}
                  onChange={e => updateField('whatsapp', e.target.value)}
                  placeholder="919876543210"
                  className="w-full h-14 bg-gray-50 rounded-xl px-5 font-bold outline-none border border-gray-100 focus:border-primary/50 transition-all"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-black uppercase text-gray-400 ml-1">Email</label>
                <input
                  value={formData.email || ''}
                  onChange={e => updateField('email', e.target.value)}
                  className="w-full h-14 bg-gray-50 rounded-xl px-5 font-bold outline-none border border-gray-100 focus:border-primary/50 transition-all"
                />
              </div>
            </div>
            <div className="space-y-6 pt-8 border-t border-gray-100">
              <div className="flex items-center gap-2 text-gray-300 font-black uppercase tracking-[0.1em] text-[10px] pb-2">
                <MapPin className="w-3 h-3" /> Address & Google Map (Optional)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Clinic Address</label>
                  <textarea
                    value={formData.address || ''}
                    onChange={e => updateField('address', e.target.value)}
                    rows={3}
                    className="w-full bg-gray-50 rounded-xl p-5 text-sm font-bold outline-none border border-gray-100 focus:border-primary/50 transition-all resize-none"
                    placeholder="1st Floor, Fitness plaza..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Map Embed Link</label>
                  <textarea
                    value={formData.mapUrl || ''}
                    onChange={e => updateField('mapUrl', e.target.value)}
                    rows={3}
                    className="w-full bg-gray-50 rounded-xl p-5 text-[10px] font-mono font-bold outline-none border border-gray-100 focus:border-primary/50 transition-all resize-none"
                    placeholder="Paste the iframe src link..."
                  />
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest pl-1 italic">Google Maps &rarr; Share &rarr; Embed Map &rarr; Copy src</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ── Social & Reputation ─── */}
        <section className="space-y-6 text-left">
          <div className="flex items-center gap-2 text-gray-400 font-black uppercase tracking-[0.2em] text-xs">
            <Globe className="w-4 h-4" /> Pulse Social Presence
          </div>

          <Card className="p-8 rounded-[2rem] bg-white space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { id: 'instagramUrl', label: 'Instagram Url', placeholder: 'https://instagram.com/your-clinic' },
                { id: 'facebookUrl', label: 'Facebook Url', placeholder: 'https://facebook.com/your-clinic' },
                { id: 'youtubeUrl', label: 'YouTube Channel', placeholder: 'https://youtube.com/@your-clinic' },
                { id: 'twitterUrl', label: 'Twitter (X) Url', placeholder: 'https://twitter.com/your-clinic' },
              ].map((social) => (
                <div key={social.id} className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">{social.label}</label>
                  <input
                    value={formData[social.id] || ''}
                    onChange={e => updateField(social.id, e.target.value)}
                    placeholder={social.placeholder}
                    className="w-full h-12 bg-gray-50 rounded-xl px-4 text-xs font-bold outline-none border border-gray-100 focus:border-primary/50 transition-all"
                  />
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-gray-50">
              <div className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-indigo-50 border border-indigo-100">
                <img src="https://www.gstatic.com/images/branding/product/2x/google_g_48dp.png" className="w-6 h-6 shrink-0" alt="Google" />
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase text-indigo-700 block mb-1">Google Business Review Link</label>
                  <input
                    value={formData.googleReviewUrl || ''}
                    onChange={e => updateField('googleReviewUrl', e.target.value)}
                    placeholder="https://g.page/r/your-id/review"
                    className="w-full bg-white h-10 px-4 rounded-lg text-xs font-bold outline-none border border-indigo-100 focus:border-indigo-300 transition-all"
                  />
                </div>
              </div>
            </div>
          </Card>

          <div className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Patient Testimonials</p>
              <Button variant="ghost" size="sm" onClick={() => addListItem('testimonials', { name: 'Patient Name', text: '', rating: 5 })}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Manual Review
              </Button>
            </div>
            <div className="space-y-4">
              {(formData.testimonials || []).map((t, i) => (
                <Card key={i} className="p-6 rounded-[1.5rem] bg-white border-gray-100 shadow-sm flex flex-col gap-4">
                  <div className="flex gap-4">
                    <input
                      value={t.name}
                      onChange={e => updateListItem('testimonials', i, 'name', e.target.value)}
                      className="flex-1 bg-gray-50 rounded-lg h-10 px-3 text-sm font-bold outline-none border border-gray-100 focus:border-primary/50 transition-all"
                    />
                    <button onClick={() => removeListItem('testimonials', i)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <textarea
                    value={t.text}
                    onChange={e => updateListItem('testimonials', i, 'text', e.target.value)}
                    className="w-full bg-gray-50 rounded-lg p-3 text-xs outline-none font-medium border border-gray-100 focus:border-primary/50 transition-all resize-none"
                    rows={2}
                  />
                </Card>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
