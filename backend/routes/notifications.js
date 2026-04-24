import { Router } from 'express';
import { sendAppointmentReminder, sendOTP } from '../services/whatsapp.js';
import { createCustomToken } from '../firebase-admin.js';

const router = Router();

const isConfigured = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_CLIENT_EMAIL
);

async function getDb() {
  if (!isConfigured) return null;
  const { getDb: initDb } = await import('../firebase-admin.js');
  return initDb();
}

function timeUntil(dateStr, timeStr) {
  const appt = new Date(`${dateStr}T${timeStr}:00`);
  return Math.floor((appt - new Date()) / 60000);
}

/**
 * GET /api/notifications/process-reminders
 * ---------------------------------------------------------------------------
 * CRON JOB — run every 15 minutes.
 *
 * VPS cron example (crontab -e):
 *   EVERY15="0,15,30,45,59 * * * *" curl -s https://your-domain/api/notifications/process-reminders
 *
 * Or use cron-job.org, Cloudflare Workers, Railway, Render cron.
 * ---------------------------------------------------------------------------
 * Logic:
 *   1. Fetch confirmed bookings where appointment is 15–60 min away
 *      and reminderSent != true.
 *   2. Send WhatsApp reminder to patient.
 *   3. Send nudge to physio (from clinic.whatsapp field).
 *   4. Mark reminderSent: true so we never double-send.
 */
router.get('/process-reminders', async (req, res) => {
  console.log('[ReminderEngine] Starting reminder scan...');

  try {
    const db = await getDb();
    if (!db) {
      return res.json({ success: false, error: 'Firebase not configured — skipping scan' });
    }

    const now = new Date();

    const snap = await db.collection('bookings')
      .where('status', '==', 'confirmed')
      .where('reminderSent', '!=', true)
      .get();

    const results = [];
    const errors = [];

    for (const doc of snap.docs) {
      const b = { id: doc.id, ...doc.data() };
      const diffMins = timeUntil(b.date, b.time);

      // Only trigger if session is 15–60 minutes away
      if (diffMins > 15 && diffMins <= 60) {
        console.log(`[ReminderEngine] Session ${b.id} starts in ${diffMins}m — sending nudge`);

        // Patient Reminder
        if (b.patientPhone) {
          try {
            await sendAppointmentReminder('patient_reminder', b.patientPhone, {
              name: b.patientName,
              time: `${b.date} at ${b.time}`,
              link: `https://${b.clinicId || 'onlinept'}.onlinept.in/join/${b.id}`,
            });
            console.log(`[ReminderEngine] Patient reminder sent for ${b.id}`);
          } catch (e) {
            console.error(`[ReminderEngine] Patient WA failed for ${b.id}:`, e.message);
            errors.push({ id: b.id, role: 'patient', error: e.message });
          }
        }

        // Therapist Nudge
        if (b.clinicId) {
          try {
            const clinicSnap = await db.collection('clinics').doc(b.clinicId).get();
            const clinic = clinicSnap.exists ? clinicSnap.data() : null;

            if (clinic?.whatsapp) {
              await sendAppointmentReminder('therapist_nudge', clinic.whatsapp, {
                name: b.patientName,
                time: `${b.date} at ${b.time}`,
                link: `https://${clinic.subdomain || b.clinicId}.onlinept.in/dashboard`,
              });
              console.log(`[ReminderEngine] Therapist nudge sent for ${b.id}`);
            }
          } catch (e) {
            console.error(`[ReminderEngine] Therapist WA failed for ${b.id}:`, e.message);
            errors.push({ id: b.id, role: 'therapist', error: e.message });
          }
        }

        // Mark reminderSent so we never double-send
        await db.collection('bookings').doc(b.id).update({
          reminderSent: true,
          reminderSentAt: new Date().toISOString(),
        });

        results.push(b.id);
      }
    }

    console.log(`[ReminderEngine] Scan complete. Sent: ${results.length} | Errors: ${errors.length}`);

    res.json({
      success: true,
      scannedAt: now.toISOString(),
      triggeredCount: results.length,
      triggeredIds: results,
      errors: errors.length ? errors : undefined,
    });

  } catch (err) {
    console.error('[ReminderEngine] Fatal error:', err);
    res.status(500).json({ error: 'Failed to process reminders' });
  }
});

/**
 * POST /api/notifications/send-now
 * Manually trigger a reminder for a specific booking (admin override).
 * Body: { bookingId: 'booking_abc123' }
 */
