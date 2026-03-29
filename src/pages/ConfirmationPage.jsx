import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import clinicConfig, { derivedConfig } from '@/config/clinicConfig';
import {
  CheckCircle2,
  Video,
  MessageCircle,
  Calendar,
  Clock,
  Download,
  Home,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  Smartphone,
  Info
} from 'lucide-react';

/**
 * Luxe ConfirmationPage — Designed as a "Premium Digital Ticket".
 * Optimized for celebration, clarity, and conversion.
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

  // SEO Meta Update
  useEffect(() => {
    document.title = `Booking Confirmed | Physio On Web`;
  }, []);

  const generateICS = () => {
    const start = new Date(`${booking.date.toISOString().split('T')[0]}T${booking.time}:00`);
    const end = new Date(start.getTime() + booking.serviceDuration * 60000);
    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (d) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PhysioOnWeb//EN',
      'BEGIN:VEVENT',
      `UID:${bookingId}@physioonweb`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:Physio On Web - ${booking.serviceName}`,
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
    clinicConfig.videoMode === 'zoom' ? 'Zoom Meeting' :
    clinicConfig.videoMode === 'meet' ? 'Google Meet' : 'WhatsApp Video';

  return (
    <PageWrapper className="bg-gray-50/50 min-h-screen">
      <div className="max-w-4xl mx-auto py-12 px-6">
        
        {/* Success Header (Elite Animation) */}
        <div className="text-center mb-16 animate-in zoom-in-95 duration-500">
          <div className="relative inline-block mb-8">
             <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150 animate-pulse" />
             <div 
               className="relative w-24 h-24 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl shadow-primary/30"
               style={{ backgroundColor: clinicConfig.primaryColor }}
             >
                <CheckCircle2 size={48} className="text-white" />
             </div>
             <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-xl flex items-center justify-center text-primary animate-bounce">
                <Sparkles size={20} />
             </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-3">
             {demo ? 'Launch Activated!' : 'You\'re All Set!'}
          </h1>
          <p className="text-lg text-gray-500 font-bold max-w-lg mx-auto leading-relaxed">
             {demo 
               ? 'This is a demo booking. In production, your session would be live now.' 
               : 'Your expert physiotherapy session is confirmed. Let\'s start your journey to recovery.'}
          </p>
          <button 
            onClick={copyBookingId} 
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary hover:border-primary transition-all shadow-sm"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? 'Link Copied!' : `Booking ID: ${bookingId}`}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Laterial Ticket Area */}
          <div className="md:col-span-12 lg:col-span-8 space-y-10">
            
            {/* The Digital Ticket (Perforated Style) */}
            <div className="relative group">
               {/* Left and Right Perforations (Visual Design) */}
               <div className="absolute top-1/2 -left-4 w-8 h-8 rounded-full bg-gray-50 z-10 -translate-y-1/2 border-r border-[#eee]" />
               <div className="absolute top-1/2 -right-4 w-8 h-8 rounded-full bg-gray-50 z-10 -translate-y-1/2 border-l border-[#eee]" />
               
               <Card className="p-0 border-none rounded-[3.5rem] overflow-hidden shadow-2xl shadow-gray-200/50 bg-white">
                  <div className="p-10 border-b-2 border-dashed border-gray-100 relative">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-2">
                        <Zap size={12} className="text-primary" /> Session Entry Pass
                     </p>
                     <div className="flex justify-between items-start gap-10">
                        <div className="space-y-1 text-left">
                           <h2 className="text-3xl font-black text-gray-900 leading-tight">{booking.serviceName}</h2>
                           <p className="text-sm font-bold text-gray-400">{clinicConfig.physioName} · {booking.serviceDuration} Min</p>
                        </div>
                        <div className="shrink-0 text-right">
                           <p className="text-xs font-black uppercase text-gray-400 mb-1">Status</p>
                           <Badge variant={demo ? 'warning' : 'success'} size="lg" className="rounded-xl px-4 py-2 text-[10px] font-black uppercase">Confirmed</Badge>
                        </div>
                     </div>
                  </div>
                  
                  <div className="p-10 grid grid-cols-1 sm:grid-cols-2 gap-10 bg-gray-50/10">
                     <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary"><Calendar size={20} /></div>
                        <div>
                           <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Appointment Date</p>
                           <p className="text-sm font-black text-gray-900">{booking.date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary"><Clock size={20} /></div>
                        <div>
                           <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Consultation Time</p>
                           <p className="text-sm font-black text-gray-900">{booking.time} AM (India Time)</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary"><Video size={20} /></div>
                        <div>
                           <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Live Platform</p>
                           <p className="text-sm font-black text-gray-900">{videoLabel}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 text-left">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary"><Smartphone size={20} /></div>
                        <div>
                           <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Mobile Support</p>
                           <p className="text-sm font-black text-gray-900">Push Notifications ON</p>
                        </div>
                     </div>
                  </div>
               </Card>
            </div>

            {/* Preparation Checklist */}
            <div className="space-y-6 text-left">
               <p className="text-xs font-black uppercase tracking-widest text-gray-400 pl-4 border-l-2 border-primary">Preparation Checklist</p>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { text: 'Wear comfortable exercise clothing', icon: '👕' },
                    { text: 'Find a well-lit, quiet room', icon: '💡' },
                    { text: 'Ensure high-speed stable internet', icon: '📶' },
                    { text: 'Keep medical reports handy', icon: '📋' },
                  ].map((tip, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-gray-100 shadow-sm">
                       <span className="text-2xl">{tip.icon}</span>
                       <p className="text-xs font-bold text-gray-600 leading-snug">{tip.text}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Sticky Actions Sidebar */}
          <div className="md:col-span-12 lg:col-span-4 space-y-6">
             <Card className="p-8 rounded-[3rem] bg-gray-900 text-white border-none shadow-2xl shadow-gray-900/40">
                <div className="w-16 h-16 rounded-[2rem] flex items-center justify-center mb-6" style={{ backgroundColor: clinicConfig.primaryColor }}>
                   <Video size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-black mb-2 tracking-tight">Access Virtual Room</h3>
                <p className="text-gray-400 text-sm font-bold mb-8 leading-relaxed">Your secure room opens 5 minutes before scheduled time.</p>
                <Link to={meetingUrl}>
                   <Button fullWidth className="h-16 rounded-[1.8rem] shadow-2xl shadow-primary/20 bg-white text-gray-900 hover:bg-white/90">
                      Join Live Session <ArrowRight size={18} className="ml-2" />
                   </Button>
                </Link>
             </Card>

             <div className="space-y-4">
                <Button variant="outline" fullWidth onClick={generateICS} className="h-14 rounded-2xl border-gray-200">
                   <Calendar size={18} className="mr-2" /> Google Calendar
                </Button>
                <a
                  href={`https://wa.me/${derivedConfig.whatsappClean}?text=${whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" fullWidth className="h-14 rounded-2xl border-gray-200">
                    <MessageCircle size={18} className="mr-2" /> Share via WhatsApp
                  </Button>
                </a>
                <Button variant="ghost" fullWidth onClick={() => navigate('/')} className="h-14 rounded-2xl text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                   <Home size={18} className="mr-2" /> Go to Home
                </Button>
             </div>

             <div className="p-6 bg-yellow-50/50 rounded-3xl border border-yellow-100">
                <div className="flex items-center gap-3 text-yellow-700 font-black uppercase text-[10px] tracking-widest mb-2">
                   <Info size={14} /> Need Help?
                </div>
                <p className="text-[11px] text-yellow-800/80 font-medium leading-relaxed">
                   If you need to reschedule or cancel, please contact the clinic at least 4 hours in advance at <b className="text-yellow-900">{clinicConfig.phone}</b>.
                </p>
             </div>
          </div>

        </div>
      </div>
    </PageWrapper>
  );
}
