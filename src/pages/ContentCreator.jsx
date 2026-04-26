import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { onAuth } from '@/firebase/auth';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  Loader2, Plus, Trash2, Download, Eye, Save, X, ChevronDown,
  ChevronRight, GripVertical, Bold, AlignLeft, AlignCenter, AlignRight,
  Image, FileText, ToggleLeft, ToggleRight, Upload,
  CheckCircle2, AlertCircle, RefreshCw, ExternalLink, BookOpen,
  LayoutTemplate, Video, FileDown, Layers, SaveAll, EyeOff, BarChart2, LayoutGrid,
  UserCheck, Minus, Activity, Settings, MousePointer2, Monitor, Smartphone, Square, Circle, Info, Type, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';

import { API_BASE } from '@/utils/api';
const API_STORAGE = `${API_BASE}/api/storage`;

// ---─ Luxe Midnight Design Tokens (premium iOS) ------------------------------------------------------------------------------------------
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

// ── Block types ──────────────────────────────────────────────────────────────
const BLOCK_TYPES = {
  clinicHeader:   { label: 'Clinic Header',   icon: FileText },
  patientInfo:    { label: 'Patient Info',     icon: UserCheck },
  textBlock:      { label: 'Text Block',       icon: AlignLeft },
  imageBlock:     { label: 'Image',             icon: Image },
  vasScale:       { label: 'VAS Scale',         icon: Activity },
  exerciseTable:  { label: 'Exercise Table',   icon: LayoutGrid },
  sessionNotes:   { label: 'Session Notes',     icon: FileText },
  divider:        { label: 'Divider',           icon: Minus },
  customTable:    { label: 'Custom Table',      icon: LayoutGrid },
  progressChart:  { label: 'Progress Chart',    icon: BarChart2 },
};

const TEMPLATES = [
  { key: 'exerciseSheet', label: 'Exercise Sheet', preview: '🏋️', blocks: ['clinicHeader','patientInfo','textBlock','exerciseTable','divider','sessionNotes'] },
  { key: 'education', label: 'Education Handout', preview: '📋', blocks: ['clinicHeader','patientInfo','textBlock','textBlock','divider'] },
  { key: 'progressReport', label: 'Progress Report', preview: '📊', blocks: ['clinicHeader','patientInfo','vasScale','textBlock','sessionNotes'] },
  { key: 'homeProgram', label: 'Home Program', preview: '🏠', blocks: ['clinicHeader','patientInfo','exerciseTable','textBlock','sessionNotes'] },
];

const BODY_PARTS = ['neck', 'shoulder', 'back', 'knee', 'ankle', 'hip', 'wrist', 'general'];
const FONT_SIZES = { sm: 12, md: 16, lg: 22 };
const ALIGNMENTS = { left: 'text-left', center: 'text-center', right: 'text-right' };

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── Block components ─────────────────────────────────────────────────────────

