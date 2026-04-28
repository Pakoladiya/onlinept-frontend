import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuth } from '@/firebase/auth';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  Upload, FolderOpen, FileText, Video, Image, File,
  Search, Plus, Trash2, Send, X, ChevronDown,
  Loader2, CheckCircle2, AlertCircle, Download, Sparkles,
  Filter, Tag, Clock, HardDrive, Package, List, LayoutGrid,
  ArrowLeft, GripVertical, BookOpen, Camera
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

import { API_BASE } from '@/utils/api';
const API_STORAGE = `${API_BASE}/api/storage`;

const T = {
  bg: '#0B0F1A',
  bgCard: 'rgba(30, 41, 59, 0.4)',
  glass: 'rgba(255, 255, 255, 0.03)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  ink: '#F8FAFC',
  ink2: '#94A3B8',
  ink3: '#64748B',
  ink4: '#475569',
  primary: '#14A3A8',
  white: '#FFFFFF',
  blur: 'blur(16px)',
  r: { md: 20, lg: 32 },
};

const TABS = [
  { key: 'all',        label: 'All',         icon: FolderOpen },
  { key: 'exercises',  label: 'Exercises',   icon: Video },
  { key: 'education',  label: 'Education',   icon: BookOpen },
  { key: 'forms',      label: 'Forms',        icon: FileText },
  { key: 'recordings', label: 'Recordings',  icon: Camera },
  { key: 'documents',  label: 'Documents',   icon: File },
  { key: 'bundles',    label: 'Bundles',     icon: Package },
];

const TYPE_LIMITS = {
  exercises: { maxMB: 500, types: ['mp4', 'mov', 'webm', 'jpg', 'jpeg', 'png', 'webp'] },
  education:  { maxMB: 500, types: ['mp4', 'mov', 'webm', 'pdf', 'jpg', 'jpeg', 'png', 'webp'] },
  forms:      { maxMB: 50,  types: ['pdf', 'jpg', 'jpeg', 'png', 'webp'] },
  recordings: { maxMB: 500, types: ['mp4', 'mov', 'webm'] },
  documents:  { maxMB: 50,  types: ['pdf', 'jpg', 'jpeg', 'png', 'webp'] },
};

const BODY_PARTS = ['neck', 'shoulder', 'back', 'knee', 'ankle', 'hip', 'wrist', 'general'];

function getFileIcon(type) {
  if (type === 'exercises')  return <Video size={18} />;
  if (type === 'education')  return <BookOpen size={18} />;
  if (type === 'forms')       return <FileText size={18} />;
  if (type === 'recordings') return <Camera size={18} />;
  return <File size={18} />;
}

