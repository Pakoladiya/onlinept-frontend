import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { onAuth } from '@/firebase/auth';
import {
  collection, query, where, getDocs, doc, getDoc, updateDoc, limit
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { updateClinicConfig } from '@/config/clinicConfig';
import { uploadFile } from '@/firebase/storage';
import { isSuperAdminEmail } from '@/config/superAdminConfig';
import {
  ArrowLeft, Save, CheckCircle2, X, ChevronDown,
  Loader2, AlertCircle, Image, User, Palette, Globe, Clock,
  Eye, EyeOff, Plus, Trash2, Check, Tag, Link as LinkIcon, Gift,
  Facebook, Instagram, Youtube, Linkedin, Phone,
  Video, DollarSign, MessageCircle, ChevronLeft, ExternalLink, Star, Briefcase
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
  { name: 'Forest Night', p: '#065F46', d: '#064E3B', l: '#ECFDF5', a: '#10B981' },
  { name: 'Modern Grey',  p: '#334155', d: '#1E293B', l: '#F1F5F9', a: '#94A3B8' },
  { name: 'Sunset Silk',  p: '#E85D04', d: '#CC4D00', l: '#FFF0E5', a: '#FFBA08' },
  { name: 'Royal Purple', p: '#7C3AED', d: '#6D28D9', l: '#EDE9FE', a: '#A78BFA' },
  { name: 'Rose Quartz',  p: '#DB2777', d: '#BE185D', l: '#FDF2F8', a: '#F472B6' },
  { name: 'Teal Calm',    p: '#0D9488', d: '#0F766E', l: '#CCFBF1', a: '#5EEAD4' },
  { name: 'Crimson Power',p: '#DC2626', d: '#B91C1C', l: '#FEE2E2', a: '#F87171' },
  { name: 'Midnight',    p: '#0F172A', d: '#020617', l: '#F1F5F9', a: '#38BDF8' },
  { name: 'Emerald Plus', p: '#059669', d: '#047857', l: '#D1FAE5', a: '#34D399' },
  { name: 'Amber Glow',   p: '#D97706', d: '#B45309', l: '#FEF3C7', a: '#FCD34D' },
  { name: 'Terracotta',   p: '#C2410C', d: '#9A3412', l: '#FFF7ED', a: '#FB923C' },
];

// ─── Live Preview ──────────────────────────────────────────────────────────────
function Preview({ settings }) {
  const { primaryColor, secondaryColor, clinicName, physioName, logo, logoWidth, logoHeight, coverPhoto } = settings;
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
                minWidth: 52, minHeight: 52, 
                width: logoWidth || 'auto',
                height: logoHeight || 'auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {logo ? (
                  <img src={logo} alt="" style={{ 
                    maxWidth: '100%', maxHeight: '100%',
                    width: 'auto', height: 'auto',
                    objectFit: 'contain' 
                  }} />
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
function Field({ label, value, onChange, placeholder, type = 'text', multiline, rows, list }) {
  const isTitleType = label?.toLowerCase().includes('name') || label?.toLowerCase().includes('clinic') || label?.toLowerCase().includes('designation') || label?.toLowerCase().includes('category');
  
  const style = multiline
    ? { width: '100%', padding: '12px 16px', background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: T.r.md, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: T.ink, outline: 'none', resize: 'vertical', minHeight: 80, lineHeight: 1.5, transition: 'border-color 0.2s, box-shadow 0.2s', textTransform: isTitleType ? 'capitalize' : 'none' }
    : { width: '100%', height: 48, padding: '0 16px', background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: T.r.md, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: T.ink, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', textTransform: isTitleType ? 'capitalize' : 'none' };

  const Component = multiline ? 'textarea' : 'input';
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.ink2, marginBottom: 6, letterSpacing: '0.1px' }}>{label}</label>}
      <Component
        type={type}
        list={list}
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
        <h3 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16, fontWeight: 700, color: T.ink, textTransform: 'capitalize' }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: T.ink4 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Image Upload ──────────────────────────────────────────────────────────────
