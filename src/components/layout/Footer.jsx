import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, Youtube, Globe, HeartPulse, ShieldCheck, Activity } from 'lucide-react';
import clinicConfig from '@/config/clinicConfig';
import { Link } from 'react-router-dom';

/**
 * Rich, Professional Footer for the Branded Portal.
 * Optimized with Dynamic Social Visibility.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Social handles mapping — only show if URL is provided
  const socialLinks = [
    { icon: Instagram, url: clinicConfig.instagramUrl, label: 'Instagram' },
    { icon: Facebook, url: clinicConfig.facebookUrl, label: 'Facebook' },
    { icon: Youtube, url: clinicConfig.youtubeUrl, label: 'YouTube' },
    { icon: Twitter, url: clinicConfig.twitterUrl, label: 'X (Twitter)' },
  ].filter(link => link.url && link.url.trim() !== '');

  return (
    <footer className="bg-gray-900 pt-24 pb-12 px-6 sm:px-12 text-white relative overflow-hidden">
      {/* Background Glow */}
      <div 
        className="absolute bottom-0 right-0 w-[500px] h-[500px] blur-[150px] opacity-10 rounded-full -mr-32 -mb-32"
        style={{ backgroundColor: clinicConfig.primaryColor }}
      />
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
          
          {/* Brand Column */}
          <div className="md:col-span-12 lg:col-span-5 space-y-8">
            <Link to="/" className="flex items-center gap-3">
               <div 
                 className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-xl"
                 style={{ backgroundColor: clinicConfig.primaryColor }}
               >
                 {clinicConfig.clinicName.charAt(0)}
               </div>
               <span className="text-2xl font-black tracking-tight">{clinicConfig.clinicName}</span>
            </Link>
            <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
              Providing modern, expert-led physical therapy assessments from the comfort of your home. Regain your movement with India's leading virtual clinic.
            </p>
            
            {socialLinks.length > 0 && (
              <div className="flex gap-4">
                 {socialLinks.map((social, i) => {
                   const Icon = social.icon;
                   return (
                     <a 
                       key={i} 
                       href={social.url} 
                       target="_blank" 
                       rel="noreferrer"
                       className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-primary hover:scale-110 transition-all duration-300"
                       title={social.label}
                     >
                        <Icon size={18} className="text-gray-300" />
                     </a>
                   );
                 })}
              </div>
            )}
          </div>

          {/* Contact Column */}
          <div className="md:col-span-6 lg:col-span-4 space-y-8">
             <h4 className="text-sm font-black uppercase tracking-[0.3em] text-gray-500">Get In Touch</h4>
             <ul className="space-y-5">
               <li className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary transition-colors">
                     <Phone size={18} className="text-primary group-hover:text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest text-left">Phone</p>
                    <p className="text-gray-200 font-bold">{clinicConfig.phone}</p>
                  </div>
               </li>
               <li className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary transition-colors">
                     <Mail size={18} className="text-primary group-hover:text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest text-left">Email</p>
                    <p className="text-gray-200 font-bold">{clinicConfig.email}</p>
                  </div>
               </li>
             </ul>
          </div>

          {/* Clinical Network Column */}
          <div className="md:col-span-6 lg:col-span-3 space-y-8">
             <h4 className="text-sm font-black uppercase tracking-[0.3em] text-gray-500 text-left">Clinical Network</h4>
             <ul className="space-y-4 font-bold text-gray-400 text-left">
                <li className="hover:text-white transition-colors"><Link to="/book">Patient Booking</Link></li>
                <li className="hover:text-white transition-colors"><Link to="/physio-signup" className="text-primary">Therapist Sign Up</Link></li>
                <li className="hover:text-white transition-colors"><Link to="/dashboard-login">Clinical Login</Link></li>
                <li className="hover:text-white transition-colors"><Link to="/saas">Platform Features</Link></li>
             </ul>
             <div className="pt-6 flex justify-start">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#FF4500]">
                   <Activity size={12} className="animate-pulse" /> Verified Clinic
                </div>
             </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
           <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">
             © {currentYear} {clinicConfig.clinicName}. All Rights Reserved.
           </p>
           <div className="flex items-center gap-2 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
              <span className="text-[10px] font-black text-gray-500">Powered by</span>
              <img src="/onlinept-logo-v3.png" className="h-8" alt="OnlinePT" /> 
              <span className="text-xs font-black text-white italic">OnlinePT.in</span>
           </div>
        </div>
      </div>
    </footer>
  );
}
