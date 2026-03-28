import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, ChevronRight, Stethoscope, Paintbrush, ShieldCheck, Rocket, LayoutTemplate } from 'lucide-react';
import clinicConfig from '@/config/clinicConfig';

export default function ClinicOnboardingFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    physioName: '',
    email: '',
    clinicName: '',
    subdomain: '',
    primaryColor: '#39A900', // Default green
    plan: 'Premium Bundle',
  });

  const handleNext = () => setStep((s) => Math.min(s + 1, 4));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompleteSignUp = () => {
    setLoading(true);
    // Simulate API call to Firebase/Stripe to create the tenant
    setTimeout(() => {
      setLoading(false);
      setStep(5); // Success step
    }, 2000);
  };

  const renderStepIcon = (stepNumber, Icon) => {
    const isActive = step === stepNumber;
    const isPast = step > stepNumber;
    return (
      <div className={`flex flex-col items-center flex-1 ${stepNumber !== 4 ? 'relative' : ''}`}>
        <div 
          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 z-10 bg-white transition-all duration-300
          ${isActive ? 'border-primary text-primary shadow-md' : isPast ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 text-gray-400'}`}
        >
          {isPast ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
        </div>
        <p className={`text-xs mt-2 font-medium ${isActive ? 'text-primary' : 'text-gray-500'}`}>
          {stepNumber === 1 && 'Details'}
          {stepNumber === 2 && 'Branding'}
          {stepNumber === 3 && 'Package'}
          {stepNumber === 4 && 'Launch'}
        </p>
        {stepNumber !== 4 && (
          <div className={`absolute top-6 left-1/2 w-full h-[2px] transition-all duration-300 -z-0
            ${isPast ? 'bg-green-500' : 'bg-gray-200'}`} 
            style={{ width: 'calc(100% - 3rem)', marginLeft: '1.5rem'}} 
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <Stethoscope className="w-6 h-6 text-primary" />
           <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            {clinicConfig.clinicName} SaaS
           </span>
        </div>
        <span className="text-sm text-gray-500 font-medium">Clinic Provisioning Engine</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6">
        
        {/* Progress Stepper */}
        {step < 5 && (
          <div className="w-full max-w-3xl flex justify-between mb-12 relative px-4">
            {renderStepIcon(1, ShieldCheck)}
            {renderStepIcon(2, Paintbrush)}
            {renderStepIcon(3, LayoutTemplate)}
            {renderStepIcon(4, Rocket)}
          </div>
        )}

        <Card className="w-full max-w-2xl bg-white shadow-xl border-gray-100 overflow-hidden transform transition-all duration-300">
          
          {/* STEP 1: Basic Details */}
          {step === 1 && (
            <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's set up your clinic.</h2>
              <p className="text-gray-500 mb-8">Enter your details to generate your white-labeled instance.</p>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Physiotherapist Name</label>
                    <Input name="physioName" value={formData.physioName} onChange={handleChange} placeholder="Dr. Jane Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Work Email</label>
                    <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="jane@physio.com" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Clinic Display Name</label>
                  <Input name="clinicName" value={formData.clinicName} onChange={handleChange} placeholder="e.g. Peak Performance Rehab" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Claim your Custom Subdomain</label>
                  <div className="flex rounded-md shadow-sm">
                    <Input 
                      name="subdomain" 
                      value={formData.subdomain} 
                      onChange={handleChange} 
                      placeholder="peakrehab"
                      className="rounded-e-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <span className="inline-flex items-center px-4 rounded-e-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      .physiosaas.com
                    </span>
                  </div>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Available
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end pt-6 border-t border-gray-100">
                <Button onClick={handleNext} disabled={!formData.physioName || !formData.clinicName || !formData.subdomain}>
                  Next: Branding <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Branding */}
          {step === 2 && (
            <div className="p-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Design your portal.</h2>
              <p className="text-gray-500 mb-8">Choose the colors that represent your clinical brand.</p>
              
              <div className="space-y-8">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-3">Primary Brand Color</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="color" 
                      name="primaryColor" 
                      value={formData.primaryColor} 
                      onChange={handleChange}
                      className="w-14 h-14 rounded cursor-pointer border-0 p-0"
                    />
                    <Input value={formData.primaryColor} onChange={handleChange} name="primaryColor" className="w-32 font-mono" />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Used for buttons, active tabs, and primary interactions.</p>
                </div>

                {/* Instant Live Preview */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Live App Preview</h3>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-bold text-gray-900">{formData.clinicName || 'Your Clinic Name'}</span>
                      <div className="w-8 h-8 rounded-full bg-gray-100" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-4 bg-gray-100 rounded w-1/2" />
                      <div className="w-full flex justify-end mt-4">
                        <button 
                          className="px-4 py-2 text-sm text-white font-medium rounded-md shadow-sm transition-all"
                          style={{ backgroundColor: formData.primaryColor }}
                        >
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
                <Button variant="ghost" onClick={handleBack}>Back</Button>
                <Button onClick={handleNext}>Next: Select Package <ChevronRight className="w-4 h-4 ml-1" /> </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Plan Selection */}
          {step === 3 && (
            <div className="p-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose your subscription.</h2>
              <p className="text-gray-500 mb-8">All plans include a 14-day free trial. Cancel anytime.</p>
              
              <div className="space-y-4">
                {['Starter', 'Pro', 'Premium Bundle'].map((plan) => (
                  <label 
                    key={plan}
                    className={`flex items-center justify-between p-5 rounded-xl border-2 cursor-pointer transition-all duration-200
                      ${formData.plan === plan ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/30'}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${formData.plan === plan ? 'border-primary' : 'border-gray-300'}
                      `}>
                        {formData.plan === plan && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                      </div>
                      <div>
                        <h4 className={`font-bold ${formData.plan === plan ? 'text-primary' : 'text-gray-900'}`}>{plan}</h4>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {plan === 'Starter' && 'Basic booking & patient management.'}
                          {plan === 'Pro' && 'Starter + WebRTC Video & EHR.'}
                          {plan === 'Premium Bundle' && 'Everything + WhatsApp & SaaS Whitelabeling.'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {plan === 'Starter' && '₹1,999'}
                        {plan === 'Pro' && '₹3,999'}
                        {plan === 'Premium Bundle' && '₹7,999'}
                        <span className="text-sm font-normal text-gray-500">/mo</span>
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
                <Button variant="ghost" onClick={handleBack}>Back</Button>
                <Button onClick={handleNext}>Review & Setup <ChevronRight className="w-4 h-4 ml-1" /> </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Launch */}
          {step === 4 && (
            <div className="p-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="text-center mb-8">
               <Rocket className="w-16 h-16 text-primary mx-auto mb-4" />
               <h2 className="text-3xl font-bold text-gray-900 mb-2">Ready for Liftoff!</h2>
               <p className="text-gray-500">Your custom clinic environment is ready to be provisioned.</p>
              </div>

               <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 mb-8 max-w-sm mx-auto">
                 <ul className="space-y-3 text-sm text-gray-600">
                   <li className="flex justify-between"><span className="font-medium text-gray-900">Clinic:</span> {formData.clinicName}</li>
                   <li className="flex justify-between"><span className="font-medium text-gray-900">Subdomain:</span> {formData.subdomain}.physiosaas.com</li>
                   <li className="flex justify-between"><span className="font-medium text-gray-900">Plan:</span> {formData.plan}</li>
                   <li className="flex justify-between items-center"><span className="font-medium text-gray-900">Theme:</span> 
                     <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: formData.primaryColor }} />
                   </li>
                 </ul>
               </div>

              <div className="flex flex-col items-center gap-3">
                <Button size="lg" className="w-full max-w-sm py-4 text-lg shadow-xl shadow-primary/20" onClick={handleCompleteSignUp} loading={loading}>
                  {loading ? 'Provisioning Servers...' : 'Claim 14-Day Free Trial'}
                </Button>
                <Button variant="ghost" onClick={handleBack} disabled={loading}>Back to Edit</Button>
              </div>
            </div>
          )}

          {/* STEP 5: Success State */}
          {step === 5 && (
            <div className="p-10 text-center animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Clinic Successfully Created!</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                Welcome aboard, <strong>{formData.physioName}</strong>! Your white-labeled dashboard is now live. An email with your administrative credentials has been sent to <strong>{formData.email}</strong>.
              </p>
              
              <div className="bg-gray-50 inline-block px-6 py-4 rounded-xl border border-gray-200 mb-8">
                 <p className="text-sm text-gray-500 uppercase font-semibold mb-1">Your Portal URL</p>
                 <a href="#" className="text-primary font-bold text-lg underline">https://{formData.subdomain}.physiosaas.com</a>
              </div>

              <div>
                <Button size="lg" onClick={() => navigate('/admin')}>
                  Go to Master Dashboard
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
