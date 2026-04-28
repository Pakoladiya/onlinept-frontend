import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Star, CheckCircle2, ThumbsUp, ThumbsDown, MessageSquare, ShieldCheck, Heart, ArrowRight, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ClinicConfigProvider, useClinicConfig } from '@/context/ClinicConfigContext';

function FeedbackForm() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { config } = useClinicConfig();
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [rating, setRating] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [professionalism, setProfessionalism] = useState(0);
  const [techQuality, setTechQuality] = useState(null);
  const [recommend, setRecommend] = useState(null);
  const [comments, setComments] = useState('');

  useEffect(() => {
    async function fetchBooking() {
      if (!bookingId) return;
      try {
        const snap = await getDoc(doc(db, 'bookings', bookingId));
        if (snap.exists()) {
          const data = snap.data();
          setBooking(data);
          if (data.feedbackSubmitted) setSubmitted(true);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchBooking();
  }, [bookingId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) return;
    
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        feedbackRating: rating,
        feedbackClarity: clarity,
        feedbackProfessionalism: professionalism,
        feedbackTechQuality: techQuality,
        recommend: recommend,
        feedbackText: comments,
        feedbackSubmitted: true,
        feedbackAt: new Date().toISOString()
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-black text-white">Thank You!</h1>
          <p className="text-gray-400 font-medium leading-relaxed">
            Your feedback has been recorded. It helps {booking?.physioName || 'us'} provide better care for you and others.
          </p>
          <Button onClick={() => window.close()} className="w-full h-14 rounded-2xl font-black bg-white text-black hover:bg-gray-200">
            Close Window
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest">
            <ShieldCheck size={14} /> Patient Experience
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            How was your session with <span className="text-blue-500">{booking?.physioName || 'your Physio'}</span>?
          </h1>
          <p className="text-gray-400 font-medium text-lg">
            Your honest feedback helps us improve our clinical standards.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Overall Rating */}
          <section className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold">Overall Satisfaction</h3>
              <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Tap to rate</p>
            </div>
            <div className="flex justify-center gap-2 md:gap-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    n <= rating 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-110' 
                      : 'bg-white/5 text-gray-500 hover:bg-white/10'
                  }`}
                >
                  <Star size={24} fill={n <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-blue-400 font-black uppercase text-xs tracking-widest animate-in fade-in slide-in-from-bottom-2">
                {rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
              </p>
            )}
          </section>

          {/* Detailed Questions */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Clarity */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Exercise Clarity</h4>
              <p className="text-xs text-gray-500">Were the exercises explained clearly?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setClarity(n)}
                    className={`flex-1 h-10 rounded-lg text-xs font-black transition-all ${
                      n <= clarity ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-500'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Professionalism */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Professionalism</h4>
              <p className="text-xs text-gray-500">Professionalism of the therapist?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setProfessionalism(n)}
                    className={`flex-1 h-10 rounded-lg text-xs font-black transition-all ${
                      n <= professionalism ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-500'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tech Quality & Recommendation */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Tech Quality */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 space-y-4 text-center">
              <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Call Quality</h4>
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setTechQuality('good')}
                  className={`px-6 py-3 rounded-xl font-bold text-xs transition-all ${
                    techQuality === 'good' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white/5 text-gray-500'
                  }`}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setTechQuality('bad')}
                  className={`px-6 py-3 rounded-xl font-bold text-xs transition-all ${
                    techQuality === 'bad' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-gray-500'
                  }`}
                >
                  Laggy
                </button>
              </div>
            </div>

            {/* Recommend */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 space-y-4 text-center">
              <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Recommend us?</h4>
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setRecommend(true)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    recommend === true ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-500'
                  }`}
                >
                  <ThumbsUp size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setRecommend(false)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    recommend === false ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-500'
                  }`}
                >
                  <ThumbsDown size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <MessageSquare size={16} /> Additional Comments
            </h4>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Tell us what we can do better..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-gray-600 outline-none focus:border-blue-500/40 transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <Button 
            disabled={rating === 0 || submitting}
            className="w-full h-16 rounded-[24px] font-black text-lg bg-blue-600 hover:bg-blue-500 shadow-2xl shadow-blue-600/20 disabled:opacity-50 disabled:grayscale"
          >
            {submitting ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                Submit Feedback <ArrowRight size={20} />
              </span>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center py-10 opacity-30">
          <p className="text-xs font-black uppercase tracking-[0.3em]">OnlinePT Security Standard</p>
        </div>
      </div>
    </div>
  );
}

export default function PatientFeedbackPage() {
  return (
    <ClinicConfigProvider>
      <FeedbackForm />
    </ClinicConfigProvider>
  );
}
