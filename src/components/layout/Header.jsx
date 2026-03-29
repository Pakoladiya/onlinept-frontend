import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clinicConfig from '@/config/clinicConfig';
import { useLanguage } from '@/context/LanguageContext';
import { 
    Phone, 
    Mail, 
    Sparkles, 
    Globe, 
    ChevronDown, 
    Home, 
    Video, 
    PlusCircle, 
    MessageCircle, 
    CalendarCheck, 
    MapPin,
    Calendar,
    ShieldCheck,
    CheckCircle2
} from 'lucide-react';

/**
 * Luxe Header & Native-Style Mobile Navigation.
 * Features: Bottom action dock for mobile + Glassmorphic Desktop Header.
 */
export default function Header() {
  const location = useLocation();
  const { language: lang, setLanguage } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const languages = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'hi', label: 'Hindi', short: 'HI' },
    { code: 'gu', label: 'Gujarati', short: 'GU' },
  ];

  const updateLanguage = (newLang) => {
    setLanguage(newLang);
    setShowLangMenu(false);
  };

  const isAdminRoute = 
    location.pathname.startsWith('/saas') || 
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/dashboard') || 
    location.pathname.startsWith('/setup') ||
    location.pathname.startsWith('/settings');

  return (
    <>
      {/* ── Desktop/Global Header ─────────────────────── */}
      <header 
        className={`sticky top-0 z-50 transition-all duration-500 border-b 
          ${scrolled ? 'bg-white/80 backdrop-blur-2xl border-gray-100 shadow-xl shadow-gray-200/20' : 'bg-transparent border-transparent'}`}
      >
        <div className="mx-auto px-6 max-w-7xl h-20 flex items-center justify-between">
          
          {/* Logo Branding */}
          <Link to="/" className="flex items-center gap-4 group">
            <div
              className="w-12 h-12 rounded-[1.4rem] flex items-center justify-center text-white font-black text-xl shadow-2xl shadow-primary/20 transition-all group-hover:rotate-12"
              style={{ backgroundColor: clinicConfig.primaryColor }}
            >
              {clinicConfig.clinicName.charAt(0)}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-black text-gray-900 tracking-tight group-hover:text-primary transition-colors">
                {clinicConfig.clinicName}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hidden sm:block">
                {clinicConfig.tagline}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {/* Contact Quick-Action (Desktop Only) */}
            <div className="hidden lg:flex items-center gap-6 mr-6">
                <a href={`tel:${clinicConfig.phone}`} className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-primary transition-colors uppercase tracking-widest">
                   <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"><Phone size={14} /></div>
                   Contact Clinic
                </a>
            </div>

            {/* Language Switcher */}
            <div className="relative">
               <button 
                 onClick={() => setShowLangMenu(!showLangMenu)}
                 className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-100 hover:border-primary/50 transition-all shadow-sm"
               >
                  <Globe size={16} className="text-primary/60" />
                  <span className="text-[11px] font-black uppercase text-gray-600">
                    {languages.find(l => l.code === lang)?.short}
                  </span>
                  <ChevronDown size={14} className={`text-gray-300 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
               </button>

               {showLangMenu && (
                 <div className="absolute top-full right-0 mt-3 w-40 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-3 animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest px-4 mb-2">Preferred View</p>
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => updateLanguage(l.code)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black uppercase transition-all
                          ${lang === l.code ? 'bg-primary text-white shadow-lg' : 'hover:bg-gray-50 text-gray-400'}`}
                        style={lang === l.code ? { backgroundColor: clinicConfig.primaryColor } : {}}
                      >
                        {l.label}
                        {lang === l.code && <CheckCircle2 size={14} />}
                      </button>
                    ))}
                 </div>
               )}
            </div>

            {/* Main Action Button (Desktop/Tablet) */}
            {!isAdminRoute && (
               <Link to="/book" className="hidden sm:block">
                  <button 
                    className="h-14 px-8 rounded-2xl shadow-2xl shadow-primary/20 font-black uppercase tracking-widest text-[11px] text-white hover:opacity-90 active:scale-95 transition-all"
                    style={{ backgroundColor: clinicConfig.primaryColor }}
                  >
                    Book Appointment
                  </button>
               </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Native Mobile Navigation Dock ──────────────── */}
      {!isAdminRoute && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-3rem)] max-w-sm sm:hidden animate-in slide-in-from-bottom-10 duration-700">
           <div className="bg-gray-900/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 shadow-2xl flex items-center justify-between">
              <Link to="/" className="w-12 h-12 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                <Home size={22} />
              </Link>
              <Link to="/book" className="w-12 h-12 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                <Video size={22} />
              </Link>
              
              {/* Central Primary Action */}
              <Link to="/book">
                 <div 
                   className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl shadow-primary/40 -translate-y-4 border-4 border-gray-900 scale-110 active:scale-95 transition-all"
                   style={{ backgroundColor: clinicConfig.primaryColor }}
                 >
                    <Calendar size={28} />
                 </div>
              </Link>

              <a href={`https://wa.me/${clinicConfig.phone}`} className="w-12 h-12 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                <MessageCircle size={22} />
              </a>
              <Link to="/dashboard-login" className="w-12 h-12 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                <ShieldCheck size={22} />
              </Link>
           </div>
        </nav>
      )}
    </>
  );
}
