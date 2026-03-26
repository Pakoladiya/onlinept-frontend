import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import clinicConfig, { derivedConfig } from '@/config/clinicConfig';
import {
  Video,
  Clock,
  AlertCircle,
  ExternalLink,
  Copy,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Wifi,
  Mic,
  Camera,
  Volume2,
  Check,
} from 'lucide-react';

const videoModeLabels = { zoom: 'Zoom Meeting', meet: 'Google Meet', whatsapp: 'WhatsApp Video Call' };

const techChecks = [
  { id: 'camera', icon: Camera, label: 'Camera access allowed', desc: 'Allow camera when prompted' },
  { id: 'mic', icon: Mic, label: 'Microphone access allowed', desc: 'Allow mic for voice consultation' },
  { id: 'wifi', icon: Wifi, label: 'Stable internet connection', desc: 'Close other bandwidth-heavy apps' },
  { id: 'audio', icon: Volume2, label: 'Headphones recommended', desc: 'Use headphones to reduce echo' },
];

function getSessionStatus(sessionTime) {
  const now = new Date();
  const diff = sessionTime - now;
  if (diff <= 0) return 'live';
  if (diff <= 15 * 60 * 1000) return 'soon';
  return 'upcoming';
}

function getCountdownParts(ms) {
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { d, h, m, s };
}

