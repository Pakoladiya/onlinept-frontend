import React, { useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  Video,
  Database,
  Smartphone,
  BarChart,
  Briefcase,
  PlayCircle,
  Globe,
  Mail,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import clinicConfig from '@/config/clinicConfig';
import saasHeroImg from '@/assets/saas_hero.png';

export default function SaaSLandingPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  const handleStartOnboarding = () => {
    navigate('/saas/onboarding');
  };

  const features = [
    {
      title: 'Multi-Tenant Dashboard',
      description: 'Run multiple clinics under your brand. Manage subscriptions, provision custom domains (e.g., yourname.com), and scale effortlessly.',
      icon: Globe,
      color: 'bg-blue-100 text-blue-600 border-blue-200',
    },
    {
      title: 'HEP Video Vault',
      description: 'Access a centralized library of high-quality exercise videos. Quickly build, customize, and send digital prescriptions to patients.',
      icon: PlayCircle,
      color: 'bg-red-100 text-red-600 border-red-200',
    },
    {
      title: 'Secure Digital EHR',
      description: 'HIPAA-compliant Electronic Health Records. Store patient history, digital X-ray/MRI uploads, and track progress charts in one place.',
      icon: Database,
      color: 'bg-green-100 text-green-600 border-green-200',
    },
    {
      title: 'WhatsApp Automation',
      description: 'Automate appointment reminders, payment links, and post-session Home Exercise Plan (HEP) delivery directly to patients.',
      icon: Smartphone,
      color: 'bg-teal-100 text-teal-600 border-teal-200',
    },
    {
      title: 'Advanced Analytics Engine',
      description: 'Gain insights into Patient Lifetime Value (LTV), recovery rates, and optimal booking hours to maximize your clinical revenue.',
      icon: BarChart,
      color: 'bg-purple-100 text-purple-600 border-purple-200',
    },
    {
      title: 'Integrated WebRTC Video',
      description: 'Browser-based video calls built directly into the platform. No more Zoom links—just a friction-free "Consult Now" experience.',
      icon: Video,
      color: 'bg-indigo-100 text-indigo-600 border-indigo-200',
    },
    {
      title: 'Marketing Automation Kit',
      description: 'Grow your practice with pre-designed email templates, landing page SEO optimization controls, and social media sharing tools.',
      icon: Mail,
      color: 'bg-pink-100 text-pink-600 border-pink-200',
    },
    {
      title: 'Recovery Packages (Subscriptions)',
      description: 'Improve cash flow by selling bundles (e.g., 10-session ACL recovery plan) instead of single sessions. Increase patient commitment.',
      icon: Briefcase,
      color: 'bg-orange-100 text-orange-600 border-orange-200',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ── Navigation ── */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                {clinicConfig.clinicName} SaaS
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                Physio Login
              </Link>
              <Button size="sm" className="hidden sm:flex" onClick={handleStartOnboarding}>
                Start Free Trial <Zap className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <div className="relative bg-white overflow-hidden pb-16 pt-20 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gray-50 rounded-l-[100px] -z-10 opacity-50 transform rotate-3"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="primary" className="mb-6 bg-primary/10 text-primary border-primary/20">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> The Future of Tele-PT
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
              Scale Your Physiotherapy Practice <span className="text-primary">Without Walls.</span>
            </h1>
            <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-xl">
              Stop juggling generic tools. Get a complete, white-labeled "Clinic-in-a-Box" built specifically for modern physiotherapists. From integrated video to automated HEPs, we handle the tech so you can handle the care.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="px-8 shadow-lg shadow-primary/30" onClick={handleStartOnboarding}>
                Get Started Today <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 bg-white" onClick={() => navigate('/admin')}>
                View Demo
              </Button>
            </div>
            <p className="mt-4 text-xs text-gray-400 font-medium">No credit card required · 14-day free trial · Cancel anytime</p>
          </div>
          <div className="relative">
            {/* Conceptual Dashboard Image */}
            <div className="relative rounded-2xl shadow-2xl border border-gray-100 overflow-hidden bg-white z-10 transform transition-transform hover:-translate-y-1 hover:shadow-3xl duration-300">
               <div className="absolute top-0 left-0 w-full h-8 bg-gray-100 border-b border-gray-200 flex items-center px-3">
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  </div>
               </div>
               <img 
                 src={saasHeroImg}
                 alt="Physio SaaS Dashboard Preview" 
                 className="w-full h-auto mt-8 object-cover"
                 style={{ minHeight: '300px' }}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-6">
                 <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20">
                    <p className="text-sm font-semibold text-gray-900">Dr. Sarah Jenkins</p>
                    <p className="text-xs text-gray-500 flex items-center mt-1"><CheckCircle2 className="w-3 h-3 text-green-500 mr-1"/> Active Session: ACL Rehab</p>
                 </div>
               </div>
            </div>
            {/* Decorative background circle */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl z-0"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl z-0"></div>
          </div>
        </div>
      </div>

      {/* ── Value Proposition / Features ── */}
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Everything You Need</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            A Complete Tech Stack for Physios
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            We've bundled the most requested features into a single, cohesive platform to help you transition from a solopreneur to a thriving digital clinic.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
            >
              {/* Subtle hover background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 border ${feature.color}`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed flex-grow">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pricing / CTA Section ── */}
      <div className="bg-gray-900 py-16 relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-secondary opacity-20 rounded-full blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to empower your peers?
          </h2>
          <p className="mt-4 text-lg leading-6 text-gray-300">
            Start selling this powerful software suite to other physiotherapists. Create a new recurring revenue stream while elevating the standard of care across the industry.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Button size="lg" className="px-8 py-4 text-lg" onClick={handleStartOnboarding}>
              Partner With Us
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-4 text-lg text-white border-white hover:bg-white/10 hover:text-white">
              Schedule a Strategy Call
            </Button>
          </div>
        </div>
      </div>
      
      {/* ── Footer ── */}
      <footer className="bg-white py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} {clinicConfig.clinicName} SaaS Platform. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
             <a href="#" className="hover:text-gray-900">Privacy Policy</a>
             <a href="#" className="hover:text-gray-900">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
