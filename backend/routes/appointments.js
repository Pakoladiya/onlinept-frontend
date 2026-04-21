import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Appointments Router
 *
 * Full CRUD for patient bookings backed by Firestore.
 * Collection: bookings/{bookingId}
 *
 * Falls back gracefully when Firebase env vars are not configured.
 */

const router = Router();

// In-memory mock store for when Firestore isn't configured
const bookings = new Map();

// ── Helpers ─────────────────────────────────────────────────────────────────

async function getDb() {
  const isConfigured = !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL
  );
  if (!isConfigured) return null;
  const { getDb } = await import('../firebase-admin.js');
  return getDb();
}

async function getBooking(db, id) {
  const snap = await db.collection('bookings').doc(id).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

async function getClinic(db, clinicId) {
  const snap = await db.collection('clinics').doc(clinicId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/appointments
 * List all bookings. Filter: ?date=YYYY-MM-DD&clinicId=xxx&status=confirmed
 */
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      const result = [...bookings.values()];
      return res.json({ bookings: result });
    }

    const { date, status, clinicId } = req.query;
    let ref = db.collection('bookings');

    if (date)         ref = ref.where('date', '==', date);
    if (status)       ref = ref.where('status', '==', status);
    if (clinicId)     ref = ref.where('clinicId', '==', clinicId);

    const snap = await ref.orderBy('date', 'asc').orderBy('time', 'asc').get();
    res.json({ bookings: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    console.error('[Appointments] GET / error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/appointments/physio/:physioId
 * All bookings for a physio (dashboard use).
 */
router.get('/physio/:physioId', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      const result = [...bookings.values()].filter(b => b.clinicId === req.params.physioId);
      result.sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));
      return res.json({ bookings: result });
    }

    const snap = await db.collection('bookings')
      .where('clinicId', '==', req.params.physioId)
      .orderBy('date', 'desc')
      .orderBy('time', 'desc')
      .get();
    res.json({ bookings: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
  } catch (err) {
    console.error('[Appointments] GET /physio error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/appointments/upcoming
 * Get confirmed bookings where reminder hasn't been sent yet.
 * Query: ?hours=24
 */
router.get('/upcoming', async (req, res) => {
  try {
    const db = await getDb();
    const now = new Date();

    if (!db) {
      // Mock: return bookings with times between now and 24h from now
      const upcoming = [...bookings.values()].filter(b => {
        if (b.status !== 'confirmed' || b.reminderSent) return false;
        const t = new Date(`${b.date}T${b.time}:00`);
        return t > now;
      });
      return res.json({ bookings: upcoming });
    }

    const snap = await db.collection('bookings')
      .where('status', '==', 'confirmed')
      .where('reminderSent', '!=', true)
      .get();

    const upcoming = [];
    for (const doc of snap.docs) {
      const b = { id: doc.id, ...doc.data() };
      const apptTime = new Date(`${b.date}T${b.time}:00`);
      const diffMs = apptTime - now;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins > 0 && diffMins <= 60) {
        upcoming.push(b);
      }
    }

    res.json({ bookings: upcoming });
  } catch (err) {
    console.error('[Appointments] GET /upcoming error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/appointments/:id
 * Get a single booking by ID.
 */
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      const b = bookings.get(req.params.id);
      if (!b) return res.status(404).json({ error: 'Booking not found' });
      return res.json({ booking: { id: req.params.id, ...b } });
    }
    const booking = await getBooking(db, req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/appointments/create
 * Create a new booking.
 */
router.post('/create', async (req, res) => {
  try {
    const {
      patientName, date, time, slotDuration = 30, contact,
      serviceId, serviceName, servicePrice, clinicId, intakeData,
      patientPhone, patientEmail,
    } = req.body;

    if (!patientName || !date || !time) {
      return res.status(400).json({ error: 'patientName, date, and time are required' });
    }

    const id = `booking_${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    const booking = {
      clinicId: clinicId || 'default',
      patientName,
      date,
      time,
      slotDuration,
      contact: contact || null,
      patientPhone: patientPhone || null,
      patientEmail: patientEmail || null,
      serviceId: serviceId || null,
      serviceName: serviceName || 'Consultation',
      servicePrice: servicePrice || 0,
      intakeData: intakeData || null,
      status: 'pending_payment',
      videoLink: null,
      meetingId: null,
      paymentId: null,
      paymentVerified: false,
      zoomJoinUrl: null,
      zoomStartUrl: null,
      reminderSent: false,
      reminderSentAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDb();

    if (db) {
      await db.collection('bookings').doc(id).set(booking);

      // Fetch clinic for WhatsApp notifications
      let clinicConfig = null;
      if (clinicId) {
        clinicConfig = await getClinic(db, clinicId);
      }

      // Fire-and-forget WhatsApp notifications
      if (clinicConfig?.whatsapp) {
        import('../services/whatsapp.js').then(({ notifyPatientBooking }) => {
          notifyPatientBooking({
            phone: patientPhone,
            name: patientName,
            clinicName: clinicConfig.clinicName,
            dateDisplay: date,
            slotLabel: time,
            meetingLink: `https://${clinicConfig.subdomain || clinicId}.onlinept.in/join/${id}`,
          }, {
            whatsappToken: process.env.WHATSAPP_ADMIN_TOKEN,
            whatsappPhoneId: process.env.WHATSAPP_PHONE_ID,
          }).catch(err => console.error('[WA] Patient notification failed:', err));
        });
      }
    } else {
      bookings.set(id, booking);
    }

    res.status(201).json({ booking: { id, ...booking } });
  } catch (err) {
    console.error('[Appointments] POST /create error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/appointments/:id/status
 * Update booking status.
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const db = await getDb();
    const { status } = req.body;
    const allowed = ['pending_payment', 'confirmed', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }

    if (db) {
      const booking = await getBooking(db, req.params.id);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });

      const updates = { status, updatedAt: new Date().toISOString() };
      if (status === 'confirmed' && !booking.status.startsWith('confirmed')) {
        updates.confirmedAt = new Date().toISOString();
      }

      await db.collection('bookings').doc(req.params.id).update(updates);
      const updated = await getBooking(db, req.params.id);
      return res.json({ booking: updated });
    }

    // Fallback: in-memory
    const b = bookings.get(req.params.id);
    if (!b) return res.status(404).json({ error: 'Booking not found' });
    b.status = status;
    b.updatedAt = new Date().toISOString();
    return res.json({ booking: { id: req.params.id, ...b } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/appointments/:id
 * Update booking fields.
 */
router.patch('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const allowed = [
      'status', 'videoLink', 'paymentId', 'zoomJoinUrl', 'zoomStartUrl',
      'meetingId', 'paymentVerified', 'reminderSent', 'reminderSentAt',
    ];

    if (db) {
      const booking = await getBooking(db, req.params.id);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });

      const updates = { updatedAt: new Date().toISOString() };
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }

      await db.collection('bookings').doc(req.params.id).update(updates);
      const updated = await getBooking(db, req.params.id);
      return res.json({ booking: updated });
    }

    // Fallback: in-memory
    const b = bookings.get(req.params.id);
    if (!b) return res.status(404).json({ error: 'Booking not found' });
    for (const key of allowed) {
      if (req.body[key] !== undefined) b[key] = req.body[key];
    }
    b.updatedAt = new Date().toISOString();
    return res.json({ booking: { id: req.params.id, ...b } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/appointments/:id
 * Cancel a booking.
 */
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();

    if (db) {
      const booking = await getBooking(db, req.params.id);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });

      await db.collection('bookings').doc(req.params.id).update({
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      });
      const updated = await getBooking(db, req.params.id);
      return res.json({ booking: updated });
    }

    // Fallback: in-memory
    const b = bookings.get(req.params.id);
    if (!b) return res.status(404).json({ error: 'Booking not found' });
    b.status = 'cancelled';
    b.updatedAt = new Date().toISOString();
    return res.json({ booking: { id: req.params.id, ...b } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;