router.post('/send-now', async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: 'Firebase not configured' });

    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ error: 'bookingId required' });

    const snap = await db.collection('bookings').doc(bookingId).get();
    if (!snap.exists) return res.status(404).json({ error: 'Booking not found' });

    const b = { id: snap.id, ...snap.data() };

    if (b.patientPhone) {
      await sendAppointmentReminder('patient_reminder', b.patientPhone, {
        name: b.patientName,
        time: `${b.date} at ${b.time}`,
        link: `https://${b.clinicId || 'onlinept'}.onlinept.in/join/${b.id}`,
      });
    }

    if (b.clinicId) {
      const clinicSnap = await db.collection('clinics').doc(b.clinicId).get();
      const clinic = clinicSnap.exists ? clinicSnap.data() : null;
      if (clinic?.whatsapp) {
        await sendAppointmentReminder('therapist_nudge', clinic.whatsapp, {
          name: b.patientName,
          time: `${b.date} at ${b.time}`,
          link: `https://${clinic.subdomain || b.clinicId}.onlinept.in/dashboard`,
        });
      }
    }

    await db.collection('bookings').doc(bookingId).update({
      reminderSent: true,
      reminderSentAt: new Date().toISOString(),
    });

    res.json({ success: true, bookingId });
  } catch (err) {
    console.error('[Notifications] send-now error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/notifications/send-otp
 * Sends a 6-digit OTP to the user's WhatsApp.
 */
router.post('/send-otp', async (req, res) => {
  console.log(`[OTP] Request received for ${req.body?.phone} (Purpose: ${req.body?.purpose})`);
  try {
    const { phone, purpose, userName } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    const db = await getDb();
    if (!db) return res.status(503).json({ error: 'Database not available' });

    // ── Gate: verify the number exists in our database before burning an OTP ──
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone.replace(/\D/g, '')}`;
    const rawPhone = phone.replace(/\D/g, '');
    let registeredUser = null;

    // Check 1: users collection
    const usersSnap = await db.collection('users')
      .where('phone', '==', formattedPhone)
      .limit(1)
      .get();
    if (!usersSnap.empty) registeredUser = usersSnap.docs[0].id;

    // Check 2: clinics collection (whatsapp or phone field)
    if (!registeredUser) {
      for (const fieldVal of [formattedPhone, rawPhone, phone]) {
        const cWA = await db.collection('clinics').where('whatsapp', '==', fieldVal).limit(1).get();
        if (!cWA.empty) { registeredUser = cWA.docs[0].id; break; }
        const cPhone = await db.collection('clinics').where('phone', '==', fieldVal).limit(1).get();
        if (!cPhone.empty) { registeredUser = cPhone.docs[0].id; break; }
      }
    }

    if (!registeredUser) {
      console.log(`[OTP] Blocked — number not found in DB: ${phone}`);
      return res.status(404).json({
        success: false,
        error: 'This number is not registered on OnlinePT. Please check the number or contact support.'
      });
    }
    // ──────────────────────────────────────────────────────────────────────────

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60000); // 10 mins

    await db.collection('otps').doc(phone).set({
      otp,
      purpose: purpose || 'signin',
      expiresAt: expiry.toISOString(),
      createdAt: new Date().toISOString()
    });

    const result = await sendOTP(phone, otp, userName || 'User');

    if (result.success) {
      res.json({ success: true, message: 'OTP sent successfully' });
    } else {
      res.status(500).json({ success: false, error: typeof result.error === 'string' ? result.error : JSON.stringify(result.error) });
    }
  } catch (err) {
    console.error('[OTP Send Error]:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/notifications/verify-otp
 * Verifies the OTP.
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });

    const db = await getDb();
    if (!db) return res.status(503).json({ error: 'Database not available' });

    const doc = await db.collection('otps').doc(phone).get();
    if (!doc.exists) {
      return res.status(400).json({ success: false, error: 'OTP not found' });
    }

    const data = doc.data();
    if (new Date() > new Date(data.expiresAt)) {
      await db.collection('otps').doc(phone).delete();
      return res.status(400).json({ success: false, error: 'OTP expired' });
    }

    if (data.otp !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    await db.collection('otps').doc(phone).delete();

    // Look up Firebase UID by phone number
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone.replace(/\D/g, '')}`;
    const rawPhone = phone.replace(/\D/g, '');

    let token = null;
    let userId = null;

    // Strategy 1: Look up in users collection by phone
    const usersSnap = await db.collection('users')
      .where('phone', '==', formattedPhone)
      .limit(1)
      .get();

    if (!usersSnap.empty) {
      userId = usersSnap.docs[0].id;
    }

    // Strategy 2: Look up in clinics collection by whatsapp or phone field
    // Fetch up to 10 and prefer the active clinic if multiple share the same number
    if (!userId) {
      const pickActiveUid = (docs) => {
        const active = docs.find(d => d.data().subscriptionStatus === 'active');
        const nonPending = docs.find(d => d.data().subscriptionStatus !== 'pending_approval');
        const chosen = active || nonPending || docs[0];
        return chosen?.data()?.uid || null;
      };

      for (const fieldVal of [formattedPhone, rawPhone, phone]) {
        const clinicByWA = await db.collection('clinics')
          .where('whatsapp', '==', fieldVal)
          .limit(10)
          .get();
        if (!clinicByWA.empty) {
          userId = pickActiveUid(clinicByWA.docs);
          if (userId) break;
        }
        const clinicByPhone = await db.collection('clinics')
          .where('phone', '==', fieldVal)
          .limit(10)
          .get();
        if (!clinicByPhone.empty) {
          userId = pickActiveUid(clinicByPhone.docs);
          if (userId) break;
        }
      }
    }

    if (userId) {
      try {
        token = await createCustomToken(userId, { phone: formattedPhone, purpose: data.purpose });
      } catch (err) {
        console.error('[verify-otp] Custom token creation failed:', err);
      }
    }

    res.json({ success: true, purpose: data.purpose, token, userId });

  } catch (err) {
    console.error('[OTP Verify Error]:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

export default router;