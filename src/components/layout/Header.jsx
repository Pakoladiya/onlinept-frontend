import { Link } from 'react-router-dom';
import clinicConfig from '@/config/clinicConfig';
import { Phone, Mail, Sparkles } from 'lucide-react';

/**
 * Header — clinic logo + name from white-label config.
 * Mobile-first: logo + name only on mobile, contact info on larger screens.
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border/70">
      <div className="mx-auto px-4 max-w-mobile sm:max-w-tablet lg:max-w-desktop h-14 flex items-center justify-between">
        {/* Logo + Clinic Name */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: clinicConfig.primaryColor }}
          >
            {clinicConfig.clinicName.charAt(0)}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
              {clinicConfig.clinicName}
            </span>
            <span className="text-xs text-text-secondary hidden sm:block">
              {clinicConfig.tagline}
            </span>
          </div>
        </Link>

        {/* Contact info + Sign Up — desktop only */}
        <div className="hidden sm:flex items-center gap-4">
          <a
            href={`tel:${clinicConfig.phone}`}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            <Phone size={14} />
            <span>{clinicConfig.phone}</span>
          </a>
          <a
            href={`mailto:${clinicConfig.email}`}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            <Mail size={14} />
            <span>{clinicConfig.email}</span>
          </a>
          <Link
            to="/physio-signup"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
            style={{ backgroundColor: clinicConfig.secondaryColor }}
          >
            <Sparkles size={13} />
            Start Free Trial
          </Link>
        </div>
      </div>
    </header>
  );
}
