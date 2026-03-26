import { Router } from 'express';

/**
 * Slots Router
 *
 * Manages available consultation time slots.
 * In production: store in Firestore clinics/{clinicId}/slots/{date}
 *
 * Each slot document:
 *   { time: "HH:mm", booked: boolean, bookingId: string | null }
 */

const router = Router();

const workingHours = { start: '09:00', end: '19:00', slotMinutes: 30 };

// In-memory mock store — replace with Firestore in production
const slotsByDate = new Map();

/**
 * Generate time slots for a given date string (YYYY-MM-DD).
 */
function generateDaySlots(dateStr) {
  const slots = [];
  const [startH, startM] = workingHours.start.split(':').map(Number);
  const [endH, endM] = workingHours.end.split(':').map(Number);
  let h = startH, m = startM;
  while (h < endH || (h === endH && m < endM)) {
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    slots.push({ time: timeStr, booked: false, bookingId: null });
    m += workingHours.slotMinutes;
    if (m >= 60) { h += Math.floor(m / 60); m %= 60; }
  }
  return slots;
}

/**
 * GET /api/slots/:clinicId?date=YYYY-MM-DD
 * Get slots for a clinic/date. Auto-generates if not found.
 */
router.get('/:clinicId', (req, res) => {
  const { clinicId } = req.params;
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });

  const key = `${clinicId}:${date}`;
  if (!slotsByDate.has(key)) {
    slotsByDate.set(key, generateDaySlots(date));
  }

  res.json({ clinicId, date, slots: slotsByDate.get(key) });
});

/**
 * POST /api/slots/create
 * Create a custom slot.
 * Body: { clinicId, date, time }
 */
router.post('/create', (req, res) => {
  const { clinicId, date, time } = req.body;
  if (!clinicId || !date || !time) {
    return res.status(400).json({ error: 'clinicId, date, and time are required' });
  }
  const key = `${clinicId}:${date}`;
  if (!slotsByDate.has(key)) {
    slotsByDate.set(key, generateDaySlots(date));
  }
  const slots = slotsByDate.get(key);
  const existing = slots.find((s) => s.time === time);
  if (existing) return res.status(409).json({ error: 'Slot already exists', slot: existing });

  slots.push({ time, booked: false, bookingId: null });
  slots.sort((a, b) => a.time.localeCompare(b.time));
  res.status(201).json({ message: 'Slot created', slot: { time, booked: false, bookingId: null } });
});

/**
 * PATCH /api/slots/:slotId/block
 * Block (unbook) a slot.
 * Body: { clinicId, date, time }
 */
router.patch('/:slotId/block', (req, res) => {
  const { clinicId, date, time } = req.body;
  if (!clinicId || !date || !time) {
    return res.status(400).json({ error: 'clinicId, date, and time are required' });
  }
  const key = `${clinicId}:${date}`;
  if (!slotsByDate.has(key)) return res.status(404).json({ error: 'No slots found for this date' });

  const slots = slotsByDate.get(key);
  const slot = slots.find((s) => s.time === time);
  if (!slot) return res.status(404).json({ error: 'Slot not found' });

  slot.booked = false;
  slot.bookingId = null;
  res.json({ message: 'Slot blocked', slot });
});

/**
 * POST /api/slots/bulk-create
 * Bulk-create slots for a date range.
 * Body: { clinicId, startDate, endDate }
 */
router.post('/bulk-create', (req, res) => {
  const { clinicId, startDate, endDate } = req.body;
  if (!clinicId || !startDate || !endDate) {
    return res.status(400).json({ error: 'clinicId, startDate, and endDate are required' });
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end) || start > end) {
    return res.status(400).json({ error: 'Invalid date range' });
  }

  const created = [];
  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const key = `${clinicId}:${dateStr}`;
    if (!slotsByDate.has(key)) {
      slotsByDate.set(key, generateDaySlots(dateStr));
      created.push(dateStr);
    }
    current.setDate(current.getDate() + 1);
  }

  res.json({ message: `Slots generated for ${created.length} days`, dates: created });
});

/**
 * POST /api/slots/book
 * Mark a slot as booked.
 * Body: { clinicId, date, time, bookingId }
 */
router.post('/book', (req, res) => {
  const { clinicId, date, time, bookingId } = req.body;
  if (!clinicId || !date || !time || !bookingId) {
    return res.status(400).json({ error: 'clinicId, date, time, and bookingId required' });
  }

  const key = `${clinicId}:${date}`;
  if (!slotsByDate.has(key)) {
    slotsByDate.set(key, generateDaySlots(date));
  }

  const slots = slotsByDate.get(key);
  const slot = slots.find((s) => s.time === time);
  if (!slot) return res.status(404).json({ error: 'Slot not found' });
  if (slot.booked) return res.status(409).json({ error: 'Slot already booked' });

  slot.booked = true;
  slot.bookingId = bookingId;
  res.json({ slot });
});

/**
 * DELETE /api/slots/release
 * Release (unbook) a slot.
 * Body: { clinicId, date, time }
 */
router.delete('/release', (req, res) => {
  const { clinicId, date, time } = req.body;
  if (!clinicId || !date || !time) {
    return res.status(400).json({ error: 'clinicId, date, and time required' });
  }
  const key = `${clinicId}:${date}`;
  if (!slotsByDate.has(key)) return res.status(404).json({ error: 'Date not found' });

  const slots = slotsByDate.get(key);
  const slot = slots.find((s) => s.time === time);
  if (!slot) return res.status(404).json({ error: 'Slot not found' });

  slot.booked = false;
  slot.bookingId = null;
  res.json({ slot });
});

export default router;
