import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import clinicConfig from '@/config/clinicConfig';
import { Link } from 'react-router-dom';
import {
  Video,
  CalendarCheck,
  ShieldCheck,
  Star,
  ArrowRight,
  HeartPulse,
  FileText,
  Clock,
  Users,
  Phone,
} from 'lucide-react';

/**
 * LandingPage — Complete mobile-first patient-facing home page.
 * All content driven from clinicConfig.
 */
export default function LandingPage() {
  const howItWorks = [
    { step: '1', title: 'Book a Slot', desc: 'Pick a date and time in under 2 minutes.' },
    { step: '2', title: 'Fill Details', desc: 'Share your health history so your physio is prepared.' },
    { step: '3', title: 'Pay Online', desc: 'Secure payment via Razorpay — no cash needed.' },
    { step: '4', title: 'Join & Recover', desc: 'Video session + Home Exercise Plan after.' },
  ];

  const videoLabel =
    clinicConfig.videoMode === 'zoom' ? 'Zoom' :
    clinicConfig.videoMode === 'meet' ? 'Google Meet' : 'WhatsApp Video';

  return (
    <PageWrapper>
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="text-center mb-10">
        <Badge variant="primary" size="md" className="mb-4">
          Online Consultation Available
        </Badge>
        <h1
          className="text-3xl sm:text-4xl font-bold mb-3 leading-tight"
          style={{ color: clinicConfig.primaryColor }}
        >
          {clinicConfig.clinicName}
        </h1>
        <p className="text-base sm:text-lg text-text-secondary max-w-md mx-auto mb-8 leading-relaxed">
          {clinicConfig.tagline}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/book">
            <Button size="lg" fullWidth={false}>
              Book a Consultation <ArrowRight size={18} />
            </Button>
          </Link>
          <a href={`tel:${clinicConfig.phone}`}>
            <Button variant="outline" size="lg" fullWidth={false}>
              <Phone size={16} /> Call Us
            </Button>
          </a>
        </div>
      </section>

      {/* ── Hero Banner ────────────────────────────── */}
      <Card className="mb-10 overflow-hidden" padding={false}>
        <div
          className="h-44 sm:h-56 flex flex-col items-center justify-center gap-3 text-white/95"
          style={{ background: `linear-gradient(135deg, ${clinicConfig.primaryColor}, ${clinicConfig.secondaryColor})` }}
        >
          <HeartPulse size={44} strokeWidth={1.5} className="animate-pulse" />
          <p className="text-base sm:text-lg font-medium text-center px-6 max-w-sm leading-relaxed">
            Your recovery starts with a single step — book your session today
          </p>
        </div>
      </Card>

      {/* ── How It Works ────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-text-primary mb-6 text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {howItWorks.map(({ step, title, desc }) => (
            <Card key={step} className="text-center">
              <div
                className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: clinicConfig.primaryColor }}
              >
                {step}
              </div>
              <h3 className="font-semibold text-text-primary text-sm mb-1">{title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Services ─────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-text-primary mb-6 text-center">
          Our Services
        </h2>
        <div className="space-y-3">
          {clinicConfig.services.map((svc) => (
            <Card key={svc.id} hover className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${clinicConfig.primaryColor}15` }}
              >
                <FileText size={22} style={{ color: clinicConfig.primaryColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-text-primary text-sm">{svc.name}</h3>
                  <span className="font-bold text-base shrink-0" style={{ color: clinicConfig.primaryColor }}>
                    ₹{svc.price}
                  </span>
                </div>
                <p className="text-xs text-text-secondary mb-2 leading-relaxed">{svc.description}</p>
                <div className="flex items-center gap-1 text-xs text-text-secondary">
                  <Clock size={12} />
                  <span>{svc.duration} min</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Physio Profile ───────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-text-primary mb-6 text-center">
          Your Physio
        </h2>
        <Card className="flex flex-col sm:flex-row gap-5 items-center text-center sm:text-left">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shrink-0"
            style={{ backgroundColor: clinicConfig.primaryColor }}
          >
            {clinicConfig.physioName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1">
            <Badge variant="primary" size="sm" className="mb-2">{clinicConfig.qualifications}</Badge>
            <h2 className="text-lg font-bold text-text-primary mb-1">{clinicConfig.physioName}</h2>
            <p className="text-sm text-text-secondary mb-3 leading-relaxed">{clinicConfig.bio}</p>
            <div className="flex items-center justify-center sm:justify-start gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="text-warning fill-warning" />
              ))}
              <span className="text-sm text-text-secondary ml-1">5.0 · {clinicConfig.experience}</span>
            </div>
          </div>
        </Card>
      </section>

      {/* ── Why Choose Us ────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-text-primary mb-6 text-center">
          Why Choose Us
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Video, title: `${videoLabel} Consultation`, desc: `Secure ${videoLabel} sessions from home` },
            { icon: CalendarCheck, title: 'Easy Booking', desc: 'Pick your slot in under 2 minutes — no app needed' },
            { icon: ShieldCheck, title: 'Qualified Physio', desc: 'Expert assessment with personalized treatment plans' },
            { icon: Users, title: 'HEP Included', desc: 'Home Exercise Plan sent after every session' },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="flex gap-3 items-start">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${clinicConfig.primaryColor}15` }}>
                <Icon size={18} style={{ color: clinicConfig.primaryColor }} />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-sm mb-0.5">{title}</h3>
                <p className="text-xs text-text-secondary">{desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-text-primary mb-6 text-center">
          What Patients Say
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: 'Rajesh K.', text: 'Excellent consultation from home. The physio understood my issue immediately and gave me a clear plan.', rating: 5 },
            { name: 'Priya M.', text: 'Very professional and convenient. The video call quality was perfect. Highly recommend!', rating: 5 },
            { name: 'Amit S.', text: 'Booking was seamless and the follow-up exercises helped me recover faster. Thank you!', rating: 5 },
          ].map(({ name, text, rating }) => (
            <Card key={name}>
              <div className="flex gap-0.5 mb-2">
                {[...Array(rating)].map((_, i) => <Star key={i} size={11} className="text-warning fill-warning" />)}
              </div>
              <p className="text-sm text-text-secondary mb-3 italic leading-relaxed">"{text}"</p>
              <p className="text-sm font-semibold text-text-primary">— {name}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────── */}
      <section
        className="rounded-card p-7 sm:p-8 text-center"
        style={{ background: `linear-gradient(135deg, ${clinicConfig.primaryColor}10, ${clinicConfig.secondaryColor}10)` }}
      >
        <h2 className="text-xl font-bold text-text-primary mb-2">
          Ready to start your recovery?
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          Initial consultation from{' '}
          <strong>₹{clinicConfig.services[0]?.price}</strong>
          {clinicConfig.services.length > 1 && (
            <> · Sessions from ₹{Math.min(...clinicConfig.services.map((s) => s.price))}</>
          )}
        </p>
        <Link to="/book">
          <Button size="lg">
            Book Your Session <ArrowRight size={18} />
          </Button>
        </Link>
      </section>
    </PageWrapper>
  );
}
