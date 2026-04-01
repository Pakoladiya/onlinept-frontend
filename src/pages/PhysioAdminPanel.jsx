import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { onAuth } from '@/firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { updateClinicConfig } from '@/config/clinicConfig';
import { uploadFile } from '@/firebase/storage';
import {
  ArrowLeft, Save, CheckCircle2, X, ChevronDown,
  Loader2, AlertCircle, Image, User, Palette, Globe, Clock,
  Eye, EyeOff, Plus, Trash2, Check,
  Facebook, Instagram, Youtube, Linkedin, Phone,
  Video, DollarSign, MessageCircle, ChevronLeft, ExternalLink,
} from 'lucide-react';

// ─── iOS Design Tokens ──────────────────────────────────────────────────────────
const T = {
  primary: '#007AFF',
  primaryDark: '#0055CC',
  primaryLight: '#E8F1FF',
  accent: '#5AC8FA',
  blue: '#007AFF',
  orange: '#FF9F0A',
  surface: '#F5F5F7',
  surface2: '#E5E5EA',
  white: '#FFFFFF',
  ink: '#1D1D1F',
  ink2: '#3A3A3C',
  ink3: '#636366',
  ink4: '#AEAEB2',
  border: 'rgba(0,0,0,0.08)',
  glass: 'rgba(255,255,255,0.85)',
  blur: 'blur(20px)',
  r: { sm: 10, md: 16, lg: 24, xl: 32 },
};

// ─── Color Palettes ─────────────────────────────────────────────────────────────
const PALETTES = [
  { name: 'iOS Blue',     p: '#007AFF', d: '#0055CC', l: '#E8F1FF', a: '#5AC8FA' },
  { name: 'Deep Blue',    p: '#0066FF', d: '#0050CC', l: '#E8F1FF', a: '#3B82F6' },
  { name: 'Ocean Blue',   p: '#0066CC', d: '#0055AA', l: '#E5F4FF', a: '#00B4D8' },
  { name: 'Sunset',       p: '#E85D04', d: '#CC4D00', l: '#FFF0E5', a: '#FFBA08' },
  { name: 'Royal Purple', p: '#7C3AED', d: '#6D28D9', l: '#EDE9FE', a: '#A78BFA' },
  { name: 'Rose Gold',   p: '#BE185D', d: '#9D174D', l: '#FCE7F3', a: '#F9A8D4' },
  { name: 'Teal Zen',    p: '#0D9488', d: '#0F766E', l: '#CCFBF1', a: '#5EEAD4' },
  { name: 'Crimson',      p: '#DC2626', d: '#B91C1C', l: '#FEE2E2', a: '#F87171' },
  { name: 'Midnight',    p: '#1E293B', d: '#0F172A', l: '#E2E8F0', a: '#38BDF8' },
  { name: 'Emerald',     p: '#059669', d: '#047857', l: '#D1FAE5', a: '#34D399' },
  { name: 'Amber',       p: '#D97706', d: '#B45309', l: '#FEF3C7', a: '#FCD34D' },
  { name: 'Indigo',      p: '#4338CA', d: '#3730A3', l: '#E0E7FF', a: '#818CF8' },
];

