import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

async function getFirebase() {
  return import('../firebase-admin.js');
}

/**
 * POST /api/clinics/provision
 * Provisions a new clinic. Uses Admin SDK to bypass security rules.
 * Handles duplicate phone/email by linking to existing users.
 */
router.post('/provision', async (req, res) => {
  const traceId = uuidv4().slice(0, 8);
  console.log(`[Provision:${traceId}] Start request for:`, req.body.clinicId);

  try {
    const { clinicId, formData, uid: providedUid } = req.body;
    if (!clinicId || !formData) {
      return res.status(400).json({ error: 'clinicId and formData are required' });
    }

    const { email, password, physioName, phone, plan } = formData;

    const { getDb: fetchDb, getFieldValue, getAuth } = await getFirebase();
    const db = await fetchDb();
    const auth = await getAuth();

    if (!db || !auth) {
      console.error(`[Provision:${traceId}] Firebase services not available`);
      return res.status(503).json({ error: 'Database or Auth service not available' });
    }

    // ── 1. Check Subdomain Availability ──
    const existingClinic = await db.collection('clinics').doc(clinicId).get();
    if (existingClinic.exists) {
      console.warn(`[Provision:${traceId}] Subdomain taken: ${clinicId}`);
      return res.status(400).json({ error: 'Clinic ID (subdomain) is already taken' });
    }

    // ── 2. Phone Normalization (E.164) ──
    let normalizedPhone = phone || '';
    if (normalizedPhone && /^[6-9]\d{9}$/.test(normalizedPhone)) {
      normalizedPhone = `+91${normalizedPhone}`; // Default to India for 10-digit numbers
    } else if (normalizedPhone && !normalizedPhone.startsWith('+')) {
      normalizedPhone = `+${normalizedPhone}`;
    }

    // ── 3. Find or Create User ──
    let finalUid = providedUid;
    
    if (!finalUid || finalUid === 'unknown') {
      console.log(`[Provision:${traceId}] Attempting to resolve user for ${email || normalizedPhone}`);
      
      try {
        // Try finding by email first
        if (email) {
          const userByEmail = await auth.getUserByEmail(email).catch(() => null);
          if (userByEmail) {
            finalUid = userByEmail.uid;
            console.log(`[Provision:${traceId}] Found existing user by email: ${finalUid}`);
          }
        }

        // Try finding by phone if still not found
        if (!finalUid && normalizedPhone) {
          const userByPhone = await auth.getUserByPhoneNumber(normalizedPhone).catch(() => null);
          if (userByPhone) {
            finalUid = userByPhone.uid;
            console.log(`[Provision:${traceId}] Found existing user by phone: ${finalUid}`);
          }
        }

        // Create if totally new
        if (!finalUid) {
          console.log(`[Provision:${traceId}] Creating new Firebase user...`);
          const newUser = await auth.createUser({
            email: email || undefined,
            password: password || uuidv4(), // Random password if missing (unlikely in this flow)
            displayName: physioName,
            phoneNumber: normalizedPhone || undefined,
          });
          finalUid = newUser.uid;
          console.log(`[Provision:${traceId}] Created user: ${finalUid}`);
        }
      } catch (userErr) {
        console.error(`[Provision:${traceId}] Auth resolution failed:`, userErr.message);
        // If we can't create or find user, we MUST stop to avoid 'unknown' UIDs
        return res.status(500).json({ 
          error: `Account setup failed: ${userErr.message}`,
          code: userErr.code 
        });
      }
    }

    // ── 4. Prepare Final Clinic Document ──
    const clinicData = {
      uid: finalUid,
      clinicId,
      clinicName: formData.clinicName || 'My Clinic',
      physioName: formData.physioName || 'Physiotherapist',
      email: formData.email || '',
      phone: normalizedPhone,
      whatsapp: normalizedPhone,
      domain: `${clinicId}.onlinept.in`,
      subdomain: clinicId,
      primaryColor: formData.primaryColor || '#14A3A8',
      secondaryColor: formData.secondaryColor || '#000000',
      tagline: `Expert physiotherapy consultations online`,
      plan: plan || 'Starter',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      subscriptionStatus: 'pending_approval',
      status: 'active',
      workingHours: { start: '09:00', end: '19:00', days: [1, 2, 3, 4, 5, 6] },
      slotDurationMinutes: 30,
      videoMode: 'zoom',
      razorpayEnabled: false,
      currency: 'INR',
      createdAt: getFieldValue().serverTimestamp(),
      createdBy: 'onboarding_flow',
      hasAgreedToTerms: formData.hasAgreedToTerms || false,
      agreedAt: formData.agreedAt || null,
      traceId, // For debugging support
    };

    // ── 5. Final Persistence ──
    console.log(`[Provision:${traceId}] Writing clinic document...`);
    await db.collection('clinics').doc(clinicId).set(clinicData);

    console.log(`[Provision:${traceId}] SUCCESS: Clinic provisioned for ${finalUid}`);
    res.json({ 
      success: true, 
      clinicId, 
      uid: finalUid,
      message: 'Clinic provisioned successfully' 
    });

  } catch (err) {
    console.error(`[Provision:${traceId}] CRITICAL FAIL:`, err);
    res.status(500).json({ 
      success: false, 
      error: `Internal system error during provisioning. Reference ID: ${traceId}`,
      details: err.message,
      code: err.code || 'internal_error'
    });
  }
});

export default router;
