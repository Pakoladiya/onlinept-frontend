import React, { useState, useEffect } from 'react';
import { X, Send, Phone, Clock } from 'lucide-react';

/**
 * Premium WhatsApp Widget with Dialog support.
 * Features a custom slow-pulse animation and a native-looking chat window.
 */
export default function WhatsAppButton({ phone = '9228108454', clinicName = 'Superadmin', primaryColor = '#25D366', inline = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Default to 91 if not present (assuming Indian context as per number format)
  // Ensure phone is a string to prevent .replace() errors if passed as null or number
  const safePhone = (phone || '9228108454').toString();
  const targetPhone = safePhone.replace(/[^0-9]/g, '');
  const fullPhone = targetPhone.length === 10 ? `91${targetPhone}` : targetPhone;
  
  const greeting = `Hi ${clinicName}, I would like to inquire about a physiotherapy appointment.`;
  const whatsappUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(greeting)}`;

  const waGreen = '#25D366';
  if (!isMounted) return null;

  const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );

  if (inline) {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          width: '100%', padding: '14px 24px', borderRadius: 16,
          background: waGreen, color: '#fff', fontWeight: 700, fontSize: 15,
          textDecoration: 'none', transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        <WhatsAppIcon />
        Chat on WhatsApp
      </a>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans antialiased text-slate-900">
      {/* Pulse Styles */}
      <style>{`
        @keyframes custom-pulse {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        .animate-pulse-slow {
          animation: custom-pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .wa-shadow {
          box-shadow: 0 8px 24px rgba(37, 211, 102, 0.4);
        }
        .chat-bubble-shadow {
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
        }
      `}</style>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[340px] bg-white rounded-3xl overflow-hidden chat-bubble-shadow animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div style={{ backgroundColor: waGreen }} className="p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg border border-white/20">
                    {clinicName.charAt(0)}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-emerald-500 rounded-full" />
                </div>
                <div>
                  <h4 className="font-bold text-base leading-tight">{clinicName}</h4>
                  <p className="text-white/80 text-xs flex items-center gap-1">
                    <Clock size={10} /> Typically replies in minutes
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-white/90 leading-relaxed font-medium">
              Hello! 👋 How can we help you today? Feel free to ask anything.
            </p>
          </div>

          {/* Body */}
          <div className="p-5 bg-slate-50">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm mb-6">
              <p className="text-sm text-slate-600 leading-relaxed italic">
                Welcome! Contact our clinic directly via WhatsApp.
              </p>
            </div>
            
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] wa-shadow"
              style={{ backgroundColor: waGreen }}
            >
              <Send size={16} />
              Start Chat with {clinicName}
            </a>
          </div>

          <div className="p-3 text-center bg-white border-t border-slate-100">
             <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Powered by OnlinePT</p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative w-16 h-16 rounded-full flex items-center justify-center text-white transition-all active:scale-90 wa-shadow overflow-visible"
        style={{ backgroundColor: waGreen }}
        aria-label="Open WhatsApp Chat"
      >
        {/* Pulse Effect - Slower and Lighter */}
        <div 
          className="absolute inset-0 rounded-full animate-pulse-slow pointer-events-none" 
          style={{ backgroundColor: waGreen }} 
        />
        
        {/* Toggle Icon */}
        <div className="relative transition-transform duration-300 group-hover:scale-110">
          {isOpen ? <X size={32} /> : <WhatsAppIcon />}
        </div>

        {/* Dynamic Tooltip (Hidden if open) */}
        {!isOpen && (
          <div className="absolute right-20 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 whitespace-nowrap shadow-xl">
             Chat with Clinic
          </div>
        )}
      </button>
    </div>
  );
}