// ─── Live Preview ──────────────────────────────────────────────────────────────
function Preview({ settings }) {
  const { primaryColor, secondaryColor, clinicName, physioName, logo, coverPhoto } = settings;
  return (
    <div style={{
      width: 280, background: '#000', borderRadius: 40,
      padding: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 32, overflow: 'hidden',
        height: 520,
      }}>
        {/* Status bar */}
        <div style={{
          height: 44, background: primaryColor || T.primary,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          paddingBottom: 6, gap: 4,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: 600 }}>9:41</span>
        </div>
        {/* Notch */}
        <div style={{
          position: 'absolute', top: 52, left: '50%', transform: 'translateX(-50%)',
          width: 80, height: 24, background: '#000', borderRadius: '0 0 16px 16px',
        }} />
        {/* Content */}
        <div style={{ height: 520 - 44, overflow: 'hidden', position: 'relative' }}>
          {/* Cover */}
          <div style={{
            height: 140, background: `linear-gradient(135deg, ${primaryColor || T.primary} 0%, ${secondaryColor || T.accent} 100%)`,
            display: 'flex', alignItems: 'flex-end', padding: '0 16px 12px',
            position: 'relative',
          }}>
            {coverPhoto && (
              <img src={coverPhoto} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, position: 'relative' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: T.white, border: '3px solid white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}>
                {logo ? (
                  <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 18, fontWeight: 800, color: primaryColor || T.primary }}>
                    {clinicName?.charAt(0) || 'C'}
                  </span>
                )}
              </div>
              <div style={{ paddingBottom: 2 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.3)', lineHeight: 1.2 }}>
                  {clinicName || 'Your Clinic'}
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                  {physioName || 'Physiotherapist'}
                </p>
              </div>
            </div>
          </div>
          {/* Page content */}
          <div style={{ padding: '14px 14px 0', overflow: 'hidden' }}>
            <div style={{
              background: T.surface, borderRadius: 14, padding: '14px',
              display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 10,
            }}>
              {['Book', 'Services', 'About'].map((tab, i) => (
                <div key={tab} style={{
                  padding: '5px 14px', borderRadius: 20,
                  background: i === 0 ? primaryColor || T.primary : 'transparent',
                  color: i === 0 ? '#fff' : T.ink3,
                  fontSize: 11, fontWeight: 600,
                }}>{tab}</div>
              ))}
            </div>
            <div style={{ height: 4, background: primaryColor || T.primary, borderRadius: 4, marginBottom: 12 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Book Appointment', 'View Services', 'Call Now'].map((btn) => (
                <div key={btn} style={{
                  height: 36, borderRadius: 10,
                  background: `linear-gradient(135deg, ${primaryColor || T.primary}, ${secondaryColor || T.accent})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{btn}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {['Services', 'About', 'Contact'].map((label) => (
                <div key={label} style={{
                  flex: 1, height: 50, background: T.surface, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 9, fontWeight: 500, color: T.ink3 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Home indicator */}
        <div style={{
          position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 4, background: '#000', borderRadius: 4,
        }} />
      </div>
    </div>
  );
}

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 51, height: 31, borderRadius: 16,
        background: checked ? (T.blue) : (T.surface2),
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 27, height: 27, borderRadius: 14,
        background: T.white, boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        position: 'absolute', top: 2,
        left: checked ? 22 : 2,
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

// ─── Input Field ───────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text', multiline, rows }) {
  const style = multiline
    ? { width: '100%', padding: '12px 16px', background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: T.r.md, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: T.ink, outline: 'none', resize: 'vertical', minHeight: 80, lineHeight: 1.5, transition: 'border-color 0.2s, box-shadow 0.2s' }
    : { width: '100%', height: 48, padding: '0 16px', background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: T.r.md, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: T.ink, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' };

  const Component = multiline ? 'textarea' : 'input';
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.ink2, marginBottom: 6, letterSpacing: '0.1px' }}>{label}</label>}
      <Component
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={style}
        onFocus={e => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 3px ${T.primaryLight}`; e.target.style.background = T.white; }}
        onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; e.target.style.background = T.surface; }}
      />
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: T.primaryLight,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16, fontWeight: 700, color: T.ink }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: T.ink4 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Image Upload ──────────────────────────────────────────────────────────────
function ImageUpload({ label, value, onChange, aspect = '16/9', clinicId }) {
  const [uploading, setUploading] = useState(false);
  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file || !clinicId) return;
    if (file.size > 5 * 1024 * 1024) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, `clinics/${clinicId}/${label.toLowerCase().replace(/ /g, '-')}`);
      onChange(url);
    } catch (err) {
      console.error('Upload failed', err);
    }
    setUploading(false);
  }
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.ink2, marginBottom: 6 }}>{label}</label>}
      <div style={{
        position: 'relative', borderRadius: T.r.md, overflow: 'hidden',
        background: T.surface, border: `1.5px dashed ${T.border}`,
        aspectRatio: aspect, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = T.primary}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
      >
        {value ? (
          <>
            <img src={value} alt={label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>Change</span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: T.ink4 }}>
            <Image size={20} />
            <span style={{ fontSize: 11, fontWeight: 500 }}>Tap to upload</span>
          </div>
        )}
        {uploading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={20} className="animate-spin" style={{ color: '#fff' }} />
          </div>
        )}
        <input type="file" accept="image/*" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} disabled={uploading} />
      </div>
    </div>
  );
}

