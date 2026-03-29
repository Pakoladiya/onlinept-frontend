import React, { useState } from 'react';
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
  Clock,
  Activity,
  Phone,
  MessageSquare,
  Languages,
  Award,
  CircleCheck,
  Quote,
  ChevronDown,
  HelpCircle,
  ThumbsUp,
  Award as AwardIcon,
  Smile,
  MapPin,
  ExternalLink,
  X,
  CheckCircle,
} from 'lucide-react';

/**
 * Premium LandingPage — Designed for "Dashing & Aesthetic" feel.
 * Implements Google Review Dialog and High-End Social Proof.
 */
export default function LandingPage() {
  const [activeBio, setActiveBio] = useState(localStorage.getItem('preferredLanguage') || 'en');
  const [openFaq, setOpenFaq] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  React.useEffect(() => {
    const handleLangChange = (e) => setActiveBio(e.detail);
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const stats = [
    { label: 'Successful Recoveries', value: '1,500+', Icon: Smile, color: 'text-green-500' },
    { label: 'Years of Excellence', value: `${clinicConfig.experience.split('+')[0] || '12'}+`, Icon: AwardIcon, color: 'text-primary' },
    { label: 'Patient Satisfaction', value: '100%', Icon: ThumbsUp, color: 'text-yellow-500' },
  ];

  const faqs = [
    { q: 'How does an online consultation work?', a: 'Its easy! You pick a time, join a secure HD video call with the doctor, and get a full musculoskeletal assessment followed by a personalized exercise plan sent to your WhatsApp.' },
    { q: 'What conditions do you treat?', a: 'We specialize in sports injuries, chronic back/neck pain, post-surgery rehabilitation, and geriatric physiotherapy.' },
    { q: 'How long is a treatment session?', a: 'Standard sessions are 45-60 minutes depending on your condition and the package selected.' },
    { q: 'Is online physio as effective as offline?', a: 'For most conditions, yes! Research shows that supervised exercise and physical education are the most critical parts of recovery, which we handle expertly through video.' },
  ];

  const testimonials = clinicConfig.testimonials || [
    { name: 'Dr. Rajesh Kumar', text: 'Remarkable clinical insight even through video. Highly professional and knowledgeable doctor.', rating: 5 },
    { name: 'Sonal Mehta', text: 'My chronic back pain is 90% better in 3 weeks. The HEP (Exercise Plan) they provided was a game changer.', rating: 5 },
    { name: 'Captain Amit Singh', text: 'Recovery from my ACL surgery was seamless. Clear instructions and constant support.', rating: 5 },
  ];

  const bios = {
    en: clinicConfig.bio || 'Your recovery is our primary mission.',
    hi: clinicConfig.bio_hi || 'हम आधुनिक फिजियोथेरेपी के साथ आपकी रिकवरी सुनिश्चित करते हैं।',
    gu: clinicConfig.bio_gu || 'શ્રેષ્ઠ ફિઝિયોથેરપી દ્વારા તમારી તંદુરસ્તી મેળવો.',
  };

  const expertiseTags = clinicConfig.expertiseTags || ['Musculoskeletal', 'Sports Injury', 'Spine Care', 'Post-Op Rehab'];
  const videoLabel = clinicConfig.videoMode === 'zoom' ? 'Zoom' : 'Google Meet';

  return (
    <PageWrapper>
      {/* ── Floating Review Badge (DESKTOP) ────────── */}
      {clinicConfig.googleReviewUrl && (
        <div className="fixed top-32 right-0 z-50 hidden xl:block group">
           <button 
             onClick={() => setShowReviewModal(true)}
             className="bg-white border-y border-l border-gray-100 shadow-2xl rounded-l-3xl p-4 pl-6 pr-8 flex items-center gap-4 hover:translate-x-[-8px] transition-all transform duration-500 group"
           >
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shadow-inner group-hover:bg-primary/5">
                 <img src="https://www.gstatic.com/images/branding/product/2x/google_g_48dp.png" className="w-5 h-5" alt="G" />
              </div>
              <div className="text-left space-y-0.5">
                 <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} size={10} className="text-yellow-500 fill-yellow-500" />)}
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">4.9/5 Verified</p>
              </div>
           </button>
        </div>
      )}

      {/* ── Attractive Review Dialog (MODAL) ─────────── */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setShowReviewModal(false)} />
           <Card className="relative w-full max-w-lg bg-white rounded-[3.5rem] p-10 sm:p-14 overflow-hidden border-none shadow-3xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-secondary" />
              <button onClick={() => setShowReviewModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 transition-colors">
                 <X size={24} />
              </button>
              
              <div className="flex flex-col items-center text-center space-y-8">
                 <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center shadow-inner border border-gray-100">
                    <img src="https://www.gstatic.com/images/branding/product/2x/google_g_48dp.png" className="w-12 h-12" alt="Google" />
                 </div>
                 <div className="space-y-3">
                    <div className="flex gap-1.5 justify-center mb-2">
                       {[...Array(5)].map((_, i) => <Star key={i} size={28} className="text-yellow-500 fill-yellow-500 drop-shadow-lg" />)}
                    </div>
                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter">Highly Rated Clinic</h3>
                    <p className="text-gray-500 font-medium">We maintain a 4.9/5 Average Rating based on verified patient consultations.</p>
                 </div>

                 <div className="w-full bg-gray-50 rounded-3xl p-6 flex items-center gap-4 border border-gray-100/50">
                    <CheckCircle className="text-green-500 w-6 h-6 shrink-0" />
                    <p className="text-left text-xs font-bold text-gray-600 leading-relaxed uppercase tracking-wider">
                      Verified by Google Business Reputation Engine for {clinicConfig.clinicName}.
                    </p>
                 </div>

                 <div className="flex flex-col w-full gap-4">
                    <a href={clinicConfig.googleReviewUrl} target="_blank">
                       <Button size="lg" className="w-full h-16 rounded-2xl text-lg font-black shadow-xl shadow-primary/30 uppercase tracking-widest">
                          View Authentic Reviews <ExternalLink className="ml-2 w-5 h-5" />
                       </Button>
                    </a>
                    <button onClick={() => setShowReviewModal(false)} className="text-xs font-black uppercase text-gray-400 tracking-[0.2em] hover:text-gray-600 transition-colors">
                       Continue Browsing
                    </button>
                 </div>
              </div>
           </Card>
        </div>
      )}

      {/* ── Floating Action Bar (Mobile-First) ────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md sm:hidden">
         <div className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl p-3 flex items-center justify-between gap-3">
            <a href={`tel:${clinicConfig.phone}`} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-primary border border-gray-100 shadow-sm">
               <Phone className="w-5 h-5" />
            </a>
            <Link to="/book" className="flex-1">
               <Button className="w-full h-12 rounded-2xl shadow-xl shadow-primary/20 font-black text-sm uppercase tracking-widest">
                  Book Free Intro
               </Button>
            </Link>
            <a href={clinicConfig.whatsappLink} className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center text-white shadow-xl shadow-green-200">
               <MessageSquare className="w-5 h-5 fill-white" />
            </a>
         </div>
      </div>

      {/* ── Aesthetic Hero Section ──────────────────── */}
      <section className="relative pt-12 pb-24 px-4 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] -z-10 opacity-30">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] blur-[120px] rounded-full" style={{ backgroundColor: `${clinicConfig.primaryColor}40` }} />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] blur-[120px] rounded-full translate-y-1/2" style={{ backgroundColor: `${clinicConfig.secondaryColor}40` }} />
        </div>
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <Badge variant="primary" size="lg" className="rounded-full bg-white/80 backdrop-blur-md border shadow-2xl shadow-primary/10 px-6 py-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
            <Activity className="w-3.5 h-3.5 mr-2 animate-bounce" /> Your Recovery Journey Starts Here
          </Badge>
          <h1 className="text-5xl sm:text-7xl font-black text-gray-900 leading-[1.05] tracking-tighter">
             Transform Your <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${clinicConfig.primaryColor}, ${clinicConfig.secondaryColor})` }}>Movement</span>, Regain Your Life.
          </h1>
          <p className="text-xl sm:text-2xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed opacity-80 uppercase tracking-wide">
            {clinicConfig.tagline} — Expert physical assessment via HD {videoLabel}.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-4">
             <Link to="/book" className="w-full sm:w-auto">
               <Button className="w-full sm:w-80 h-16 sm:h-20 rounded-3xl text-xl font-black shadow-2xl shadow-primary/30 uppercase tracking-widest hover:scale-[1.03] transition-all">
                  Book Your Session <ArrowRight className="ml-2 w-6 h-6" />
               </Button>
             </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Milestones ───────────────────────── */}
      <section className="px-4 mb-24 max-w-5xl mx-auto">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((s, i) => (
              <Card key={i} className="p-10 rounded-[3rem] border-transparent bg-white/50 backdrop-blur-sm text-center space-y-4 hover:bg-white hover:shadow-2xl transition-all duration-500">
                 <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-gray-50 shadow-inner ${s.color}`}>
                   <s.Icon size={28} />
                 </div>
                 <div className="space-y-1">
                    <p className="text-4xl font-black text-gray-900 tracking-tighter">{s.value}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{s.label}</p>
                 </div>
              </Card>
            ))}
         </div>
      </section>

      {/* ── Expert & Multilingual Bio ────────────────── */}
      <section className="mb-32 px-4 sm:px-0">
         <div className="flex flex-col lg:flex-row bg-white rounded-[4rem] border border-gray-100 shadow-2xl shadow-gray-200/50 relative overflow-hidden">
            <div className="lg:w-[450px] bg-gray-900 p-12 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden text-left">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32" />
               <div className="relative">
                  <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-[3.5rem] overflow-hidden border-8 border-gray-800 shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
                     <img src={clinicConfig.photo || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=800"} className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500" />
                  </div>
                  <div className="absolute -bottom-4 right-4 bg-primary text-white px-5 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Gold Certified</div>
               </div>
               <div className="space-y-3 relative z-10">
                  <h3 className="text-3xl font-black text-white">{clinicConfig.physioName}</h3>
                  <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">{clinicConfig.qualifications}</div>
               </div>
            </div>
            <div className="flex-1 p-10 sm:p-20 space-y-10 text-left">
               <div className="flex items-center justify-between border-b border-gray-100 pb-8">
                  <div className="flex items-center gap-3 text-gray-900 font-bold text-lg uppercase tracking-widest">
                    <MessageSquare className="w-6 h-6 text-primary" /> Meet Your Specialist
                  </div>
                  <div className="flex bg-gray-50 px-4 py-2 rounded-2xl">
                     <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                       {activeBio === 'en' ? 'English' : activeBio === 'hi' ? 'Hindi' : 'Gujarati'} Mode
                     </span>
                  </div>
               </div>
               <div className="relative min-h-[8rem]">
                  <p className={`text-2xl sm:text-3xl font-medium text-gray-700 leading-relaxed italic transition-all duration-300 ${activeBio === 'en' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 absolute inset-0'}`}>"{bios.en}"</p>
                  <p className={`text-3xl sm:text-4xl font-hindi font-medium text-gray-700 leading-[1.6] italic transition-all duration-300 ${activeBio === 'hi' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 absolute inset-0'}`}>"{bios.hi}"</p>
                  <p className={`text-3xl sm:text-4xl font-gujarati font-medium text-gray-700 leading-[1.6] italic transition-all duration-300 ${activeBio === 'gu' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 absolute inset-0'}`}>"{bios.gu}"</p>
               </div>
               <div className="flex flex-wrap gap-4 pt-10">
                  {expertiseTags.map(tag => (
                    <span key={tag} className="flex items-center gap-2 bg-gray-50 px-5 py-3 rounded-2xl text-xs font-black text-gray-500 border border-gray-100 uppercase tracking-widest">
                       <CircleCheck className="w-4 h-4 text-primary" /> {tag}
                    </span>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* ── Aesthetic Gallery Showcase ──────────────── */}
      <section className="mb-40 px-4 sm:px-0">
         <div className="grid grid-cols-12 gap-6 sm:gap-8 h-auto">
            <div className="col-span-12 lg:col-span-7 rounded-[4rem] overflow-hidden border-8 border-white shadow-2xl shadow-gray-200 relative group aspect-[4/3] sm:aspect-video text-left">
               <img src={clinicConfig.galleryBanner || "https://images.unsplash.com/photo-1576091160550-2173dad99961?auto=format&fit=crop&q=80&w=1200"} className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-110" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex items-end p-8 md:p-16">
                  <div className="space-y-4">
                     <Badge className="bg-primary/20 backdrop-blur-md text-white border-white/20">PREMIUM FACILITY</Badge>
                     <h4 className="text-4xl sm:text-6xl font-black text-white leading-tight">Expert Care,<br/>Anywhere.</h4>
                  </div>
               </div>
            </div>
            <div className="col-span-12 lg:col-span-5 grid grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-6 sm:gap-8 h-auto">
               <div className="rounded-[2rem] sm:rounded-[3rem] overflow-hidden border-4 sm:border-8 border-white shadow-xl relative group aspect-square lg:aspect-auto">
                  <img src={clinicConfig.galleryImage1 || "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800"} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
               </div>
               <div className="rounded-[2rem] sm:rounded-[3rem] overflow-hidden border-4 sm:border-8 border-white shadow-xl relative group aspect-square lg:aspect-auto">
                  <img src={clinicConfig.galleryImage2 || "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&q=80&w=800"} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
               </div>
            </div>
         </div>
      </section>

      {/* ── FAQ Section ─────────────────────────────── */}
      <section className="mb-32 max-w-4xl mx-auto px-4">
         <div className="text-center space-y-4 mb-20 text-left">
            <Badge className="font-black">YOUR QUESTIONS</Badge>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Need Clarity?</h2>
            <p className="text-gray-500 font-medium">Everything you need to know about our virtual therapy process.</p>
         </div>
         <div className="space-y-4 text-left">
            {faqs.map((faq, idx) => (
              <Card key={idx} className={`p-0 rounded-3xl overflow-hidden border-gray-100 transition-all duration-300 shadow-sm ${openFaq === idx ? 'border-primary/50 shadow-xl' : 'hover:border-primary/30'}`}>
                 <button onClick={() => setOpenFaq(openFaq === idx ? null : idx)} className="w-full p-8 flex items-center justify-between gap-4 text-left group">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-primary/5">
                          <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                       </div>
                       <span className="font-bold text-gray-900 text-lg sm:text-xl">{faq.q}</span>
                    </div>
                    <ChevronDown className={`w-6 h-6 text-gray-300 transition-transform ${openFaq === idx ? 'rotate-180 text-primary' : ''}`} />
                 </button>
                 <div className={`overflow-hidden transition-all duration-500 ease-in-out ${openFaq === idx ? 'max-h-[300px]' : 'max-h-0'}`}>
                    <div className="px-8 pb-8 pt-0 pl-[4.5rem] sm:pl-24 text-gray-500 text-lg leading-relaxed">
                       {faq.a}
                    </div>
                 </div>
              </Card>
            ))}
         </div>
         {clinicConfig.googleReviewUrl && (
           <div className="mt-12 flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => setShowReviewModal(true)}
                className="rounded-2xl h-14 px-8 border-gray-200 hover:border-primary/50 text-gray-900 font-black uppercase tracking-widest text-xs"
              >
                <img src="https://www.gstatic.com/images/branding/product/2x/google_g_48dp.png" className="w-4 h-4 mr-3" alt="G" />
                View Google Business Reviews
              </Button>
           </div>
         )}
      </section>

      {/* ── Physical Location Section (OPTIONAL) ──────── */}
      {(clinicConfig.address || clinicConfig.mapUrl) && (
        <section className="mb-32 px-4 sm:px-0">
           <div className="flex flex-col lg:flex-row bg-white rounded-[4rem] border border-gray-100 shadow-2xl overflow-hidden text-left">
              <div className="flex-1 p-10 sm:p-20 space-y-8 flex flex-col justify-center text-left">
                 <Badge variant="outline" className="w-fit text-primary border-primary/20">Visit Our Clinic</Badge>
                 <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter">Local Expertise,<br/>Global Quality.</h2>
                 <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-sm">Our physical facility is equipped with state-of-the-art diagnostic tools for complex clinical cases.</p>
                 <div className="space-y-6 pt-4">
                    <div className="flex items-start gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0"><MapPin className="text-primary w-6 h-6" /></div>
                       <p className="text-lg font-bold text-gray-700 leading-tight pt-1">{clinicConfig.address || 'Location details available upon request.'}</p>
                    </div>
                 </div>
                 <div className="pt-6"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicConfig.address || '')}`} target="_blank" className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs hover:gap-4 transition-all">Get Directions <ExternalLink size={16} /></a></div>
              </div>
              <div className="lg:w-1/2 min-h-[400px] bg-gray-100 relative group">
                 {clinicConfig.mapUrl ? (<iframe src={clinicConfig.mapUrl} className="absolute inset-0 w-full h-full border-0 grayscale-[0.2] contrast-[1.1] group-hover:grayscale-0 transition-all duration-700" allowFullScreen="" loading="lazy" />) : (<div className="absolute inset-0 flex items-center justify-center bg-gray-50 text-gray-300"><MapPin size={64} className="opacity-20" /></div>)}
              </div>
           </div>
        </section>
      )}

      {/* ── Final Dashing CTA ────────────────────────── */}
      <section className="mb-24 px-4 sm:px-0">
         <div className="rounded-[4.5rem] p-12 sm:p-24 text-center shadow-3xl overflow-hidden relative group" style={{ background: `linear-gradient(135deg, ${clinicConfig.primaryColor}, ${clinicConfig.secondaryColor})` }}>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse" />
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
            <div className="relative z-10 space-y-10">
               <div className="space-y-4">
                  <h2 className="text-5xl sm:text-8xl font-black text-white tracking-tighter drop-shadow-2xl">Recover Stronger.</h2>
                  <p className="text-xl sm:text-3xl text-white/90 font-bold max-w-2xl mx-auto opacity-90">Trusted by 1000+ patients in India for world-class physiotherapy assessment.</p>
               </div>
               <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Link to="/book" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-80 h-20 sm:h-24 rounded-[2rem] bg-white text-gray-900 text-2xl font-black shadow-3xl hover:bg-gray-50 hover:-translate-y-2 transition-all">BOOK YOUR SESSION <ArrowRight className="ml-3 w-8 h-8 text-primary" /></Button>
                  </Link>
               </div>
               <div className="flex items-center justify-center gap-8 text-white/70 font-black text-[10px] uppercase tracking-[0.3em] pt-10">
                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white animate-ping" /> AVAILABILITY: TODAY</span>
                  <span className="flex items-center gap-2 opacity-50">•</span>
                  <span>14-DAY TRIAL ACTIVE</span>
               </div>
            </div>
         </div>
      </section>
    </PageWrapper>
  );
}
