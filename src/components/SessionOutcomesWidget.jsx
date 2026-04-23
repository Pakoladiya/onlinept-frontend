import React, { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Activity, TrendingUp, Users, Star, Loader2 } from 'lucide-react';

export default function SessionOutcomesWidget({ user }) {
  const [loading, setLoading] = useState(true);
  const [vasData, setVasData] = useState([]);
  const [stats, setStats] = useState({ avgVas: null, sessionsCompleted: 0, improvedPatients: 0 });
  const canvasRef = React.useRef(null);

  useEffect(() => {
    if (!user) return;
    async function loadData() {
      setLoading(true);
      try {
        // Get clinicId from user uid
        const clinicsQ = query(collection(db, 'clinics'), where('uid', '==', user.uid));
        const clinicsSnap = await getDocs(clinicsQ);
        if (clinicsSnap.empty) { setLoading(false); return; }
        const clinicId = clinicsSnap.docs[0].id;

        // Last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const bookingsQ = query(
          collection(db, 'bookings'),
          where('clinicId', '==', clinicId),
          where('status', '==', 'completed'),
          orderBy('createdAt', 'desc'),
          limit(200)
        );
        const bookingsSnap = await getDocs(bookingsQ);
        const allBookings = bookingsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(b => b.createdAt && new Date(b.createdAt.seconds ? b.createdAt.toDate() : b.createdAt) >= thirtyDaysAgo);

        const completedSessions = allBookings.length;

        // VAS scores from intake
        const sessionsWithVas = allBookings
          .filter(b => b.vasScore != null || (b.intake && b.intake.vasScore != null))
          .map(b => ({
            date: b.createdAt ? (b.createdAt.seconds ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(),
            vas: b.vasScore ?? b.intake?.vasScore ?? 0,
          }))
          .sort((a, b) => a.date - b.date)
          .slice(-10);

        setVasData(sessionsWithVas);

        const avgVas = sessionsWithVas.length > 0
          ? (sessionsWithVas.reduce((sum, s) => sum + s.vas, 0) / sessionsWithVas.length).toFixed(1)
          : null;

        // Patients with >2 point improvement (compare first vs last VAS per patient)
        const patientVasMap = {};
        allBookings.forEach(b => {
          const phone = b.patientPhone || b.patientPhone2 || '';
          const vas = b.vasScore ?? b.intake?.vasScore;
          if (!phone || vas == null) return;
          if (!patientVasMap[phone]) patientVasMap[phone] = [];
          patientVasMap[phone].push({ date: b.createdAt ? (b.createdAt.seconds ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(), vas });
        });
        let improvedPatients = 0;
        Object.values(patientVasMap).forEach(records => {
          if (records.length < 2) return;
          records.sort((a, b) => a.date - b.date);
          const first = records[0].vas;
          const last = records[records.length - 1].vas;
          if (last < first - 2) improvedPatients++;
        });

        setStats({ avgVas, sessionsCompleted: completedSessions, improvedPatients });
      } catch (err) {
        console.error('[SessionOutcomesWidget]', err);
      }
      setLoading(false);
    }
    loadData();
  }, [user]);

  // Draw chart
  useEffect(() => {
    if (loading || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (vasData.length === 0) {
      ctx.fillStyle = '#6B7280';
      ctx.font = '14px DM Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No completed sessions with VAS data yet.', W / 2, H / 2);
      return;
    }

    const pad = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const barWidth = Math.max(12, (chartW / vasData.length) - 8);

    // Y-axis lines (0–10)
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '11px DM Sans, sans-serif';
    for (let v = 0; v <= 10; v++) {
      const y = pad.top + chartH - (v / 10) * chartH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(v, pad.left - 6, y + 4);
    }

    // Bars
    vasData.forEach((s, i) => {
      const x = pad.left + i * (chartW / vasData.length) + (chartW / vasData.length - barWidth) / 2;
      const barH = (s.vas / 10) * chartH;
      const y = pad.top + chartH - barH;

      // Color by VAS level
      let color;
      if (s.vas <= 3) color = '#10B981';
      else if (s.vas <= 6) color = '#F59E0B';
      else color = '#EF4444';

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, 4);
      ctx.fill();

      // VAS value label on top of bar
      ctx.fillStyle = '#E5E7EB';
      ctx.font = 'bold 10px DM Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.vas.toFixed(0), x + barWidth / 2, y - 4);

      // X-axis label
      ctx.fillStyle = '#6B7280';
      ctx.font = '10px DM Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`S${i + 1}`, x + barWidth / 2, pad.top + chartH + 14);
    });

    // Axis labels
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Session Number', W / 2, H - 6);
    ctx.save();
    ctx.translate(12, pad.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('VAS Score', 0, 0);
    ctx.restore();
  }, [vasData, loading]);

  if (loading) {
    return (
      <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color="#007AFF" className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Avg VAS Score', value: stats.avgVas ?? '—', icon: Activity, color: '#007AFF' },
          { label: 'Sessions Completed', value: stats.sessionsCompleted, icon: TrendingUp, color: '#10B981' },
          { label: 'Improved Patients (>2pt)', value: stats.improvedPatients, icon: Users, color: '#8B5CF6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{
            background: '#111827', borderRadius: 20, border: '1px solid #1F2937',
            padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `${color}20`, display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: color
            }}>
              <Icon size={18} />
            </div>
            <div>
              <h4 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 28, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{value}</h4>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginTop: 4 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Canvas Chart */}
      <div style={{
        background: '#111827', borderRadius: 24, border: '1px solid #1F2937',
        padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={18} color="#007AFF" />
          <h3 style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Manrope', sans-serif", color: '#FFFFFF' }}>VAS Trend — Last 10 Sessions</h3>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[{ color: '#10B981', label: 'Low (0–3)' }, { color: '#F59E0B', label: 'Medium (4–6)' }, { color: '#EF4444', label: 'High (7–10)' }].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>{label}</span>
            </div>
          ))}
        </div>
        <canvas ref={canvasRef} width={400} height={200} style={{ borderRadius: 12, background: '#0F172A', display: 'block', width: '100%', height: 'auto' }} />
      </div>
    </div>
  );
}
