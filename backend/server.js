import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import appointmentsRouter from './routes/appointments.js';
import slotsRouter from './routes/slots.js';
import zoomRouter from './routes/zoom.js';
import paymentsRouter from './routes/payments.js';
import notificationsRouter from './routes/notifications.js';
import storageRouter from './routes/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Parse raw body for Razorpay webhooks (must be before express.json)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// ── API Routes ────────────────────────────────────────────────
app.use('/api/appointments', appointmentsRouter);
app.use('/api/slots', slotsRouter);
app.use('/api/zoom', zoomRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/storage', storageRouter);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Serve frontend build in production ──────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
  app.get('*', (_req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

// ── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`\n🏥 Physio Backend running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;
