import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  Users,
  Activity,
  DollarSign,
  Briefcase,
  PlayCircle,
  Database,
  Smartphone,
  BarChart,
  Video,
  Mail,
  Plus,
  Settings,
  Globe,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Eye,
  Ban,
} from 'lucide-react';

export default function SaaSDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');

  // ── Mock data ───────────────────────────────────────────────────────────────

  const stats = [
    { title: 'Active Physios',       value: '142',    icon: Users,     change: '+12% this month', color: 'text-primary',  bg: 'bg-primary/10' },
    { title: 'Total Patients',        value: '12,450', icon: Activity,  change: '+24% this month', color: 'text-info',     bg: 'bg-blue-50' },
    { title: 'MRR',                   value: '₹4.2L',  icon: DollarSign,change: '+8% this month',  color: 'text-success',  bg: 'bg-green-50' },
    { title: 'Consultations (30d)',   value: '3,842',  icon: Briefcase, change: '+18% this month', color: 'text-warning',  bg: 'bg-yellow-50' },
  ];

  const bundleFeatures = [
    { title: 'Multi-Tenant Dashboard',        icon: Globe,       color: 'bg-blue-50 text-blue-600',    description: 'Custom domains, per-clinic isolation.' },
    { title: 'HEP Video Vault',               icon: PlayCircle,  color: 'bg-red-50 text-red-600',      description: 'Digital exercise prescription library.' },
    { title: 'Secure Digital EHR',            icon: Database,    color: 'bg-green-50 text-green-600',  description: 'HIPAA-compliant patient records.' },
    { title: 'WhatsApp Automation',           icon: Smartphone,  color: 'bg-teal-50 text-teal-600',   description: 'Reminders, payment links, HEP delivery.' },
    { title: 'Advanced Analytics',            icon: BarChart,    color: 'bg-purple-50 text-purple-600',description: 'LTV, recovery rates, booking insights.' },
    { title: 'Integrated WebRTC Video',       icon: Video,       color: 'bg-indigo-50 text-indigo-600',description: 'No Zoom—built-in "Consult Now" flow.' },
    { title: 'Marketing Automation Kit',      icon: Mail,        color: 'bg-pink-50 text-pink-600',   description: 'Email templates and SEO controls.' },
    { title: 'Recovery Subscription Packages',icon: Briefcase,   color: 'bg-orange-50 text-orange-600',description: '10-session bundles to boost cash flow.' },
  ];

  const clinics = [
    { id: 1, name: 'Elite Sports Rehab',  domain: 'elite.physiosaas.com',   plan: 'Premium Bundle', mrr: '₹7,999', patients: 248, status: 'active' },
    { id: 2, name: 'City Walk Physio',    domain: 'citywalk.physiosaas.com', plan: 'Starter',        mrr: '₹1,999', patients: 86,  status: 'active' },
    { id: 3, name: 'MoveWell Clinic',     domain: 'Pending Setup',          plan: 'Pro',            mrr: '₹3,999', patients: 0,   status: 'onboarding' },
    { id: 4, name: 'FlexCare Physio',     domain: 'flex.physiosaas.com',    plan: 'Pro',            mrr: '₹3,999', patients: 174, status: 'active' },
    { id: 5, name: 'RehabPro Centre',     domain: 'rehab.physiosaas.com',   plan: 'Premium Bundle', mrr: '₹7,999', patients: 312, status: 'active' },
  ];

  const plans = [
    { name: 'Starter',        price: '₹1,999', subscribers: 34, features: ['Booking', 'Patient Mgmt', 'WhatsApp Reminders'] },
    { name: 'Pro',            price: '₹3,999', subscribers: 84, features: ['All Starter', 'WebRTC Video', 'EHR', 'Analytics'] },
    { name: 'Premium Bundle', price: '₹7,999', subscribers: 42, features: ['All Pro', 'HEP Vault', 'WhatsApp Automation', 'White-labeling'] },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'clinics',  label: 'Clinics' },
    { id: 'billing',  label: 'Subscriptions & Billing' },
  ];

  const statusBadge = (status) => {
    if (status === 'active')     return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">Active</span>;
    if (status === 'onboarding') return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Onboarding</span>;
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">Suspended</span>;
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        {/* ---- Header ---- */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Platform Command Center</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your white-label SaaS offering for physiotherapists.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => window.open('/?tenant=demo', '_blank')}>
              <Eye className="w-4 h-4 mr-2" /> Preview Demo
            </Button>
            <Button onClick={() => navigate('/saas/onboarding')}>
              <Plus className="w-4 h-4 mr-2" /> Onboard New Clinic
            </Button>
          </div>
        </div>

        {/* ---- Tab Bar ---- */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors duration-150
                ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            TAB 1 — OVERVIEW
        ══════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">

            {/* KPI Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <Card key={stat.title} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-4 font-medium flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" /> {stat.change}
                  </p>
                </Card>
              ))}
            </div>

            {/* Bundle Features Grid */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-5">SaaS Bundle Features</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {bundleFeatures.map((f, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-100 shadow-sm rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col gap-3"
                  >
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${f.color}`}>
                      <f.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-gray-900 leading-snug">{f.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed flex-grow">{f.description}</p>
                    <div className="flex items-center text-xs font-medium text-green-600 pt-2 border-t border-gray-100">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Available in Premium Bundle
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recently Onboarded */}
            <Card className="overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Recently Onboarded Clinics</h3>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('clinics')}>View All</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 bg-gray-50 uppercase">
                    <tr>
                      <th className="px-6 py-3 font-medium">Clinic Name</th>
                      <th className="px-6 py-3 font-medium">Domain</th>
                      <th className="px-6 py-3 font-medium">Plan</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clinics.slice(0, 3).map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                        <td className="px-6 py-4 text-gray-500">{c.domain}</td>
                        <td className="px-6 py-4 text-gray-700">{c.plan}</td>
                        <td className="px-6 py-4">{statusBadge(c.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB 2 — CLINICS
        ══════════════════════════════════════════ */}
        {activeTab === 'clinics' && (
          <div className="animate-in fade-in duration-300 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-bold text-gray-900">All Tenants ({clinics.length})</h2>
              <input
                type="text"
                placeholder="Search clinics or domains..."
                className="w-full sm:w-72 text-sm border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clinics.map((clinic) => (
                <Card key={clinic.id} className="p-6 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl
                      ${clinic.id % 2 === 0 ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                      {clinic.name.charAt(0)}
                    </div>
                    {statusBadge(clinic.status)}
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{clinic.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <Globe className="w-3 h-3" /> {clinic.domain}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Plan</span><span className="font-semibold text-gray-900">{clinic.plan}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">MRR</span><span className="font-semibold text-gray-900">{clinic.mrr}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Patients</span><span className="font-semibold text-gray-900">{clinic.patients}</span></div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <Button variant="outline" size="sm" className="flex-1">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Manage
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700">
                      <Ban className="w-3.5 h-3.5 mr-1.5" /> Suspend
                    </Button>
                  </div>
                </Card>
              ))}

              {/* Add Clinic CTA Card */}
              <button
                onClick={() => navigate('/saas/onboarding')}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold">Onboard New Clinic</span>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB 3 — BILLING
        ══════════════════════════════════════════ */}
        {activeTab === 'billing' && (
          <div className="animate-in fade-in duration-300 space-y-8 max-w-4xl">
            <h2 className="text-xl font-bold text-gray-900">Subscriptions & Billing</h2>

            {/* Plans Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {plans.map((plan) => (
                <Card key={plan.name} className="p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-2xl font-extrabold text-primary mt-1">{plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2.5 py-1 rounded-full">{plan.subscribers} active</span>
                  </div>
                  <ul className="space-y-1.5 text-sm text-gray-600">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" size="sm" className="mt-auto">Edit Plan</Button>
                </Card>
              ))}
            </div>

            {/* Razorpay API Config */}
            <Card className="overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" /> Razorpay API Configuration
                </h3>
              </div>
              <div className="p-6 space-y-5">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Connect your Razorpay Account</h4>
                    <p className="text-xs mt-1">To automatically charge physios for their SaaS subscription, configure your live Razorpay API credentials. These are stored securely as environment variables and never exposed client-side.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Razorpay Key ID</label>
                    <input
                      type="text"
                      placeholder="rzp_live_xxxxxxxxxx"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Razorpay Key Secret</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button>
                    <ShieldCheck className="w-4 h-4 mr-2" /> Save API Keys
                  </Button>
                  <p className="text-xs text-gray-400">These keys will be stored as <code className="bg-gray-100 px-1 rounded">VITE_RAZORPAY_*</code> environment variables.</p>
                </div>
              </div>
            </Card>

            {/* Recent Transactions */}
            <Card className="overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-3 font-medium">Clinic</th>
                      <th className="px-6 py-3 font-medium">Plan</th>
                      <th className="px-6 py-3 font-medium">Amount</th>
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { clinic: 'Elite Sports Rehab', plan: 'Premium Bundle', amount: '₹7,999', date: 'Mar 28, 2026', status: 'Paid' },
                      { clinic: 'City Walk Physio',   plan: 'Starter',        amount: '₹1,999', date: 'Mar 27, 2026', status: 'Paid' },
                      { clinic: 'FlexCare Physio',    plan: 'Pro',            amount: '₹3,999', date: 'Mar 25, 2026', status: 'Paid' },
                      { clinic: 'RehabPro Centre',    plan: 'Premium Bundle', amount: '₹7,999', date: 'Mar 24, 2026', status: 'Paid' },
                    ].map((tx, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{tx.clinic}</td>
                        <td className="px-6 py-4 text-gray-600">{tx.plan}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{tx.amount}</td>
                        <td className="px-6 py-4 text-gray-500">{tx.date}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">{tx.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

      </div>
    </PageWrapper>
  );
}
