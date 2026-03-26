import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import BookingPage from '@/pages/BookingPage';
import IntakeFormPage from '@/pages/IntakeFormPage';
import PaymentPage from '@/pages/PaymentPage';
import ConfirmationPage from '@/pages/ConfirmationPage';
import JoinSessionPage from '@/pages/JoinSessionPage';
import PhysioDashboard from '@/pages/PhysioDashboard';
import PhysioLoginPage from '@/pages/PhysioLoginPage';
import HEPBuilderPage from '@/pages/HEPBuilderPage';
import PostSessionPage from '@/pages/PostSessionPage';
import OnboardingPage from '@/pages/OnboardingPage';

/**
 * AppRouter — all routes for the PWA.
 *
 * Routes:
 *   /                     → LandingPage
 *   /book                 → BookingPage
 *   /intake/:bookingId    → IntakeFormPage
 *   /payment/:bookingId   → PaymentPage
 *   /confirmation/:id     → ConfirmationPage
 *   /join/:bookingId      → JoinSessionPage
 *   /dashboard-login       → PhysioLoginPage
 *   /dashboard            → PhysioDashboard (Firebase auth protected)
 *   /hep                  → HEPBuilderPage
 *   /post-session/:id      → PostSessionPage
 *   /setup                → OnboardingPage
 */
export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/book" element={<BookingPage />} />
      <Route path="/intake/:bookingId" element={<IntakeFormPage />} />
      <Route path="/payment/:bookingId" element={<PaymentPage />} />
      <Route path="/confirmation/:id" element={<ConfirmationPage />} />
      <Route path="/join/:bookingId" element={<JoinSessionPage />} />
      <Route path="/dashboard-login" element={<PhysioLoginPage />} />
      <Route path="/setup" element={<OnboardingPage />} />

      {/* Protected: physiotherapist dashboard */}
      <Route path="/dashboard" element={<PhysioDashboard />} />
      <Route path="/hep" element={<HEPBuilderPage />} />
      <Route path="/post-session/:bookingId" element={<PostSessionPage />} />

      {/* Fallback: redirect root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