// ─── Image Crop Modal ────────────────────────────────────────────────────────
function CropModal({ image, aspect = 1, onCrop, onCancel, width, height, onWidthChange, onHeightChange }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  
  const isLogo = onWidthChange !== undefined;

  function handleStart(e) {
    setIsDragging(true);
    const pos = e.touches ? e.touches[0] : e;
    setStartPos({ x: pos.clientX - offset.x, y: pos.clientY - offset.y });
  }

  function handleMove(e) {
    if (!isDragging) return;
    const pos = e.touches ? e.touches[0] : e;
    setOffset({ x: pos.clientX - startPos.x, y: pos.clientY - startPos.y });
  }

  function handleEnd() { setIsDragging(false); }

  async function handleConfirm() {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    const canvas = document.createElement('canvas');
    const cw = container.offsetWidth;
    const ch = container.offsetHeight;
    
    // The visual size of the white crop box
    const cropBoxW = 300;
    const cropBoxH = 300 / aspect;
    
    // How much of the source image is actually inside that white box?
    // Scale factor between natural image and its displayed size * zoom
    const displayedImgW = img.width * zoom;
    const displayedImgH = img.height * zoom;
    const scale = img.naturalWidth / displayedImgW;
    
    // Relative coordinates of the crop box center vs the image center
    // Image is at: (cw/2 + offset.x, ch/2 + offset.y)
    // Crop box is at: (cw/2, ch/2)
    const relativeX = (cw/2 - (cw/2 + offset.x)) / zoom;
    const relativeY = (ch/2 - (ch/2 + offset.y)) / zoom;

    // Output dimension (1000px high res)
    const outputWidth = 1000;
    const outputHeight = outputWidth / aspect;
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');

    // The width/height of the source image we need to grab
    const sW = (cropBoxW / zoom) * (img.naturalWidth / img.width);
    const sH = sW / aspect;
    
    // The top-left corner on the source image
    const sX = (img.naturalWidth / 2) + (relativeX * (img.naturalWidth / img.width)) - (sW / 2);
    const sY = (img.naturalHeight / 2) + (relativeY * (img.naturalHeight / img.height)) - (sH / 2);

    ctx.drawImage(img, sX, sY, sW, sH, 0, 0, outputWidth, outputHeight);
    
    canvas.toBlob((blob) => {
      onCrop(blob);
    }, 'image/webp');
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 500, overflow: 'hidden', animation: 'fadeUp 0.3s ease' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>Perfect Your Shot</h3>
            <p style={{ fontSize: 12, color: '#666' }}>Drag to position, pinch or use slider to zoom</p>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}><X size={20} /></button>
        </div>

        <div 
          ref={containerRef}
          style={{ 
            height: 350, background: '#111', position: 'relative', overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
          }}
          onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
          onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
        >
          {/* Crop Guide */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 300, height: 300 / aspect,
            border: '2px solid #fff', boxShadow: '0 0 0 2000px rgba(0,0,0,0.5)',
            zIndex: 10, pointerEvents: 'none', borderRadius: aspect === 1 ? 16 : 4
          }}>
             <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
             <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.3)' }} />
             <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.3)' }} />
             <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.3)' }} />
          </div>

          <img 
            ref={imgRef}
            src={image} 
            alt="To crop" 
            style={{ 
              position: 'absolute', top: '50%', left: '50%',
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              maxWidth: '80%', maxHeight: '80%', userSelect: 'none', pointerEvents: 'none'
            }} 
          />
        </div>

        <div style={{ padding: 24 }}>
          {/* Zoom Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isLogo ? 20 : 24 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#666', width: 40 }}>Zoom</span>
            <input 
              type="range" min="0.5" max="3" step="0.01" value={zoom} 
              onChange={e => setZoom(parseFloat(e.target.value))}
              style={{ flex: 1, cursor: 'pointer', accentColor: '#007AFF' }}
            />
          </div>

          {/* Logo Size Adjusters (Unified into modal) */}
          {isLogo && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, padding: 12, background: '#f8f8fa', borderRadius: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Disp. Width: {width}px</label>
                <input 
                  type="range" min="20" max="250" value={width} 
                  onChange={e => onWidthChange(parseInt(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#007AFF' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Disp. Height: {height}px</label>
                <input 
                  type="range" min="20" max="250" value={height} 
                  onChange={e => onHeightChange(parseInt(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#007AFF' }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onCancel} style={{ flex: 1, height: 48, borderRadius: 14, background: '#f5f5f7', border: 'none', fontSize: 13, fontWeight: 700, color: '#333', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleConfirm} style={{ flex: 2, height: 48, borderRadius: 14, background: '#007AFF', border: 'none', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,122,255,0.3)' }}>Confirm & Update</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Image Upload ──────────────────────────────────────────────────────────────
function ImageUpload({ label, value, onChange, aspect = '1/1', clinicId, width, height, onWidthChange, onHeightChange }) {
  const [uploading, setUploading] = useState(false);
  const [cropTarget, setCropTarget] = useState(null); // The raw image URL to crop

  const numericAspect = typeof aspect === 'string' && aspect.includes('/') 
    ? aspect.split('/').reduce((a, b) => parseFloat(a) / parseFloat(b)) 
    : parseFloat(aspect);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Read file, then show cropper
    const reader = new FileReader();
    reader.onload = () => setCropTarget(reader.result);
    reader.readAsDataURL(file);
  }

  async function uploadCropped(blob) {
    setCropTarget(null);
    if (!clinicId) return;
    setUploading(true);
    try {
      const fileName = `${label.toLowerCase().replace(/ /g, '-')}-${Date.now()}.webp`;
      const path = `clinics/${clinicId}/${fileName}`;
      
      // Convert blob to File for our helper
      const file = new File([blob], fileName, { type: 'image/webp' });
      const url = await uploadFile(file, path);
      onChange(url);
    } catch (err) {
      alert("Upload failed. Please try again.");
    }
    setUploading(false);
  }

  return (
    <div>
      {cropTarget && (
        <CropModal 
          image={cropTarget} 
          aspect={numericAspect} 
          onCrop={uploadCropped} 
          onCancel={() => setCropTarget(null)} 
        />
      )}
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
        <input type="file" accept="image/png, image/webp" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} disabled={uploading} />
      </div>
      <p style={{ fontSize: 10, color: T.ink4, marginTop: 6, textAlign: 'center' }}>PNG or WebP recommended for transparency</p>
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
    logoWidth: 44,
    logoHeight: 44,
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
    googleReviews: '',
    justDial: '',
    // Content
    highlights: ['', '', ''],
    languages: ['English', 'Hindi'],
    showLanguages: true,
    testimonials: [
      { name: 'Anil Mehta', text: 'Incredibly knowledgeable. My chronic back pain is significantly better after just 4 sessions under the doctor\'s care.', rating: 5 },
      { name: 'Sonal Verma', text: 'The clinic is clean and modern, and the online booking is so seamless. No waiting, just professional care.', rating: 5 },
      { name: 'Kushal Shah', text: 'Highly recommend for sports injury rehab. They have state-of-the-art evidence-based treatment protocols.', rating: 5 }
    ],
    showTestimonials: true,
    showHighlights: true,
    noticeText: '',
    showNotice: false,
    adBanner: '',
    showAdBanner: false,
    // Schedule
    workingHours: { start: '09:00', end: '19:00' },
    blockedDates: [],
    // Payouts
    upiId: '',
    accountName: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
    pan: '',
    cancelledCheque: '',
    // Services, Packages, Coupons
    services: [
      { id: 'initial', name: 'Initial Consultation', duration: 45, price: 500, description: 'First-time comprehensive assessment.' }
    ],
    packages: [],
    coupons: [],
    // Link Generation state (Not saved to DB)
    customLinkAmount: '',
    customLinkDesc: '',
    generatedLink: '',
  });

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const TABS = [
    { id: 'branding',   label: 'Branding',   icon: <Palette size={14} /> },
    { id: 'clinic',     label: 'Clinic',      icon: <User size={14} /> },
    { id: 'schedule',   label: 'Schedule',    icon: <Clock size={14} /> },
    { id: 'content',    label: '⭐ Reviews & Notices', icon: <MessageCircle size={14} /> },
    { id: 'video',      label: 'Video',       icon: <Video size={14} /> },
    { id: 'payouts',    label: 'Payouts',     icon: <DollarSign size={14} /> },
    { id: 'pricing',    label: 'Services & Promos', icon: <Tag size={14} /> },
    { id: 'custom_link', label: 'Create Invoice Link', icon: <LinkIcon size={14} /> },
  ];

  // ── Auth & load data ───────────────────────────────────────────────────────────
  useEffect(() => {
    document.title = 'Edit My Page | OnlinePT';
    
    // Subdomain detection logic (consistent with AppRouter)
    const hn = window.location.hostname;
    const urlParams = new URLSearchParams(window.location.search);
    const tenantParam = urlParams.get('tenant') || urlParams.get('dev');
    const effectiveHn = hn.replace(/^www\./, '');
    const isSubdomain = (effectiveHn.split('.').length >= 3 && effectiveHn.endsWith('onlinept.in')) || 
                        ((hn === 'localhost' || hn === '127.0.0.1') && tenantParam);
    const subdomain = isSubdomain ? (tenantParam || effectiveHn.split('.')[0]) : null;

    const unsub = onAuth(async (u) => {
      if (!u) { navigate('/dashboard-login'); return; }
      setUser(u);
      setLoading(true);
      setError('');

      try {
        // 1. Try strategy A: Load by subdomain if present
        let clinicDoc = null;
        let cId = '';

        if (subdomain) {
          const sRef = doc(db, 'clinics', subdomain);
          const sSnap = await getDoc(sRef);
          if (sSnap.exists()) {
            const data = sSnap.data();
            // Verify ownership
            if (data.uid === u.uid || isSuperAdminEmail(u.email)) {
               clinicDoc = data;
               cId = sSnap.id;
            }
          }
        }

        // 2. Strategy B: Load by UID query (if A failed or no subdomain)
        if (!clinicDoc) {
          try {
            const qSnap = await getDocs(query(collection(db, 'clinics'), where('uid', '==', u.uid)));
            if (!qSnap.empty) {
              clinicDoc = qSnap.docs[0].data();
              cId = qSnap.docs[0].id;
            }
          } catch (uidErr) {
            // UID index may be missing
          }
        }

        // 3. Strategy C: Fallback to Email search
        if (!clinicDoc && u.email) {
          try {
            const lowerEmail = u.email.toLowerCase();
            const qBounded = query(
              collection(db, 'clinics'),
              where('email', '>=', lowerEmail),
              where('email', '<=', lowerEmail + '\uf8ff'),
            );
            const qSnap = await getDocs(qBounded);
            const emailMatch = qSnap.docs.find(d => d.data().email?.toLowerCase() === lowerEmail);
            if (emailMatch) {
              const foundDoc = emailMatch.data();
              cId = emailMatch.id;
              // Self-heal: if UID mismatch (account was recreated), update the stored UID
              if (foundDoc.uid !== u.uid) {
                await updateDoc(doc(db, 'clinics', cId), { uid: u.uid });
              }
              clinicDoc = foundDoc;
            }
          } catch (emailErr) {
            // Likely missing Firestore index — use client-side scan
            if (emailErr.message?.includes('index')) {
              try {
                const qAll = await getDocs(query(collection(db, 'clinics'), limit(200)));
                const lowerEmail = u.email.toLowerCase();
                const emailMatch = qAll.docs.find(d => (d.data().email || '').toLowerCase() === lowerEmail);
                if (emailMatch) {
                  const foundDoc = emailMatch.data();
                  cId = emailMatch.id;
                  if (foundDoc.uid !== u.uid) {
                    await updateDoc(doc(db, 'clinics', cId), { uid: u.uid });
                  }
                  clinicDoc = foundDoc;
                }
              } catch (scanErr) {
                // Fallback scan also failed
              }
            } else {
              throw emailErr;
            }
          }
        }

        if (clinicDoc) {
          setClinicId(cId);
          // Redirect if on wrong domain
          if (!subdomain && cId && !hn.includes('localhost')) {
             window.location.href = `https://${cId}.onlinept.in/admin`;
             return;
          }
          const d = clinicDoc;
          setS(prev => ({
            ...prev,
            physioName: d.physioName || '',
            clinicName: d.clinicName || '',
            email: d.email || u.email || '',
            phone: d.phone || '',
            address: d.address || '',
            logo: d.settings?.logo || d.logo || '',
            logoWidth: d.settings?.logoWidth || d.logoWidth || 44,
            logoHeight: d.settings?.logoHeight || d.logoHeight || 44,
            coverPhoto: d.settings?.coverPhoto || d.coverPhoto || '',
            physioPhoto: d.settings?.physioPhoto || d.physioPhoto || '',
            primaryColor: d.settings?.primaryColor || d.primaryColor || '#007AFF',
            secondaryColor: d.settings?.secondaryColor || d.secondaryColor || '#5AC8FA',
            videoMode: d.settings?.videoMode || d.videoMode || 'whatsapp',
            zoomLink: d.settings?.zoomLink || d.zoomLink || '',
            facebook: d.settings?.facebook || d.facebook || '',
            instagram: d.settings?.instagram || d.instagram || '',
            youtube: d.settings?.youtube || d.youtube || '',
            linkedin: d.settings?.linkedin || d.linkedin || '',
            googleReviews: d.settings?.googleReviews || '',
            justDial: d.settings?.justDial || '',
            highlights: d.settings?.highlights || d.highlights || ['', '', ''],
            languages: d.settings?.languages || d.languages || ['English', 'Hindi'],
            showLanguages: d.settings?.showLanguages ?? true,
            testimonials: d.settings?.testimonials || d.testimonials || [
              { name: 'Anil Mehta', text: 'Incredibly knowledgeable. My chronic back pain is significantly better after just 4 sessions.', rating: 5 },
              { name: 'Sonal Verma', text: 'The clinic is clean and modern. Online booking is seamless.', rating: 5 },
              { name: 'Kushal Shah', text: 'Highly recommend for rehab.', rating: 5 }
            ],
            showTestimonials: d.settings?.showTestimonials !== false && d.showTestimonials !== false,
            showHighlights: d.settings?.showHighlights !== false && d.showHighlights !== false,
            noticeText: d.settings?.noticeText || d.noticeText || '',
            showNotice: d.settings?.showNotice || d.showNotice || false,
            adBanner: d.settings?.adBanner || d.adBanner || '',
            showAdBanner: d.settings?.showAdBanner || d.showAdBanner || false,
            upiId: d.settings?.upiId || d.upiId || '',
            accountName: d.settings?.accountName || d.accountName || d.settings?.accountHolder || '',
            bankName: d.settings?.bankName || d.bankName || '',
            accountNumber: d.settings?.accountNumber || d.accountNumber || '',
            ifsc: d.settings?.ifsc || d.ifsc || '',
            pan: d.settings?.pan || d.pan || '',
            cancelledCheque: d.settings?.cancelledCheque || d.cancelledCheque || '',
            services: d.settings?.services || d.services || [{ id: 'initial', name: 'Initial Consultation', duration: 45, price: 500, description: 'First-time comprehensive assessment.' }],
            packages: d.settings?.packages || d.packages || [],
            coupons: d.settings?.coupons || d.coupons || [],
            workingHours: d.workingHours || { start: '09:00', end: '19:00' },
            blockedDates: d.blockedDates || [],
          }));
        } else {
          // All strategies failed — try rescue scan (first 300 clinics)
          try {
            const rescueSnap = await getDocs(query(collection(db, 'clinics'), limit(300)));
            const match = rescueSnap.docs.find(d => (d.data().email || '').toLowerCase() === (u.email || '').toLowerCase());
            if (match) {
              const rescueDoc = match.data();
              const rescueId = match.id;
              // Self-heal UID if mismatched
              if (rescueDoc.uid !== u.uid) {
                await updateDoc(doc(db, 'clinics', rescueId), { uid: u.uid });
              }
              // Re-run the load with the found clinic
              setClinicId(rescueId);
              setS(prev => ({
                ...prev,
                physioName: rescueDoc.physioName || '',
                clinicName: rescueDoc.clinicName || '',
                email: rescueDoc.email || u.email || '',
                phone: rescueDoc.phone || '',
                address: rescueDoc.address || '',
                logo: rescueDoc.settings?.logo || rescueDoc.logo || '',
                logoWidth: rescueDoc.settings?.logoWidth || rescueDoc.logoWidth || 44,
                logoHeight: rescueDoc.settings?.logoHeight || rescueDoc.logoHeight || 44,
                coverPhoto: rescueDoc.settings?.coverPhoto || rescueDoc.coverPhoto || '',
                physioPhoto: rescueDoc.settings?.physioPhoto || rescueDoc.physioPhoto || '',
                primaryColor: rescueDoc.settings?.primaryColor || rescueDoc.primaryColor || '#007AFF',
                secondaryColor: rescueDoc.settings?.secondaryColor || rescueDoc.secondaryColor || '#5AC8FA',
                videoMode: rescueDoc.settings?.videoMode || rescueDoc.videoMode || 'whatsapp',
                services: rescueDoc.settings?.services || rescueDoc.services || [],
                packages: rescueDoc.settings?.packages || rescueDoc.packages || [],
                coupons: rescueDoc.settings?.coupons || rescueDoc.coupons || [],
                workingHours: rescueDoc.workingHours || { start: '09:00', end: '19:00' },
                blockedDates: rescueDoc.blockedDates || [],
              }));
              return;
            }
          } catch (rescueErr) {
            // Rescue scan also failed
          }

          setError(
            <div>
              Clinic profile not found. If you have deleted your clinic and want to start fresh, 
              please <Link to="/setup" style={{ color: T.primary, fontWeight: 700, textDecoration: 'underline' }}>Complete Setup Here</Link>.
            </div>
          );
        }
      } catch (e) {
        setError(`Failed to load clinic: ${e.message}`);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, [navigate]);

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
        workingHours: s.workingHours,
        blockedDates: s.blockedDates,
        settings: {
          logo: s.logo,
          logoWidth: s.logoWidth,
          logoHeight: s.logoHeight,
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
          googleReviews: s.googleReviews,
          justDial: s.justDial,
          highlights: s.highlights,
          languages: s.languages,
          showLanguages: s.showLanguages,
          testimonials: s.testimonials,
          showTestimonials: s.showTestimonials,
          showHighlights: s.showHighlights,
          noticeText: s.noticeText,
          showNotice: s.showNotice,
          adBanner: s.adBanner,
          showAdBanner: s.showAdBanner,
          upiId: s.upiId,
          accountName: s.accountName,
          bankName: s.bankName,
          accountNumber: s.accountNumber,
          ifsc: s.ifsc,
          pan: s.pan,
          cancelledCheque: s.cancelledCheque,
          services: s.services,
          packages: s.packages,
          coupons: s.coupons,
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

        /* ── Mobile Responsive ── */
        @media (max-width: 768px) {
          .admin-header-inner { padding: 0 12px !important; }
          .admin-tab-bar { padding: 0 12px 10px !important; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; gap: 2px !important; }
          .admin-tab-bar::-webkit-scrollbar { display: none; }
          .admin-tab-btn { padding: 5px 10px !important; font-size: 11px !important; white-space: nowrap; }
          .admin-main { flex-direction: column !important; padding: 16px 12px !important; gap: 20px !important; }
          .admin-preview-toggle { display: flex !important; }
          .admin-preview-panel { display: none; }
          .admin-preview-panel.open { display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 200; background: white; border-radius: 20px 20px 0 0; box-shadow: 0 -4px 30px rgba(0,0,0,0.15); padding: 16px; flex-direction: column; align-items: center; }
          .admin-preview-backdrop { display: none; position: fixed; inset: 0; z-index: 199; background: rgba(0,0,0,0.4); }
          .admin-preview-backdrop.open { display: block; }
          .admin-preview-panel .preview-inner { transform: scale(0.55) !important; transform-origin: top center !important; margin: -40px auto 0 !important; }
          .admin-palette-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .admin-form-grid { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 480px) {
          .admin-header-title { font-size: 12px !important; }
          .admin-logo-name { font-size: 13px !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>

      {/* ── Sticky Header ────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="admin-header-inner">
          {/* Left: back */}
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: T.ink3, fontSize: 13, fontWeight: 500 }}>
            <ChevronLeft size={18} />
            <span className="hide-mobile" style={{ display: 'none' }}>Back</span>
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
            <span className="admin-logo-name" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 15, fontWeight: 800, color: T.ink }}>
              Online<span style={{ color: T.primary }}>PT</span>
            </span>
            <span style={{ color: T.border, fontSize: 16 }}>|</span>
            <span className="admin-header-title" style={{ fontSize: 13, fontWeight: 600, color: T.ink2 }}>Edit My Page</span>
          </div>

          {/* Right: preview toggle (mobile) + save */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Mobile preview toggle */}
            <button
              className="admin-preview-toggle"
              onClick={() => setPreviewOpen(o => !o)}
              style={{
                display: 'none', height: 36, padding: '0 14px',
                background: previewOpen ? T.primary : T.surface,
                color: previewOpen ? '#fff' : T.ink2,
                border: `1.5px solid ${previewOpen ? T.primary : T.border}`,
                borderRadius: T.r.sm, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', alignItems: 'center', gap: 5,
              }}
            >
              <Eye size={13} />
              {previewOpen ? 'Hide Preview' : 'Preview'}
            </button>
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
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 12px', display: 'flex', gap: 4 }} className="admin-tab-bar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPreviewOpen(false); }}
              className="admin-tab-btn"
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
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px', display: 'flex', gap: 32, alignItems: 'flex-start' }} className="admin-main">

        {/* ── Form Panel ─────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }} className="admin-form-grid">

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
                  <ImageUpload 
                    label="Clinic Logo" value={s.logo} onChange={v => update('logo', v)} aspect="1/1" clinicId={clinicId}
                    width={s.logoWidth} height={s.logoHeight} 
                    onWidthChange={v => update('logoWidth', v)} 
                    onHeightChange={v => update('logoHeight', v)}
                  />
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }} className="admin-palette-grid">
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

          {/* ── Schedule Tab ─────────────────────────────────────────────────── */}
          {activeTab === 'schedule' && (
            <div style={{ animation: 'slideIn 0.25s ease', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, padding: 24 }}>
                <SectionHeader
                  icon={<Clock size={16} style={{ color: T.primary }} />}
                  title="Working Hours"
                  subtitle="Set your daily consultation availability"
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <Field label="Starts at" type="time" value={s.workingHours.start} onChange={v => update('workingHours', { ...s.workingHours, start: v })} />
                  </div>
                  <div style={{ paddingTop: 20, fontWeight: 800, color: T.ink4 }}>TO</div>
                  <div style={{ flex: 1 }}>
                    <Field label="Ends at" type="time" value={s.workingHours.end} onChange={v => update('workingHours', { ...s.workingHours, end: v })} />
                  </div>
                </div>
              </div>

              <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, padding: 24 }}>
                <SectionHeader
                  icon={<X size={16} style={{ color: '#DC2626' }} />}
                  title="Closed Dates"
                  subtitle="Block entire days for holidays or unavailability"
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {s.blockedDates.map(date => (
                      <div key={date} style={{ padding: '6px 12px', background: T.surface, borderRadius: 10, fontSize: 13, fontWeight: 700, color: T.ink2, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${T.border}` }}>
                        {date}
                        <X size={14} style={{ cursor: 'pointer' }} onClick={() => update('blockedDates', s.blockedDates.filter(d => d !== date))} />
                      </div>
                    ))}
                    {s.blockedDates.length === 0 && <p style={{ fontSize: 13, color: T.ink4, fontStyle: 'italic' }}>No dates blocked yet.</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <input type="date" id="block-date-input" style={{ flex: 1, padding: '0 16px', height: 44, borderRadius: 10, border: `1.5px solid ${T.border}`, outline: 'none' }} />
                    <button 
                      onClick={() => {
                        const el = document.getElementById('block-date-input');
                        if (el.value && !s.blockedDates.includes(el.value)) {
                          update('blockedDates', [...s.blockedDates, el.value]);
                          el.value = '';
                        }
                      }}
                      style={{ padding: '0 20px', background: T.primary, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Block Date
                    </button>
                  </div>
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

          {/* ── Content Tab ──────────────────────────────────────────────────── */}
          {activeTab === 'content' && (
            <div style={{ animation: 'slideIn 0.25s ease', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Notice Board */}
              <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <SectionHeader
                    icon={<AlertCircle size={16} style={{ color: T.orange }} />}
                    title="Notice Board"
                    subtitle="Display an urgent message to patients"
                  />
                  <Toggle checked={s.showNotice} onChange={v => update('showNotice', v)} />
                </div>
                <Field label="Announcement Text" value={s.noticeText} onChange={v => update('noticeText', v)} placeholder="e.g. Clinic closed this Monday for Diwali." multiline rows={2} />
              </div>

              {/* Advertisement Banner */}
              <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <SectionHeader
                    icon={<Image size={16} style={{ color: T.accent }} />}
                    title="Advertisement Banner"
                    subtitle="Promote a camp, offer, or new service"
                  />
                  <Toggle checked={s.showAdBanner} onChange={v => update('showAdBanner', v)} />
                </div>
                <ImageUpload label="Ad Image (e.g. 16:9 banner)" value={s.adBanner} onChange={v => update('adBanner', v)} aspect="16/9" clinicId={clinicId} />
              </div>

              {/* Highlights */}
              <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <SectionHeader
                    icon={<CheckCircle2 size={16} style={{ color: T.primary }} />}
                    title="Clinic Highlights"
                    subtitle="3 key reasons patients should choose you"
                  />
                  <Toggle checked={s.showHighlights} onChange={v => update('showHighlights', v)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {s.highlights.map((h, i) => (
                    <Field 
                      key={i} 
                      label={`Highlight #${i+1}`} 
                      value={h} 
                      onChange={v => {
                        const newH = [...s.highlights];
                        newH[i] = v;
                        update('highlights', newH);
                      }} 
                      placeholder={['Fast Recovery', 'Expert Sports Care', 'Certified MPT'][i]} 
                    />
                  ))}
                </div>
              </div>

              {/* Testimonials */}
              <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <SectionHeader
                    icon={<MessageCircle size={16} style={{ color: T.primary }} />}
                    title="Patient Reviews"
                    subtitle="Showcase your best patient feedback"
                  />
                  <Toggle checked={s.showTestimonials} onChange={v => update('showTestimonials', v)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {s.testimonials.map((t, i) => (
                    <div key={i} style={{ padding: 16, background: T.surface, borderRadius: T.r.md, position: 'relative' }}>
                      <button 
                        onClick={() => {
                          const newT = s.testimonials.filter((_, idx) => idx !== i);
                          update('testimonials', newT);
                        }}
                        style={{ position: 'absolute', top: 12, right: 12, border: 'none', background: 'none', cursor: 'pointer', color: T.ink4 }}
                      >
                        <Trash2 size={14} />
                      </button>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <Field label="Patient Name" value={t.name} onChange={v => {
                          const newT = [...s.testimonials];
                          newT[i].name = v;
                          update('testimonials', newT);
                        }} placeholder="Rahul S." />
                        <Field label="Review Text" value={t.text} onChange={v => {
                          const newT = [...s.testimonials];
                          newT[i].text = v;
                          update('testimonials', newT);
                        }} placeholder="Amazing experience, felt better in 2 session!" multiline rows={2} />
                      </div>
                    </div>
                  ))}
                  {s.testimonials.length < 5 && (
                    <button 
                      onClick={() => update('testimonials', [...s.testimonials, { name: '', text: '', rating: 5 }])}
                      style={{ padding: '10px', border: `1.5px dashed ${T.border}`, borderRadius: T.r.md, background: 'none', color: T.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <Plus size={14} /> Add Testimonial
                    </button>
                  )}
                </div>
              </div>

              {/* Languages */}
              <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <SectionHeader
                    icon={<Globe size={16} style={{ color: T.primary }} />}
                    title="Languages"
                    subtitle="Help local patients feel comfortable"
                  />
                  <Toggle checked={s.showLanguages} onChange={v => update('showLanguages', v)} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Bengali', 'Kannada'].map(lang => {
                    const active = s.languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        onClick={() => {
                          const newL = active 
                            ? s.languages.filter(l => l !== lang)
                            : [...s.languages, lang];
                          update('languages', newL);
                        }}
                        style={{
                          padding: '6px 14px', borderRadius: 20, border: `1px solid ${active ? T.primary : T.border}`,
                          background: active ? T.primaryLight : T.white,
                          color: active ? T.primary : T.ink3,
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Social Identity (Integrated) ── */}
          {activeTab === 'content' && (
             <div style={{ marginTop: 24, background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, padding: 24 }}>
                <SectionHeader
                  icon={<Globe size={16} style={{ color: T.primary }} />}
                  title="Social Media Presence"
                  subtitle="Connect patients to your professional social profiles"
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
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
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Star size={14} style={{ color: '#FABB05' }} />
                      <label style={{ fontSize: 12, fontWeight: 600, color: T.ink2 }}>Google Reviews</label>
                    </div>
                    <Field value={s.googleReviews} onChange={v => update('googleReviews', v)} placeholder="Google Maps Review Link" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Globe size={14} style={{ color: '#4B3BC2' }} />
                      <label style={{ fontSize: 12, fontWeight: 600, color: T.ink2 }}>Just Dial Reviews</label>
                    </div>
                    <Field value={s.justDial} onChange={v => update('justDial', v)} placeholder="Just Dial Profile Link" />
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


          {/* ── Payouts Tab ──────────────────────────────────────────────────── */}
          {activeTab === 'payouts' && (
            <div style={{ animation: 'slideIn 0.25s ease' }}>
              <div style={{
                background: T.white, borderRadius: T.r.lg,
                border: `1px solid ${T.border}`,
                padding: 24,
              }}>
                <SectionHeader
                  icon={<DollarSign size={16} style={{ color: '#10B981' }} />}
                  title="Payouts & Banking"
                  subtitle="How we send you money for completed bookings"
                />
                
                <div style={{ padding: '12px 16px', background: '#F0FDF4', borderRadius: T.r.md, marginBottom: 20, border: '1px solid #BBF7D0' }}>
                  <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.5 }}>
                    <strong>Payout Schedule:</strong> We transfer your consultation fees (minus platform charges) directly to your account within <strong>24 hours of successful session completion</strong>.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Field label="BHIM / UPI ID (Fastest Transfer)" value={s.upiId} onChange={v => update('upiId', v)} placeholder="dr.aruna@okaxis" />
                  
                  <div style={{ height: 1, background: T.border, margin: '8px 0' }} />
                  
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>Alternative: Bank Transfer (NEFT / IMPS)</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 8 }}>
                    <ImageUpload label="Fastest Method: Upload Cancelled Cheque Photo" value={s.cancelledCheque} onChange={v => update('cancelledCheque', v)} aspect="21/9" clinicId={clinicId} />
                  </div>

                  <div style={{ textAlign: 'center', color: T.ink4, fontSize: 11, fontWeight: 600, letterSpacing: '0.5px' }}>OR FILL MANUALLY</div>

                  <Field label="Account Holder Name" value={s.accountName} onChange={v => update('accountName', v)} placeholder="Aruna Kapoor" />
                  <Field label="PAN Number (For TDS Compliance)" value={s.pan} onChange={v => update('pan', v.toUpperCase())} placeholder="ABCDE1234F" />
                  
                  <div>
                    <datalist id="bank-list">
                      <option value="State Bank of India (SBI)" />
                      <option value="HDFC Bank" />
                      <option value="ICICI Bank" />
                      <option value="Axis Bank" />
                      <option value="Punjab National Bank (PNB)" />
                      <option value="Bank of Baroda" />
                      <option value="Kotak Mahindra Bank" />
                      <option value="IndusInd Bank" />
                      <option value="Union Bank of India" />
                      <option value="Canara Bank" />
                    </datalist>
                    <Field label="Bank Name" value={s.bankName} onChange={v => update('bankName', v)} placeholder="HDFC Bank" list="bank-list" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Account Number" value={s.accountNumber} onChange={v => update('accountNumber', v)} placeholder="50100XXXXXXX" />
                    <div>
                      <Field label="IFSC Code" value={s.ifsc} onChange={v => update('ifsc', v.toUpperCase())} placeholder="HDFC0001234" />
                      {s.ifsc && s.ifsc.length !== 11 && (
                        <span style={{ fontSize: 10, color: '#DC2626', fontWeight: 600, marginTop: 4, display: 'block' }}>⚠️ IFSC must be exactly 11 characters. Current: {s.ifsc.length}</span>
                      )}
                      {s.ifsc && s.ifsc.length === 11 && (
                        <span style={{ fontSize: 10, color: '#166534', fontWeight: 600, marginTop: 4, display: 'block' }}>✅ Valid length</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Branding & Social Tab ───────────────────────────────────────── */}

          {/* ── Custom Link Form ──────────────────────────────────────────────── */}
          {activeTab === 'custom_link' && (
             <div style={{ animation: 'slideIn 0.25s ease' }}>
                <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, padding: 24 }}>
                  <SectionHeader
                    icon={<LinkIcon size={16} style={{ color: T.orange }} />}
                    title="Generate Custom Invoice Link"
                    subtitle="Instantly create a secure Razorpay checkout link for a custom amount to WhatsApp to a patient."
                  />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Field 
                      label="Patient Name (Optional)" 
                      value={s.customLinkName || ''} 
                      onChange={v => update('customLinkName', v)} 
                      placeholder="e.g. Ramesh Patel" 
                    />
                    <Field 
                      label="Description of Service" 
                      value={s.customLinkDesc} 
                      onChange={v => update('customLinkDesc', v)} 
                      placeholder="e.g. Custom Knee Mobility Bundle - 7 Sessions" 
                    />
                    <Field 
                      label="Total Amount to Collect (₹)" 
                      value={s.customLinkAmount} 
                      onChange={v => update('customLinkAmount', v)} 
                      placeholder="e.g. 5000" 
                      type="number" 
                    />
                    
                    <button
                      onClick={() => {
                        if (!s.customLinkAmount || !s.customLinkDesc) return alert('Enter amount and description');
                        const url = `${window.location.origin}/pay?clinicId=${clinicId}&amount=${s.customLinkAmount}&desc=${encodeURIComponent(s.customLinkDesc)}&name=${encodeURIComponent(s.customLinkName || '')}`;
                        update('generatedLink', url);
                      }}
                      style={{
                        height: 48, borderRadius: T.r.md, background: T.ink, color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 10
                      }}
                    >
                      Generate Secure Payment Link
                    </button>

                    {s.generatedLink && (
                      <div style={{ marginTop: 20, padding: 20, background: '#F0FDF4', border: '2px dashed #4ADE80', borderRadius: T.r.md, textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                          <CheckCircle2 color="#16A34A" size={40} />
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: '#166534', marginBottom: 8 }}>Link Generated Successfully!</p>
                        <p style={{ fontSize: 11, color: '#15803D', marginBottom: 16 }}>Patients can click this link on any device to open the Razorpay Secure Checkout popup instantly.</p>
                        
                        <div style={{ display: 'flex', gap: 10 }}>
                          <input 
                            readOnly 
                            value={s.generatedLink} 
                            style={{ flex: 1, height: 44, padding: '0 12px', background: '#fff', border: '1px solid #BBF7D0', borderRadius: T.r.sm, fontSize: 11, color: T.ink2, outline: 'none' }} 
                            onClick={e => e.target.select()}
                          />
                          <button 
                            onClick={() => { navigator.clipboard.writeText(s.generatedLink); alert('Copied to clipboard!'); }}
                            style={{ padding: '0 20px', background: '#16A34A', color: '#fff', fontSize: 12, fontWeight: 700, borderRadius: T.r.sm, border: 'none', cursor: 'pointer' }}
                          >
                            Copy Link
                          </button>
                        </div>
                        <a 
                          href={`https://wa.me/?text=${encodeURIComponent(`Hi ${s.customLinkName || ''}, here is your secure checkout link for: ${s.customLinkDesc}. Amount: ₹${s.customLinkAmount}. Click to pay securely via Razorpay: ${s.generatedLink}`)}`}
                          target="_blank" rel="noreferrer"
                          style={{ marginTop: 12, display: 'inline-block', color: '#16A34A', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
                        >
                          Share instantly on WhatsApp &rarr;
                        </a>
                      </div>
                    )}
                  </div>
                </div>
             </div>
          )}

          {/* ── Services & Promos Tab ──────────────────────────────────────────── */}
          {activeTab === 'pricing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'slideIn 0.25s ease' }}>

              {/* ── Services ── */}
              <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, padding: 24 }}>
                <SectionHeader
                  icon={<Briefcase size={16} style={{ color: T.primary }} />}
                  title="Your Services"
                  subtitle="Add the treatments you offer. Patients see these on your booking page."
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(s.services || []).map((svc, i) => (
                    <div key={svc.id || i} style={{
                      border: `1.5px solid ${T.border}`, borderRadius: T.r.md,
                      padding: 16, background: T.surface, position: 'relative'
                    }}>
                      {/* Delete button */}
                      <button
                        onClick={() => {
                          const updated = s.services.filter((_, idx) => idx !== i);
                          update('services', updated);
                        }}
                        style={{
                          position: 'absolute', top: 12, right: 12,
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#EF4444', padding: 4
                        }}
                        title="Remove service"
                      >
                        <Trash2 size={15} />
                      </button>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }} className="admin-form-grid">
                        <Field
                          label="Service Name"
                          value={svc.name}
                          onChange={v => {
                            const updated = [...s.services];
                            updated[i] = { ...updated[i], name: v };
                            update('services', updated);
                          }}
                          placeholder="e.g. Initial Consultation"
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <Field
                            label="Duration (min)"
                            value={svc.duration}
                            type="number"
                            onChange={v => {
                              const updated = [...s.services];
                              updated[i] = { ...updated[i], duration: parseInt(v) || 0 };
                              update('services', updated);
                            }}
                            placeholder="45"
                          />
                          <Field
                            label="Price (₹)"
                            value={svc.price}
                            type="number"
                            onChange={v => {
                              const updated = [...s.services];
                              updated[i] = { ...updated[i], price: parseInt(v) || 0 };
                              update('services', updated);
                            }}
                            placeholder="500"
                          />
                        </div>
                      </div>
                      <Field
                        label="Short Description"
                        value={svc.description}
                        multiline
                        rows={2}
                        onChange={v => {
                          const updated = [...s.services];
                          updated[i] = { ...updated[i], description: v };
                          update('services', updated);
                        }}
                        placeholder="What does this service include?"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const newSvc = {
                      id: `svc_${Date.now()}`,
                      name: '',
                      duration: 30,
                      price: 500,
                      description: '',
                    };
                    update('services', [...(s.services || []), newSvc]);
                  }}
                  style={{
                    marginTop: 16, width: '100%', height: 44,
                    border: `2px dashed ${T.border}`, borderRadius: T.r.md,
                    background: 'transparent', color: T.ink3,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.ink3; }}
                >
                  <Plus size={16} /> Add New Service
                </button>
              </div>

              {/* ── Promo Coupons ── */}
              <div style={{ background: T.white, borderRadius: T.r.lg, border: `1px solid ${T.border}`, padding: 24 }}>
                <SectionHeader
                  icon={<Tag size={16} style={{ color: T.orange }} />}
                  title="Promo Coupons"
                  subtitle="Create discount codes patients can apply at checkout."
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(s.coupons || []).map((cpn, i) => (
                    <div key={i} style={{
                      border: `1.5px solid ${T.border}`, borderRadius: T.r.md,
                      padding: 16, background: T.surface, position: 'relative'
                    }}>
                      <button
                        onClick={() => {
                          const updated = s.coupons.filter((_, idx) => idx !== i);
                          update('coupons', updated);
                        }}
                        style={{
                          position: 'absolute', top: 12, right: 12,
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#EF4444', padding: 4
                        }}
                      >
                        <Trash2 size={15} />
                      </button>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }} className="admin-form-grid">
                        <Field
                          label="Coupon Code"
                          value={cpn.code}
                          onChange={v => {
                            const updated = [...s.coupons];
                            updated[i] = { ...updated[i], code: v.toUpperCase() };
                            update('coupons', updated);
                          }}
                          placeholder="e.g. WELCOME10"
                        />
                        <div>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.ink2, marginBottom: 6 }}>Discount Type</label>
                          <select
                            value={cpn.type || 'percent'}
                            onChange={e => {
                              const updated = [...s.coupons];
                              updated[i] = { ...updated[i], type: e.target.value };
                              update('coupons', updated);
                            }}
                            style={{
                              width: '100%', height: 48, padding: '0 12px',
                              background: T.surface, border: `1.5px solid ${T.border}`,
                              borderRadius: T.r.md, fontSize: 14, color: T.ink,
                              outline: 'none', cursor: 'pointer'
                            }}
                          >
                            <option value="percent">% Percent Off</option>
                            <option value="flat">₹ Flat Off</option>
                          </select>
                        </div>
                        <Field
                          label={cpn.type === 'flat' ? 'Amount (₹)' : 'Discount (%)'}
                          value={cpn.value}
                          type="number"
                          onChange={v => {
                            const updated = [...s.coupons];
                            updated[i] = { ...updated[i], value: parseInt(v) || 0 };
                            update('coupons', updated);
                          }}
                          placeholder={cpn.type === 'flat' ? '100' : '10'}
                        />
                      </div>
                      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <Field
                          label="Max Uses (blank = unlimited)"
                          value={cpn.maxUses || ''}
                          type="number"
                          onChange={v => {
                            const updated = [...s.coupons];
                            updated[i] = { ...updated[i], maxUses: parseInt(v) || null };
                            update('coupons', updated);
                          }}
                          placeholder="e.g. 50"
                        />
                        <Field
                          label="Expiry Date (optional)"
                          value={cpn.expiry || ''}
                          type="date"
                          onChange={v => {
                            const updated = [...s.coupons];
                            updated[i] = { ...updated[i], expiry: v };
                            update('coupons', updated);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const newCoupon = { code: '', type: 'percent', value: 10, maxUses: null, expiry: '' };
                    update('coupons', [...(s.coupons || []), newCoupon]);
                  }}
                  style={{
                    marginTop: 16, width: '100%', height: 44,
                    border: `2px dashed ${T.border}`, borderRadius: T.r.md,
                    background: 'transparent', color: T.ink3,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.orange; e.currentTarget.style.color = T.orange; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.ink3; }}
                >
                  <Plus size={16} /> Add Promo Coupon
                </button>
              </div>

            </div>
          )}
        </div>

        {/* ── Mobile Preview Backdrop ─────────────────────────────────────────── */}
        <div
          className={`admin-preview-backdrop${previewOpen ? ' open' : ''}`}
          onClick={() => setPreviewOpen(false)}
        />

        {/* ── Live Preview Panel ─────────────────────────────────────────────── */}
        <div
          className={`admin-preview-panel${previewOpen ? ' open' : ''}`}
          style={{
            width: 300, flexShrink: 0, position: 'sticky', top: 120,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}
        >
          {/* Mobile close bar */}
          <div style={{ display: 'none', width: 36, height: 4, background: T.surface2, borderRadius: 4, marginBottom: 8 }} className="admin-preview-toggle" />
          <div style={{ fontSize: 11, fontWeight: 600, color: T.ink4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Live Preview
          </div>
          <div className="preview-inner">
            <Preview settings={s} />
          </div>
          <p style={{ fontSize: 10, color: T.ink4, textAlign: 'center', maxWidth: 200, lineHeight: 1.4 }}>
            Changes appear instantly in your patient page preview
          </p>
          {/* Mobile close button */}
          <button
            className="admin-preview-toggle"
            onClick={() => setPreviewOpen(false)}
            style={{
              display: 'none', marginTop: 8, padding: '8px 24px',
              background: T.primary, color: '#fff',
              border: 'none', borderRadius: T.r.sm,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
