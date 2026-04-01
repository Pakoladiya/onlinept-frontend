import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, Mail, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * ClinicPendingApprovalPage — Shown to new clinics after they sign up.
 * They stay here until the Super Admin validates their account.
 */
export default function ClinicPendingApprovalPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
            OnlinePT
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 p-10 border border-gray-100">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <Clock className="w-10 h-10" />
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
            Application Received!
          </h1>
          
          <p className="text-gray-500 leading-relaxed mb-8">
            Thank you for choosing OnlinePT. Your clinic registration is currently being 
            <strong className="text-gray-900"> reviewed by our Super Admin team</strong>. 
            We verify all clinical credentials to maintain platform integrity.
          </p>

          <div className="space-y-4 mb-10">
            {[
              { icon: CheckCircle2, text: 'Identity & Qualification Verification', color: 'text-green-500' },
              { icon: Mail, text: 'You will receive an email once approved', color: 'text-blue-500' },
              { icon: ShieldCheck, text: 'Activation usually takes less than 24 hours', color: 'text-blue-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-sm font-bold text-gray-700">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              size="lg" 
              className="w-full shadow-lg shadow-blue-600/20"
              onClick={() => navigate('/')}
            >
              Return Home
            </Button>
            <p className="text-xs text-gray-400">
              Need urgent activation? Contact support@onlinept.in
            </p>
          </div>
        </div>
        
        <p className="mt-8 text-sm text-gray-400 font-medium tracking-wide flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          SECURE CLINIC PROVISIONING ENGINE
        </p>
      </main>
    </div>
  );
}