export default function JoinSessionPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [techOpen, setTechOpen] = useState(false);
  const [preChecks, setPreChecks] = useState(() => {
    const saved = localStorage.getItem(`precheck_${bookingId}`);
    return saved ? JSON.parse(saved) : { camera: false, mic: false, wifi: true, audio: false };
  });

  useEffect(() => {
    localStorage.setItem(`precheck_${bookingId}`, JSON.stringify(preChecks));
  }, [preChecks, bookingId]);

  const toggleCheck = (id) => setPreChecks((p) => ({ ...p, [id]: !p[id] }));

  // Session time: stored in localStorage during booking, fallback to tomorrow 10am
  const [sessionTime] = useState(() => {
    const stored = localStorage.getItem(`session_${bookingId}`);
    return stored ? new Date(stored) : (() => {
      const t = new Date();
      t.setDate(t.getDate() + 1);
      t.setHours(10, 0, 0, 0);
      return t;
    })();
  });

  const [countdown, setCountdown] = useState('');
  const [status, setStatus] = useState('upcoming');

  useEffect(() => {
    const tick = () => {
      const diff = sessionTime - new Date();
      setStatus(getSessionStatus(sessionTime));
      if (diff <= 0) {
        setCountdown('Session is live');
        return;
      }
      const parts = getCountdownParts(diff);
      if (parts.d > 0) {
        setCountdown(`${parts.d}d ${String(parts.h).padStart(2, '0')}h ${String(parts.m).padStart(2, '0')}m`);
      } else {
        setCountdown(`${String(parts.h).padStart(2, '0')}:${String(parts.m).padStart(2, '0')}:${String(parts.s).padStart(2, '0')}`);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sessionTime]);

  const [meetingLink] = useState(() => {
    if (clinicConfig.videoMode === 'zoom') return `https://zoom.us/j/mock-${bookingId}`;
    if (clinicConfig.videoMode === 'meet') return `https://meet.google.com/mock-${bookingId}`;
    return derivedConfig.whatsappLink;
  });

  const copyLink = () => {
    navigator.clipboard.writeText(meetingLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const statusConfig = {
    upcoming: { label: 'Upcoming', variant: 'default', color: clinicConfig.primaryColor },
    soon: { label: 'Starting Soon', variant: 'warning', color: '#F6A000' },
    live: { label: 'Live Now', variant: 'primary', color: clinicConfig.primaryColor },
    ended: { label: 'Session Ended', variant: 'default', color: '#9ca3af' },
  };
  const sc = statusConfig[status];

  const handleJoin = () => {
    window.open(meetingLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <PageWrapper>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={sc.variant} size="sm">{sc.label}</Badge>
          <span className="text-xs text-text-secondary">Booking #{bookingId}</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Join Your Session</h1>
        <p className="text-sm text-text-secondary mt-1">
          Your consultation with {clinicConfig.physioName}
        </p>
      </div>

      {/* Countdown */}
      <Card className="text-center mb-5" style={{ borderColor: status === 'live' ? clinicConfig.primaryColor : 'transparent', border: status === 'live' ? '2px solid' : '1px solid' }}>
        {status === 'live' ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center animate-pulse" style={{ backgroundColor: `${clinicConfig.primaryColor}20` }}>
              <Video size={28} style={{ color: clinicConfig.primaryColor }} />
            </div>
            <p className="text-xl font-bold" style={{ color: clinicConfig.primaryColor }}>Your session is live!</p>
            <p className="text-sm text-text-secondary">Click "Join Now" to enter the consultation</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-text-secondary uppercase tracking-wide mb-2">Session starts in</p>
            <div className="text-4xl font-bold font-mono mb-2" style={{ color: sc.color }}>
              {countdown}
            </div>
            <p className="text-sm text-text-secondary">
              {sessionTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} at{' '}
              {sessionTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </>
        )}
      </Card>

      {/* Preparation Checklist */}
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <CheckCircle size={16} style={{ color: clinicConfig.primaryColor }} />
            Preparation Checklist
          </h2>
          <span className="text-xs text-text-secondary">
            {Object.values(preChecks).filter(Boolean).length}/{Object.keys(preChecks).length} done
          </span>
        </div>
        <div className="space-y-3">
          {techChecks.map(({ id, icon: Icon, label, desc }) => (
            <button
              key={id}
              onClick={() => toggleCheck(id)}
              className="w-full flex items-center gap-3 text-left"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                style={{ backgroundColor: preChecks[id] ? `${clinicConfig.primaryColor}20` : 'var(--color-surface, #f9fafb)' }}
              >
                {preChecks[id] ? (
                  <Check size={16} style={{ color: clinicConfig.primaryColor }} />
                ) : (
                  <Icon size={16} className="text-text-secondary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${preChecks[id] ? 'text-text-primary' : 'text-text-secondary'}`}>{label}</p>
                <p className="text-xs text-text-secondary">{desc}</p>
              </div>
              <div
                className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                style={{ borderColor: preChecks[id] ? clinicConfig.primaryColor : 'var(--color-border, #e5e7eb)', backgroundColor: preChecks[id] ? clinicConfig.primaryColor : 'transparent' }}
              >
                {preChecks[id] && <Check size={11} className="text-white" />}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Join card */}
      <Card className="mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${clinicConfig.primaryColor}15` }}
          >
            <Video size={20} style={{ color: clinicConfig.primaryColor }} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">{videoModeLabels[clinicConfig.videoMode]}</h2>
            <p className="text-xs text-text-secondary">
              {status === 'ended' ? 'Session has ended' : 'Click to join your video consultation'}
            </p>
          </div>
        </div>

        {status !== 'ended' ? (
          <>
            <Button size="lg" fullWidth onClick={handleJoin} disabled={status === 'upcoming'}>
              <ExternalLink size={18} />
              {status === 'live' ? 'Join Now' : 'Join When Ready'}
            </Button>
            <button
              onClick={copyLink}
              className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
            >
              {copied ? <CheckCircle size={14} className="text-success" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy meeting link'}
            </button>
          </>
        ) : (
          <Button size="lg" fullWidth variant="ghost" onClick={() => navigate('/')}>
            <RefreshCw size={16} /> Back to Home
          </Button>
        )}
      </Card>

      {/* Tech issues accordion */}
      <Card className="mb-5">
        <button
          onClick={() => setTechOpen((o) => !o)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-warning" />
            <span className="text-sm font-medium text-text-primary">Technical issues?</span>
          </div>
          {techOpen ? <ChevronUp size={15} className="text-text-secondary" /> : <ChevronDown size={15} className="text-text-secondary" />}
        </button>
        {techOpen && (
          <div className="mt-4 space-y-3">
            {[
              { q: 'Camera not working', a: 'Go to browser settings → Site permissions → Camera. Allow access and refresh.' },
              { q: 'Cannot hear audio', a: 'Check system volume. Make sure the correct audio output device is selected in Zoom/Meet settings.' },
              { q: 'Connection drops', a: 'Move closer to your WiFi router. Close video streaming apps. Try a wired connection if available.' },
              { q: 'Still having trouble', a: `Call us at ${clinicConfig.phone} and we'll help you join manually.` },
            ].map(({ q, a }) => (
              <div key={q} className="text-sm">
                <p className="font-medium text-text-primary mb-1">{q}</p>
                <p className="text-text-secondary">{a}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Tips */}
      <Card>
        <h3 className="font-semibold text-text-primary mb-3">Before You Join</h3>
        <ul className="space-y-2">
          {[
            'Find a quiet, well-lit space with good internet',
            'Wear comfortable clothing for physical assessment',
            'Have your medical history and medications ready',
            `Your ${clinicConfig.slotDurationMinutes || 30}-minute consultation with ${clinicConfig.physioName}`,
            'Questions or concerns? Call us anytime',
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-sm text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: clinicConfig.primaryColor }} />
              {tip}
            </li>
          ))}
        </ul>
      </Card>
    </PageWrapper>
  );
}
