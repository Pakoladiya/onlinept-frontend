import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazyRetry } from '@/utils/lazyRetry';

// ── Components & Guards ──
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import PhysioGuard from '@/components/auth/PhysioGuard';
import ScrollToTop from '@/components/layout/ScrollToTop';

// ── Resilient Lazy Pages (Handles Chunk Load Errors) ──
const LandingPage = lazyRetry(() => import('@/pages/LandingPage'));
const BookingPage = lazyRetry(() => import('@/pages/BookingPage'));
const ReschedulePage = lazyRetry(() => import('@/pages/ReschedulePage'));
const IntakeFormPage = lazyRetry(() => import('@/pages/IntakeFormPage'));
const PaymentPage = lazyRetry(() => import('@/pages/PaymentPage'));
const ConfirmationPage = lazyRetry(() => import('@/pages/ConfirmationPage'));
const JoinSessionPage = lazyRetry(() => import('@/pages/JoinSessionPage'));
const PhysioLoginPage = lazyRetry(() => import('@/pages/PhysioLoginPage'));
const PhysioSignUpPage = lazyRetry(() => import('@/pages/PhysioSignUpPage'));
const PhysioDashboard = lazyRetry(() => import('@/pages/PhysioDashboard'));
const HEPBuilderPage = lazyRetry(() => import('@/pages/HEPBuilderPage'));
const PostSessionPage = lazyRetry(() => import('@/pages/PostSessionPage'));
const OnboardingPage = lazyRetry(() => import('@/pages/OnboardingPage'));
const SettingsPage = lazyRetry(() => import('@/pages/SettingsPage'));
const PhysioAdminPanel = lazyRetry(() => import('@/pages/PhysioAdminPanel'));
const SaaSDashboard = lazyRetry(() => import('@/pages/admin/SaaSDashboard'));
const SaaSLandingPage = lazyRetry(() => import('@/pages/admin/SaaSLandingPage'));
const ClinicOnboardingFlow = lazyRetry(() => import('@/pages/admin/ClinicOnboardingFlow'));
const ClinicPendingApprovalPage = lazyRetry(() => import('@/pages/admin/ClinicPendingApprovalPage'));
const ClinicSettings = lazyRetry(() => import('@/pages/clinic/ClinicSettings'));
const ResourceLibrary = lazyRetry(() => import('@/pages/ResourceLibrary'));
const ContentCreator = lazyRetry(() => import('@/pages/ContentCreator'));
const ClinicBranding = lazyRetry(() => import('@/pages/ClinicBranding'));
const BulkMessaging = lazyRetry(() => import('@/pages/BulkMessaging'));
const PrivacyPolicyPage = lazyRetry(() => import('@/pages/PrivacyPolicyPage'));
const ContactUsPage = lazyRetry(() => import('@/pages/ContactUsPage'));
const HelpCenterPage = lazyRetry(() => import('@/pages/HelpCenterPage'));
const CancellationPolicyPage = lazyRetry(() => import('@/pages/CancellationPolicyPage'));
const ClinicWhatsAppRedirect = lazyRetry(() => import('@/pages/ClinicWhatsAppRedirect'));
const PatientFeedbackPage = lazyRetry(() => import('@/pages/PatientFeedbackPage'));

// ── Loading Spinner ──
// ── Loading Spinner (Luxe Midnight) ──
function RouteLoader() {
  return (
    <div style={{ 
      height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#000', gap: 24
    }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 64, height: 64, border: '4px solid rgba(255,255,255,0.05)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}></div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '4px solid transparent', borderBottomColor: '#fff', opacity: 0.3, filter: 'blur(8px)', animation: 'spin 0.8s linear infinite reverse' }}></div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '4px', textTransform: 'uppercase', opacity: 0.6 }}>OnlinePT</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AppRouter() {
  // ── Subdomain Detection ──
  const hostname = window.location.hostname;
  const urlParams = new URL(window.location.href).searchParams;
  
  // Strip www. prefix so both abcefgh.onlinept.in AND www.abcefgh.onlinept.in work
  const effectiveHostname = hostname.replace(/^www\./, '');

  // 1. Production: 3+ parts ending with onlinept.in (e.g. abcefgh.onlinept.in)
  // 2. Local: if ?dev=1 or ?tenant= is present
  const isClinicPortal = (effectiveHostname.endsWith('.onlinept.in') && effectiveHostname !== 'onlinept.in') || 
                         urlParams.get('tenant') || 
                         urlParams.get('dev') === '1';

  return (
    <Suspense fallback={<RouteLoader />}>
      <ScrollToTop />
      <Routes>
        <Route 
          path="/" 
          element={isClinicPortal ? <BookingPage /> : <LandingPage />} 
        />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/reschedule/:bookingId" element={<ReschedulePage />} />
        <Route path="/intake/:bookingId" element={<IntakeFormPage />} />
        <Route path="/payment/:bookingId" element={<PaymentPage />} />
        <Route path="/pay" element={<PaymentPage />} />
        <Route path="/confirmation/:id" element={<ConfirmationPage />} />
        <Route path="/join/:bookingId" element={<JoinSessionPage />} />
        <Route path="/dashboard-login" element={<PhysioLoginPage />} />
        <Route path="/physio-signup" element={<PhysioSignUpPage />} />
        <Route path="/setup" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<PhysioDashboard />} />
        <Route path="/hep" element={<HEPBuilderPage />} />
        <Route path="/post-session/:bookingId" element={<PostSessionPage />} />
        <Route path="/feedback/:bookingId" element={<PatientFeedbackPage />} />
        <Route path="/resources" element={<Navigate to="/dashboard?tab=Library" replace />} />
        <Route path="/content-creator" element={<Navigate to="/dashboard?tab=Creator" replace />} />
        <Route path="/clinic-branding" element={<Navigate to="/dashboard?tab=Branding" replace />} />
        <Route path="/bulk-messaging" element={<PhysioGuard><BulkMessaging /></PhysioGuard>} />

        {/* ── Physio Own Settings (Firebase Auth) ── */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* ── Physio Admin Panel (Page Builder with Live Preview) ── */}
        <Route path="/admin" element={<PhysioGuard><PhysioAdminPanel /></PhysioGuard>} />

        {/* ── Master Admin (SuperAdminGuard) ── */}
        <Route path="/saas/dashboard" element={<SuperAdminGuard><SaaSDashboard /></SuperAdminGuard>} />
        
        {/* PUBLIC SaaS routes for signup/onboarding */}
        <Route path="/saas" element={<LandingPage />} />
        <Route path="/saas/onboarding" element={<ClinicOnboardingFlow />} />
        
        <Route path="/saas/pending" element={<ClinicPendingApprovalPage />} />
        <Route path="/saas/settings" element={<SuperAdminGuard><ClinicSettings /></SuperAdminGuard>} />

        {/* PUBLIC Info Pages */}
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/cancellation" element={<CancellationPolicyPage />} />
        <Route path="/contact" element={<ContactUsPage />} />
        {/* WhatsApp redirect: used by the approved WA template "Talk To Clinic" button */}
        <Route path="/wa/:subdomain" element={<ClinicWhatsAppRedirect />} />
        <Route path="/help" element={<HelpCenterPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
