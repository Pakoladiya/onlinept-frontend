import { Link } from 'react-router-dom';
import clinicConfig from '@/config/clinicConfig';
import { Phone, Mail, MapPin, HeartPulse, Sparkles } from 'lucide-react';

/**
 * Footer — clinic info from white-label config.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border/70 mt-auto">
      <div className="mx-auto px-4 max-w-mobile sm:max-w-tablet lg:max-w-desktop py-8">
        {/* Logo + tagline */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: clinicConfig.primaryColor }}
            >
              {clinicConfig.clinicName.charAt(0)}
            </div>
            <span className="font-semibold text-text-primary">
              {clinicConfig.clinicName}
            </span>
          </div>
          <p className="text-sm text-text-secondary">{clinicConfig.tagline}</p>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="flex items-start gap-3">
            <Phone size={16} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">Phone</p>
              <a
                href={`tel:${clinicConfig.phone}`}
                className="text-sm text-text-primary hover:text-primary transition-colors"
              >
                {clinicConfig.phone}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail size={16} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">Email</p>
              <a
                href={`mailto:${clinicConfig.email}`}
                className="text-sm text-text-primary hover:text-primary transition-colors break-all"
              >
                {clinicConfig.email}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">Location</p>
              <p className="text-sm text-text-primary">{clinicConfig.address}</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-secondary">
            &copy; {year} {clinicConfig.clinicName}. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard-login"
              className="text-sm text-text-secondary hover:text-primary transition-colors font-medium"
            >
              Physio Login
            </Link>
            <Link
              to="/physio-signup"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
              style={{ backgroundColor: clinicConfig.secondaryColor }}
            >
              <Sparkles size={14} />
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