// ─── Color Swatch ──────────────────────────────────────────────────────────────
function ColorSwatch({ color }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 8,
      background: color,
      border: '2px solid rgba(0,0,0,0.1)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }} />
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PhysioAdminPanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [clinicId, setClinicId] = useState('');

  const [activeTab, setActiveTab] = useState('branding');

  // ── Settings state (mirrors SettingsPage.jsx) ─────────────────────────────────
  const [s, setS] = useState({
    // Brand
    logo: '',
    coverPhoto: '',
    physioPhoto: '',
    primaryColor: '#007AFF',
    secondaryColor: '#5AC8FA',
    // Clinic
    physioName: '',
    clinicName: '',
    phone: '',
    email: '',
    address: '',
    // Video
    videoMode: 'whatsapp',
    zoomLink: '',
    // Social
    facebook: '',
    instagram: '',
    youtube: '',
    linkedin: '',
  });

  const [paletteOpen, setPaletteOpen] = useState(false);

  const TABS = [
    { id: 'branding',   label: 'Branding',   icon: <Palette size={14} /> },
    { id: 'clinic',     label: 'Clinic',      icon: <User size={14} /> },
    { id: 'video',      label: 'Video',       icon: <Video size={14} /> },
    { id: 'social',     label: 'Social',      icon: <Globe size={14} /> },
  ];

  // ── Auth & load data ───────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = 'Edit My Page | OnlinePT';
    const unsub = onAuth(async (u) => {
      if (!u) { navigate('/dashboard-login'); return; }
      setUser(u);
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const snap = await getDocs(query(collection(db, 'clinics'), where('uid', '==', u.uid)));
        if (!snap.empty) {
          const d = snap.docs[0].data();
          setClinicId(snap.docs[0].id);
          setS(prev => ({
            ...prev,
            physioName: d.physioName || '',
            clinicName: d.clinicName || '',
            email: d.email || u.email || '',
            phone: d.phone || '',
            address: d.address || '',
            logo: d.settings?.logo || '',
            coverPhoto: d.settings?.coverPhoto || '',
            physioPhoto: d.settings?.physioPhoto || '',
            primaryColor: d.settings?.primaryColor || '#007AFF',
            secondaryColor: d.settings?.secondaryColor || '#5AC8FA',
            videoMode: d.settings?.videoMode || 'whatsapp',
            zoomLink: d.settings?.zoomLink || '',
            facebook: d.settings?.facebook || '',
            instagram: d.settings?.instagram || '',
            youtube: d.settings?.youtube || '',
            linkedin: d.settings?.linkedin || '',
          }));
        }
      } catch (e) {
        console.error('Load error', e);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!clinicId) return;
    setSaving(true);
    setError('');
    try {
      await updateDoc(doc(db, 'clinics', clinicId), {
        physioName: s.physioName,
        clinicName: s.clinicName,
        email: s.email,
        phone: s.phone,
        address: s.address,
        settings: {
          logo: s.logo,
          coverPhoto: s.coverPhoto,
          physioPhoto: s.physioPhoto,
          primaryColor: s.primaryColor,
          secondaryColor: s.secondaryColor,
          videoMode: s.videoMode,
          zoomLink: s.zoomLink,
          facebook: s.facebook,
          instagram: s.instagram,
          youtube: s.youtube,
          linkedin: s.linkedin,
        },
      });
      updateClinicConfig({
        primaryColor: s.primaryColor,
        secondaryColor: s.secondaryColor,
        clinicName: s.clinicName,
        physioName: s.physioName,
        phone: s.phone,
        email: s.email,
        address: s.address,
        logo: s.logo,
        coverPhoto: s.coverPhoto,
        videoMode: s.videoMode,
        meetLink: s.zoomLink,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError('Failed to save. Please try again.');
    }
    setSaving(false);
  }

  function update(key, val) { setS(prev => ({ ...prev, [key]: val })); }

  function applyPalette(pal) {
    setS(prev => ({ ...prev, primaryColor: pal.p, secondaryColor: pal.a }));
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.surface }}>
        <Loader2 size={24} className="animate-spin" style={{ color: T.primary }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.surface, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        textarea { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: none; } }
        @keyframes slideIn { from { opacity:0; transform: translateX(-8px); } to { opacity:1; transform: none; } }
      `}</style>

      {/* ── Sticky Header ────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: back */}
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: T.ink3, fontSize: 13, fontWeight: 500 }}>
            <ChevronLeft size={18} />
            <span style={{ display: 'none' }}>Back</span>
          </Link>

          {/* Center: logo + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 15, fontWeight: 800, color: T.ink }}>
              Online<span style={{ color: T.primary }}>PT</span>
            </span>
            <span style={{ color: T.border, fontSize: 16 }}>|</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.ink2 }}>Edit My Page</span>
          </div>

          {/* Right: save */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {saved && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.blue, fontWeight: 600, animation: 'fadeUp 0.3s ease' }}>
                <CheckCircle2 size={14} /> Saved
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                height: 36, padding: '0 16px',
                background: saving ? T.primaryLight : `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
                color: saving ? T.primary : '#fff',
                border: 'none', borderRadius: T.r.sm,
                fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: saving ? 'none' : `0 4px 12px ${T.primary}30`,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseDown={e => { if (!saving) e.currentTarget.style.transform = 'scale(0.97)'; }}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* ── Pill Tab Bar ───────────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 12px', display: 'flex', gap: 4 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 20,
                border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                background: activeTab === tab.id ? T.primary : 'transparent',
                color: activeTab === tab.id ? '#fff' : T.ink3,
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {error && (
        <div style={{ maxWidth: 1100, margin: '12px auto 0', padding: '0 20px' }}>
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: T.r.md, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#DC2626' }}>
            <AlertCircle size={15} />
            {error}
          </div>
        </div>
      )}

      {/* ── Main Layout ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px', display: 'flex', gap: 32, alignItems: 'flex-start' }}>

        {/* ── Form Panel ─────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Branding Tab ─────────────────────────────────────────────────── */}
          {activeTab === 'branding' && (
            <div style={{ animation: 'slideIn 0.25s ease' }}>
              <div style={{
                background: T.white, borderRadius: T.r.lg,
                border: `1px solid ${T.border}`,
                padding: 24,
              }}>
                <SectionHeader
                  icon={<Image size={16} style={{ color: T.primary }} />}
                  title="Brand Identity"
                  subtitle="Logo, photos, and your clinic's visual identity"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <ImageUpload label="Clinic Logo" value={s.logo} onChange={v => update('logo', v)} aspect="1/1" clinicId={clinicId} />
                  <ImageUpload label="Cover Photo" value={s.coverPhoto} onChange={v => update('coverPhoto', v)} aspect="16/9" clinicId={clinicId} />
                </div>
                <ImageUpload label="Physio Photo" value={s.physioPhoto} onChange={v => update('physioPhoto', v)} aspect="1/1" clinicId={clinicId} />
              </div>

              {/* Brand Colors */}
              <div style={{
                background: T.white, borderRadius: T.r.lg,
                border: `1px solid ${T.border}`,
                padding: 24, marginTop: 16,
              }}>
                <SectionHeader
                  icon={<Palette size={16} style={{ color: T.primary }} />}
                  title="Brand Colors"
                  subtitle="Choose your clinic's color scheme"
                />

                {/* Quick Palettes */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.ink2, marginBottom: 8 }}>Quick Palettes</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                    {PALETTES.map(pal => (
                      <button
                        key={pal.name}
                        onClick={() => applyPalette(pal)}
                        title={pal.name}
                        style={{
                          padding: 6, borderRadius: T.r.sm, cursor: 'pointer',
                          border: s.primaryColor === pal.p ? `2px solid ${T.primary}` : '2px solid transparent',
                          background: T.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                          transition: 'border-color 0.15s, transform 0.15s',
                        }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <div style={{ display: 'flex', gap: 2 }}>
                          <div style={{ width: 16, height: 16, borderRadius: 4, background: pal.p }} />
                          <div style={{ width: 16, height: 16, borderRadius: 4, background: pal.a }} />
                        </div>
                        <span style={{ fontSize: 8, fontWeight: 600, color: T.ink4, textAlign: 'center', lineHeight: 1.1 }}>{pal.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.ink2, marginBottom: 6 }}>Primary Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="color" value={s.primaryColor}
                        onChange={e => update('primaryColor', e.target.value)}
                        style={{ width: 44, height: 44, border: `1.5px solid ${T.border}`, borderRadius: T.r.sm, cursor: 'pointer', padding: 2, background: 'none' }}
                      />
                      <input
                        type="text" value={s.primaryColor}
                        onChange={e => update('primaryColor', e.target.value)}
                        style={{ flex: 1, height: 44, padding: '0 14px', background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: T.r.sm, fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: T.ink, outline: 'none' }}
                        onFocus={e => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 3px ${T.primaryLight}`; }}
                        onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.ink2, marginBottom: 6 }}>Accent Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="color" value={s.secondaryColor}
                        onChange={e => update('secondaryColor', e.target.value)}
                        style={{ width: 44, height: 44, border: `1.5px solid ${T.border}`, borderRadius: T.r.sm, cursor: 'pointer', padding: 2, background: 'none' }}
                      />
                      <input
                        type="text" value={s.secondaryColor}
                        onChange={e => update('secondaryColor', e.target.value)}
                        style={{ flex: 1, height: 44, padding: '0 14px', background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: T.r.sm, fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: T.ink, outline: 'none' }}
                        onFocus={e => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 3px ${T.primaryLight}`; }}
                        onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>
                </div>

                {/* Color Preview */}
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: s.primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>{s.clinicName?.charAt(0) || 'C'}</span>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: s.secondaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>{s.clinicName?.charAt(0) || 'C'}</span>
                  </div>
                  <span style={{ fontSize: 11, color: T.ink4, fontWeight: 500 }}>Color preview</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Clinic Tab ────────────────────────────────────────────────────── */}
          {activeTab === 'clinic' && (
            <div style={{ animation: 'slideIn 0.25s ease' }}>
              <div style={{
                background: T.white, borderRadius: T.r.lg,
                border: `1px solid ${T.border}`,
                padding: 24,
              }}>
                <SectionHeader
                  icon={<User size={16} style={{ color: T.primary }} />}
                  title="Clinic Information"
                  subtitle="Basic details about your practice"
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field label="Physio Name" value={s.physioName} onChange={v => update('physioName', v)} placeholder="Dr. Aruna Kapoor" />
                  <Field label="Clinic Name" value={s.clinicName} onChange={v => update('clinicName', v)} placeholder="Aruna Physiotherapy Clinic" />
                  <Field label="Email" value={s.email} onChange={v => update('email', v)} placeholder="aruna@example.com" type="email" />
                  <Field label="Phone" value={s.phone} onChange={v => update('phone', v)} placeholder="+91 98765 43210" />
                  <Field label="Address" value={s.address} onChange={v => update('address', v)} placeholder="123 Main Street, Mumbai, India" multiline rows={3} />
                </div>
              </div>
            </div>
          )}

          {/* ── Video Tab ─────────────────────────────────────────────────────── */}
          {activeTab === 'video' && (
            <div style={{ animation: 'slideIn 0.25s ease' }}>
              <div style={{
                background: T.white, borderRadius: T.r.lg,
                border: `1px solid ${T.border}`,
                padding: 24,
              }}>
                <SectionHeader
                  icon={<Video size={16} style={{ color: T.primary }} />}
                  title="Video Consultation"
                  subtitle="Choose how patients join your online sessions"
                />

                {/* Video Mode Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    {
                      id: 'whatsapp',
                      title: 'WhatsApp Video',
                      desc: 'Share your WhatsApp number — patient calls you directly. Free and instant.',
                      icon: <MessageCircle size={18} style={{ color: '#25D366' }} />,
                    },
                    {
                      id: 'zoom',
                      title: 'Zoom Meeting',
                      desc: 'Patient joins via your Zoom meeting link. Great for scheduled sessions.',
                      icon: <Video size={18} style={{ color: T.primary }} />,
                    },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => update('videoMode', opt.id)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 14,
                        padding: '16px', borderRadius: T.r.md,
                        border: `2px solid ${s.videoMode === opt.id ? T.primary : T.border}`,
                        background: s.videoMode === opt.id ? T.primaryLight : T.surface,
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: T.white, border: `1px solid ${T.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {opt.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 14, fontWeight: 700, color: T.ink }}>{opt.title}</span>
                          {s.videoMode === opt.id && (
                            <span style={{ background: T.primary, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>
                              Selected
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: T.ink3, lineHeight: 1.4 }}>{opt.desc}</p>
                      </div>
                      <div style={{
                        width: 22, height: 22, borderRadius: 11,
                        border: `2px solid ${s.videoMode === opt.id ? T.primary : T.ink4}`,
                        background: s.videoMode === opt.id ? T.primary : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: 2, transition: 'background 0.2s, border-color 0.2s',
                      }}>
                        {s.videoMode === opt.id && <Check size={12} color="#fff" />}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Zoom link */}
                {s.videoMode === 'zoom' && (
                  <div style={{ marginTop: 16 }}>
                    <Field
                      label="Zoom Meeting Link"
                      value={s.zoomLink}
                      onChange={v => update('zoomLink', v)}
                      placeholder="https://us02web.zoom.us/j/..."
                      type="url"
                    />
                    <p style={{ fontSize: 11, color: T.ink4, marginTop: 6 }}>
                      Paste your recurring Zoom meeting link. Share the same link with all patients.
                    </p>
                  </div>
                )}

                {/* WhatsApp note */}
                {s.videoMode === 'whatsapp' && (
                  <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: T.r.md, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                    <p style={{ fontSize: 12, color: '#166534', fontWeight: 500, lineHeight: 1.5 }}>
                      WhatsApp video is free and works instantly. Your patients will see your WhatsApp number when they book.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Social Tab ───────────────────────────────────────────────────── */}
          {activeTab === 'social' && (
            <div style={{ animation: 'slideIn 0.25s ease' }}>
              <div style={{
                background: T.white, borderRadius: T.r.lg,
                border: `1px solid ${T.border}`,
                padding: 24,
              }}>
                <SectionHeader
                  icon={<Globe size={16} style={{ color: T.primary }} />}
                  title="Social Links"
                  subtitle="Connect your social media profiles"
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Facebook size={14} style={{ color: '#1877F2' }} />
                      <label style={{ fontSize: 12, fontWeight: 600, color: T.ink2 }}>Facebook</label>
                    </div>
                    <Field value={s.facebook} onChange={v => update('facebook', v)} placeholder="https://facebook.com/yourpage" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Instagram size={14} style={{ color: '#E1306C' }} />
                      <label style={{ fontSize: 12, fontWeight: 600, color: T.ink2 }}>Instagram</label>
                    </div>
                    <Field value={s.instagram} onChange={v => update('instagram', v)} placeholder="https://instagram.com/yourprofile" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Youtube size={14} style={{ color: '#FF0000' }} />
                      <label style={{ fontSize: 12, fontWeight: 600, color: T.ink2 }}>YouTube</label>
                    </div>
                    <Field value={s.youtube} onChange={v => update('youtube', v)} placeholder="https://youtube.com/@yourchannel" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Linkedin size={14} style={{ color: '#0A66C2' }} />
                      <label style={{ fontSize: 12, fontWeight: 600, color: T.ink2 }}>LinkedIn</label>
                    </div>
                    <Field value={s.linkedin} onChange={v => update('linkedin', v)} placeholder="https://linkedin.com/in/yourprofile" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Live Preview Panel ─────────────────────────────────────────────── */}
        <div style={{
          width: 300, flexShrink: 0, position: 'sticky', top: 120,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.ink4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Live Preview
          </div>
          <Preview settings={s} />
          <p style={{ fontSize: 10, color: T.ink4, textAlign: 'center', maxWidth: 200, lineHeight: 1.4 }}>
            Changes appear instantly in your patient page preview
          </p>
        </div>

      </div>
    </div>
  );
}
