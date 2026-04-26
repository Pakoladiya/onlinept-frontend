import { Router } from 'express';
import { sendAppointmentReminder, sendOTP, notifyClinicApproval } from '../services/whatsapp.js';
import { getDb, createCustomToken } from '../firebase-admin.js';

const router = Router();

const isConfigured = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_CLIENT_EMAIL
);

async function fetchDb() {
  if (!isConfigured) return null;
  return getDb();
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
    const db = await fetchDb();
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
    const db = await fetchDb();
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

    const db = await fetchDb();
    if (!db) return res.status(503).json({ error: 'Database not available' });

    // ── Gate: verify the number exists in our database before burning an OTP ──
    const phoneStr = String(phone).replace(/\D/g, '');
    // Remove leading 0 if present
    const cleanPhone = phoneStr.startsWith('0') ? phoneStr.substring(1) : phoneStr;
    // Ensure +91 for India if not already present
    const formattedPhone = `+${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}`;
    const rawPhone = cleanPhone;
    
    console.log(`[OTP] Normalized: ${formattedPhone}, Raw: ${rawPhone}`);
    
    let registeredUser = null;

    // Check 1: users collection
    const usersSnap = await db.collection('users')
      .where('phone', '==', formattedPhone)
      .limit(1)
      .get();
    if (!usersSnap.empty) registeredUser = usersSnap.docs[0].id;

    // Check 2: clinics collection (whatsapp or phone field)
    if (!registeredUser) {
      // Check multiple formats for clinics
      const clinicChecks = [formattedPhone, rawPhone, phone];
      for (const fieldVal of clinicChecks) {
        const cWA = await db.collection('clinics').where('whatsapp', '==', String(fieldVal)).limit(1).get();
        if (!cWA.empty) { registeredUser = cWA.docs[0].id; break; }
        const cPhone = await db.collection('clinics').where('phone', '==', String(fieldVal)).limit(1).get();
        if (!cPhone.empty) { registeredUser = cPhone.docs[0].id; break; }
      }
    }

    // Check 3: bookings collection (patient rescheduling their own appointment)
    if (!registeredUser) {
      const bookingChecks = [formattedPhone, rawPhone, phone];
      for (const fieldVal of bookingChecks) {
        const bSnap = await db.collection('bookings')
          .where('patientPhone', '==', String(fieldVal))
          .limit(1).get();
        if (!bSnap.empty) { registeredUser = bSnap.docs[0].id; break; }
      }
    }

    if (!registeredUser && purpose !== 'signup') {
      console.log(`[OTP] Blocked — number not found in DB: ${phone} (Attempted: ${formattedPhone})`);
      return res.status(404).json({
        success: false,
        error: 'This number is not registered on OnlinePT. Please check the number or contact support.'
      });
    }

    // ──────────────────────────────────────────────────────────────────────────

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60000); // 10 mins

    // Use formattedPhone as the doc ID to be consistent and string-safe
    await db.collection('otps').doc(formattedPhone).set({
      otp,
      phone: formattedPhone,
      purpose: purpose || 'signin',
      expiresAt: expiry.toISOString(),
      createdAt: new Date().toISOString()
    });

    console.log(`[OTP] Sending ${otp} to ${formattedPhone} using campaign "${process.env.AISENSY_CAMPAIGN_OTP || 'opt'}"`);
    const result = await sendOTP(formattedPhone, otp, userName || 'User');
    console.log(`[OTP] Send result:`, JSON.stringify(result));

    if (result.success) {
      res.json({ success: true, message: 'OTP sent successfully', phone: formattedPhone });
    } else {
      const errorMsg = typeof result.error === 'string' ? result.error : (result.error?.message || JSON.stringify(result.error));
      console.error(`[OTP] WhatsApp Service Error:`, errorMsg);
      res.status(500).json({ success: false, error: `WhatsApp Service: ${errorMsg}` });
    }
  } catch (err) {
    console.error('[OTP Send Fatal Error]:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
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

    const db = await fetchDb();
    if (!db) return res.status(503).json({ error: 'Database not available' });

    // Normalize phone to match the format used in /send-otp
    const phoneStr = String(phone).replace(/\D/g, '');
    const cleanPhone = phoneStr.startsWith('0') ? phoneStr.substring(1) : phoneStr;
    const formattedPhone = `+${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}`;
    const rawPhone = cleanPhone;

    console.log(`[verify-otp] Verifying for ${formattedPhone} (raw: ${phone})`);

    const otpDoc = await db.collection('otps').doc(formattedPhone).get();
    let otpData = null;

    if (!otpDoc.exists) {
      console.log(`[verify-otp] No OTP doc for ${formattedPhone}, trying raw: ${phone}`);
      const fallbackDoc = await db.collection('otps').doc(phone).get();
      if (!fallbackDoc.exists) {
        return res.status(400).json({ success: false, error: 'OTP not found or expired. Please request a new one.' });
      }
      otpData = fallbackDoc.data();
    } else {
      otpData = otpDoc.data();
    }

    if (new Date() > new Date(otpData.expiresAt)) {
      console.log(`[verify-otp] OTP expired for ${formattedPhone}`);
      await db.collection('otps').doc(formattedPhone).delete().catch(() => {});
      return res.status(400).json({ success: false, error: 'OTP expired' });
    }

    if (otpData.otp !== otp) {
      console.log(`[verify-otp] Invalid OTP attempt for ${formattedPhone}: ${otp} vs ${otpData.otp}`);
      return res.status(400).json({ success: false, error: 'Invalid OTP' });
    }

    // Success - clean up
    await db.collection('otps').doc(formattedPhone).delete().catch(() => {});
    if (otpDoc.exists === false) await db.collection('otps').doc(phone).delete().catch(() => {});

    // Look up Firebase UID by phone number using consistent formatting

    // New Multi-Clinic Resolution Strategy
    const allClinics = [];
    const uniqueUids = new Set();

    try {
      console.log(`[verify-otp] Starting clinic discovery for ${formattedPhone}`);

      // Check Strategy 1: Users collection (Primary owner account)
      const usersSnap = await db.collection('users')
        .where('phone', '==', String(formattedPhone))
        .limit(5)
        .get();
      
      usersSnap.docs.forEach(d => {
        console.log(`[verify-otp] Found user via formatted phone: ${d.id}`);
        uniqueUids.add(String(d.id));
      });

      // Check Strategy 2: Clinics collection (by whatsapp or phone)
      const clinicChecks = [formattedPhone, rawPhone, phone].filter(Boolean);
      for (const fieldVal of clinicChecks) {
        const valStr = String(fieldVal);
        
        const waMatch = await db.collection('clinics').where('whatsapp', '==', valStr).limit(10).get();
        waMatch.docs.forEach(d => {
          const cData = d.data();
          if (!allClinics.find(c => c.id === d.id)) {
            allClinics.push({ id: d.id, name: cData.clinicName, subdomain: cData.subdomain, logo: cData.settings?.logo || cData.logo, status: cData.subscriptionStatus, uid: cData.uid });
          }
          if (cData.uid) uniqueUids.add(String(cData.uid));
        });

        const phoneMatch = await db.collection('clinics').where('phone', '==', valStr).limit(10).get();
        phoneMatch.docs.forEach(d => {
          const cData = d.data();
          if (!allClinics.find(c => c.id === d.id)) {
            allClinics.push({ id: d.id, name: cData.clinicName, subdomain: cData.subdomain, logo: cData.settings?.logo || cData.logo, status: cData.subscriptionStatus, uid: cData.uid });
          }
          if (cData.uid) uniqueUids.add(String(cData.uid));
        });
      }

      // If no clinics found in Strategy 2, but we have a User UID, try to find clinics for that UID
      if (allClinics.length === 0 && uniqueUids.size > 0) {
        for (const uid of uniqueUids) {
          if (!uid) continue;
          const uidClinics = await db.collection('clinics').where('uid', '==', String(uid)).limit(10).get();
          uidClinics.docs.forEach(d => {
            const cData = d.data();
            if (!allClinics.find(c => c.id === d.id)) {
              allClinics.push({ id: d.id, name: cData.clinicName, subdomain: cData.subdomain, logo: cData.settings?.logo || cData.logo, status: cData.subscriptionStatus, uid: cData.uid });
            }
          });
        }
      }
    } catch (discoveryErr) {
      console.error('[verify-otp] Discovery error (non-fatal):', discoveryErr);
    }

    console.log(`[verify-otp] Discovery complete. Clinics: ${allClinics.length}, UIDs: ${uniqueUids.size}`);

    // Resolution Logic
    let requiresSelection = allClinics.length > 1;
    let selectedUid = null;
    let selectedToken = null;

    if (allClinics.length === 1) {
      selectedUid = allClinics[0].uid;
    } else if (allClinics.length === 0 && uniqueUids.size > 0) {
      selectedUid = Array.from(uniqueUids)[0];
    } else if (allClinics.length > 1) {
      // If multiple, check if they all share the same UID
      const distinctUids = new Set(allClinics.map(c => c.uid).filter(u => !!u));
      if (distinctUids.size === 1) {
        selectedUid = Array.from(distinctUids)[0];
        // We still show selection to be safe and "WOW" the user
        requiresSelection = true;
      }
    }

    if (!requiresSelection && selectedUid) {
      try {
        console.log(`[verify-otp] Creating token for UID: ${selectedUid}`);
        selectedToken = await createCustomToken(String(selectedUid), { 
          phone: String(formattedPhone), 
          purpose: String(otpData?.purpose || 'signin') 
        });
      } catch (err) {
        console.error('[verify-otp] Token creation failed:', err);
      }
    }

    res.json({ 
      success: true, 
      purpose: otpData?.purpose || 'signin', 
      requiresSelection,
      clinics: allClinics,
      token: selectedToken, 
      userId: selectedUid 
    });

  } catch (err) {
    console.error('[OTP Verify Critical Error]:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

/**
 * POST /api/notifications/notify-clinic-approval
 * Sends the "Welcome Onboard" WhatsApp template to a clinic owner.
 */
router.post('/notify-clinic-approval', async (req, res) => {
  try {
    const { clinicId } = req.body;
    if (!clinicId) return res.status(400).json({ error: 'clinicId required' });

    const db = await fetchDb();
    if (!db) return res.status(503).json({ error: 'Database not available' });

    const snap = await db.collection('clinics').doc(clinicId).get();
    if (!snap.exists) return res.status(404).json({ error: 'Clinic not found' });

    const clinic = snap.data();
    
    // Trigger notification
    await notifyClinicApproval({
      phone: clinic.whatsapp || clinic.phone,
      ownerName: clinic.physioName,
      clinicName: clinic.clinicName,
      subdomain: clinic.subdomain
    });

    res.json({ success: true, message: 'Approval notification sent' });
  } catch (err) {
    console.error('[Notifications] Approval notify error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/notifications/complete-selection-login
 * Generates a custom token for a specific UID after user selection.
 */
router.post('/complete-selection-login', async (req, res) => {
  try {
    const { phone, userId, purpose } = req.body;
    if (!phone || !userId) return res.status(400).json({ error: 'phone and userId required' });

    // Normalize phone for consistency
    const phoneStr = String(phone).replace(/\D/g, '');
    const cleanPhone = phoneStr.startsWith('0') ? phoneStr.substring(1) : phoneStr;
    const formattedPhone = `+${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}`;

    const token = await createCustomToken(userId, { phone: formattedPhone, purpose: purpose || 'login' });
    res.json({ success: true, token, userId });
  } catch (err) {
    console.error('[Selection Login Error]:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;