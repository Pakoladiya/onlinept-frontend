import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuth } from '@/firebase/auth';
import { db } from '@/firebase/config';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { uploadFile } from '@/firebase/storage';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Save, Upload, Palette, Type, Globe, Phone, Mail, MapPin,
  CheckCircle2, AlertCircle, Loader2, RotateCcw, Eye, X
} from 'lucide-react';

const FONTS = [
  { value: 'DM Sans', label: 'DM Sans', style: { fontFamily: "'DM Sans', sans-serif" } },
  { value: 'Manrope', label: 'Manrope', style: { fontFamily: "'Manrope', sans-serif" } },
  { value: 'Inter', label: 'Inter', style: { fontFamily: "'Inter', sans-serif" } },
];

const T = {
  bg: '#020617', // Deep Obsidian
  bgCard: 'rgba(15, 23, 42, 0.6)', 
  glass: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  ink: '#F8FAFC',
  inkSecondary: '#94A3B8',
  inkTertiary: '#64748B',
  primary: '#0EA5E9', // iOS-style Cyan/Blue
  primaryVibrant: '#38BDF8',
  white: '#FFFFFF',
  r: { sm: 12, md: 16, lg: 24, xl: 32 },
  blur: 'blur(30px)',
};

const DEFAULTS = {
  clinicName: '',
  tagline: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
  address: '',
  primaryColor: '#0EA5E9',
  secondaryColor: '#F6A000',
  logoUrl: '',
  defaultFont: 'Inter',
  applyToAllDocuments: false,
};

