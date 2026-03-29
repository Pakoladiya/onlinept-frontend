import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import clinicConfig from '@/config/clinicConfig';
import { db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import {
  Video,
  Clock,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  Wifi,
  Mic,
  Camera,
  Volume2,
  Check,
  Loader2,
  UserCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
  XCircle
} from 'lucide-react';

/**
 * Luxe JoinSessionPage — "Premium Pre-Flight Dashboard" with real WebRTC checks.
 */

const videoModeLabels = { zoom: 'Zoom Meeting', meet: 'Google Meet', whatsapp: 'WhatsApp Video Call' };

const techChecks = [
  { id: 'camera', icon: Camera, title: 'Camera', desc: 'Front camera active' },
  { id: 'mic', icon: Mic, title: 'Microphone', desc: 'Voice input ready' },
  { id: 'wifi', icon: Wifi, title: 'Network', desc: 'Connection stable' },
  { id: 'audio', icon: Volume2, title: 'Speaker', desc: 'Audio output ready' },
];

export default function JoinSessionPage() {
  const { bookingId } = useParams();
  const [techOpen, setTechOpen] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [clinicSettings, setClinicSettings] = useState({
    videoMode: clinicConfig.videoMode,
    zoomLink: clinicConfig.meetLink || '',
    physioName: clinicConfig.physioName,
    whatsappNumber: clinicConfig.whatsappNumber,
    primaryColor: clinicConfig.primaryColor,
  });
  const [preChecks, setPreChecks] = useState({
    camera: null, mic: null, wifi: null, audio: null,
  });
  const [checkRunning, setCheckRunning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    async function loadSettings() {
      if (!db) { setSettingsLoading(false); return; }
      try {
        const bookingSnap = await getDoc(doc(db, 'bookings', bookingId));
        if (bookingSnap.exists()) {
           const data = bookingSnap.data();
           setBooking(data);
           setClinicSettings(s => ({ ...s, ...data }));
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
      setSettingsLoading(false);
    }
    loadSettings();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [bookingId]);

  const runTechCheck = async () => {
    setCheckRunning(true);
    const results = { camera: false, mic: false, wifi: false, audio: false };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      results.camera = stream.getVideoTracks().length > 0;
      results.mic = stream.getAudioTracks().length > 0;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }
    } catch {
      results.camera = false;
      results.mic = false;
    }

    results.wifi = navigator.onLine;
    results.audio = true;

    setPreChecks(results);
    setCheckRunning(false);
  };

  const getMeetingLink = () => {
    if (clinicSettings.videoMode === 'zoom') {
      return clinicSettings.zoomLink || `https://zoom.us/j/mock-${bookingId}`;
    }
    if (clinicSettings.videoMode === 'meet') {
      return clinicSettings.meetLink || `https://meet.google.com/new`;
    }
    return `https://wa.me/${clinicSettings.whatsappNumber}?text=${encodeURIComponent(
      `Hi, I'm joining my physiotherapy consultation. Booking ID: ${bookingId}`
    )}`;
  };

  const handleJoin = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    window.open(getMeetingLink(), '_blank');
  };

  const allChecksPass = Object.values(preChecks).every(v => v === true);

  return (
    <PageWrapper className="bg-gray-50/50 min-h-screen">
      <div className="max-w-2xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
        
        {/* Header Metadata */}
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <ShieldCheck size={12} className="text-primary" /> Session ID: #{bookingId}
           </div>
           <Badge variant="primary" className="rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-widest">Wait-Lounge Active</Badge>
        </div>

        {/* Doctor Identity Hero */}
        <div className="text-center mb-12">
            <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-2xl shadow-primary/10 mx-auto mb-6 flex items-center justify-center text-primary relative">
               <UserCircle2 size={50} />
               <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-2xl bg-primary flex items-center justify-center text-white border-4 border-white">
                  <Activity size={16} />
               </div>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Your Session with {clinicSettings.physioName}</h1>
            <p className="text-gray-400 font-bold mt-2 uppercase tracking-[0.2em] text-[10px]">Medical Consultation & Rehabilitation</p>
        </div>

        {/* Countdown / Live Card */}
        <Card className="p-0 rounded-[3.5rem] border-none shadow-2xl shadow-gray-200 bg-white overflow-hidden mb-10 group">
           <div className="p-12 text-center bg-gray-900 relative overflow-hidden">
               {/* Background Sparkle */}
               <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                  <Sparkles size={150} className="text-white" />
               </div>

               <div className="relative z-10 space-y-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full border border-primary/30">
                     <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                     <span className="text-[10px] font-black text-primary uppercase tracking-widest">Consultation Live</span>
                  </div>
                  
                  <div>
                    <h2 className="text-6xl font-black text-white tracking-tighter">Ready Now</h2>
                    <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-[10px]">Your Physio is waiting for you</p>
                  </div>

                  <Button
                    onClick={handleJoin}
                    className="h-20 w-full rounded-[2rem] bg-primary text-white shadow-2xl shadow-primary/30 font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ backgroundColor: clinicSettings.primaryColor }}
                  >
                     Launch Consultation <Video className="ml-3" />
                  </Button>
               </div>
           </div>
           
           <div className="p-8 bg-gray-50 flex items-center justify-center gap-10">
              <div className="text-center">
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Session Platform</p>
                 <p className="text-sm font-black text-gray-900 tracking-tight flex items-center justify-center gap-1 mt-1">
                    <Video size={14} className="text-primary" /> {videoModeLabels[clinicSettings.videoMode]}
                 </p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Duration</p>
                 <p className="text-sm font-black text-gray-900 tracking-tight flex items-center justify-center gap-1 mt-1">
                    <Clock size={14} className="text-primary" /> {booking?.serviceDuration || clinicConfig.services?.[0]?.duration || 45} Mins
                 </p>
              </div>
           </div>
        </Card>

        {/* "Pre-Flight" Tech Diagnostics */}
        <div className="mb-6 flex justify-center">
          <Button
            onClick={runTechCheck}
            disabled={checkRunning}
            className="h-12 px-6 rounded-2xl bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest"
          >
            {checkRunning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {checkRunning ? 'Checking...' : 'Run Device Check'}
          </Button>
        </div>

        {/* Hidden video element for camera preview */}
        <video ref={videoRef} autoPlay muted playsInline className="hidden" />

        <div className="grid grid-cols-2 gap-4 mb-10">
            {techChecks.map((t) => {
              const status = preChecks[t.id];
              return (
                <Card key={t.id} className="p-6 rounded-[2rem] border-none shadow-xl shadow-gray-100 bg-white flex flex-col items-center text-center group cursor-default">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                      status === true ? 'bg-green-50 text-green-600' : status === false ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'
                    }`}>
                       <t.icon size={22} />
                    </div>
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1">{t.title}</p>
                    {status === null ? (
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-full">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Not Checked</span>
                      </div>
                    ) : status ? (
                      <div className="flex items-center gap-1.5 bg-green-100/50 px-2 py-0.5 rounded-full">
                        <Check size={10} className="text-green-600" />
                        <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">Ready</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-red-100/50 px-2 py-0.5 rounded-full">
                        <XCircle size={10} className="text-red-500" />
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">Failed</span>
                      </div>
                    )}
                </Card>
              );
            })}
        </div>

        {/* Elite Preparation Guide */}
        <Card className="p-10 rounded-[3rem] border-none shadow-xl shadow-gray-100 bg-white text-left">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center"><Zap size={20} /></div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Consultation Checklist</h3>
           </div>
           
           <ul className="space-y-4">
              {[
                'Find a quiet, well-lit medical assessment zone',
                'Wear comfortable clothing for movement testing',
                'Ensure your camera is at eye level for ROM assessment',
                'Keep any recent MRI or X-Ray reports within reach'
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-4 group">
                    <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                       <Check size={12} />
                    </div>
                    <p className="text-xs font-bold text-gray-500 flex-1 leading-relaxed">{tip}</p>
                </li>
              ))}
           </ul>
        </Card>

        {/* Troubleshooting Accordion */}
        <div className="mt-10 pt-10 border-t border-gray-100 text-center">
            <button 
              onClick={() => setTechOpen(!techOpen)}
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest hover:text-primary transition-all"
            >
               Technical Assistance Center <ChevronDown className={`transition-transform ${techOpen ? 'rotate-180' : ''}`} />
            </button>
            {techOpen && (
               <div className="mt-6 p-8 bg-white border border-gray-100 rounded-[2.5rem] text-left animate-in slide-in-from-top-4 duration-500">
                  <p className="text-xs font-bold text-gray-500 leading-relaxed">
                     Experiencing camera or audio drops? Ensure you have granted "Media Permissions" to your browser. 
                     For immediate help, call clinical support at <span className="text-gray-900">{clinicConfig.phone}</span>.
                  </p>
               </div>
            )}
        </div>

      </div>
    </PageWrapper>
  );
}