function getTypeIcon(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  if (['mp4', 'mov', 'webm'].includes(ext)) return <Video size={16} className="text-purple-400" />;
  if (['pdf'].includes(ext)) return <FileText size={16} className="text-red-400" />;
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return <Image size={16} className="text-green-400" />;
  return <File size={16} className="text-gray-400" />;
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Badge({ children, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-100 text-blue-700',
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
    gray:   'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}

const CONDITIONS = ['Frozen Shoulder', 'Lower Back Pain', 'Cervical Pain', 'Knee Pain', 'Hip Pain', 'Ankle Sprain', 'Postural Correction', 'Sports Injury', 'Post-Surgery', 'General'];

// ─────────────────────────────────────────────
// BundleCard — mobile-friendly card layout
// ─────────────────────────────────────────────
function BundleCard({ bundle, onEdit, onDelete, onDuplicate, onSend, readOnly }) {
  return (
    <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
          <Package size={20} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-bold text-white text-sm truncate">{bundle.name}</h3>
            {bundle._isPlatform && <Badge color="purple">Platform</Badge>}
          </div>
          {bundle.condition && <Badge color="blue">{bundle.condition}</Badge>}
        </div>
      </div>

      {bundle.description && (
        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{bundle.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1"><File size={12} /> {bundle.resources?.length || 0} resources</span>
        {bundle.recommendedSessions && <span className="flex items-center gap-1"><Clock size={12} /> {bundle.recommendedSessions} sessions</span>}
      </div>

      {!readOnly && (
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-800">
          <button onClick={onEdit} className="h-11 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95">
            Edit
          </button>
          <button onClick={onSend} className="h-11 rounded-xl bg-green-600/20 hover:bg-green-600/40 text-green-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95">
            <Send size={13} /> Send
          </button>
          <button onClick={onDuplicate} className="h-11 rounded-xl bg-purple-900/20 hover:bg-purple-900/40 text-purple-400 text-xs font-bold flex items-center justify-center transition-all active:scale-95">
            <File size={13} />
          </button>
          <button onClick={onDelete} className="h-11 rounded-xl bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs font-bold flex items-center justify-center transition-all active:scale-95">
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-gray-800/40 rounded-2xl p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-700/50" />
        <div className="flex-1">
          <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-700/30 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-gray-700/30 rounded w-full mb-2" />
      <div className="h-3 bg-gray-700/30 rounded w-2/3" />
    </div>
  );
}

// ─────────────────────────────────────────────
// BundleBuilderModal — full-screen on mobile
// ─────────────────────────────────────────────
function BundleBuilderModal({ bundle, files, onSave, onClose }) {
  const [name, setName] = useState(bundle?.name || '');
  const [description, setDescription] = useState(bundle?.description || '');
  const [condition, setCondition] = useState(bundle?.condition || '');
  const [selectedResources, setSelectedResources] = useState(bundle?.resources || []);
  const [recommendedSessions, setRecommendedSessions] = useState(bundle?.recommendedSessions || 4);
  const [resourceFilter, setResourceFilter] = useState('');

  const filteredFiles = files.filter(f => {
    const q = resourceFilter.toLowerCase();
    if (!q) return true;
    return f.name?.toLowerCase().includes(q) || f.tags?.some(t => t.toLowerCase().includes(q));
  });

  function toggleResource(file) {
    setSelectedResources(prev => {
      const exists = prev.find(r => r.fileId === file.fileId);
      if (exists) return prev.filter(r => r.fileId !== file.fileId);
      return [...prev, { fileId: file.fileId, name: file.name, type: file.type, url: file.url }];
    });
  }

  function isSelected(file) {
    return selectedResources.some(r => r.fileId === file.fileId);
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description.trim(), condition, resources: selectedResources, recommendedSessions });
  }

  return (
    <>
      {/* Desktop overlay */}
      <div className="hidden md:flex fixed inset-0 z-[160] bg-black/70 backdrop-blur-sm items-center justify-center p-4" onClick={onClose}>
        <div
          className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white">{bundle?.id ? 'Edit Bundle' : 'Create Bundle'}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white active:scale-90 transition-transform"><X size={22} /></button>
          </div>
          <BundleBuilderBody
            name={name} setName={setName}
            description={description} setDescription={setDescription}
            condition={condition} setCondition={setCondition}
            selectedResources={selectedResources} setSelectedResources={setSelectedResources}
            recommendedSessions={recommendedSessions} setRecommendedSessions={setRecommendedSessions}
            resourceFilter={resourceFilter} setResourceFilter={setResourceFilter}
            filteredFiles={filteredFiles} files={files}
            toggleResource={toggleResource} isSelected={isSelected}
            onSave={handleSave}
            bundle={bundle}
          />
        </div>
      </div>

      {/* Mobile: full-screen bottom-sheet-like page */}
      <div className="md:hidden fixed inset-0 z-[160] bg-gray-950 flex flex-col">
        {/* Sticky top bar */}
        <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 px-4 py-3 flex items-center gap-3">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 active:scale-90 transition-all" aria-label="Close">
            <X size={22} />
          </button>
          <div className="flex-1">
            <h2 className="font-black text-white text-base">{bundle?.id ? 'Edit Bundle' : 'Create Bundle'}</h2>
          </div>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-bold disabled:opacity-40 active:scale-95 transition-all"
          >
            {bundle?.id ? 'Update' : 'Create'}
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-5 pb-28">
          <BundleBuilderBody
            name={name} setName={setName}
            description={description} setDescription={setDescription}
            condition={condition} setCondition={setCondition}
            selectedResources={selectedResources} setSelectedResources={setSelectedResources}
            recommendedSessions={recommendedSessions} setRecommendedSessions={setRecommendedSessions}
            resourceFilter={resourceFilter} setResourceFilter={setResourceFilter}
            filteredFiles={filteredFiles} files={files}
            toggleResource={toggleResource} isSelected={isSelected}
            onSave={handleSave}
            bundle={bundle}
            mobile
          />
        </div>

        {/* Fixed bottom CTA */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 px-4 py-4 safe-bottom">
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full h-14 rounded-2xl bg-blue-600 text-white font-black text-base disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            {bundle?.id ? 'Update Bundle' : 'Create Bundle'}
          </button>
        </div>
      </div>
    </>
  );
}

// Shared body content (used by both mobile full-screen and desktop overlay)
function BundleBuilderBody({
  name, setName,
  description, setDescription,
  condition, setCondition,
  selectedResources, setSelectedResources,
  recommendedSessions, setRecommendedSessions,
  resourceFilter, setResourceFilter,
  filteredFiles, files,
  toggleResource, isSelected,
  onSave,
  bundle,
  mobile,
}) {
  const inputCls = `w-full min-h-[48px] bg-gray-800 border border-gray-700 rounded-xl px-4 text-white font-medium outline-none focus:border-blue-500/70 transition-colors ${mobile ? 'text-base' : 'h-12 text-sm'}`;
  const labelCls = `text-xs font-black uppercase text-gray-500 mb-2 block`;
  const sectionCls = mobile ? 'space-y-4' : 'space-y-5';

  return (
    <div className={sectionCls}>
      <div>
        <label className={labelCls}>Bundle Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Shoulder Rehab Program" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this bundle..." rows={3} className={`${inputCls} resize-none py-3`} />
      </div>

      <div className={mobile ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-4'}>
        <div>
          <label className={labelCls}>Condition</label>
          <select value={condition} onChange={e => setCondition(e.target.value)} className={inputCls}>
            <option value="">Select condition</option>
            {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Recommended Sessions</label>
          <input type="number" min={1} max={52} value={recommendedSessions} onChange={e => setRecommendedSessions(parseInt(e.target.value) || 4)} className={inputCls} />
        </div>
      </div>

      {/* Selected Resources */}
      {selectedResources.length > 0 && (
        <div>
          <label className={labelCls}>Selected ({selectedResources.length})</label>
          <div className="bg-gray-800 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1">
            {selectedResources.map(r => (
              <div key={r.fileId} className="flex items-center gap-2 py-2 px-2 rounded-lg bg-gray-750">
                <span className="text-gray-400 shrink-0">{getFileIcon(r.type)}</span>
                <span className="flex-1 text-sm text-gray-200 truncate">{r.name}</span>
                <button
                  onClick={() => setSelectedResources(prev => prev.filter(x => x.fileId !== r.fileId))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-900/30 active:scale-90 transition-all shrink-0"
                  aria-label="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resource Picker */}
      <div>
        <label className={labelCls}>Add Resources</label>
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={resourceFilter}
            onChange={e => setResourceFilter(e.target.value)}
            placeholder="Filter resources..."
            className={`${inputCls} pl-10`}
          />
        </div>
        <div className="bg-gray-800 rounded-xl p-2 max-h-56 overflow-y-auto space-y-1">
          {filteredFiles.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No resources found</p>
          ) : (
            filteredFiles.map(f => (
              <div
                key={f.fileId}
                onClick={() => toggleResource(f)}
                className={`flex items-center gap-3 py-3 px-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
                  isSelected(f) ? 'bg-blue-500/20 border border-blue-500/40' : 'hover:bg-gray-700'
                }`}
              >
                <input type="checkbox" checked={isSelected(f)} onChange={() => toggleResource(f)} className="w-5 h-5 rounded accent-blue-500 shrink-0 pointer-events-none" tabIndex={-1} />
                <span className="text-gray-400 shrink-0">{getFileIcon(f.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{f.name}</p>
                  <p className="text-[11px] text-gray-500">{f.type}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Desktop-only save button (mobile has fixed bottom bar) */}
      {!mobile && (
        <Button onClick={onSave} disabled={!name.trim()} className="w-full h-14 rounded-2xl font-black mt-1">
          {bundle?.id ? 'Update Bundle' : 'Create Bundle'}
        </Button>
      )}
    </div>
  );
}

export default function ResourceLibrary({ isEmbedded }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [clinicId, setClinicId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Auto view: grid on mobile, list on desktop
  const [viewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 ? 'list' : 'grid';
    }
    return 'grid';
  });
  const [files, setFiles] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [toast, setToast] = useState(null);

  // Bundle state
  const [bundles, setBundles] = useState([]);
  const [showBundleBuilder, setShowBundleBuilder] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [showSendBundleModal, setShowSendBundleModal] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [platformBundles, setPlatformBundles] = useState([]);

  // Upload form state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState('exercises');
  const [uploadName, setUploadName] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadBodyPart, setUploadBodyPart] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Send form state
  const [sendMessage, setSendMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Auth + clinic lookup
  useEffect(() => {
    const unsub = onAuth(async (u) => {
      if (!u) { navigate('/dashboard-login'); return; }
      setUser(u);
      if (db) {
        const snap = await getDocs(query(collection(db, 'clinics'), where('uid', '==', u.uid)));
        if (!snap.empty) setClinicId(snap.docs[0].id);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Fetch files
  const fetchFiles = useCallback(async () => {
    if (!clinicId) return;
    try {
      const res = await fetch(`${API_STORAGE}/files/${clinicId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const all = Array.isArray(data) ? data : (Array.isArray(data.files) ? data.files : []);
      setAllFiles(all);
      if (activeTab === 'bundles') {
        setFiles([]);
      } else if (activeTab === 'all') {
        setFiles(all);
      } else {
        setFiles(all.filter(f => f.type === activeTab));
      }
    } catch (err) {
      console.error('Fetch files error:', err);
      setFiles([]);
      setAllFiles([]);
    }
  }, [clinicId]);

  useEffect(() => {
    if (allFiles.length === 0) return;
    if (activeTab === 'bundles') {
      setFiles([]);
    } else if (activeTab === 'all') {
      setFiles(allFiles);
    } else {
      setFiles(allFiles.filter(f => f.type === activeTab));
    }
  }, [activeTab, allFiles]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  // Fetch bundles
  const fetchBundles = useCallback(async () => {
    if (!clinicId) return;
    try {
      const [clinicRes, platformRes] = await Promise.all([
        fetch(`${API_STORAGE}/bundles/${clinicId}`),
        fetch(`${API_STORAGE}/bundles/platform`),
      ]);
      const clinicBundles = clinicRes.ok ? await clinicRes.json() : [];
      const platformData = platformRes.ok ? await platformRes.json() : [];
      setBundles(clinicBundles.map(b => ({ ...b, _isPlatform: false })));
      setPlatformBundles(platformData.map(b => ({ ...b, _isPlatform: true })));
    } catch (err) {
      console.error('Fetch bundles error:', err);
    }
  }, [clinicId]);

  useEffect(() => { fetchBundles(); }, [fetchBundles]);

  // Fetch patients for send modal
  const fetchPatients = useCallback(async () => {
    if (!clinicId || !db) return;
    try {
      const snap = await getDocs(query(collection(db, 'patients'), where('physioId', '==', user?.uid)));
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Fetch patients error:', err);
    }
  }, [clinicId, user]);

  useEffect(() => {
    if (showSendModal) fetchPatients();
  }, [showSendModal, fetchPatients]);

  // Toast helper
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // File upload handler
  async function handleUpload() {
    if (!uploadFile || !clinicId) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('clinicId', clinicId);
      formData.append('type', uploadType);
      formData.append('name', uploadName || uploadFile.name);
      formData.append('tags', uploadTags);
      if (uploadBodyPart) formData.append('bodyPart', uploadBodyPart);
      formData.append('file', uploadFile);
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      });
      const result = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.open('POST', `${API_STORAGE}/upload`);
        xhr.send(formData);
      });
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadName('');
      setUploadTags('');
      setUploadBodyPart('');
      showToast('File uploaded successfully!');
      fetchFiles();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleDelete(fileId) {
    if (!confirm('Delete this file?')) return;
    try {
      const res = await fetch(`${API_STORAGE}/files/${clinicId}/${fileId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      showToast('File deleted');
      fetchFiles();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleSaveBundle(bundleData) {
    try {
      if (editingBundle?.id) {
        await fetch(`${API_STORAGE}/bundles/${clinicId}/${editingBundle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bundleData),
        });
        showToast('Bundle updated');
      } else {
        await fetch(`${API_STORAGE}/bundles/${clinicId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bundleData),
        });
        showToast('Bundle created');
      }
      setShowBundleBuilder(false);
      setEditingBundle(null);
      fetchBundles();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDeleteBundle(bundleId) {
    if (!confirm('Delete this bundle?')) return;
    try {
      await fetch(`${API_STORAGE}/bundles/${clinicId}/${bundleId}`, { method: 'DELETE' });
      showToast('Bundle deleted');
      fetchBundles();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDuplicateBundle(bundle) {
    try {
      const { name, description, condition, resources, recommendedSessions } = bundle;
      await fetch(`${API_STORAGE}/bundles/${clinicId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${name} (Copy)`,
          description, condition,
          resources: resources || [],
          recommendedSessions: recommendedSessions || 4,
        }),
      });
      showToast('Bundle duplicated');
      fetchBundles();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleSendBundle() {
    if (!selectedBundle || !selectedPatient) return;
    setSending(true);
    try {
      const patientName = selectedPatient?.name || 'Patient';
      const resourceList = (selectedBundle.resources || []).map(r => `• ${r.name} (${r.type}): ${r.url}`).join('\n');
      const msg = `Hi ${patientName},\n\nHere's your rehab bundle: "${selectedBundle.name}"\n\nResources:\n${resourceList}\n\nRegards,\nYour Physio`;
      const waLink = `https://wa.me/${selectedPatient?.phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(msg)}`;
      window.open(waLink, '_blank');
      setShowSendBundleModal(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  }

  async function handleSend() {
    if (!selectedFile) return;
    setSending(true);
    try {
      const link = selectedFile.url;
      const patientName = selectedPatient?.name || 'Patient';
      const msg = `Hi ${patientName},\n\nHere's the resource your physio shared with you:\n${link}\n\nRegards,\nYour Physio`;
      const waLink = `https://wa.me/${selectedPatient?.phone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(msg)}`;
      window.open(waLink, '_blank');
      setShowSendModal(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  }

  function detectType(filename) {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    if (['mp4', 'mov', 'webm'].includes(ext)) return 'recordings';
    if (['pdf'].includes(ext)) return 'forms';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return 'education';
    return 'documents';
  }

  const filtered = (activeTab === 'all' ? allFiles : files).filter(f => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return f.name?.toLowerCase().includes(q) || f.tags?.some(t => t.toLowerCase().includes(q));
  });

  if (loading) {
    return (
      <div className={isEmbedded ? "py-20 flex items-center justify-center" : "min-h-screen bg-gray-950 flex items-center justify-center"}>
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
      </div>
    );
  }

  const totalBundles = bundles.length + platformBundles.length;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className={isEmbedded ? "" : "min-h-screen bg-gray-950 text-white"}>
      {/* ── Toast ─────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-[200] px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 duration-300 ${
          toast.type === 'error' ? 'bg-red-900/90 border border-red-700 text-red-200' : 'bg-green-900/90 border border-green-700 text-green-200'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span className="flex-1">{toast.msg}</span>
        </div>
      )}

      {/* ── Page wrapper with sticky header ───────── */}
      <div className="max-w-7xl mx-auto">
        {/* Sticky header */}
        {!isEmbedded ? (
          <div className="sticky top-0 z-30 bg-gray-950/95 backdrop-blur-md border-b border-gray-800 px-4 py-3">
              {/* Row 1: Title + desktop upload button */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-2xl font-black text-white leading-tight">Resource Library</h1>
                  <p className="text-xs sm:text-sm text-gray-400 font-medium">
                    {allFiles.length} file{allFiles.length !== 1 ? 's' : ''}
                    {totalBundles > 0 && ` · ${totalBundles} bundle${totalBundles !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <Button onClick={() => setShowUploadModal(true)} className="hidden sm:flex h-11 px-5 rounded-xl shadow-lg">
                  <Upload size={15} className="mr-2" /> Upload
                </Button>
              </div>

              {/* Row 2: Search */}
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or tag..."
                  className="w-full h-11 pl-11 pr-4 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm font-medium outline-none focus:border-blue-500/70 transition-colors placeholder:text-gray-600"
                />
              </div>
          </div>
        ) : (
          <div className="px-4 py-6 border-b border-gray-800/40">
             {/* Search only when embedded, no title */}
             <div className="relative max-w-2xl">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or tag..."
                  className="w-full h-11 pl-11 pr-4 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium outline-none focus:border-[#14A3A8]/70 transition-colors"
                />
              </div>
          </div>
        )}

        {/* ── Tabs — horizontal scroll ──────────────── */}
        <div className={`${isEmbedded ? "" : "sticky top-[88px] sm:top-[97px]"} z-20 bg-gray-950/95 backdrop-blur-md border-b border-gray-800/60`}>
          <div className="flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const count = tab.key === 'all'
                ? allFiles.length
                : tab.key === 'bundles'
                  ? totalBundles
                  : allFiles.filter(f => f.type === tab.key).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all shrink-0 min-h-[44px] active:scale-95 ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden xs:inline">{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                    activeTab === tab.key ? 'bg-blue-500/30' : 'bg-gray-800'
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main content ──────────────────────────── */}
        <div className="px-4 py-5 pb-28 sm:pb-10">

          {/* ── Bundles tab ────────────────────────── */}
          {activeTab === 'bundles' && (
            <div>
              {/* Mobile: stacked header + create button */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-black text-white">Your Bundles</h2>
                <Button
                  onClick={() => { setEditingBundle(null); setShowBundleBuilder(true); }}
                  className="h-11 px-5 rounded-xl text-sm font-bold shadow-lg"
                >
                  <Plus size={15} className="mr-1.5" /> New Bundle
                </Button>
              </div>

              {bundles.length === 0 && platformBundles.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-900 flex items-center justify-center">
                    <Package size={32} className="text-gray-700" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-400 mb-2">No bundles yet</h3>
                  <p className="text-gray-600 text-sm mb-6">Group resources for easy sharing</p>
                  <Button onClick={() => { setEditingBundle(null); setShowBundleBuilder(true); }} className="h-12 px-6 rounded-2xl text-sm font-bold">
                    <Plus size={15} className="mr-1.5" /> Create Bundle
                  </Button>
                </div>
              ) : (
                <>
                  {bundles.length > 0 && (
                    <div className="space-y-3 mb-6">
                      {bundles.map(bundle => (
                        <BundleCard
                          key={bundle.id}
                          bundle={bundle}
                          onEdit={() => { setEditingBundle(bundle); setShowBundleBuilder(true); }}
                          onDelete={() => handleDeleteBundle(bundle.id)}
                          onDuplicate={() => handleDuplicateBundle(bundle)}
                          onSend={() => { setSelectedBundle(bundle); setShowSendBundleModal(true); }}
                        />
                      ))}
                    </div>
                  )}

                  {platformBundles.length > 0 && (
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-4">Platform Bundles</h2>
                      <div className="space-y-3">
                        {platformBundles.map(bundle => (
                          <BundleCard key={bundle.id} bundle={bundle} readOnly />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── File grid / list ───────────────────── */}
          {activeTab !== 'bundles' && (
            <>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-900 flex items-center justify-center">
                    <FolderOpen size={32} className="text-gray-700" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-400 mb-2">No files yet</h3>
                  <p className="text-gray-600 text-sm mb-6">
                    {activeTab === 'all' ? 'Upload your first resource' : `No ${activeTab} files`}
                  </p>
                  <Button onClick={() => setShowUploadModal(true)} className="h-12 px-6 rounded-2xl text-sm font-bold">
                    <Plus size={15} className="mr-1.5" /> Upload
                  </Button>
                </div>
              ) : viewMode === 'list' ? (
                /* Desktop list view */
                <div className="hidden md:block bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
                  {/* List header */}
                  <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-gray-800 text-[10px] font-black uppercase tracking-wider text-gray-500">
                    <div className="col-span-5">Name</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Size</div>
                    <div className="col-span-2">Modified</div>
                    <div className="col-span-1"></div>
                  </div>
                  {filtered.map(file => (
                    <div key={file.fileId} className="grid grid-cols-12 gap-4 px-5 py-3 items-center border-b border-gray-800/50 hover:bg-gray-800/40 transition-all group">
                      <div className="col-span-5 flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                          {getFileIcon(file.type)}
                        </div>
                        <span className="text-sm font-medium text-white truncate">{file.name}</span>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <Badge color="blue">{file.type}</Badge>
                      </div>
                      <div className="col-span-2 text-xs text-gray-500">{formatBytes(file.size)}</div>
                      <div className="col-span-2 text-xs text-gray-500">{formatDate(file.uploadedAt)}</div>
                      <div className="col-span-1 flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-all" title="View"><Download size={14} /></a>
                        <button onClick={() => { setSelectedFile(file); setShowSendModal(true); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 text-gray-400 hover:text-green-400 transition-all" title="Send"><Send size={14} /></button>
                        <button onClick={() => handleDelete(file.fileId)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-all" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Grid/card view (mobile-first) */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filtered.map(file => (
                    <div key={file.fileId} className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-all">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center shrink-0">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-sm truncate leading-tight">{file.name}</h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <Badge color="blue">{file.type}</Badge>
                            {file.bodyPart && <Badge color="purple">{file.bodyPart}</Badge>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1"><HardDrive size={11} /> {formatBytes(file.size)}</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(file.uploadedAt)}</span>
                      </div>

                      {file.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {file.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-800 rounded-md text-[10px] text-gray-400 font-medium">#{tag}</span>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-800">
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="h-11 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95">
                          <Download size={13} />
                        </a>
                        <button
                          onClick={() => { setSelectedFile(file); setShowSendModal(true); }}
                          className="h-11 rounded-xl bg-green-600/20 hover:bg-green-600/40 text-green-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                          <Send size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(file.fileId)}
                          className="h-11 rounded-xl bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs font-bold flex items-center justify-center transition-all active:scale-95"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Mobile FAB — Upload ───────────────────── */}
        <button
          onClick={() => setShowUploadModal(true)}
          className="sm:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-2xl shadow-blue-600/50 flex items-center justify-center active:scale-90 transition-all"
          aria-label="Upload file"
        >
          <Plus size={26} />
        </button>
      </div>

      {/* ════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════ */}

      {/* ── Upload Modal ───────────────────────────── */}
      {showUploadModal && (
        <>
          {/* Desktop centered modal */}
          <div className="hidden sm:flex fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm items-center justify-center p-4" onClick={() => !uploading && setShowUploadModal(false)}>
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white">Upload Resource</h2>
                {!uploading && <button onClick={() => setShowUploadModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>}
              </div>
              <UploadForm
                uploadFile={uploadFile} setUploadFile={setUploadFile}
                uploadType={uploadType} setUploadType={setUploadType}
                uploadName={uploadName} setUploadName={setUploadName}
                uploadTags={uploadTags} setUploadTags={setUploadTags}
                uploadBodyPart={uploadBodyPart} setUploadBodyPart={setUploadBodyPart}
                dragOver={dragOver} setDragOver={setDragOver}
                uploading={uploading} uploadProgress={uploadProgress}
                handleUpload={handleUpload}
                detectType={detectType}
              />
            </div>
          </div>

          {/* Mobile bottom-sheet */}
          <div className="sm:hidden fixed inset-0 z-[150] flex flex-col" onClick={() => !uploading && setShowUploadModal(false)}>
            {/* Backdrop */}
            <div className="flex-1 bg-black/70 backdrop-blur-sm" />
            {/* Sheet */}
            <div className="bg-gray-900 border-t border-gray-800 rounded-t-3xl" onClick={e => e.stopPropagation()}>
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-gray-700" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-4">
                <h2 className="text-lg font-black text-white">Upload Resource</h2>
                {!uploading && (
                  <button onClick={() => setShowUploadModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 active:scale-90 transition-all" aria-label="Close">
                    <X size={20} />
                  </button>
                )}
              </div>
              {/* Form */}
              <div className="px-5 pb-8 max-h-[75vh] overflow-y-auto">
                <UploadForm
                  uploadFile={uploadFile} setUploadFile={setUploadFile}
                  uploadType={uploadType} setUploadType={setUploadType}
                  uploadName={uploadName} setUploadName={setUploadName}
                  uploadTags={uploadTags} setUploadTags={setUploadTags}
                  uploadBodyPart={uploadBodyPart} setUploadBodyPart={setUploadBodyPart}
                  dragOver={dragOver} setDragOver={setDragOver}
                  uploading={uploading} uploadProgress={uploadProgress}
                  handleUpload={handleUpload}
                  detectType={detectType}
                  mobile
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Send to Patient Modal ──────────────────── */}
      {showSendModal && selectedFile && (
        <>
          <div className="hidden sm:flex fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm items-center justify-center p-4" onClick={() => !sending && setShowSendModal(false)}>
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white">Send to Patient</h2>
                {!sending && <button onClick={() => setShowSendModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>}
              </div>
              <SendForm
                selectedFile={selectedFile}
                patients={patients} selectedPatient={selectedPatient} setSelectedPatient={setSelectedPatient}
                sendMessage={sendMessage} setSendMessage={setSendMessage}
                sending={sending} handleSend={handleSend}
              />
            </div>
          </div>

          {/* Mobile bottom-sheet */}
          <div className="sm:hidden fixed inset-0 z-[150] flex flex-col" onClick={() => !sending && setShowSendModal(false)}>
            <div className="flex-1 bg-black/70 backdrop-blur-sm" />
            <div className="bg-gray-900 border-t border-gray-800 rounded-t-3xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-gray-700" /></div>
              <div className="flex items-center justify-between px-5 pb-4">
                <h2 className="text-lg font-black text-white">Send to Patient</h2>
                {!sending && (
                  <button onClick={() => setShowSendModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 active:scale-90 transition-all" aria-label="Close">
                    <X size={20} />
                  </button>
                )}
              </div>
              <div className="px-5 pb-8">
                <SendForm
                  selectedFile={selectedFile}
                  patients={patients} selectedPatient={selectedPatient} setSelectedPatient={setSelectedPatient}
                  sendMessage={sendMessage} setSendMessage={setSendMessage}
                  sending={sending} handleSend={handleSend}
                  mobile
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Bundle Builder Modal ───────────────────── */}
      {showBundleBuilder && (
        <BundleBuilderModal
          bundle={editingBundle}
          files={allFiles}
          onSave={handleSaveBundle}
          onClose={() => { setShowBundleBuilder(false); setEditingBundle(null); }}
        />
      )}

      {/* ── Send Bundle to Patient Modal ──────────── */}
      {showSendBundleModal && selectedBundle && (
        <>
          <div className="hidden sm:flex fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm items-center justify-center p-4" onClick={() => !sending && setShowSendBundleModal(false)}>
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white">Send Bundle to Patient</h2>
                {!sending && <button onClick={() => setShowSendBundleModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>}
              </div>
              <SendBundleForm
                selectedBundle={selectedBundle}
                patients={patients} selectedPatient={selectedPatient} setSelectedPatient={setSelectedPatient}
                sending={sending} handleSendBundle={handleSendBundle}
              />
            </div>
          </div>

          {/* Mobile bottom-sheet */}
          <div className="sm:hidden fixed inset-0 z-[150] flex flex-col" onClick={() => !sending && setShowSendBundleModal(false)}>
            <div className="flex-1 bg-black/70 backdrop-blur-sm" />
            <div className="bg-gray-900 border-t border-gray-800 rounded-t-3xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-gray-700" /></div>
              <div className="flex items-center justify-between px-5 pb-4">
                <h2 className="text-lg font-black text-white">Send Bundle to Patient</h2>
                {!sending && (
                  <button onClick={() => setShowSendBundleModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 active:scale-90 transition-all" aria-label="Close">
                    <X size={20} />
                  </button>
                )}
              </div>
              <div className="px-5 pb-8">
                <SendBundleForm
                  selectedBundle={selectedBundle}
                  patients={patients} selectedPatient={selectedPatient} setSelectedPatient={setSelectedPatient}
                  sending={sending} handleSendBundle={handleSendBundle}
                  mobile
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// UploadForm — shared by desktop + mobile
// ─────────────────────────────────────────────
function UploadForm({ uploadFile, setUploadFile, uploadType, setUploadType, uploadName, setUploadName, uploadTags, setUploadTags, uploadBodyPart, setUploadBodyPart, dragOver, setDragOver, uploading, uploadProgress, handleUpload, detectType, mobile }) {
  const fileInputRef = React.useRef(null);
  const inputCls = `w-full min-h-[48px] bg-gray-800 border border-gray-700 rounded-xl px-4 text-white font-medium outline-none focus:border-blue-500/70 transition-colors ${mobile ? 'text-base' : 'text-sm'}`;
  const labelCls = `text-xs font-black uppercase text-gray-500 mb-2 block`;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer ${
          dragOver ? 'border-blue-500 bg-blue-500/5' : 'border-gray-700 hover:border-gray-600'
        }`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) {
            setUploadFile(file);
            setUploadName(file.name.replace(/\.[^.]+$/, ''));
            setUploadType(detectType(file.name));
          }
        }}
        onClick={() => !uploadFile && fileInputRef.current?.click()}
      >
        {uploadFile ? (
          <div>
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              {getTypeIcon(uploadFile.name)}
            </div>
            <p className="font-bold text-white text-sm mb-1">{uploadFile.name}</p>
            <p className="text-gray-500 text-xs mb-3">{formatBytes(uploadFile.size)}</p>
            <button onClick={(e) => { e.stopPropagation(); setUploadFile(null); }} className="text-red-400 text-sm font-bold active:scale-90 transition-transform">Remove</button>
          </div>
        ) : (
          <div>
            <Upload size={30} className="text-gray-600 mx-auto mb-3" />
            <p className="font-bold text-gray-400 mb-1 text-sm">Drag & drop or click to browse</p>
            <p className="text-gray-600 text-xs mb-4">Videos (500MB), PDFs (50MB), Images (10MB)</p>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={e => {
                const file = e.target.files[0];
                if (file) {
                  setUploadFile(file);
                  setUploadName(file.name.replace(/\.[^.]+$/, ''));
                  setUploadType(detectType(file.name));
                }
              }} 
            />
            <div className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] rounded-xl bg-blue-600 text-white text-sm font-bold active:scale-[0.98] transition-all">
              Browse Files
            </div>
          </div>
        )}
      </div>

      {uploadFile && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Name</label>
              <input value={uploadName} onChange={e => setUploadName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select value={uploadType} onChange={e => setUploadType(e.target.value)} className={inputCls}>
                {Object.keys(TYPE_LIMITS).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Tags (comma-separated)</label>
            <input value={uploadTags} onChange={e => setUploadTags(e.target.value)} placeholder="rehab, shoulder, mobility" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Body Part (optional)</label>
            <select value={uploadBodyPart} onChange={e => setUploadBodyPart(e.target.value)} className={inputCls}>
              <option value="">Select body part</option>
              {BODY_PARTS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </>
      )}

      {uploading && (
        <div>
          <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
            <span>Uploading...</span><span>{uploadProgress}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      <Button onClick={handleUpload} disabled={!uploadFile || uploading} className="w-full h-14 rounded-2xl font-black">
        {uploading ? <><Loader2 size={18} className="mr-2 animate-spin" /> Uploading... {uploadProgress}%</> : 'Upload'}
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────
// SendForm — shared
// ─────────────────────────────────────────────
function SendForm({ selectedFile, patients, selectedPatient, setSelectedPatient, sendMessage, setSendMessage, sending, handleSend, mobile }) {
  const inputCls = `w-full min-h-[48px] bg-gray-800 border border-gray-700 rounded-xl px-4 text-white font-medium outline-none focus:border-blue-500/70 transition-colors ${mobile ? 'text-base' : 'text-sm'}`;
  const labelCls = `text-xs font-black uppercase text-gray-500 mb-2 block`;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-800 rounded-xl">
        <p className="text-xs text-gray-400 uppercase font-black mb-1">File</p>
        <p className="font-bold text-white text-sm">{selectedFile.name}</p>
      </div>

      <div>
        <label className={labelCls}>Patient</label>
        <select
          onChange={e => {
            const p = patients.find(x => x.id === e.target.value);
            setSelectedPatient(p || null);
          }}
          className={inputCls}
        >
          <option value="">Select patient</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name} {p.phone ? `(${p.phone})` : ''}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Message Preview</label>
        <textarea
          value={sendMessage || `Hi ${selectedPatient?.name || 'Patient'},\n\nHere's the resource your physio shared with you:\n${selectedFile?.url || ''}\n\nRegards,\nYour Physio`}
          onChange={e => setSendMessage(e.target.value)}
          rows={5}
          className={`w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm font-medium outline-none resize-none focus:border-blue-500/70 transition-colors ${mobile ? 'text-base' : 'text-sm'}`}
        />
      </div>

      <Button onClick={handleSend} disabled={sending} className="w-full h-14 rounded-2xl font-black bg-green-600">
        {sending ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Send size={16} className="mr-2" />}
        Open WhatsApp
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────
// SendBundleForm — shared
// ─────────────────────────────────────────────
function SendBundleForm({ selectedBundle, patients, selectedPatient, setSelectedPatient, sending, handleSendBundle, mobile }) {
  const inputCls = `w-full min-h-[48px] bg-gray-800 border border-gray-700 rounded-xl px-4 text-white font-medium outline-none focus:border-blue-500/70 transition-colors ${mobile ? 'text-base' : 'text-sm'}`;
  const labelCls = `text-xs font-black uppercase text-gray-500 mb-2 block`;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-800 rounded-xl">
        <p className="text-xs text-gray-400 uppercase font-black mb-1">Bundle</p>
        <p className="font-bold text-white text-sm">{selectedBundle.name}</p>
        <p className="text-xs text-gray-500 mt-1">{selectedBundle.resources?.length || 0} resources</p>
      </div>

      <div>
        <label className={labelCls}>Patient</label>
        <select
          onChange={e => {
            const p = patients.find(x => x.id === e.target.value);
            setSelectedPatient(p || null);
          }}
          className={inputCls}
        >
          <option value="">Select patient</option>
          {patients.map(p => <option key={p.id} value={p.id}>{p.name} {p.phone ? `(${p.phone})` : ''}</option>)}
        </select>
      </div>

      <div className="p-4 bg-gray-800 rounded-xl max-h-48 overflow-y-auto">
        <p className="text-xs text-gray-400 uppercase font-black mb-2">Resources in Bundle</p>
        {(selectedBundle.resources || []).map((r, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5">
            <span className="text-gray-400 shrink-0">{getFileIcon(r.type)}</span>
            <span className="text-sm text-gray-300 truncate">{r.name}</span>
          </div>
        ))}
      </div>

      <Button onClick={handleSendBundle} disabled={sending} className="w-full h-14 rounded-2xl font-black bg-green-600">
        {sending ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Send size={16} className="mr-2" />}
        Open WhatsApp
      </Button>
    </div>
  );
}