export default function ClinicBrandingPage({ isEmbedded }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── FAILSAFE: Redirect to Dashboard if accessed standalone ──
  useEffect(() => {
    if (!isEmbedded && !window.location.search.includes('standalone=true')) {
      navigate('/dashboard?tab=Branding', { replace: true });
    }
  }, [isEmbedded, navigate]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [clinicId, setClinicId] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');

  const [form, setForm] = useState({ ...DEFAULTS });

  useEffect(() => {
    const unsub = onAuth(async (u) => {
      if (!u) { navigate('/dashboard-login'); return; }
      setUser(u);
      try {
        // Find clinic by uid
        const snap = await getDocs(query(collection(db, 'clinics'), where('uid', '==', u.uid)));
        if (!snap.empty) {
          const cid = snap.docs[0].id;
          const data = snap.docs[0].data();
          setClinicId(cid);
          setForm((prev) => ({
            ...prev,
            clinicName: data.clinicName || '',
            contactEmail: data.email || u.email || '',
            contactPhone: data.phone || '',
            website: data.website || '',
            address: data.address || '',
          }));

          // Fetch clinic_presets
          try {
            const presetSnap = await getDoc(doc(db, 'clinic_presets', cid));
            if (presetSnap.exists()) {
              const preset = presetSnap.data();
              setForm((prev) => ({
                ...prev,
                clinicName: preset.clinicName || data.clinicName || '',
                tagline: preset.tagline || '',
                contactEmail: preset.contactEmail || data.email || '',
                contactPhone: preset.contactPhone || data.phone || '',
                website: preset.website || '',
                address: preset.address || data.address || '',
                primaryColor: preset.primaryColor || '#007AFF',
                secondaryColor: preset.secondaryColor || '#F6A000',
                logoUrl: preset.logoUrl || '',
                defaultFont: preset.defaultFont || 'DM Sans',
                applyToAllDocuments: preset.applyToAllDocuments || false,
              }));
            }
          } catch (e) {
            console.warn('No clinic_presets found, using clinic data.');
          }

          // Fetch existing logo from storage API
          try {
            const res = await fetch(`/api/storage/files/${cid}?type=branding`);
            if (res.ok) {
              const files = await res.json();
              const logoFile = files?.find((f) => f.type === 'branding' && f.name?.toLowerCase().includes('logo'));
              if (logoFile?.url) {
                setForm((prev) => ({ ...prev, logoUrl: logoFile.url }));
              }
            }
          } catch (e) {
            console.warn('Could not fetch branding files:', e);
          }
        }
      } catch (e) {
        console.error('Failed to load branding data:', e);
        setError('Failed to load clinic branding data.');
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !clinicId) return;
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('File must be under 5MB.');
      return;
    }
    setUploadingLogo(true);
    setLogoError('');
    try {
      const url = await uploadFile(file, `clinics/${clinicId}/branding/logo`);
      setForm((prev) => ({ ...prev, logoUrl: url }));
      showToast('Logo uploaded successfully.');
    } catch (err) {
      setLogoError('Logo upload failed. Try again.');
    }
    setUploadingLogo(false);
  }

  async function handleSave() {
    if (!clinicId) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        clinicName: form.clinicName,
        tagline: form.tagline,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        website: form.website,
        address: form.address,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        logoUrl: form.logoUrl,
        defaultFont: form.defaultFont,
        applyToAllDocuments: form.applyToAllDocuments,
        updatedAt: serverTimestamp(),
      };

      // 1. Update the main clinic document (which is what the rest of the app uses)
      await setDoc(doc(db, 'clinics', clinicId), {
        clinicName: form.clinicName,
        tagline: form.tagline,
        address: form.address,
        settings: {
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          logo: form.logoUrl,
          defaultFont: form.defaultFont,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          website: form.website,
        },
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // 2. Also keep clinic_presets in sync for any standalone uses
      await setDoc(doc(db, 'clinic_presets', clinicId), payload, { merge: true });

      setSaved(true);
      showToast('Branding saved successfully!');
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Save error:', err);
      setError(`Failed to save branding: ${err.message}`);
      showToast(`Failed to save branding: ${err.message}`, 'error');
    }
    setSaving(false);
  }

  function handleReset() {
    setForm((prev) => ({
      ...prev,
      tagline: '',
      contactEmail: user?.email || '',
      website: '',
      primaryColor: '#007AFF',
      secondaryColor: '#F6A000',
      logoUrl: '',
      defaultFont: 'DM Sans',
      applyToAllDocuments: false,
    }));
    showToast('Fields reset to defaults.');
  }

  if (loading) {
    return (
      <div className={isEmbedded ? "py-20 flex items-center justify-center" : "min-h-screen bg-gray-950 flex items-center justify-center"}>
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const selectedFont = FONTS.find((f) => f.value === form.defaultFont) || FONTS[0];

  return (
    <div style={isEmbedded ? { color: T.ink, fontFamily: "'Inter', sans-serif" } : { minHeight: '100vh', background: `radial-gradient(circle at 50% 0%, ${T.primary}10 0%, transparent 50%), ${T.bg}`, color: T.ink, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        input::placeholder, textarea::placeholder { color: ${T.inkTertiary}; }
      `}</style>

      <div style={isEmbedded ? { maxWidth: 1400, margin: '0 auto', padding: '0 0 40px 0' } : { maxWidth: 1400, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
          {!isEmbedded && (
            <div>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 8 }}>
                Clinic Branding
              </h1>
              <p style={{ color: T.inkSecondary, fontWeight: 500 }}>Standardize your clinical identity across all patient touchpoints.</p>
            </div>
          )}
          {isEmbedded && <div />}
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="ghost" onClick={handleReset} style={{ color: T.inkSecondary, borderRadius: 12 }}>
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{ background: T.primary, color: T.white, borderRadius: 12, boxShadow: `0 8px 20px ${T.primary}30`, fontWeight: 800, padding: '0 24px' }}
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} className="mr-2" /> Save Changes</>}
            </Button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
            <Loader2 size={40} className="animate-spin text-primary" />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            {/* Left: Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Identity Section */}
              <div style={{ background: T.bgCard, borderRadius: T.r.lg, border: `1px solid ${T.glassBorder}`, padding: 32, backdropFilter: T.blur, WebkitBackdropFilter: T.blur }}>
                <h2 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', color: T.inkTertiary, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Palette size={16} color={T.primary} /> Visual Identity
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Logo Upload */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSecondary, display: 'block', marginBottom: 12 }}>CLINIC LOGO</label>
                    <div
                      style={{
                        position: 'relative', height: 180, borderRadius: 16, border: `2px dashed ${T.glassBorder}`,
                        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = T.primary}
                      onMouseLeave={e => e.currentTarget.style.borderColor = T.glassBorder}
                    >
                      {form.logoUrl ? (
                        <div style={{ textAlign: 'center' }}>
                          <img src={form.logoUrl} alt="Logo" style={{ maxHeight: 120, maxWidth: '80%', objectFit: 'contain' }} />
                          <button
                            onClick={(e) => { e.stopPropagation(); setField('logoUrl', ''); }}
                            style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(239, 68, 68, 0.2)', border: 'none', borderRadius: 8, padding: 6, color: '#ef4444', cursor: 'pointer' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', color: T.inkTertiary }}>
                          <Upload size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                          <p style={{ fontSize: 13, fontWeight: 600 }}>Click or drag to upload logo</p>
                          <p style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>PNG or SVG recommended</p>
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                      {uploadingLogo && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Loader2 size={24} className="animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Colors */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSecondary, display: 'block', marginBottom: 12 }}>PRIMARY COLOR</label>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <input type="color" value={form.primaryColor} onChange={e => setField('primaryColor', e.target.value)} style={{ width: 44, height: 44, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }} />
                        <input type="text" value={form.primaryColor} onChange={e => setField('primaryColor', e.target.value)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.glassBorder}`, borderRadius: 12, padding: '0 16px', color: T.ink, fontFamily: 'monospace', fontSize: 13 }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 700, color: T.inkSecondary, display: 'block', marginBottom: 12 }}>ACCENT COLOR</label>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <input type="color" value={form.secondaryColor} onChange={e => setField('secondaryColor', e.target.value)} style={{ width: 44, height: 44, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }} />
                        <input type="text" value={form.secondaryColor} onChange={e => setField('secondaryColor', e.target.value)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.glassBorder}`, borderRadius: 12, padding: '0 16px', color: T.ink, fontFamily: 'monospace', fontSize: 13 }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography Section */}
              <div style={{ background: T.bgCard, borderRadius: T.r.lg, border: `1px solid ${T.glassBorder}`, padding: 32, backdropFilter: T.blur, WebkitBackdropFilter: T.blur }}>
                <h2 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', color: T.inkTertiary, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Type size={16} color={T.primary} /> Typography
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  {FONTS.map(font => (
                    <button
                      key={font.value}
                      onClick={() => setField('defaultFont', font.value)}
                      style={{
                        padding: '16px', borderRadius: 16, border: `1px solid ${form.defaultFont === font.value ? T.primary : T.glassBorder}`,
                        background: form.defaultFont === font.value ? `${T.primary}10` : 'rgba(255,255,255,0.02)',
                        textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s ease', color: T.ink
                      }}
                    >
                      <p style={{ ...font.style, fontSize: 15, fontWeight: 600 }}>{font.label}</p>
                      <p style={{ fontSize: 10, color: T.inkTertiary, marginTop: 4, letterSpacing: '0.5px' }}>ABC...XYZ</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Info Section */}
              <div style={{ background: T.bgCard, borderRadius: T.r.lg, border: `1px solid ${T.glassBorder}`, padding: 32, backdropFilter: T.blur, WebkitBackdropFilter: T.blur }}>
                <h2 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', color: T.inkTertiary, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Globe size={16} color={T.primary} /> Public Information
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: T.inkTertiary, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Clinic Name</label>
                      <input value={form.clinicName} onChange={e => setField('clinicName', e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.glassBorder}`, borderRadius: 12, padding: '12px 16px', color: T.ink, fontSize: 14 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 800, color: T.inkTertiary, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Contact Phone</label>
                      <input value={form.contactPhone} onChange={e => setField('contactPhone', e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.glassBorder}`, borderRadius: 12, padding: '12px 16px', color: T.ink, fontSize: 14 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: T.inkTertiary, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Public Address</label>
                    <textarea value={form.address} onChange={e => setField('address', e.target.value)} rows={2} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.glassBorder}`, borderRadius: 12, padding: '12px 16px', color: T.ink, fontSize: 14, resize: 'none' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Preview */}
            <div style={{ position: 'sticky', top: 40, height: 'fit-content' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: T.inkSecondary, fontSize: 13, fontWeight: 600 }}>
                <Eye size={16} /> LIVE PREVIEW (DOCUMENT MODE)
              </div>
              <div style={{ 
                background: '#FFFFFF', borderRadius: 24, boxShadow: '0 40px 100px rgba(0,0,0,0.5)', 
                overflow: 'hidden', minHeight: 600, display: 'flex', flexDirection: 'column' 
              }}>
                {/* Mock Document Header */}
                <div style={{ padding: '40px 48px', borderBottom: `2px solid ${form.primaryColor}20`, background: `${form.primaryColor}05` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      {form.logoUrl ? (
                         <img src={form.logoUrl} style={{ height: 60, width: 'auto', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ width: 60, height: 60, borderRadius: 16, background: form.primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 24, fontWeight: 800 }}>
                          {form.clinicName[0] || 'C'}
                        </div>
                      )}
                      <div>
                        <h3 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: 0, fontFamily: form.defaultFont }}>{form.clinicName || 'Vora Physio'}</h3>
                        <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 0', fontWeight: 500 }}>{form.tagline || 'Leading Excellence in Physiotherapy'}</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 24, display: 'flex', gap: 32, fontSize: 12, color: '#9CA3AF', fontWeight: 600, borderTop: '1px solid #F3F4F6', paddingTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={12} /> {form.contactPhone || '+91 92281 08454'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Globe size={12} /> {form.website || 'voraphysio.com'}</div>
                  </div>
                </div>
                
                {/* Mock Document Content */}
                <div style={{ padding: '48px', flex: 1, fontFamily: form.defaultFont }}>
                  <div style={{ height: 1.5, background: '#E5E7EB', marginBottom: 32 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>Patient Details</p>
                      <div style={{ width: 140, height: 12, background: '#F3F4F6', borderRadius: 4, marginBottom: 8 }} />
                      <div style={{ width: 100, height: 12, background: '#F3F4F6', borderRadius: 4 }} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <p style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 }}>Date</p>
                       <p style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>21 Oct, 2026</p>
                    </div>
                  </div>
                  
                  <div style={{ width: '100%', height: 16, background: '#F9FAFB', borderRadius: 4, marginBottom: 12 }} />
                  <div style={{ width: '90%', height: 16, background: '#F9FAFB', borderRadius: 4, marginBottom: 12 }} />
                  <div style={{ width: '95%', height: 16, background: '#F9FAFB', borderRadius: 4, marginBottom: 32 }} />
                  
                  <div style={{ padding: 24, borderRadius: 16, background: `${form.secondaryColor}10`, border: `1px solid ${form.secondaryColor}30` }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: form.secondaryColor, marginBottom: 8 }}>CLINIC NOTE:</h4>
                    <div style={{ width: '100%', height: 12, background: '#FFF', borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ width: '80%', height: 12, background: '#FFF', borderRadius: 4 }} />
                  </div>
                </div>
                
                {/* Tooltip hint */}
                <div style={{ padding: 20, textAlign: 'center', background: '#FBFBFE', borderTop: '1px solid #F3F4F6' }}>
                   <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>This is how your patients perceive your clinic.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? '#ef4444' : T.primary,
          color: '#FFF', padding: '16px 32px', borderRadius: 100,
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 12, zIndex: 1000
        }}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          {toast.message}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', marginLeft: 12, opacity: 0.7 }}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
