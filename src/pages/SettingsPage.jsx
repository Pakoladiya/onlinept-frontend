import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { onAuth } from '@/firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { uploadFile } from '@/firebase/storage';
import {
  ArrowLeft, Save, Check, Upload,
  Image, User, Palette, Video,
  Globe, Phone, Mail, MapPin,
  Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';

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
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB');
      return;
    }
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
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={uploading}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        {uploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-white" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
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

  // Clinic settings
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
    primaryColor: '#39A900',
    secondaryColor: '#F6A000',
    videoMode: 'whatsapp',
    zoomLink: '',
  });

  useEffect(() => {
    const unsub = onAuth(async (u) => {
      if (!u) { navigate('/dashboard-login'); return; }
      setUser(u);
      try {
        // Find clinic by uid
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
            logo: data.settings?.logo || '',
            coverPhoto: data.settings?.coverPhoto || '',
            physioPhoto: data.settings?.physioPhoto || '',
            primaryColor: data.settings?.primaryColor || '#39A900',
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 size={24} className="animate-spin" style={{ color: '#39A900' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="bg-white border-b border-border/70 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
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
          <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/30 text-sm text-error">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Branding */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#39A90015' }}>
              <Image size={16} style={{ color: '#39A900' }} />
            </div>
            <h2 className="font-semibold text-text-primary">Brand Identity</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <ImageUpload
              label="Clinic Logo"
              value={settings.logo}
              onChange={(v) => update('logo', v)}
              path="logo"
              clinicId={clinicId}
              aspect="1/1"
            />
            <ImageUpload
              label="Cover Photo"
              value={settings.coverPhoto}
              onChange={(v) => update('coverPhoto', v)}
              path="cover"
              clinicId={clinicId}
              aspect="16/9"
            />
          </div>
          <div className="mt-4">
            <ImageUpload
              label="Physio Photo"
              value={settings.physioPhoto}
              onChange={(v) => update('physioPhoto', v)}
              path="physio"
              clinicId={clinicId}
              aspect="1/1"
            />
          </div>
        </Card>

        {/* Colors */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#39A90015' }}>
              <Palette size={16} style={{ color: '#39A900' }} />
            </div>
            <h2 className="font-semibold text-text-primary">Brand Colors</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <ColorPicker
              label="Primary Color"
              value={settings.primaryColor}
              onChange={(v) => update('primaryColor', v)}
            />
            <ColorPicker
              label="Accent Color"
              value={settings.secondaryColor}
              onChange={(v) => update('secondaryColor', v)}
            />
          </div>
          {/* Preview */}
          <div className="mt-4 flex gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: settings.primaryColor }}
            >
              {settings.clinicName.charAt(0) || 'C'}
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: settings.secondaryColor }}
            >
              {settings.clinicName.charAt(0) || 'C'}
            </div>
            <div className="flex items-center text-xs text-text-secondary/70 self-center ml-1">
              Color preview
            </div>
          </div>
        </Card>

        {/* Clinic Info */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#39A90015' }}>
              <User size={16} style={{ color: '#39A900' }} />
            </div>
            <h2 className="font-semibold text-text-primary">Clinic Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary uppercase tracking-wide mb-1.5 block">Physio Name</label>
              <input
                value={settings.physioName}
                onChange={(e) => update('physioName', e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase tracking-wide mb-1.5 block">Clinic Name</label>
              <input
                value={settings.clinicName}
                onChange={(e) => update('clinicName', e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary uppercase tracking-wide mb-1.5 block">Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </Card>

        {/* Video Mode */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#39A90015' }}>
              <Video size={16} style={{ color: '#39A900' }} />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">Video Consultation</h2>
              <p className="text-xs text-text-secondary">Choose how patients join your sessions</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 'whatsapp',
                label: 'WhatsApp Video',
                desc: 'Share your WhatsApp number — patient calls you directly',
                icon: '📱',
              },
              {
                id: 'zoom',
                label: 'Zoom Meeting',
                desc: 'Patient joins via your Zoom meeting link',
                icon: '📹',
              },
            ].map((opt) => (
              <label
                key={opt.id}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${settings.videoMode === opt.id ? 'border-primary' : 'border-border hover:border-primary/40'}`}
                style={settings.videoMode === opt.id ? { backgroundColor: '#39A90008' } : {}}
              >
                <input
                  type="radio"
                  name="videoMode"
                  value={opt.id}
                  checked={settings.videoMode === opt.id}
                  onChange={() => update('videoMode', opt.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-lg">{opt.icon}</span>
                    <p className="text-sm font-semibold text-text-primary">{opt.label}</p>
                    {settings.videoMode === opt.id && (
                      <Badge variant="primary" size="sm">Selected</Badge>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {settings.videoMode === 'zoom' && (
            <div className="mt-4">
              <label className="text-xs text-text-secondary uppercase tracking-wide mb-1.5 block">
                Zoom Meeting Link
              </label>
              <input
                type="url"
                value={settings.zoomLink}
                onChange={(e) => update('zoomLink', e.target.value)}
                placeholder="https://us02web.zoom.us/j/..."
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:border-primary"
              />
              <p className="text-xs text-text-secondary/70 mt-1">
                Paste your recurring Zoom meeting link. Share the same link with all patients.
              </p>
            </div>
          )}

          {settings.videoMode === 'whatsapp' && (
            <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20">
              <p className="text-xs text-success font-medium">
                WhatsApp video is free and works instantly. Your patients will see your WhatsApp number when they book.
              </p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