function TextBlock({ block, selected, onSelect, onUpdate }) {
  const [editing, setEditing] = useState(false);
  return (
    <div 
      className={`p-6 rounded-2xl border transition-all ${selected ? 'border-[#0ea5e9] bg-[#0ea5e9]/5' : 'border-white/5 bg-white/3'}`}
      onClick={() => onSelect(block.id)}
    >
      {editing ? (
        <textarea
          value={block.data?.content || ''}
          onChange={e => onUpdate(block.id, { data: { ...block.data, content: e.target.value } })}
          onBlur={() => setEditing(false)}
          autoFocus
          className="w-full bg-white/5 text-white font-bold resize-none outline-none border border-white/10 rounded-xl p-4 focus:border-[#0ea5e9]"
          rows={4}
          placeholder="Type your notes here..."
        />
      ) : (
        <div
          className={`font-bold min-h-[60px] cursor-text ${ALIGNMENTS[block.data?.align] || 'text-left'} text-white`}
          style={{ fontSize: FONT_SIZES[block.data?.size] || 16, lineHeight: 1.6 }}
          onDoubleClick={() => setEditing(true)}
        >
          {block.data?.content || <span className="text-white/20 italic font-medium">Double-click to start typing...</span>}
        </div>
      )}
      {selected && (
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
          <div className="flex gap-1">
            {['sm','md','lg'].map(s => (
              <button key={s} onClick={e => { e.stopPropagation(); onUpdate(block.id, { data: { ...block.data, size: s } }); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${block.data?.size === s ? 'bg-[#0ea5e9] text-white shadow-lg shadow-[#0ea5e9]/20' : 'bg-white/5 text-white/40 hover:text-white'}`}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex gap-1">
            <button onClick={e => { e.stopPropagation(); onUpdate(block.id, { data: { ...block.data, align: 'left' } }); }}
              className={`p-2 rounded-lg transition-all ${block.data?.align === 'left' ? 'bg-[#0ea5e9]/20 text-[#0ea5e9]' : 'text-white/40 hover:text-white'}`}><AlignLeft size={16} /></button>
            <button onClick={e => { e.stopPropagation(); onUpdate(block.id, { data: { ...block.data, align: 'center' } }); }}
              className={`p-2 rounded-lg transition-all ${block.data?.align === 'center' ? 'bg-[#0ea5e9]/20 text-[#0ea5e9]' : 'text-white/40 hover:text-white'}`}><AlignCenter size={16} /></button>
            <button onClick={e => { e.stopPropagation(); onUpdate(block.id, { data: { ...block.data, align: 'right' } }); }}
              className={`p-2 rounded-lg transition-all ${block.data?.align === 'right' ? 'bg-[#0ea5e9]/20 text-[#0ea5e9]' : 'text-white/40 hover:text-white'}`}><AlignRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseTableBlock({ block, selected, onSelect, onUpdate }) {
  const rows = block.data?.rows || [{ exercise: '', sets: 3, reps: 10, frequency: 'daily', notes: '' }];

  const updateRow = (i, field, val) => {
    const newRows = [...rows];
    newRows[i] = { ...newRows[i], [field]: val };
    onUpdate(block.id, { data: { ...block.data, rows: newRows } });
  };

  const addRow = () => {
    onUpdate(block.id, { data: { ...block.data, rows: [...rows, { exercise: '', sets: 3, reps: 10, frequency: 'daily', notes: '' }] } });
  };

  const removeRow = (i) => {
    onUpdate(block.id, { data: { ...block.data, rows: rows.filter((_, idx) => idx !== i) } });
  };

  return (
    <div 
      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${selected ? 'ring-2 ring-[#0ea5e9] shadow-2xl' : 'border-white/5 bg-white/3'}`}
      onClick={() => onSelect(block.id)}
    >
      <div className="bg-white/3 px-8 py-4 border-b border-white/5 flex justify-between items-center">
        <h3 className="text-[10px] font-black text-[#0ea5e9] uppercase tracking-[0.3em]">Prescribed Exercise Protocol</h3>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500/40" />
          <div className="w-2 h-2 rounded-full bg-blue-500/40" />
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-slate-900 shadow-sm">
            <th className="px-8 py-4 text-left text-[9px] font-black text-white/20 uppercase tracking-widest border-b border-white/5">Exercise Detail</th>
            <th className="px-4 py-4 text-center text-[9px] font-black text-white/20 uppercase tracking-widest border-b border-white/5">Volume</th>
            <th className="px-4 py-4 text-center text-[9px] font-black text-white/20 uppercase tracking-widest border-b border-white/5">Freq</th>
            <th className="p-4 border-b border-white/5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, i) => (
            <tr key={i} className="group/row hover:bg-[#0ea5e9]/5 transition-colors">
              <td className="px-8 py-6">
                <input 
                  value={row.exercise} onChange={e => updateRow(i, 'exercise', e.target.value)} 
                  className="w-full bg-transparent text-sm font-black text-white outline-none placeholder:text-white/5" 
                  placeholder="e.g. Scapular Retractions" 
                />
                <input 
                  value={row.notes} onChange={e => updateRow(i, 'notes', e.target.value)} 
                  className="w-full bg-transparent text-[10px] font-medium text-white/30 outline-none mt-2 placeholder:text-white/5" 
                  placeholder="Special instructions or precautions..." 
                />
              </td>
              <td className="px-4 py-6 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <input type="number" value={row.sets} onChange={e => updateRow(i, 'sets', e.target.value)} className="w-10 h-8 bg-white/5 rounded-lg text-center text-xs font-black text-white outline-none border border-white/5 focus:border-[#0ea5e9]" />
                  <span className="text-[10px] font-black text-white/10">×</span>
                  <input type="number" value={row.reps} onChange={e => updateRow(i, 'reps', e.target.value)} className="w-10 h-8 bg-white/5 rounded-lg text-center text-xs font-black text-white outline-none border border-white/5 focus:border-[#0ea5e9]" />
                </div>
              </td>
              <td className="px-4 py-6">
                <select 
                  value={row.frequency} onChange={e => updateRow(i, 'frequency', e.target.value)} 
                  className="w-full bg-white/5 border border-white/5 rounded-full px-4 py-1.5 text-[10px] font-black text-white outline-none focus:border-[#0ea5e9] appearance-none text-center cursor-pointer"
                >
                  {['daily','2x/day','3x/day','3x/week'].map(f => <option key={f} className="bg-slate-900">{f.toUpperCase()}</option>)}
                </select>
              </td>
              <td className="px-6 py-6 text-right">
                <button 
                  onClick={e => { e.stopPropagation(); removeRow(i); }}
                  className="p-2 rounded-xl text-red-500/20 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover/row:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-8 py-6 bg-slate-900/50">
        <button 
          onClick={e => { e.stopPropagation(); addRow(); }}
          className="flex items-center gap-3 text-[10px] font-black text-[#0ea5e9] hover:text-[#38bdf8] uppercase tracking-[0.2em] transition-colors"
        >
          <div className="w-6 h-6 rounded-lg bg-[#0ea5e9]/10 flex items-center justify-center font-black">+</div>
          Add New Exercise Protocol
        </button>
      </div>
    </div>
  );
}

function VASBlock({ block, selected, onSelect, onUpdate }) {
  const score = block.data?.score || 0;
  return (
    <div 
      className={`rounded-2xl border p-8 transition-all duration-300 ${selected ? 'ring-2 ring-[#0ea5e9] shadow-2xl bg-[#0ea5e9]/5' : 'border-white/5 bg-white/3'}`}
      onClick={() => onSelect(block.id)}
    >
      <header className="flex justify-between items-center mb-10">
        <div>
          <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Visual Analogue Scale</h4>
          <p className="text-sm font-black text-white uppercase tracking-tight">Reported Intensity Level</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl">
          <span className="text-2xl font-black text-[#0ea5e9]">{score}</span>
        </div>
      </header>

      <div className="relative h-10 flex gap-1.5">
        {[...Array(11)].map((_, i) => {
          const isActive = score === i;
          const color = i <= 3 ? 'bg-green-500' : i <= 7 ? 'bg-yellow-500' : 'bg-red-500';
          return (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onUpdate(block.id, { data: { ...block.data, score: i } }); }}
              className={`flex-1 h-full rounded-lg transition-all duration-300 relative group ${isActive ? color + ' shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-y-110' : 'bg-white/5 hover:bg-white/10'}`}
            >
              <span className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black tracking-tighter transition-all ${isActive ? 'text-white scale-110' : 'text-white/10 group-hover:text-white/40'}`}>{i}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-12 flex justify-between px-1">
        <span className="text-[9px] font-black text-green-500/40 uppercase tracking-widest">No Pain</span>
        <span className="text-[9px] font-black text-red-500/40 uppercase tracking-widest">Unbearable</span>
      </div>
    </div>
  );
}

function DividerBlock({ block, selected, onSelect }) {
  return (
    <div 
      className={`py-8 cursor-pointer group transition-all ${selected ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
      onClick={() => onSelect(block.id)}
    >
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </div>
  );
}

function ImageBlock({ block, selected, onSelect, onUpdate }) {
  const [url, setUrl] = useState(block.data?.url || '');
  return (
    <div 
      className={`rounded-2xl border overflow-hidden transition-all duration-300 relative group/img ${selected ? 'ring-2 ring-[#0ea5e9] shadow-2xl' : 'border-white/5 bg-white/3'}`}
      onClick={() => onSelect(block.id)}
    >
      {url ? (
        <div className="relative group">
          <img src={url} className="w-full h-auto max-h-[400px] object-contain bg-slate-900" alt="Clinical Ref" />
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button onClick={() => setUrl('')} className="p-3 rounded-full bg-red-500 text-white shadow-xl"><Trash2 size={20} /></button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center p-12 cursor-pointer hover:bg-white/5 transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center mb-4"><Image size={24} /></div>
          <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Select Clinical Reference Image</p>
          <input type="file" hidden accept="image/*" onChange={(e) => {
            const f = e.target.files[0];
            if (f) {
              const reader = new FileReader();
              reader.onload = (re) => {
                setUrl(re.target.result);
                onUpdate(block.id, { data: { ...block.data, url: re.target.result } });
              };
              reader.readAsDataURL(f);
            }
          }} />
        </label>
      )}
    </div>
  );
}

function ClinicHeaderBlock({ block, selected, onSelect, clinicName, physioName, phone }) {
  return (
    <div 
      className={`rounded-2xl border p-8 transition-all duration-300 relative ${selected ? 'ring-2 ring-[#0ea5e9] shadow-2xl' : 'border-white/5 bg-white/3'}`}
      onClick={() => onSelect(block.id)}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] flex items-center justify-center text-white shadow-2xl shadow-[#0ea5e9]/40 border border-white/20">
            <Activity size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter mb-1">{clinicName || 'REHAB CLINIC'}</h2>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-[#0ea5e9] uppercase tracking-[0.2em]">{physioName || 'DR. JITENDRA'}</span>
              <div className="w-1 h-1 rounded-full bg-white/10" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none translate-y-[1px]">{phone || '+91 92281 08454'}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Official Clinical Record</p>
        </div>
      </div>
    </div>
  );
}

function PatientInfoBlock({ block, selected, onSelect, onUpdate }) {
  const [data, setData] = useState({
    name: block.data?.name || '',
    id: block.data?.id || `PT-${Math.floor(Math.random()*10000)}`,
    date: block.data?.date || new Date().toISOString().split('T')[0],
    diagnosis: block.data?.diagnosis || ''
  });

  const update = (field, val) => {
    const next = { ...data, [field]: val };
    setData(next);
    onUpdate(block.id, { data: next });
  };

  return (
    <div 
      className={`rounded-2xl border p-8 transition-all duration-300 ${selected ? 'ring-2 ring-[#0ea5e9] bg-[#0ea5e9]/5' : 'border-white/5 bg-white/3'}`}
      onClick={() => onSelect(block.id)}
    >
      <div className="grid grid-cols-4 gap-8">
        <div className="col-span-2">
          <label className="text-[9px] font-black uppercase text-white/20 block mb-3 tracking-[0.2em]">Patient Full Name</label>
          <input 
            value={data.name} onChange={e => update('name', e.target.value)}
            className="w-full bg-transparent border-b border-white/5 py-2 text-sm font-black text-white outline-none focus:border-[#0ea5e9] transition-all"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="text-[9px] font-black uppercase text-white/20 block mb-3 tracking-[0.2em]">Patient ID</label>
          <input 
            value={data.id} onChange={e => update('id', e.target.value)}
            className="w-full bg-transparent border-b border-white/5 py-2 text-sm font-bold text-white/60 outline-none"
          />
        </div>
        <div>
          <label className="text-[9px] font-black uppercase text-white/20 block mb-3 tracking-[0.2em]">Clinical Date</label>
          <input 
            type="date" value={data.date} onChange={e => update('date', e.target.value)}
            className="w-full bg-transparent border-b border-white/5 py-2 text-sm font-bold text-white outline-none focus:border-[#0ea5e9] transition-all"
          />
        </div>
        <div className="col-span-4 translate-y-2">
          <label className="text-[9px] font-black uppercase text-white/20 block mb-3 tracking-[0.2em]">Primary Diagnosis / Findings</label>
          <input 
            value={data.diagnosis} onChange={e => update('diagnosis', e.target.value)}
            className="w-full bg-transparent border-b border-white/5 py-2 text-sm font-black text-[#0ea5e9] outline-none focus:border-[#38bdf8] transition-all placeholder:text-white/5"
            placeholder="Describe clinical findings..."
          />
        </div>
      </div>
    </div>
  );
}

function ProgressChartBlock({ block, selected, onSelect, onUpdate }) {
  const data = block.data || {};
  const labels = data.labels || ['W1', 'W2', 'W3', 'W4'];
  const datasets = data.datasets || [{ label: 'VAS', data: [6, 4, 3, 2], color: '#0ea5e9' }];

  return (
    <div
      className={`rounded-2xl border p-8 transition-all duration-300 ${selected ? 'ring-2 ring-[#0ea5e9] shadow-2xl bg-[#0ea5e9]/5' : 'border-white/5 bg-white/3'}`}
      onClick={() => onSelect(block.id)}
    >
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] flex items-center justify-center shadow-2xl shadow-[#0ea5e9]/40 border border-white/20">
            <BarChart2 size={24} className="text-white" />
          </div>
          <div>
            <span className="text-xs font-black text-white uppercase tracking-[0.2em] block leading-none mb-1.5">{data.title || 'Recovery Progress'}</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Real-time Clinical Data</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {datasets.map((ds, i) => (
            <div key={i} className="flex items-center gap-2.5 bg-slate-900 border border-white/5 px-4 py-2 rounded-xl shadow-inner">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: ds.color }} />
              <span className="text-[10px] font-black text-white/60 uppercase tracking-tighter">{ds.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-6 h-48 px-4 relative">
        {/* Chart Grid Lines */}
        <div className="absolute inset-x-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none opacity-5">
           {[...Array(5)].map((_, i) => <div key={i} className="h-px bg-white w-full" />)}
        </div>

        {labels.map((lbl, i) => {
          const vals = datasets.map(d => d.data[i] || 0);
          return (
            <div key={i} className="flex flex-col gap-4 flex-1 items-center h-full group z-10">
              <div className="flex-1 w-full flex items-end justify-center gap-2 mt-auto">
                {datasets.map((ds, di) => {
                  const val = vals[di] || 0;
                  const height = `${(val / 10) * 100}%`;
                  return (
                    <div
                      key={di}
                      className="w-full rounded-t-xl transition-all duration-300 relative group-hover:brightness-150"
                      style={{ 
                        height, 
                        background: `linear-gradient(to top, ${ds.color}22, ${ds.color})`,
                        boxShadow: `0 10px 20px -5px ${ds.color}44` 
                      }}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 bg-white text-black text-[10px] font-black px-3 py-1.5 rounded-lg shadow-2xl z-20 whitespace-nowrap">
                        {val} Units
                      </div>
                    </div>
                  );
                })}
              </div>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-[#0ea5e9] transition-colors">{lbl}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}



// ── Main Component ────────────────────────────────────────────────────────────


// ── Visual Video Studio Components ──────────────────────────────────────────

function VideoStudioPreview({ videoUrl, logoUrl, logoConfig, textConfig, onLogoDrag, onTextDrag, onSelect, selectedId, targetAspect, videoScale, videoX, videoY }) {
  const containerRef = useRef(null);

  const handleDragEnd = (e, info, type) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate relative position based on the point within the container
    const x = info.point.x - rect.left;
    const y = info.point.y - rect.top;
    
    const px = Math.min(Math.max((x / rect.width) * 100, 0), 95);
    const py = Math.min(Math.max((y / rect.height) * 100, 0), 95);
    
    if (type === 'logo') onLogoDrag(px, py);
    else onTextDrag(px, py);
  };

  const aspectClass = targetAspect === '9:16' ? 'aspect-[9/16] max-w-[400px] mx-auto' : 
                      targetAspect === '1:1' ? 'aspect-square max-w-[500px] mx-auto' : 
                      'aspect-video w-full';

  return (
    <div 
      className={`relative ${aspectClass} bg-black rounded-[40px] overflow-hidden border transition-all duration-700 ${selectedId === 'video' ? 'ring-2 ring-blue-500 ring-offset-8 ring-offset-[#020617] border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.15)]' : 'border-white/10 shadow-2xl'}`} 
      ref={containerRef}
      onClick={(e) => { if (e.target === e.currentTarget || e.target.tagName === 'VIDEO') onSelect('video'); }}
    >
      <video 
        ref={el => { if (el) { el.currentTime = 0; el.pause(); } }}
        src={videoUrl} 
        className="w-full h-full object-cover select-none pointer-events-none" 
        style={{ 
          transform: `scale(${videoScale/100})`,
          objectPosition: `${50 + videoX}% ${50 + videoY}%`
        }}
        muted 
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

      {/* Draggable Logo */}
      {logoConfig.enabled && (
        <motion.div
           drag
           dragMomentum={false}
           dragConstraints={containerRef}
           onDragStart={() => onSelect('logo')}
           onDragEnd={(e, info) => handleDragEnd(e, info, 'logo')}
           onMouseDown={() => onSelect('logo')}
           style={{
             position: 'absolute',
             left: `${logoConfig.x}%`,
             top: `${logoConfig.y}%`,
             width: `${logoConfig.size}%`,
             opacity: logoConfig.opacity / 100,
             cursor: 'grab',
             zIndex: selectedId === 'logo' ? 110 : 100,
             touchAction: 'none',
             userSelect: 'none'
           }}
           whileHover={{ scale: 1.05 }}
           whileDrag={{ scale: 1.1, cursor: 'grabbing', zIndex: 120 }}
           className={`transition-shadow duration-300 ${selectedId === 'logo' ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-black/50 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.5)]' : ''}`}
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-full h-auto drop-shadow-2xl pointer-events-none" />
          ) : (
            <div className="w-full aspect-square bg-blue-500/20 border-2 border-dashed border-blue-400 flex items-center justify-center text-[10px] text-blue-400 font-black">LOGO</div>
          )}
        </motion.div>
      )}

      {textConfig.enabled && (
        <motion.div
           drag
           dragMomentum={false}
           dragConstraints={containerRef}
           onDragStart={() => onSelect('text')}
           onDragEnd={(e, info) => handleDragEnd(e, info, 'text')}
           onMouseDown={() => onSelect('text')}
           style={{
             position: 'absolute',
             left: `${textConfig.x}%`,
             top: `${textConfig.y}%`,
             color: textConfig.color,
             fontSize: `${textConfig.fontSize / 2}px`,
             opacity: textConfig.opacity / 100,
             cursor: 'grab',
             zIndex: selectedId === 'text' ? 110 : 100,
             whiteSpace: 'nowrap',
             fontWeight: '900',
             textShadow: '2px 2px 10px rgba(0,0,0,0.8)',
             touchAction: 'none',
             userSelect: 'none'
           }}
           whileHover={{ scale: 1.05 }}
           whileDrag={{ scale: 1.1, cursor: 'grabbing', zIndex: 120 }}
           className={`px-3 py-1 transition-shadow duration-300 ${selectedId === 'text' ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-black/50 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.5)]' : ''}`}
        >
           {textConfig.text || 'WATERMARK'}
        </motion.div>
      )}
    </div>
  );
}
          
export default function ContentCreator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' | 'video'
  const [user, setUser] = useState(null);
  const [clinicId, setClinicId] = useState(null);
  const [clinicData, setClinicData] = useState({});
  const [loading, setLoading] = useState(true);

  // ── PDF Creator State ──
  const [pdfEnabled, setPdfEnabled] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [savingPdf, setSavingPdf] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [docTitle, setDocTitle] = useState('New Treatment Plan');

  // ── Video Branding State ──
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [logoEnabled, setLogoEnabled] = useState(true);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPos, setLogoPos] = useState('bottom-right');
  const [logoSize, setLogoSize] = useState(15);
  const [logoOpacity, setLogoOpacity] = useState(100);
  const [textEnabled, setTextEnabled] = useState(true);
  const [textVal, setTextVal] = useState('');
  const [textPos, setTextPos] = useState('bottom-left');
  const [textFontSize, setTextFontSize] = useState(24);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textOpacity, setTextOpacity] = useState(100);
  const [introEnabled, setIntroEnabled] = useState(false);
  const [introDuration, setIntroDuration] = useState(3);
  const [introBg, setIntroBg] = useState('#007AFF');
  const [outroEnabled, setOutroEnabled] = useState(false);
  const [outroDuration, setOutroDuration] = useState(5);
  const [outroCta, setOutroCta] = useState('Book Your Next Session');
  // Visual Studio drag/drop states (percentages)
  const [logoX, setLogoX] = useState(85); 
  const [logoY, setLogoY] = useState(80);
  const [textX, setTextX] = useState(5);
  const [textY, setTextY] = useState(85);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [selectedLayer, setSelectedLayer] = useState('logo'); // 'logo' | 'text' | 'video'
  const [targetAspect, setTargetAspect] = useState('16:9'); // '16:9' | '9:16' | '1:1'
  const [videoZoom, setVideoZoom] = useState(100); // 100% to 200%
  const [videoOffsetX, setVideoOffsetX] = useState(0); // -50 to 50
  const [videoOffsetY, setVideoOffsetY] = useState(0); // -50 to 50
  const [processingStatus, setProcessingStatus] = useState(null); // 'waiting', 'processing', 'done', 'error'
  const [resultVideoUrl, setResultVideoUrl] = useState(null);
  const [processingVideo, setProcessingVideo] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [videoStatus, setVideoStatus] = useState(null);
  const [ffmpegAvailable, setFfmpegAvailable] = useState(null);
  const [videoResolution, setVideoResolution] = useState('1080');
  const [videoQuality, setVideoQuality] = useState('high');

  useEffect(() => {
    const unsub = onAuth(async (u) => {
      if (!u) { navigate('/dashboard-login'); return; }
      setUser(u);
      if (db) {
        const snap = await getDocs(query(collection(db, 'clinics'), where('uid', '==', u.uid)));
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setClinicId(snap.docs[0].id);
          setClinicData(data);
          setTextVal(data.clinicName || '');
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── PDF Block Actions ──
  const addBlock = (type) => {
    const newBlock = {
      id: `block_${Date.now()}`,
      type,
      data: type === 'textBlock' ? { content: '', align: 'left', size: 'md' }
        : type === 'exerciseTable' ? { rows: [{ exercise: '', sets: 3, reps: 10, frequency: 'daily', notes: '' }] }
        : type === 'patientInfo' ? { name: '', date: new Date().toISOString().split('T')[0], diagnosis: '' }
        : type === 'progressChart' ? {
            title: 'VAS Progress',
            labels: ['W1', 'W2', 'W3', 'W4'],
            datasets: [{ label: 'VAS', data: [8, 6, 4, 2], color: '#007AFF' }],
          }
        : {},
    };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlock(newBlock.id);
  };

  const removeBlock = (id) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlock === id) setSelectedBlock(null);
  };

  const moveBlock = (fromIdx, toIdx) => {
    setBlocks(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
  };

  const updateBlock = (id, changes) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...changes } : b));
  };

  const applyTemplate = (template) => {
    setSelectedTemplate(template.key);
    const newBlocks = template.blocks.map((type, i) => ({
      id: `block_${Date.now()}_${i}`,
      type,
      data: type === 'textBlock' ? { content: '', align: 'left', size: 'md' }
        : type === 'exerciseTable' ? { rows: [{ exercise: '', sets: 3, reps: 10, frequency: 'daily', notes: '' }] }
        : type === 'progressChart' ? {
            title: 'VAS Progress',
            labels: ['W1', 'W2', 'W3', 'W4'],
            datasets: [{ label: 'VAS', data: [8, 6, 4, 2], color: '#007AFF' }],
          }
        : {},
    }));
    setBlocks(newBlocks);
    setSelectedBlock(null);
  };

  const generatePdf = async (download = false, saveToLib = false) => {
    setSavingPdf(true);
    try {
      const canvas = blocks.map(b => ({ type: b.type, data: b.data }));
      const res = await fetch(`${API_STORAGE}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, canvas }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'PDF generation failed');
      setPdfUrl(data.url);
      if (download) window.open(data.url, '_blank');
      if (saveToLib) {
        // Upload to resource library
        await fetch(`${API_STORAGE}/upload`, {
          method: 'POST',
          body: new URLSearchParams({ clinicId, type: 'documents', name: `PDF_${Date.now()}` }),
        });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingPdf(false);
    }
  };

  const videoInputRef = useRef(null);
  const isVideoReady = uploadedVideo && !uploadingVideo;

  // ── Video Upload ──
  async function handleVideoUpload(file) {
    const localUrl = URL.createObjectURL(file);
    setUploadedVideo(localUrl); // For immediate preview
    setUploadingVideo(true);
    setVideoProgress(0);
    try {
      const formData = new FormData();
      formData.append('clinicId', clinicId);
      formData.append('type', 'recordings');
      formData.append('name', file.name);
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable) setVideoProgress(Math.round((e.loaded / e.total) * 100));
      });

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status < 300) {
            try {
              const resp = JSON.parse(xhr.responseText);
              // Store the server filename in a separate state or metadata if needed
              // For now, we'll keep the object-style structure in a hidden state if needed
              // or just keep using the localUrl for preview and resp.filename for processing
              window._lastVideoFilename = resp.filename; 
              resolve();
            } catch (e) {
              resolve();
            }
          } else {
            reject(new Error(xhr.statusText));
          }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.open('POST', `${API_STORAGE}/upload`);
        xhr.send(formData);
      });
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingVideo(false);
      setVideoProgress(0);
    }
  }

  async function processVideo() {
    console.log('[ContentCreator] Clicked Apply Branding. Ready?', isVideoReady);
    if (!isVideoReady) {
      alert("Please upload a video first in Step 1.");
      return;
    }
    setProcessingVideo(true);
    setProcessingStatus('processing');
    try {
      const config = {
        logoOverlay: logoEnabled ? { 
          enabled: true, 
          imageUrl: logoFile ? URL.createObjectURL(logoFile) : '', 
          position: logoPos, 
          size: logoSize, 
          opacity: logoOpacity,
          x: logoX,
          y: logoY
        } : { enabled: false },
        textWatermark: textEnabled ? { 
          enabled: true, 
          text: textVal, 
          position: textPos, 
          fontSize: textFontSize, 
          color: textColor,
          opacity: textOpacity,
          x: textX,
          y: textY
        } : { enabled: false },
        intro: introEnabled ? { enabled: true, duration: introDuration, bgColor: introBg, logoUrl: '' } : { enabled: false },
        outro: outroEnabled ? { enabled: true, duration: outroDuration, ctaText: outroCta } : { enabled: false },
        resolution: videoResolution,
        quality: videoQuality,
        clinicName: clinicData.clinicName || textVal,
        targetAspect: targetAspect,
        videoZoom: videoZoom,
        videoOffsetX: videoOffsetX,
        videoOffsetY: videoOffsetY
      };

      const formData = new FormData();
      formData.append('clinicId', clinicId);
      formData.append('config', JSON.stringify(config));
      
      if (window._lastVideoFilename) formData.append('videoFilename', window._lastVideoFilename);
      if (logoFile) formData.append('logoFile', logoFile);

      const res = await fetch(`${API_STORAGE}/process-video`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Server processing failed');
      }

      const data = await res.json();

      if (data.error === 'ffmpeg_required') {
        setFfmpegAvailable(false);
        setProcessingVideo(false);
        setProcessingStatus('error');
        return;
      }
      
      setFfmpegAvailable(true);
      if (data.jobId) {
        setJobId(data.jobId);
        setVideoStatus(data); 
        pollVideoStatus(data.jobId);
        // Do NOT set processing false here; let poller handle it
      } else {
        setProcessingVideo(false);
        setProcessingStatus('error');
        throw new Error('No job ID received from server');
      }
    } catch (err) {
      alert(err.message);
      setProcessingVideo(false);
      setProcessingStatus('error');
    }
  }

  function pollVideoStatus(jid) {
    const pollInt = setInterval(async () => {
      try {
        const res = await fetch(`${API_STORAGE}/video-status/${jid}`);
        const resData = await res.json();
        setVideoStatus(resData);
        
        // Stop polling if finished or crashed
        if (resData.status === 'done' || resData.status === 'completed') {
          clearInterval(pollInt);
          setVideoProgress(100);
          setProcessingStatus('done');
          setProcessingVideo(false);
          if (resData.outputUrl) {
            setResultVideoUrl(resData.outputUrl);
          }
        } else if (resData.status === 'error' || resData.status === 'failed') {
          clearInterval(pollInt);
          setProcessingStatus('error');
          setProcessingVideo(false);
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 2000); // Polling faster for better UX
  }

  // ── Render Block ──
  function renderBlock(block) {
    const props = { key: block.id, block, selected: selectedBlock === block.id, onSelect: setSelectedBlock, onUpdate: updateBlock };
    switch (block.type) {
      case 'textBlock':      return <TextBlock {...props} />;
      case 'exerciseTable':  return <ExerciseTableBlock {...props} />;
      case 'vasScale':       return <VASBlock {...props} />;
      case 'divider':        return <DividerBlock {...props} />;
      case 'clinicHeader':   return <ClinicHeaderBlock {...props} clinicName={clinicData.clinicName} physioName={clinicData.physioName} phone={clinicData.phone} />;
      case 'patientInfo':    return <PatientInfoBlock {...props} />;
      case 'progressChart':  return <ProgressChartBlock {...props} />;
      case 'imageBlock':     return <ImageBlock {...props} />;
      default: return <div className="p-4 bg-gray-800 rounded-xl text-gray-500 text-sm">Unknown element: {block.type}</div>;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans overflow-hidden">
      {/* ── Studio Top Toolbar ────────────────────────────────────────── */}
      <header className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] flex items-center justify-center shadow-lg shadow-[#0ea5e9]/20">
            <FileText size={20} className="text-white" />
          </div>
          <div className="h-8 w-px bg-white/5" />
          <div>
            <input 
              className="bg-transparent border-none text-white font-black text-sm outline-none w-48 focus:text-[#0ea5e9] transition-colors"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Untitled Document"
            />
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Auto-saved</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex bg-white/5 p-1 rounded-xl">
            <button onClick={() => setActiveTab('pdf')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'pdf' ? 'bg-[#0ea5e9] text-white' : 'text-white/40 hover:text-white'}`}>Document</button>
            <button onClick={() => setActiveTab('video')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'video' ? 'bg-[#0ea5e9] text-white' : 'text-white/40 hover:text-white'}`}>Video</button>
          </div>
          {activeTab === 'pdf' && (
            <>
              <div className="h-8 w-px bg-white/5" />
              <div className="flex gap-2">
                <Button onClick={() => generatePdf(true, false)} className="h-10 px-6 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-[#0ea5e9]/20">
                  <Download size={14} /> Export PDF
                </Button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'pdf' ? (
          <aside className="w-80 border-r border-white/5 bg-slate-900/30 flex flex-col animate-in slide-in-from-left duration-500">
            <div className="p-4 flex gap-2 border-b border-white/5">
              <button className="flex-1 py-1.5 rounded-lg bg-[#0ea5e9]/10 text-[#0ea5e9] text-[10px] font-black uppercase tracking-widest">Elements</button>
              <button className="flex-1 py-1.5 rounded-lg bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">Templates</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section>
                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Core Components</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(BLOCK_TYPES).map(([type, info]) => (
                    <button key={type} onClick={() => addBlock(type)} className="group relative flex flex-col items-center justify-center p-4 rounded-2xl bg-white/3 border border-white/5 hover:border-[#0ea5e9]/50 hover:bg-[#0ea5e9]/5 transition-all duration-300">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#0ea5e9] transition-colors mb-2">
                        <info.icon size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-white/60 group-hover:text-white transition-colors">{info.label}</span>
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Quick Templates</h3>
                <div className="space-y-3">
                  {TEMPLATES.map(t => (
                    <button key={t.key} onClick={() => applyTemplate(t)} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/3 border border-white/5 hover:border-[#0ea5e9]/50 hover:bg-[#0ea5e9]/5 transition-all group">
                      <div className="text-2xl grayscale group-hover:grayscale-0 transition-all">{t.preview}</div>
                      <div className="text-left">
                        <p className="text-xs font-black text-white group-hover:text-[#0ea5e9] transition-colors uppercase">{t.label}</p>
                        <p className="text-[9px] text-white/30 font-medium">{t.blocks.length} elements</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        ) : null}

        <div className="flex-1 overflow-y-auto bg-slate-950/70 p-12 flex justify-center custom-scrollbar">
          {activeTab === 'pdf' ? (
            !pdfEnabled ? (
              <div className="w-full max-w-2xl bg-white/3 border border-white/5 rounded-[40px] p-16 text-center backdrop-blur-3xl m-auto">
                <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-[#0ea5e9]/20 to-[#0284c7]/20 flex items-center justify-center text-[#0ea5e9] mx-auto mb-8 animate-pulse">
                  <FileText size={48} />
                </div>
                <h2 className="text-3xl font-black text-white mb-4">Professional PDF Creator</h2>
                <p className="text-slate-400 font-medium mb-10 max-w-md mx-auto leading-relaxed">Design branded exercise sheets, clinical progress reports and patient education materials in seconds.</p>
                <button onClick={() => setPdfEnabled(true)} className="h-14 px-10 rounded-2xl bg-[#0ea5e9] text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-[#0ea5e9]/40 hover:scale-105 transition-transform">Launch Studio</button>
              </div>
            ) : (
              <div className="w-full max-w-[800px] min-h-[1100px] bg-[#0f172a]/95 rounded-sm shadow-2xl border border-white/5 relative p-12 flex flex-col gap-6">
                {blocks.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl p-12 text-white/20">
                    <MousePointer2 size={32} className="mb-6" />
                    <h3 className="text-xs font-black uppercase tracking-[0.3em]">Drop an element to start</h3>
                  </div>
                ) : (
                  blocks.map(block => (
                    <div key={block.id} className="relative group/block">
                      {renderBlock(block)}
                      <div className="absolute -left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover/block:opacity-100 transition-all flex flex-col gap-2 p-2 bg-slate-900 rounded-xl border border-white/10 shadow-2xl scale-75 group-hover/block:scale-100 origin-right">
                        <button onClick={() => removeBlock(block.id)} className="p-2 hover:bg-red-500/10 text-white/40 hover:text-red-500 transition-colors rounded-lg"><Trash2 size={16} /></button>
                        <button className="p-2 hover:bg-white/10 text-white/40 hover:text-white transition-colors rounded-lg cursor-grab"><GripVertical size={16} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )
          ) : (
            <div className="flex-1">{/* Video suite handled standalone */}</div>
          )}
        </div>

        {activeTab === 'pdf' ? (
          <aside className="w-80 border-l border-white/5 bg-slate-900/30 overflow-y-auto animate-in slide-in-from-right duration-500">
            <div className="p-6">
              {selectedBlock ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <header className="flex items-center gap-3 pb-6 border-b border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-[#0ea5e9]/10 flex items-center justify-center text-[#0ea5e9]">
                      <Settings size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Editor</p>
                      <h3 className="text-xs font-black text-white uppercase tracking-tight">{blocks.find(b => b.id === selectedBlock)?.type.replace('Block','')} Property</h3>
                    </div>
                  </header>
                  <div className="space-y-6">
                    {blocks.find(b => b.id === selectedBlock)?.type === 'textBlock' && (
                      <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest block mb-4">Content</label>
                        <textarea value={blocks.find(b => b.id === selectedBlock)?.data?.content || ''} onChange={(e) => updateBlock(selectedBlock, { data: { ...blocks.find(b => b.id === selectedBlock)?.data, content: e.target.value } })} rows={8} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white font-bold outline-none focus:border-[#0ea5e9] transition-all resize-none" placeholder="Type here..." />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest block mb-3">Scale</label>
                        <div className="flex bg-white/5 p-1 rounded-xl">
                          {['sm','md','lg'].map(s => (
                            <button key={s} onClick={() => updateBlock(selectedBlock, { data: { ...blocks.find(b => b.id === selectedBlock)?.data, size: s } })} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${blocks.find(b => b.id === selectedBlock)?.data?.size === s ? 'bg-[#1e293b] text-white shadow-lg' : 'text-white/30 hover:text-white'}`}>{s}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest block mb-3">Gravity</label>
                        <div className="flex bg-white/5 p-1 rounded-xl">
                          {[AlignLeft, AlignCenter, AlignRight].map((Icon, i) => {
                            const a = ['left','center','right'][i];
                            return (
                              <button key={a} onClick={() => updateBlock(selectedBlock, { data: { ...blocks.find(b => b.id === selectedBlock)?.data, align: a } })} className={`flex-1 py-1.5 flex items-center justify-center rounded-lg transition-all ${blocks.find(b => b.id === selectedBlock)?.data?.align === a ? 'bg-[#1e293b] text-[#0ea5e9]' : 'text-white/30'}`}><Icon size={14} /></button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 p-8 opacity-20">
                  <MousePointer2 size={32} className="mb-4" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Prop Inspector</h3>
                  <p className="text-[8px] font-medium mt-2 uppercase tracking-widest">Select element to edit</p>
                </div>
              )}
            </div>
          </aside>
        ) : null}

        {/* ══════════════════════════════════════════
            VIDEO BRANDING TAB (Visual Studio 2.1)
        ══════════════════════════════════════════ */}
        {activeTab === 'video' && (
          <div className="flex-1 p-6 lg:p-10 overflow-y-auto bg-[#020617] custom-scrollbar flex flex-col">
            {!videoEnabled ? (
              <div className="max-w-xl mx-auto my-auto text-center animate-in fade-in zoom-in duration-700">
                <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-2xl backdrop-blur-2xl">
                  <Video size={40} className="text-white/20" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter italic">Studio Engine Offline</h2>
                <p className="text-white/20 mb-8 font-medium tracking-wide text-xs">Initialize the production environment to begin branding.</p>
                <button onClick={() => setVideoEnabled(true)} className="px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-95">Boot Studio</button>
              </div>
            ) : (
              <div className="max-w-6xl w-full mx-auto animate-in fade-in duration-1000">
                <div className="flex justify-between items-center mb-6">
                   <div />
                   <button onClick={() => setVideoEnabled(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 text-white/20 border border-white/5 hover:text-red-400 hover:bg-red-500/10 transition-all group">
                     <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                   </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* STUDIO CANVAS (L8) */}
                  <div className="lg:col-span-8 flex flex-col gap-6">
                       <div className="flex gap-3 bg-black/20 p-2 rounded-[24px] border border-white/5">
                          {[
                            { id: '16:9', icon: <Monitor size={14} />, label: 'Cinema' },
                            { id: '9:16', icon: <Smartphone size={14} />, label: 'Social' },
                            { id: '1:1', icon: <Square size={14} />, label: 'Square' }
                          ].map(ratio => (
                            <button 
                              key={ratio.id}
                              onClick={() => setTargetAspect(ratio.id)}
                              className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${targetAspect === ratio.id ? 'bg-blue-500 text-white shadow-lg' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
                            >
                              {ratio.icon} {ratio.label}
                            </button>
                          ))}
                       </div>

                    <div className="bg-slate-900/40 border border-white/5 rounded-[48px] p-8 backdrop-blur-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] relative group">
                      <div className="absolute inset-0 bg-blue-500/5 rounded-[48px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      {!uploadedVideo ? (
                        <div className="w-full aspect-video rounded-[36px] border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center p-12 transition-all hover:bg-white/[0.03] hover:border-blue-500/30 group cursor-pointer" 
                             onClick={() => document.getElementById('studio-input').click()}>
                           <div className="w-20 h-20 rounded-full bg-blue-600/10 flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                              <Upload size={32} className="text-blue-500" />
                           </div>
                           <h4 className="text-xl font-black text-white/40 uppercase tracking-widest mb-2">Add Video</h4>
                           <input id="studio-input" type="file" accept="video/*" className="hidden" 
                             onChange={e => { if(e.target.files[0]) handleVideoUpload(e.target.files[0]); }} 
                           />
                        </div>
                      ) : (
                        <div className="w-full space-y-10 animate-in zoom-in-95 duration-500">
                          <VideoStudioPreview 
                            videoUrl={uploadedVideo}
                            logoUrl={logoFile ? URL.createObjectURL(logoFile) : clinicData.logoUrl}
                            logoConfig={{ enabled: logoEnabled, x: logoX, y: logoY, size: logoSize, opacity: logoOpacity }}
                            textConfig={{ enabled: textEnabled, x: textX, y: textY, text: textVal, color: textColor, fontSize: textFontSize, opacity: textOpacity }}
                            onLogoDrag={(x,y) => { setLogoX(x); setLogoY(y); }}
                            onTextDrag={(x,y) => { setTextX(x); setTextY(y); }}
                            onSelect={setSelectedLayer}
                            selectedId={selectedLayer}
                            targetAspect={targetAspect}
                            videoScale={videoZoom}
                            videoX={videoOffsetX}
                            videoY={videoOffsetY}
                          />
                          
                          <div className="flex justify-end">
                            <button onClick={() => setUploadedVideo(null)} className="px-4 py-2 rounded-xl text-[9px] font-black uppercase text-red-500/30 hover:text-red-500 hover:bg-red-500/5 transition-all flex items-center gap-2">
                               <Trash2 size={12} /> Clear Current Stage
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CONCISE INSPECTOR (L4) */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Identity Bank */}
                    <div className="bg-slate-900/60 border border-white/5 rounded-[40px] p-8 pt-10">
                       {/* Branding Cards */}
                       <div className="space-y-6 mb-8 pb-8 border-b border-white/5">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <button onClick={() => setIntroEnabled(!introEnabled)} className={introEnabled ? 'text-blue-400' : 'text-white/10'}>
                                   {introEnabled ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                </button>
                                <p className="text-[11px] font-black text-white/60 uppercase">Intro Card</p>
                             </div>
                             {introEnabled && (
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                   <Clock size={10} className="text-white/20" />
                                   <input type="number" min="1" max="10" value={introDuration} onChange={e => setIntroDuration(e.target.value)} className="w-6 bg-transparent text-[10px] font-black text-white outline-none" />
                                </div>
                             )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <button onClick={() => setOutroEnabled(!outroEnabled)} className={outroEnabled ? 'text-blue-400' : 'text-white/10'}>
                                   {outroEnabled ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                </button>
                                <p className="text-[11px] font-black text-white/60 uppercase">Outro Card</p>
                             </div>
                             {outroEnabled && (
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                                   <Clock size={10} className="text-white/20" />
                                   <input type="number" min="1" max="10" value={outroDuration} onChange={e => setOutroDuration(e.target.value)} className="w-6 bg-transparent text-[10px] font-black text-white outline-none" />
                                </div>
                             )}
                          </div>
                       </div>
                       
                       {/* Logo Control */}
                       <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                             <button onClick={() => setLogoEnabled(!logoEnabled)} className={logoEnabled ? 'text-blue-400' : 'text-white/10'}>
                                {logoEnabled ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                             </button>
                             <p className="text-[11px] font-black text-white/60 uppercase">Clinic Logo</p>
                          </div>
                          <div className="flex items-center gap-2">
                             {logoEnabled && (
                                <button onClick={() => document.getElementById('studio-logo').click()} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-400 transition-all">
                                   {logoFile || clinicData.logoUrl ? 'Change' : 'Upload'}
                                </button>
                             )}
                          </div>
                          <input id="studio-logo" type="file" accept="image/*" className="hidden" onChange={e => { setLogoFile(e.target.files[0]); setSelectedLayer('logo'); }} />
                       </div>

                       {/* Watermark Control */}
                       <div className="space-y-4">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <button onClick={() => setTextEnabled(!textEnabled)} className={textEnabled ? 'text-blue-400' : 'text-white/10'}>
                                   {textEnabled ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                </button>
                                <p className="text-[11px] font-black text-white/60 uppercase">Watermark Text</p>
                             </div>
                          </div>
                          {textEnabled && (
                             <div className="relative group" onClick={() => setSelectedLayer('text')}>
                                <input value={textVal} onChange={e => setTextVal(e.target.value)} placeholder="Therapy Directive..." className="w-full h-12 bg-white/[0.02] border border-white/10 rounded-2xl px-5 text-[11px] text-white outline-none font-bold focus:ring-1 ring-blue-500/40 transition-all font-mono" />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                   <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-4 h-4 rounded-full bg-transparent border-none appearance-none cursor-pointer" />
                                </div>
                             </div>
                          )}
                       </div>
                    </div>

                    {/* Universal Styles (Selection Dependent) */}
                     <div className="bg-slate-900/60 border border-white/5 rounded-[40px] p-8 relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-10">
                           <div>
                              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full inline-block">Active: {selectedLayer}</p>
                           </div>
                           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${selectedLayer === 'logo' ? 'bg-blue-500/20 text-blue-400' : selectedLayer === 'video' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                              {selectedLayer === 'logo' ? <Image size={18} /> : selectedLayer === 'video' ? <Video size={18} /> : <Type size={18} />}
                           </div>
                        </div>

                        <div className="space-y-10 animate-in fade-in duration-500" key={selectedLayer}>
                           {selectedLayer === 'video' ? (
                              <>
                                <div>
                                   <div className="flex justify-between mb-4">
                                      <label className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em]">Video Zoom</label>
                                      <span className="text-[10px] font-black text-white">{videoZoom}%</span>
                                   </div>
                                   <input 
                                      type="range" min="100" max="250" 
                                      value={videoZoom} 
                                      onChange={e => setVideoZoom(parseInt(e.target.value))} 
                                      className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-green-500" 
                                   />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div>
                                      <label className="text-[8px] font-black uppercase text-white/20 tracking-widest block mb-3">X Offset</label>
                                      <input 
                                         type="range" min="-50" max="50" 
                                         value={videoOffsetX} 
                                         onChange={e => setVideoOffsetX(parseInt(e.target.value))} 
                                         className="w-full h-1 bg-white/5 rounded-full appearance-none accent-green-500" 
                                      />
                                   </div>
                                   <div>
                                      <label className="text-[8px] font-black uppercase text-white/20 tracking-widest block mb-3">Y Offset</label>
                                      <input 
                                         type="range" min="-50" max="50" 
                                         value={videoOffsetY} 
                                         onChange={e => setVideoOffsetY(parseInt(e.target.value))} 
                                         className="w-full h-1 bg-white/5 rounded-full appearance-none accent-green-500" 
                                      />
                                   </div>
                                </div>
                              </>
                           ) : (
                              <>
                                <div>
                                   <div className="flex justify-between mb-4">
                                      <label className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em]">{selectedLayer === 'logo' ? 'Logo Scale' : 'Font Size'}</label>
                                      <span className="text-[10px] font-black text-white">{selectedLayer === 'logo' ? logoSize : textFontSize}%</span>
                                   </div>
                                   <input 
                                      type="range" min="5" max="100" 
                                      value={selectedLayer === 'logo' ? logoSize : textFontSize} 
                                      onChange={e => (selectedLayer === 'logo' ? setLogoSize(parseInt(e.target.value)) : setTextFontSize(parseInt(e.target.value)))} 
                                      className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500 shadow-inner" 
                                   />
                                </div>

                                <div>
                                   <div className="flex justify-between mb-4">
                                      <label className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em]">Transparency</label>
                                      <span className="text-[10px] font-black text-white">{selectedLayer === 'logo' ? logoOpacity : textOpacity}%</span>
                                   </div>
                                   <input 
                                      type="range" min="10" max="100" 
                                      value={selectedLayer === 'logo' ? logoOpacity : textOpacity} 
                                      onChange={e => (selectedLayer === 'logo' ? setLogoOpacity(parseInt(e.target.value)) : setTextOpacity(parseInt(e.target.value)))}
                                      className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500 shadow-inner" 
                                   />
                                </div>

                                <div className="pt-6 border-t border-white/5">
                                   <label className="text-[9px] font-black uppercase text-white/20 tracking-widest block mb-4 italic">Hold in Position</label>
                                   <div className="grid grid-cols-3 gap-2">
                                      {[
                                         { id: 'TL', x: 2, y: 2 }, { id: 'TC', x: 45, y: 2 }, { id: 'TR', x: 88, y: 2 },
                                         { id: 'ML', x: 2, y: 45 }, { id: 'C', x: 45, y: 45 }, { id: 'MR', x: 88, y: 45 },
                                         { id: 'BL', x: 2, y: 88 }, { id: 'BC', x: 45, y: 88 }, { id: 'BR', x: 88, y: 88 }
                                      ].map(anchor => (
                                         <button 
                                            key={anchor.id}
                                            onClick={() => {
                                               if(selectedLayer === 'logo') { setLogoX(anchor.x); setLogoY(anchor.y); }
                                               else { setTextX(anchor.x); setTextY(anchor.y); }
                                            }}
                                            className="h-8 rounded-lg bg-white/5 border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all flex items-center justify-center text-[7px] font-black text-white/40 hover:text-blue-400 group/anchor"
                                         >
                                            {anchor.id === 'C' ? <Monitor size={12} /> : anchor.id}
                                         </button>
                                      ))}
                                   </div>
                                </div>
                              </>
                           )}
                        </div>
                       
                       <div className="mt-8 pt-8 border-t border-white/5">
                          <div className="flex items-center gap-4 text-white/20">
                             <Info size={14} />
                             <p className="text-[9px] font-medium leading-relaxed uppercase tracking-tighter">Properties auto-save to current selection. Drag elements on canvas to quick-select.</p>
                          </div>
                       </div>
                    </div>

                    {/* Master Export Console */}
                    <div className="bg-white/[0.03] border border-white/10 rounded-[40px] p-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2" />
                       
                       <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                             <Layers size={16} />
                          </div>
                          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Finalization</h4>
                       </div>
                       
                       <div className="space-y-6">
                          <button
                            disabled={!uploadedVideo || processingVideo}
                            onClick={processVideo}
                            className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-4 ${!uploadedVideo || processingVideo ? 'bg-white/5 text-white/20' : 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 hover:bg-blue-500 hover:-translate-y-0.5'}`}
                          >
                            {processingVideo ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                            {processingVideo ? 'Exporting...' : 'Export Video'}
                          </button>

                          {processingVideo && (
                            <div className="bg-black/40 p-6 rounded-3xl border border-white/5 animate-in fade-in zoom-in duration-500">
                               <div className="flex justify-between items-end mb-4">
                                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">FFmpeg Encode Status</span>
                                  <span className="text-2xl font-black text-white font-mono leading-none tracking-tighter">{videoStatus?.progress || 0}%</span>
                               </div>
                               <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                 <motion.div initial={{ width: 0 }} animate={{ width: `${videoStatus?.progress || 0}%` }} className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]" />
                               </div>
                               <p className="mt-4 text-[7px] font-bold uppercase tracking-widest text-white/20 italic">
                                  {videoStatus?.phase === 'analyzing' ? 'Decimating streams...' : videoStatus?.phase === 'encoding' ? `Encoding H.264 via ${videoStatus?.hwUsed?.toUpperCase() || 'CPU'}...` : 'Merging intro/outro cards...'}
                               </p>
                            </div>
                          )}
                          
                          {/* Success Card */}
                          {(videoStatus?.status === 'done' || videoStatus?.status === 'completed') && !processingVideo && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-green-500/10 border border-green-500/20 rounded-3xl text-center">
                               <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 text-green-400">
                                 <CheckCircle2 size={24} />
                               </div>
                               <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-1 italic">Master Encoded</h5>
                               <p className="text-[8px] font-bold text-green-400/60 uppercase tracking-widest mb-6">{videoStatus.sizeMB || 'Master'}MB • Precision Output</p>
                               <button 
                                 onClick={() => {
                                   const link = document.createElement('a');
                                   link.href = resultVideoUrl;
                                   link.download = `OnlinePT_Master_${Date.now()}.mp4`;
                                   document.body.appendChild(link);
                                   link.click();
                                   document.body.removeChild(link);
                                 }}
                                 className="w-full py-3.5 bg-green-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-green-400 transition-all shadow-lg shadow-green-500/10 flex items-center justify-center gap-3"
                               >
                                 <Download size={14} /> Download Final
                               </button>
                            </motion.div>
                          )}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}
 