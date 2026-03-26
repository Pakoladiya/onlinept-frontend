import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import clinicConfig from '@/config/clinicConfig';
import { whatsappLink, postSessionMessage } from '@/utils/whatsapp';
import {
  Star,
  MessageCircle,
  Calendar,
  ThumbsUp,
  Loader,
  Check,
  ArrowLeft,
  Send,
} from 'lucide-react';

const STARS = [
  { value: 1, label: 'Poor' },
  { value: 2, label: 'Fair' },
  { value: 3, label: 'Good' },
  { value: 4, label: 'Very Good' },
  { value: 5, label: 'Excellent' },
];

export default function PostSessionPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { patientName, serviceName, date } = location.state || {};

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [recommend, setRecommend] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  };

  const handleWhatsAppShare = () => {
    const msg = postSessionMessage({
      patientName: patientName || 'Patient',
      physioName: clinicConfig.physioName,
      followUpDate: null,
      clinicName: clinicConfig.clinicName,
    });
    window.open(whatsappLink(msg), '_blank');
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  if (submitted) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: `${clinicConfig.primaryColor}20` }}
          >
            <Check size={40} style={{ color: clinicConfig.primaryColor }} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Session Complete!</h1>
          <p className="text-sm text-text-secondary mb-8 max-w-xs">
            Thank you for your feedback. Your exercises have been sent to your WhatsApp.
          </p>
          <div className="space-y-3 w-full max-w-xs">
            <Button fullWidth onClick={() => navigate('/')}>
              <ArrowLeft size={16} /> Back to Home
            </Button>
            <Button variant="outline" fullWidth onClick={handleWhatsAppShare}>
              <MessageCircle size={16} /> Open WhatsApp Exercises
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <button
        onClick={handleBack}
        className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </button>

      <div className="mb-6">
        <Badge variant="success" size="sm" className="mb-2">Session Ended</Badge>
        <h1 className="text-2xl font-bold text-text-primary">How Was Your Session?</h1>
        <p className="text-sm text-text-secondary mt-1">
          {serviceName || 'Physiotherapy Session'} with {clinicConfig.physioName}
        </p>
      </div>

      {/* Session Summary */}
      <Card className="mb-5">
        <h2 className="font-semibold text-text-primary mb-3">Session Summary</h2>
        <div className="space-y-2">
          {[
            { label: 'Patient', value: patientName || '—' },
            { label: 'Service', value: serviceName || 'Consultation' },
            { label: 'Date', value: date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
            { label: 'Booking ID', value: bookingId },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-text-secondary">{label}</span>
              <span className="font-medium text-text-primary">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Star Rating */}
      <Card className="mb-5">
        <h2 className="font-semibold text-text-primary mb-4">Rate Your Experience</h2>
        <div className="flex gap-2 justify-center mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={star <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
              />
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-text-secondary">
          {rating > 0 ? STARS.find((s) => s.value === rating)?.label : 'Tap to rate'}
        </p>
      </Card>

      {/* Feedback */}
      <Card className="mb-5">
        <h2 className="font-semibold text-text-primary mb-3">Share Your Feedback</h2>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="How was your consultation? Any suggestions for improvement?"
          rows={4}
          className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-primary resize-none"
        />
      </Card>

      {/* Would Recommend */}
      <Card className="mb-6">
        <h2 className="font-semibold text-text-primary mb-3">Would You Recommend Us?</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setRecommend(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${recommend === true ? 'border-success text-success bg-success/10' : 'border-border text-text-secondary hover:border-success/50'}`}
          >
            <ThumbsUp size={18} />
            <span className="text-sm font-medium">Yes</span>
          </button>
          <button
            onClick={() => setRecommend(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${recommend === false ? 'border-error text-error bg-error/10' : 'border-border text-text-secondary hover:border-error/50'}`}
          >
            <ThumbsUp size={18} className="rotate-180" />
            <span className="text-sm font-medium">Not Sure</span>
          </button>
        </div>
      </Card>

      <Button size="lg" fullWidth onClick={handleSubmit} disabled={loading || rating === 0}>
        {loading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
        {loading ? 'Submitting...' : 'Submit Feedback'}
      </Button>

      <p className="text-center text-xs text-text-secondary mt-4">
        Your feedback helps us improve our service.
      </p>
    </PageWrapper>
  );
}
