import React, { useState } from 'react';
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
} from 'lucide-react';

export default function SaaSDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { title: 'Active Physios', value: '142', icon: Users, change: '+12% this month', color: 'text-primary' },
    { title: 'Total Patients', value: '12,450', icon: Activity, change: '+24% this month', color: 'text-info' },
    { title: 'MRR', value: '₹4.2L', icon: DollarSign, change: '+8% this month', color: 'text-success' },
    { title: 'Consultations (30d)', value: '3,842', icon: Briefcase, change: '+18% this month', color: 'text-warning' },
  ];

  const features = [
    {
      title: 'Multi-Tenant Dashboard',
      description: 'Onboard other physios, manage their subscriptions, and provision custom domains (e.g., drname.yourbrand.com).',
      icon: Globe,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'HEP Video Vault',
      description: 'Centralized library of high-quality exercise videos. Physios can quickly build and send digital prescriptions.',
      icon: PlayCircle,
      color: 'bg-red-100 text-red-600',
    },
    {
      title: 'Secure Digital EHR',
      description: 'HIPAA-compliant patient history, digital X-ray/MRI uploads, and progress tracking charts all in one place.',
      icon: Database,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'WhatsApp Automation',
      description: 'Automated appointment reminders, payment links, and post-session HEP delivery directly to patients.',
      icon: Smartphone,
      color: 'bg-teal-100 text-teal-600',
    },
    {
      title: 'Advanced Analytics',
      description: 'Insights into Patient Lifetime Value (LTV), recovery rates, and optimal booking hours to maximize revenue.',
      icon: BarChart,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      title: 'Integrated WebRTC Video',
      description: 'Browser-based video calls built directly into the platform. No more Zoom links—just a friction-free "Consult Now" button.',
      icon: Video,
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      title: 'Marketing Automation Kit',
      description: 'Pre-designed email templates, landing page SEO optimization controls, and social media sharing tools.',
      icon: Mail,
      color: 'bg-pink-100 text-pink-600',
    },
    {
      title: 'Recovery Packages (Subscriptions)',
      description: 'Sell bundles (e.g., 10-session ACL recovery plan) instead of single sessions to improve cash flow and commitment.',
      icon: Briefcase,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Platform Command Center</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your white-label SaaS offering for physiotherapists.</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" /> Settings
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Onboard New Clinic
            </Button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-green-600 mt-4 font-medium flex items-center">
                <Activity className="w-3 h-3 mr-1" /> {stat.change}
              </p>
            </Card>
          ))}
        </div>

        {/* Feature Roadmap & Bundle Offerings */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Physio-SaaS Bundle Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white border text-card-foreground shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow relative"
              >
                <div className="p-6 h-full flex flex-col">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed flex-grow">
                    {feature.description}
                  </p>
                  
                  {/* Status Indicator */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-xs font-medium text-green-600">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Available in Premium Bundle
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Clinics Table (Mockup) */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Recently Onboarded Clinics</h3>
            <Button variant="outline" size="sm">View All</Button>
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
              <tbody>
                <tr className="border-b">
                  <td className="px-6 py-4 font-medium text-gray-900">Elite Sports Rehab</td>
                  <td className="px-6 py-4 text-gray-500">elite.physiosaas.com</td>
                  <td className="px-6 py-4">Premium Bundle</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4 font-medium text-gray-900">City Walk Physio</td>
                  <td className="px-6 py-4 text-gray-500">citywalk.physiosaas.com</td>
                  <td className="px-6 py-4">Starter</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-gray-900">MoveWell Clinic</td>
                  <td className="px-6 py-4 text-gray-500">Pending Setup</td>
                  <td className="px-6 py-4">Pro</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Onboarding
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
