import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuth } from '@/firebase/auth';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { whatsappLink } from '@/utils/whatsapp';
import {
  MessageSquare, Search, CheckSquare, Square, Send, Plus,
  Trash2, X, User, Loader2, Eye, Save, AlertCircle,
  CheckCircle2, FileText, Link as LinkIcon, ChevronDown, ChevronUp
} from 'lucide-react';

const VARIABLE_PILLS = [
  { label: '{patientName}', display: 'Patient Name' },
  { label: '{serviceName}', display: 'Service' },
  { label: '{nextAppointment}', display: 'Next Appointment' },
  { label: '{clinicName}', display: 'Clinic Name' },
  { label: '{resourceLink}', display: 'Resource Link' },
];

function expandMessageVariables(template, variables) {
  let text = template;
  for (const [key, value] of Object.entries(variables)) {
    text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), value || `[${key}]`);
  }
  return text;
}

export default function BulkMessagingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [clinicId, setClinicId] = useState('');

  // Patient state
  const [patients, setPatients] = useState([]);
  const [selectedPatients, setSelectedPatients] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Template state
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('__new__');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  // Resource attachment state
  const [showAttachResources, setShowAttachResources] = useState(false);
  const [attachResources, setAttachResources] = useState([]);
  const [resourceFiles, setResourceFiles] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);

  // Confirmation dialog
  const [confirmSend, setConfirmSend] = useState(false);

  useEffect(() => {
    const unsub = onAuth(async (u) => {
      if (!u) { navigate('/dashboard-login'); return; }
      setUser(u);

      try {
        // Get clinicId
        const clinicSnap = await getDocs(query(collection(db, 'clinics'), where('uid', '==', u.uid)));
        if (!clinicSnap.empty) {
          setClinicId(clinicSnap.docs[0].id);
        }

        // Fetch patients
        const patientSnap = await getDocs(query(collection(db, 'patients'), where('physioId', '==', u.uid)));
        const patientList = patientSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPatients(patientList);

        // Fetch saved templates
        const templateSnap = await getDocs(query(collection(db, 'message_templates'), where('uid', '==', u.uid)));
        const templates = templateSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSavedTemplates(templates);
      } catch (e) {
        console.error('Failed to load data:', e);
        showToast('Failed to load data.', 'error');
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  function togglePatient(id) {
    setSelectedPatients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    const filtered = filteredPatients;
    setSelectedPatients(new Set(filtered.map((p) => p.id)));
  }

  function deselectAll() {
    setSelectedPatients(new Set());
  }

  function insertVariable(variable) {
    setMessageTemplate((prev) => prev + variable);
  }

  async function handleSaveTemplate() {
    if (!messageTemplate.trim()) {
      showToast('Please enter a message before saving.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (selectedTemplateId && selectedTemplateId !== '__new__') {
        await updateDoc(doc(db, 'message_templates', selectedTemplateId), {
          name: templateName || 'Untitled Template',
          body: messageTemplate,
          updatedAt: serverTimestamp(),
        });
        setSavedTemplates((prev) =>
          prev.map((t) => t.id === selectedTemplateId ? { ...t, name: templateName, body: messageTemplate } : t)
        );
        showToast('Template updated.');
      } else {
        const { id } = await addDoc(collection(db, 'message_templates'), {
          uid: user.uid,
          name: templateName || 'Untitled Template',
          body: messageTemplate,
          createdAt: serverTimestamp(),
        });
        setSavedTemplates((prev) => [...prev, { id, name: templateName, body: messageTemplate }]);
        setSelectedTemplateId(id);
        showToast('Template saved.');
      }
    } catch (e) {
      console.error('Save template error:', e);
      showToast('Failed to save template.', 'error');
    }
    setSaving(false);
  }

  async function handleDeleteTemplate(id) {
    try {
      await deleteDoc(doc(db, 'message_templates', id));
      setSavedTemplates((prev) => prev.filter((t) => t.id !== id));
      if (selectedTemplateId === id) {
        setSelectedTemplateId('__new__');
        setMessageTemplate('');
        setTemplateName('');
      }
      showToast('Template deleted.');
    } catch (e) {
      showToast('Failed to delete template.', 'error');
    }
  }

  function handleTemplateChange(id) {
    setSelectedTemplateId(id);
    if (id === '__new__') {
      setMessageTemplate('');
      setTemplateName('');
    } else {
      const tmpl = savedTemplates.find((t) => t.id === id);
      if (tmpl) {
        setMessageTemplate(tmpl.body || '');
        setTemplateName(tmpl.name || '');
      }
    }
  }

  async function handleLoadResources() {
    if (!clinicId) return;
    setLoadingResources(true);
    try {
      const res = await fetch(`/api/storage/files/${clinicId}`);
      if (res.ok) {
        const files = await res.json();
        setResourceFiles(Array.isArray(files) ? files : []);
      } else {
        setResourceFiles([]);
      }
    } catch (e) {
      setResourceFiles([]);
    }
    setLoadingResources(false);
  }

  function toggleResource(file) {
    setAttachResources((prev) => {
      const next = [...prev];
      const idx = next.findIndex((r) => r.url === file.url);
      if (idx >= 0) next.splice(idx, 1);
      else next.push(file);
      return next;
    });
  }

  function getPreviewVariables() {
    const selected = patients.filter((p) => selectedPatients.has(p.id));
    const first = selected[0] || {};
    return {
      patientName: first.name || first.patientName || 'John Doe',
      serviceName: first.serviceName || first.service || 'Physiotherapy Session',
      nextAppointment: first.nextAppointment || first.nextSession || 'Not scheduled',
      clinicName: first.clinicName || 'Your Clinic',
      resourceLink: attachResources.map((r) => r.url).join('\n') || '',
    };
  }

  function getRenderedPreview() {
    const vars = getPreviewVariables();
    return expandMessageVariables(messageTemplate, vars);
  }

  function handlePreview() {
    setShowPreview(true);
  }

  function handleSendConfirm() {
    setConfirmSend(false);
    executeSend();
  }

  async function executeSend() {
    if (selectedPatients.size === 0) {
      showToast('Please select at least one patient.', 'error');
      return;
    }
    if (!messageTemplate.trim()) {
      showToast('Please enter a message.', 'error');
      return;
    }

    setSending(true);
    const selected = patients.filter((p) => selectedPatients.has(p.id));
    const vars = {
      patientName: '{patientName}',
      serviceName: '{serviceName}',
      nextAppointment: '{nextAppointment}',
      clinicName: '{clinicName}',
      resourceLink: attachResources.map((r) => r.url).join('\n') || '',
    };

    for (const patient of selected) {
      const patientVars = {
        patientName: patient.name || patient.patientName || 'Patient',
        serviceName: patient.serviceName || patient.service || 'Physiotherapy Session',
        nextAppointment: patient.nextAppointment || patient.nextSession || 'Not scheduled',
        clinicName: patient.clinicName || 'Your Clinic',
        resourceLink: vars.resourceLink,
      };
      const text = expandMessageVariables(messageTemplate, patientVars);
      const phone = patient.phone || patient.phoneNumber || '';
      const link = whatsappLink(text, phone);
      window.open(link, '_blank');
      // Small delay between opens to avoid browser blocking
      await new Promise((r) => setTimeout(r, 600));
    }

    showToast(`Opened WhatsApp for ${selected.length} patient(s).`);
    setSending(false);
  }

  function handleSend() {
    if (selectedPatients.size > 1) {
      setConfirmSend(true);
    } else {
      executeSend();
    }
  }

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase();
    const name = (p.name || p.patientName || '').toLowerCase();
    const phone = (p.phone || p.phoneNumber || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || email.includes(q);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-top-5 duration-300 ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.message}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmSend && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Confirm Bulk Send</h3>
            <p className="text-sm text-gray-400 mb-6">
              You are about to open WhatsApp for <span className="text-white font-semibold">{selectedPatients.size} patients</span>. Continue?
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" fullWidth onClick={() => setConfirmSend(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" fullWidth onClick={handleSendConfirm}>
                <Send size={14} /> Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Bulk Messaging</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Send personalized WhatsApp messages to your patients
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedPatients.size > 0 && (
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold border border-primary/30">
                {selectedPatients.size} selected
              </span>
            )}
            <Button
              variant="primary"
              size="sm"
              loading={sending}
              disabled={selectedPatients.size === 0 || !messageTemplate.trim()}
              onClick={handleSend}
            >
              <Send size={14} /> Send via WhatsApp
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Left: Patient List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-gray-900 border border-gray-800 rounded-2xl p-0 overflow-hidden">
              {/* Search */}
              <div className="p-4 border-b border-gray-800">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patients..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                {/* Bulk select */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={selectAll}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    <CheckSquare size={13} /> Select All
                  </button>
                  <span className="text-gray-700">|</span>
                  <button
                    onClick={deselectAll}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    <Square size={13} /> Deselect All
                  </button>
                  <span className="ml-auto text-xs text-gray-500">
                    {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Patient List */}
              <div className="divide-y divide-gray-800 max-h-[500px] overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <div className="py-10 text-center text-gray-500 text-sm">
                    {searchQuery ? 'No patients match your search.' : 'No patients found.'}
                  </div>
                ) : (
                  filteredPatients.map((patient) => {
                    const isSelected = selectedPatients.has(patient.id);
                    const name = patient.name || patient.patientName || 'Unknown Patient';
                    const phone = patient.phone || patient.phoneNumber || '';
                    return (
                      <label
                        key={patient.id}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800/50 transition-colors ${
                          isSelected ? 'bg-primary/5' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePatient(patient.id)}
                          className="accent-primary w-4 h-4"
                        />
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <User size={14} className="text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white font-medium truncate">{name}</p>
                          <p className="text-xs text-gray-500 truncate">{phone || 'No phone'}</p>
                        </div>
                        {isSelected && <CheckCircle2 size={14} className="text-primary shrink-0" />}
                      </label>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Right: Message Composer */}
          <div className="lg:col-span-3 space-y-6">

            {/* Template Selector */}
            <Card className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-primary" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wide">Message Template</h2>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-white text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="__new__">+ New Message</option>
                    {savedTemplates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name || 'Untitled'}</option>
                    ))}
                  </select>
                  {selectedTemplateId && selectedTemplateId !== '__new__' && (
                    <button
                      onClick={() => handleDeleteTemplate(selectedTemplateId)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Template name (for new) */}
              {selectedTemplateId === '__new__' && (
                <div className="mb-3">
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Template name (optional)"
                    className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              {/* Variable pills */}
              <div className="flex flex-wrap gap-2 mb-3">
                {VARIABLE_PILLS.map((vp) => (
                  <button
                    key={vp.label}
                    onClick={() => insertVariable(vp.label)}
                    className="px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/25 transition-colors"
                  >
                    {vp.display}
                  </button>
                ))}
              </div>

              {/* Message textarea */}
              <textarea
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder="Type your message here... Use variable pills above to personalize."
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary resize-none transition-colors"
              />

              {/* Save template button */}
              <div className="flex justify-end mt-3">
                <Button variant="outline" size="sm" loading={saving} onClick={handleSaveTemplate}>
                  <Save size={13} /> Save Template
                </Button>
              </div>
            </Card>

            {/* Attach Resources */}
            <Card className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <button
                onClick={() => {
                  setShowAttachResources(!showAttachResources);
                  if (!showAttachResources && resourceFiles.length === 0) handleLoadResources();
                }}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <LinkIcon size={16} className="text-primary" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wide">Attach Resources</h2>
                  {attachResources.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                      {attachResources.length}
                    </span>
                  )}
                </div>
                {showAttachResources ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </button>

              {showAttachResources && (
                <div className="mt-4 space-y-3">
                  {loadingResources ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 size={20} className="animate-spin text-primary" />
                    </div>
                  ) : resourceFiles.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No resources found for this clinic.</p>
                  ) : (
                    resourceFiles.map((file, i) => {
                      const isAttached = attachResources.some((r) => r.url === file.url);
                      return (
                        <label
                          key={i}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                            isAttached
                              ? 'border-primary bg-primary/10'
                              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isAttached}
                            onChange={() => toggleResource(file)}
                            className="accent-primary"
                          />
                          <FileText size={13} className="text-gray-400 shrink-0" />
                          <span className="text-xs text-white truncate flex-1">{file.name || file.url?.split('/').pop()}</span>
                        </label>
                      );
                    })
                  )}
                  {attachResources.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">Attached:</p>
                      <div className="flex flex-wrap gap-2">
                        {attachResources.map((r, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs"
                          >
                            <LinkIcon size={10} />
                            {r.name || r.url?.split('/').pop()}
                            <button onClick={() => toggleResource(r)} className="hover:text-red-400">
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Preview */}
            {showPreview && (
              <Card className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Eye size={16} className="text-primary" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wide">Message Preview</h2>
                  </div>
                  <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
                {selectedPatients.size === 0 ? (
                  <p className="text-xs text-gray-500">Select at least one patient to preview.</p>
                ) : (
                  <div className="space-y-3">
                    {patients
                      .filter((p) => selectedPatients.has(p.id))
                      .slice(0, 5)
                      .map((patient) => {
                        const vars = {
                          patientName: patient.name || patient.patientName || 'Patient',
                          serviceName: patient.serviceName || patient.service || 'Physiotherapy Session',
                          nextAppointment: patient.nextAppointment || patient.nextSession || 'Not scheduled',
                          clinicName: patient.clinicName || 'Your Clinic',
                          resourceLink: attachResources.map((r) => r.url).join('\n') || '',
                        };
                        const rendered = expandMessageVariables(messageTemplate, vars);
                        return (
                          <div key={patient.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                            <div className="flex items-center gap-2 mb-2">
                              <User size={12} className="text-gray-500" />
                              <span className="text-xs text-gray-400 font-semibold">
                                {patient.name || patient.patientName}
                              </span>
                            </div>
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                              {rendered || <span className="text-gray-600 italic">Empty message</span>}
                            </pre>
                          </div>
                        );
                      })}
                    {selectedPatients.size > 5 && (
                      <p className="text-xs text-gray-600 text-center">
                        + {selectedPatients.size - 5} more patient(s)...
                      </p>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye size={13} /> Preview Message
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={sending}
                disabled={selectedPatients.size === 0 || !messageTemplate.trim()}
                onClick={handleSend}
              >
                <Send size={13} /> Send via WhatsApp
              </Button>
            </div>

            {/* Help text */}
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-500">
              <AlertCircle size={13} className="shrink-0 mt-0.5 text-gray-600" />
              <span>
                Variables like <code className="text-gray-400 font-mono">{'{patientName}'}</code> will be replaced with actual patient data.
                Attach resources to include download links in your messages.
                Each patient&apos;s WhatsApp will open in a new tab.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
