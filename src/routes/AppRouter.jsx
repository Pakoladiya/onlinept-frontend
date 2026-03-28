import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import BookingPage from '@/pages/BookingPage';
import IntakeFormPage from '@/pages/IntakeFormPage';
import PaymentPage from '@/pages/PaymentPage';
import ConfirmationPage from '@/pages/ConfirmationPage';
import JoinSessionPage from '@/pages/JoinSessionPage';
import PhysioLoginPage from '@/pages/PhysioLoginPage';
import PhysioSignUpPage from '@/pages/PhysioSignUpPage';
import PhysioDashboard from '@/pages/PhysioDashboard';
import HEPBuilderPage from '@/pages/HEPBuilderPage';
import PostSessionPage from '@/pages/PostSessionPage';
import OnboardingPage from '@/pages/OnboardingPage';
import MasterAdminPage from '@/pages/MasterAdminPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/book" element={<BookingPage />} />
      <Route path="/intake/:bookingId" element={<IntakeFormPage />} />
      <Route path="/payment/:bookingId" element={<PaymentPage />} />
      <Route path="/confirmation/:id" element={<ConfirmationPage />} />
      <Route path="/join/:bookingId" element={<JoinSessionPage />} />
      <Route path="/dashboard-login" element={<PhysioLoginPage />} />
      <Route path="/physio-signup" element={<PhysioSignUpPage />} />
      <Route path="/setup" element={<OnboardingPage />} />
      <Route path="/dashboard" element={<PhysioDashboard />} />
      <Route path="/hep" element={<HEPBuilderPage />} />
      <Route path="/post-session/:bookingId" element={<PostSessionPage />} />
      <Route path="/admin" element={<MasterAdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
