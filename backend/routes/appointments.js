import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Appointments Router
 *
 * Full CRUD for patient bookings.
 * TODO: Replace in-memory store with Firestore queries using firebase-admin.
 *
 * Firestore collection: bookings/{bookingId}
 */

const router = Router();

// In-memory mock store — replace with Firestore
const bookings = new Map();

/**
 * GET /api/appointments
 * List all bookings. Filter: ?date=YYYY-MM-DD&status=confirmed
 */
router.get('/', (req, res) => {
  const { date, status } = req.query;
  let result = [...bookings.values()];
  if (date) result = result.filter((b) => b.date === date);
  if (status) result = result.filter((b) => b.status === status);
  result.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
  res.json({ bookings: result });
});

/**
 * GET /api/appointments/physio/:physioId
 * All bookings for a physio (dashboard use).
 */
router.get('/physio/:physioId', (req, res) => {
  const result = [...bookings.values()].filter((b) => b.physioId === req.params.physioId);
  result.sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));
  res.json({ bookings: result });
});

/**
 * GET /api/appointments/:id
 * Get a single booking by ID.
 */
router.get('/:id', (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  res.json({ booking });
});

/**
 * POST /api/appointments/create
 * Create a new booking.
 * Body: {
 *   patientName, date, time, slotDuration, contact, serviceId,
 *   serviceName, servicePrice, clinicId, intakeData
 * }
 */
router.post('/create', (req, res) => {
  const {
    patientName, date, time, slotDuration = 30, contact,
    serviceId, serviceName, servicePrice, clinicId, intakeData,
  } = req.body;

  if (!patientName || !date || !time) {
    return res.status(400).json({ error: 'patientName, date, and time are required' });
  }

  const id = `booking_${uuidv4().slice(0, 8)}`;
  const booking = {
    id,
    clinicId: clinicId || 'default',
    patientName,
    date,
    time,
    slotDuration,
    contact: contact || null,
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  bookings.set(id, booking);
  res.status(201).json({ booking });
});

/**
 * PATCH /api/appointments/:id/status
 * Update booking status.
 * Body: { status: 'pending_payment'|'confirmed'|'completed'|'cancelled' }
 */
router.patch('/:id/status', (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const { status } = req.body;
  const allowed = ['pending_payment', 'confirmed', 'completed', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Allowed: ${allowed.join(', ')}` });
  }

  const updated = { ...booking, status, updatedAt: new Date().toISOString() };
  bookings.set(req.params.id, updated);
  res.json({ booking: updated });
});

/**
 * PATCH /api/appointments/:id
 * Update booking fields (videoLink, paymentId, etc.)
 */
router.patch('/:id', (req, res) => {
  const booking = bookings.get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const allowed = ['status', 'videoLink', 'paymentId', 'zoomJoinUrl', 'zoomStartUrl', 'meetingId', 'paymentVerified'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const updated = { ...booking, ...updates, updatedAt: new Date().toISOString() };
  bookings.set(req.params.id, updated);
  res.json({ booking: updated });
});

/**
 * DELETE /api/appointments/:id
 * Cancel a booking.
 */
router.delete('/:id', (req, res) => {
  if (!bookings.has(req.params.id)) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  const booking = bookings.get(req.params.id);
  booking.status = 'cancelled';
  booking.updatedAt = new Date().toISOString();
  bookings.set(req.params.id, booking);
  res.json({ booking });
});

export default router;
