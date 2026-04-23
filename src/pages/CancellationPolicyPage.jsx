import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, XCircle, CreditCard, RotateCcw, Clock, Mail } from 'lucide-react';

export default function CancellationPolicyPage() {
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
            <RotateCcw size={14} /> Policies
          </div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, letterSpacing: '-1px', color: '#1D1D1F', marginBottom: 12 }}>
            Cancellation & Modification Policy
          </h1>
          <p style={{ color: '#AEAEB2', fontSize: 14, fontWeight: 600 }}>
            Last updated: April 1, 2026 · Effective Date: April 1, 2026
          </p>
        </div>

        {/* Introduction */}
        <div className="pp-section">
          <p>
            At OnlinePT, we understand that schedules can change. This policy outlines how you can modify or cancel your scheduled consultations, along with our refund procedures.
          </p>
          <div className="pp-highlight">
            <p>💡 Tip: You can easily manage your appointments directly from your booking confirmation page or clinic subdomain link.</p>
          </div>
        </div>

        {/* Modifications */}
        <div className="pp-section">
          <h2><RefreshCw size={20} /> Appointment Modifications</h2>
          <p>We offer flexibility to adjust your session time if needed:</p>
          <ul>
            <li><strong>One Free Modification:</strong> Patients are allowed <strong>1 free modification</strong> (rescheduling) per appointment.</li>
            <li><strong>Modification Window:</strong> Rescheduling requests must be made at least <strong>12 hours</strong> prior to the scheduled appointment start time.</li>
            <li><strong>How to Modify:</strong> Use the "Manage My Appointment" button on the clinic booking portal and enter your registered WhatsApp number to find and update your booking.</li>
            <li>If you need to change the appointment further times after using your free modification, please contact clinic support.</li>
          </ul>
        </div>

        {/* Cancellations */}
        <div className="pp-section">
          <h2><XCircle size={20} /> Appointment Cancellations</h2>
          <p>If you need to cancel your session outright, please observe the following guidelines:</p>
          <ul>
            <li><strong>Standard Cancellation:</strong> Cancellations made at least <strong>24 hours</strong> before the scheduled appointment will receive a refund minus a mandatory <strong>2% processing charge</strong>. A 100% full refund is not possible due to non-refundable processing charges.</li>
            <li><strong>Late Cancellations:</strong> Cancellations made within the 24-hour window prior to the appointment are non-refundable.</li>
            <li><strong>No Shows:</strong> If a patient fails to join the virtual or in-person consultation without prior notice, the session is forfeited, and no refund will be issued.</li>
            <li><strong>Clinician Cancellations:</strong> If the treating clinician must cancel due to unforeseen emergencies, a refund (minus the 2% processing charge) or an immediate rescheduling option will be provided at no cost.</li>
          </ul>
        </div>

        {/* Refunds */}
        <div className="pp-section">
          <h2><CreditCard size={20} /> Refund Processing</h2>
          <ul>
            <li><strong>Processing Time:</strong> Approved refunds will be initiated within <strong>24-48 hours</strong> of cancellation.</li>
            <li><strong>Settlement:</strong> It may take <strong>5-7 business days</strong> for the refunded amount to reflect in your original payment method (bank account, credit card, or wallet).</li>
            <li><strong>Processing Charges (Haircut):</strong> A <strong>strictly non-refundable 2% charge</strong> is automatically deducted from all approved cancellation refunds to cover mandatory payment processing charges.</li>
          </ul>
        </div>

        {/* Late Protocol */}
        <div className="pp-section">
          <h2><Clock size={20} /> Late Arrival Protocol</h2>
          <p>
            Punctuality ensures you receive the full benefit of your session. If you arrive late to a consultation, the session will still end at the scheduled time to respect the next patient's slot. The full fee remains applicable.
          </p>
        </div>

        {/* Contact */}
        <div className="pp-section">
          <h2><Mail size={20} /> Contact Us About Cancellations</h2>
          <p>If you are experiencing issues modifying or canceling your booking online, please get in touch immediately:</p>
          <div style={{
            background: '#FFFFFF', borderRadius: 16, padding: 24, marginTop: 16,
            border: '1px solid var(--color-border, #E5E5EA)',
          }}>
            <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#1D1D1F' }}>OnlinePT Support Dashboard</p>
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
