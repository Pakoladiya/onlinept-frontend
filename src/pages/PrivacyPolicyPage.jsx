import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Database, Lock, Users, Globe, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        .pp-section { margin-bottom: 40px; }
        .pp-section h2 { font-family: 'Manrope', sans-serif; font-size: 22px; font-weight: 800; color: #1D1D1F; margin-bottom: 16px; display: flex; align-items: center; gap: 12px; }
        .pp-section h2 svg { color: var(--color-primary, #007AFF); flex-shrink: 0; }
        .pp-section p, .pp-section li { font-size: 15px; line-height: 1.8; color: #636366; }
        .pp-section ul { padding-left: 20px; margin: 12px 0; }
        .pp-section li { margin-bottom: 8px; }
        .pp-highlight { background: var(--color-primary-light, #E8F0FE); border-left: 4px solid var(--color-primary, #007AFF); padding: 16px 20px; border-radius: 0 12px 12px 0; margin: 16px 0; }
        .pp-highlight p { color: #1D1D1F; font-weight: 600; font-size: 14px; margin: 0; }
      `}</style>

      {/* Header */}
      <div style={{
        background: '#FFFFFF', borderBottom: '1px solid var(--color-border, #E5E5EA)',
        padding: '16px var(--section-px, 24px)', position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" style={{
            display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none',
            color: 'var(--color-primary, #007AFF)', fontWeight: 700, fontSize: 14,
          }}>
            <ArrowLeft size={18} /> Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px var(--section-px, 24px) 80px' }}>
        {/* Title */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--color-primary-light, #E8F0FE)', padding: '8px 16px',
            borderRadius: 100, color: 'var(--color-primary, #007AFF)',
            fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 16,
          }}>
            <Shield size={14} /> Legal Document
          </div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, letterSpacing: '-1px', color: '#1D1D1F', marginBottom: 12 }}>
            Privacy Policy
          </h1>
          <p style={{ color: '#AEAEB2', fontSize: 14, fontWeight: 600 }}>
            Last updated: April 1, 2026 · Effective Date: April 1, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="pp-section">
          <p>
            OnlinePT Media ("we", "our", "us") operates the OnlinePT platform (onlinept.in and its subdomains). 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
            use our physiotherapy practice management platform, booking portals, and related services.
          </p>
          <div className="pp-highlight">
            <p>🔒 Your data security is our top priority. We are committed to protecting the privacy of both clinicians and patients on our platform.</p>
          </div>
        </div>

        {/* Information We Collect */}
        <div className="pp-section">
          <h2><Database size={20} /> Information We Collect</h2>
          <p><strong>For Clinicians (Physiotherapists):</strong></p>
          <ul>
            <li>Full name, email address, phone number, and professional credentials</li>
            <li>Clinic registration ID, years of experience, and specializations</li>
            <li>Clinic branding details (logo, subdomain preference, address)</li>
            <li>Service pricing and availability settings</li>
            <li>Authentication data (encrypted passwords, login sessions)</li>
          </ul>
          <p><strong>For Patients:</strong></p>
          <ul>
            <li>Name, email, phone number provided during booking</li>
            <li>Medical intake form responses (pain areas, medical history, symptoms)</li>
            <li>Appointment and booking history</li>
            <li>Recovery tracking data (VAS pain scores, progress notes)</li>
            <li>Payment transaction records (processed via Razorpay — we do not store card details)</li>
          </ul>
          <p><strong>Automatically Collected:</strong></p>
          <ul>
            <li>Device information, browser type, IP address</li>
            <li>Usage analytics (pages visited, features used, session duration)</li>
            <li>Cookies and local storage data for authentication and preferences</li>
          </ul>
        </div>

        {/* How We Use Information */}
        <div className="pp-section">
          <h2><Eye size={20} /> How We Use Your Information</h2>
          <ul>
            <li><strong>Platform Operation:</strong> To create and manage clinic portals, process bookings, and facilitate video consultations</li>
            <li><strong>Communication:</strong> Appointment reminders via WhatsApp, email confirmations, and service notifications</li>
            <li><strong>Clinical Care:</strong> Patient records, SOAP notes, and recovery tracking are used exclusively by the treating clinician</li>
            <li><strong>Analytics:</strong> Aggregated, anonymized data helps us improve the platform experience</li>
            <li><strong>Billing:</strong> To process subscription payments (clinicians) and consultation fees (patients)</li>
            <li><strong>Legal Compliance:</strong> To meet regulatory obligations under Indian data protection laws</li>
          </ul>
        </div>

        {/* Data Protection */}
        <div className="pp-section">
          <h2><Lock size={20} /> Data Protection & Security</h2>
          <p>We employ industry-standard measures to protect your data:</p>
          <ul>
            <li><strong>Encryption:</strong> All data in transit is encrypted via TLS/SSL (HTTPS). Sensitive data at rest is encrypted using AES-256</li>
            <li><strong>Authentication:</strong> Firebase Authentication with secure session management</li>
            <li><strong>Access Control:</strong> Role-based access ensures clinicians only see their own patient data. Super Admins have administrative access with audit logging</li>
            <li><strong>Infrastructure:</strong> Hosted on Google Cloud Platform (Firebase/Firestore) with automatic backups and 99.9% uptime SLA</li>
            <li><strong>Payment Security:</strong> All payments processed through PCI-DSS compliant Razorpay. We never store credit card numbers</li>
          </ul>
          <div className="pp-highlight">
            <p>🏥 Patient medical data (intake forms, SOAP notes, recovery scores) is exclusively accessible to the treating clinician and is never shared with third parties.</p>
          </div>
        </div>

        {/* Data Sharing */}
        <div className="pp-section">
          <h2><Users size={20} /> Data Sharing & Third Parties</h2>
          <p>We do <strong>not sell</strong> your personal data. We share information only with:</p>
          <ul>
            <li><strong>Razorpay:</strong> Payment processing (PCI-DSS compliant)</li>
            <li><strong>Google Firebase:</strong> Authentication and database infrastructure</li>
            <li><strong>WhatsApp (Meta):</strong> Appointment reminders and video call links (only phone numbers)</li>
            <li><strong>Google Analytics:</strong> Anonymized usage metrics for platform improvement</li>
            <li><strong>Legal Authorities:</strong> When required by Indian law or court orders</li>
          </ul>
        </div>

        {/* Your Rights */}
        <div className="pp-section">
          <h2><Globe size={20} /> Your Rights</h2>
          <p>Under the Digital Personal Data Protection Act, 2023 (India), you have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
            <li><strong>Erasure:</strong> Request deletion of your data (subject to legal retention requirements)</li>
            <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
            <li><strong>Withdraw Consent:</strong> Opt out of marketing communications at any time</li>
            <li><strong>Grievance Redressal:</strong> File a complaint with our Data Protection Officer</li>
          </ul>
          <p style={{ marginTop: 16 }}>To exercise any of these rights, <a href="mailto:onlinepthelp@gmail.com" style={{ color: 'var(--color-primary, #007AFF)', fontWeight: 700, textDecoration: 'none' }}>email our support team</a> or <a href="https://wa.me/919228108454" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: 700, textDecoration: 'none' }}>message us on WhatsApp</a>.</p>
        </div>

        {/* Cookies */}
        <div className="pp-section">
          <h2>🍪 Cookies & Local Storage</h2>
          <p>We use essential cookies and local storage for:</p>
          <ul>
            <li>Authentication session management (keeping you logged in)</li>
            <li>User preferences (theme, language)</li>
            <li>Analytics (anonymized, via Google Analytics)</li>
          </ul>
          <p>You can disable non-essential cookies through your browser settings. Disabling essential cookies may affect platform functionality.</p>
        </div>

        {/* Data Retention */}
        <div className="pp-section">
          <h2>📅 Data Retention</h2>
          <ul>
            <li><strong>Active accounts:</strong> Data retained while the account is active</li>
            <li><strong>Clinician data:</strong> Retained for 3 years after account closure for regulatory purposes</li>
            <li><strong>Patient medical records:</strong> Retained per clinician's practice policies and Indian medical record retention laws</li>
            <li><strong>Payment records:</strong> 7 years as required by Indian tax law</li>
            <li><strong>Analytics data:</strong> Anonymized and retained indefinitely for platform improvement</li>
          </ul>
        </div>

        {/* Contact */}
        <div className="pp-section">
          <h2><Mail size={20} /> Contact Us About Privacy</h2>
          <p>For privacy-related inquiries:</p>
          <div style={{
            background: '#FFFFFF', borderRadius: 16, padding: 24, marginTop: 16,
            border: '1px solid var(--color-border, #E5E5EA)',
          }}>
            <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#1D1D1F' }}>OnlinePT Media — Data Protection</p>
            <p style={{ margin: '0 0 4px' }}>📧 <a href="mailto:onlinepthelp@gmail.com" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Email Support</a></p>
            <p style={{ margin: '0 0 4px' }}>📱 <a href="https://wa.me/919228108454" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: 600, textDecoration: 'none' }}>WhatsApp Support</a></p>
            <p style={{ margin: 0 }}>📍 Nijanand Fitness Centre, 241, Royal Arcade, Sarthana Jakatnaka, Surat</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', paddingTop: 40, borderTop: '1px solid var(--color-border, #E5E5EA)' }}>
          <p style={{ fontSize: 12, color: '#AEAEB2' }}>© 2026 OnlinePT Media. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
