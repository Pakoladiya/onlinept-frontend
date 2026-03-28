import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '@/firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import {
  Eye, EyeOff, Loader, AlertCircle,
  Video, CalendarCheck, FileText, BarChart3,
  Shield, Zap, CheckCircle2, ArrowLeft,
  Star, Globe, Smartphone
} from 'lucide-react';

const features = [
  {
    icon: Video,
    title: 'Video Consultations',
    desc: 'WhatsApp or Zoom — your choice',
  },
  {
    icon: CalendarCheck,
    title: 'Smart Scheduling',
    desc: 'Patients book slots online, automatically',
  },
  {
    icon: FileText,
    title: 'HEP Builder',
    desc: 'Send exercise plans after every session',
  },
  {
    icon: BarChart3,
    title: 'Patient Progress',
    desc: 'Track pain scores and recovery over time',
  },
  {
    icon: Smartphone,
    title: 'Branded App',
    desc: 'Your own subdomain — your own branding',
  },
  {
    icon: Shield,
    title: 'No Credit Card',
    desc: '14 days free, then ₹999/month',
  },
];

export default function PhysioSignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    physioName: '',
    clinicName: '',
    email: '',
    password: '',
    subdomain: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (key, val) => {
    if (key === 'clinicName') {
      setForm((f) => ({
        ...f,
        clinicName: val,
        subdomain: val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }));
    } else {
      setForm((f) => ({ ...f, [key]: val }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.physioName || !form.clinicName || !form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!form.subdomain) {
      setError('Please enter a subdomain.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cred = await signUp(form.email, form.password);
      const uid = cred.user.uid;

      // Create clinic record in Firestore
      await setDoc(doc(db, 'clinics', form.subdomain), {
        uid,
        physioName: form.physioName,
        clinicName: form.clinicName,
        subdomain: form.subdomain,
        email: form.email,
        status: 'trial',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: serverTimestamp(),
        settings: {
          primaryColor: '#39A900',
          secondaryColor: '#F6A000',
          videoMode: 'whatsapp',
          zoomLink: '',
        },
        services: [
          { id: 'initial', name: 'Initial Consultation', duration: 45, price: 500, description: 'First-time comprehensive assessment.' },
          { id: 'followup', name: 'Follow-up Session', duration: 30, price: 300, description: 'Progress review and treatment.' },
        ],
        stats: { totalPatients: 0, totalSessions: 0, monthlyRevenue: 0 },
      });

      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 8 characters.');
      } else {
        setError('Sign up failed. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border/50">
        <div className="max-w-mobile mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
          <span className="text-xs text-text-secondary">
            Already have an account?{' '}
            <Link to="/dashboard-login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-2 gap-10 items-start">

          {/* Left — Branding & Features */}
          <div>
            {/* Badge */}
            <div
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
              style={{ backgroundColor: '#39A90015', color: '#39A900' }}
            >
              <Zap size={12} />
              14-Day Free Trial — No Credit Card Required
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary leading-tight mb-4">
              Your own physiotherapy
              <br />
              <span style={{ color: '#39A900' }}>practice — online.</span>
            </h1>

            <p className="text-base text-text-secondary leading-relaxed mb-8">
              Set up your branded online consultation app in 5 minutes.
              No coding required — patients book, pay, and consult through your page.
            </p>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-3">
              {features.map(({ icon: Icon, title, desc }) => (
                <Card key={title} padding="p-3" className="flex gap-3 items-start">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#39A90015' }}
                  >
                    <Icon size={15} style={{ color: '#39A900' }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary leading-tight">{title}</p>
                    <p className="text-xs text-text-secondary leading-tight mt-0.5">{desc}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Social proof */}
            <div className="mt-8 flex items-center gap-3 p-4 rounded-xl bg-surface border border-border/50">
              <div className="flex -space-x-2">
                {['#39A900', '#F6A000', '#3b82f6'].map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: color }}
                  >
                    {['JM', 'PK', 'RS'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={11} className="text-warning fill-warning" />
                  ))}
                </div>
                <p className="text-xs text-text-secondary mt-0.5">
                  Trusted by physiotherapists across India
                </p>
              </div>
            </div>
          </div>

          {/* Right — Sign Up Form */}
          <div>
            <Card padding="p-6 sm:p-8" className="shadow-card">
              <h2 className="text-xl font-bold text-text-primary mb-1">Create your account</h2>
              <p className="text-sm text-text-secondary mb-6">
                Set up your branded physio page in minutes.
              </p>

              {error && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/30 text-sm text-error">
                  <AlertCircle size={15} className="shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Physio Name"
                  placeholder="Dr. Rahul Patel"
                  value={form.physioName}
                  onChange={(e) => update('physioName', e.target.value)}
                  required
                />

                <Input
                  label="Clinic Name"
                  placeholder="Rahul's Physio Centre"
                  value={form.clinicName}
                  onChange={(e) => update('clinicName', e.target.value)}
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="rahul@clinic.com"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                />

                <div>
                  <label className="block text-xs text-text-secondary uppercase tracking-wide mb-1.5">
                    Subdomain
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={form.subdomain}
                      onChange={(e) =>
                        update('subdomain', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                      }
                      placeholder="rahul-physio"
                      className="w-full px-3 py-2.5 text-sm rounded-l-lg border border-r-0 border-border bg-surface text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                    <span className="px-3 py-2.5 text-sm text-text-secondary bg-surface border border-l-0 border-border rounded-r-lg whitespace-nowrap">
                      .onlinept.in
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary/70 mt-1">
                    Your patients will visit: <strong>{form.subdomain || 'your-name'}.onlinept.in</strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-text-secondary uppercase tracking-wide mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full px-3 py-2.5 pr-10 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary transition-colors"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" size="lg" fullWidth disabled={loading}>
                  {loading ? <Loader size={16} className="animate-spin" /> : null}
                  {loading ? 'Creating your account...' : 'Create Free Account'}
                </Button>
              </form>

              <p className="text-center text-xs text-text-secondary/70 mt-4 leading-relaxed">
                By signing up, you agree to our{' '}
                <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
              </p>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 mt-5 pt-5 border-t border-border/50">
                {[
                  { icon: Shield, text: 'Secure' },
                  { icon: CheckCircle2, text: 'Verified' },
                  { icon: Globe, text: '24/7 Access' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1 text-xs text-text-secondary/60">
                    <Icon size={12} />
                    {text}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
