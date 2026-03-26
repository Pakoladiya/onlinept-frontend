import { useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import clinicConfig from '@/config/clinicConfig';
import { derivedConfig } from '@/config/clinicConfig';
import {
  CheckCircle,
  Video,
  MessageCircle,
  Calendar,
  Clock,
  Download,
  Home,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';

/**
 * ConfirmationPage — Booking confirmed with .ics calendar export + WhatsApp share.
 */
export default function ConfirmationPage() {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { demo } = location.state || {};

  const booking = {
    id: bookingId,
    date: new Date(Date.now() + 86400000), // tomorrow
    time: '10:00',
    serviceName: location.state?.serviceName || 'Initial Consultation',
    serviceDuration: location.state?.serviceDuration || clinicConfig.slotDurationMinutes,
    videoMode: clinicConfig.videoMode,
    status: demo ? 'demo' : 'confirmed',
  };

  const meetingUrl = `/join/${bookingId}`;
  const [copied, setCopied] = useState(false);

  const generateICS = () => {
    const start = new Date(`${booking.date.toISOString().split('T')[0]}T${booking.time}:00`);
    const end = new Date(start.getTime() + booking.serviceDuration * 60000);
    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (d) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PhysioConsult//EN',
      'BEGIN:VEVENT',
      `UID:${bookingId}@physioconsult`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${clinicConfig.clinicName} - ${booking.serviceName}`,
      `DESCRIPTION:Physiotherapy consultation with ${clinicConfig.physioName}. Join: ${window.location.origin}${meetingUrl}`,
      `LOCATION:${clinicConfig.videoMode === 'zoom' ? 'Zoom' : clinicConfig.videoMode === 'meet' ? 'Google Meet' : 'WhatsApp'}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `physio-consultation-${bookingId}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyBookingId = () => {
    navigator.clipboard.writeText(bookingId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const whatsappText = encodeURIComponent(
    `Hi! I just booked a physiotherapy consultation with ${clinicConfig.clinicName} for ${booking.date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} at ${booking.time}. Booking ID: ${bookingId}. Looking forward to it!`
  );

  const videoLabel =
    clinicConfig.videoMode === 'zoom' ? 'Zoom' :
    clinicConfig.videoMode === 'meet' ? 'Google Meet' : 'WhatsApp Video';

  return (
    <PageWrapper>
      {/* Success header */}
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center animate-bounce"
          style={{ backgroundColor: `${clinicConfig.primaryColor}15` }}
        >
          <CheckCircle size={32} style={{ color: clinicConfig.primaryColor }} />
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          {demo ? 'Demo Confirmed!' : 'Booking Confirmed!'}
        </h1>
        <p className="text-sm text-text-secondary">
          {demo
            ? 'This is a demo booking. In production, your slot would be reserved and a meeting created.'
            : 'Your consultation is booked. A confirmation has been sent.'}
        </p>
        <button onClick={copyBookingId} className="mt-2 flex items-center gap-1.5 mx-auto text-xs text-text-secondary hover:text-primary transition-colors">
          {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
          {copied ? 'Copied!' : `Booking ID: ${bookingId}`}
        </button>
      </div>

      {/* Booking Details Card */}
      <Card className="mb-5">
        <Badge variant={demo ? 'warning' : 'success'} size="md" className="mb-4">
          {demo ? 'Demo Mode' : 'Booking Confirmed'}
        </Badge>
        <div className="space-y-4">
          {[
            { icon: Calendar, label: 'Date', value: booking.date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
            { icon: Clock, label: 'Time', value: `${booking.time} · ${booking.serviceDuration} min` },
            { icon: Video, label: 'Platform', value: videoLabel },
            { icon: CheckCircle, label: 'Service', value: booking.serviceName },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${clinicConfig.primaryColor}15` }}>
                <Icon size={16} style={{ color: clinicConfig.primaryColor }} />
              </div>
              <div>
                <p className="text-xs text-text-secondary uppercase tracking-wide">{label}</p>
                <p className="text-sm font-medium text-text-primary">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Join Session Card */}
      {!demo && (
        <Card className="mb-5" style={{ border: `1px solid ${clinicConfig.primaryColor}` }}>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: clinicConfig.primaryColor }}>
              <Video size={22} className="text-white" />
            </div>
            <h2 className="font-semibold text-text-primary mb-1">Join Your Session</h2>
            <p className="text-sm text-text-secondary mb-4">
              Your {videoLabel} link will be active 5 minutes before your session.
            </p>
            <Link to={meetingUrl}>
              <Button fullWidth>
                <Video size={16} /> Go to Join Page
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Action buttons */}
      <div className="space-y-3 mb-5">
        {!demo && (
          <>
            <Button variant="outline" fullWidth onClick={generateICS}>
              <Calendar size={16} /> Add to Google Calendar
            </Button>
            <a
              href={`https://wa.me/${derivedConfig.whatsappClean}?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" fullWidth>
                <MessageCircle size={16} /> Share via WhatsApp
              </Button>
            </a>
          </>
        )}
        <Button variant="ghost" fullWidth onClick={() => navigate('/')}>
          <Home size={16} /> Back to Home
        </Button>
      </div>

      {/* What to expect */}
      <Card>
        <h3 className="font-semibold text-text-primary mb-3">Before Your Session</h3>
        <ul className="space-y-2">
          {[
            'Join via the link 5 minutes before your appointment',
            `Your ${booking.serviceDuration}-minute ${videoLabel} session`,
            'Have your medical history and current medications ready',
            'Wear comfortable clothing for physical assessment',
            'Find a quiet, well-lit space with good internet',
            `Questions? Call us at ${clinicConfig.phone}`,
          ].map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-text-secondary">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-medium text-xs text-white"
                style={{ backgroundColor: clinicConfig.primaryColor }}
              >
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ul>
      </Card>
    </PageWrapper>
  );
}
