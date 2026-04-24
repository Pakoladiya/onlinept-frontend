import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  arrayUnion,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './config';

/**
 * Delete a document by ID.
 * @param {string} collectionName
 * @param {string} docId
 */
export async function deleteDocument(collectionName, docId) {
  if (!db) return;
  const ref = doc(db, collectionName, docId);
  return deleteDoc(ref);
}

/**
 * Get a single document by ID.
 * @param {string} collectionName
 * @param {string} docId
 */
export async function getDocument(collectionName, docId) {
  const ref = doc(db, collectionName, docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Create or overwrite a document.
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} data
 */
export async function setDocument(collectionName, docId, data) {
  const ref = doc(db, collectionName, docId);
  return setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Update specific fields on a document.
 * @param {string} collectionName
 * @param {string} docId
 * @param {object} fields
 */
export async function updateDocument(collectionName, docId, fields) {
  const ref = doc(db, collectionName, docId);
  return updateDoc(ref, { ...fields, updatedAt: serverTimestamp() });
}

/**
 * Add a new document (auto-generated ID).
 * @param {string} collectionName
 * @param {object} data
 * @returns {Promise<{id: string}>}
 */
export async function addDocument(collectionName, data) {
  const col = collection(db, collectionName);
  const docRef = await addDoc(col, { ...data, createdAt: serverTimestamp() });
  return { id: docRef.id };
}

/**
 * Query documents by a single field.
 * @param {string} collectionName
 * @param {string} field
 * @param {any} value
 * @returns {Promise<Array>}
 */
export async function queryByField(collectionName, field, value) {
  const col = collection(db, collectionName);
  const q = query(col, where(field, '==', value));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Domain-specific helpers ─────────────────────────────────────

/**
 * Get a clinic config by clinic slug.
 * @param {string} clinicSlug
 */
export async function getClinic(clinicSlug) {
  return getDocument('clinics', clinicSlug);
}

/**
 * Get a clinic by its owner's UID, with optional phone fallback for WhatsApp sessions.
 * @param {string} uid
 * @param {string} [phone] — optional phone number for WA session fallback
 */
export async function getClinicByOwner(uid, phone = null) {
  if (!db) return null;
  const col = collection(db, 'clinics');

  // Primary: look up by uid
  if (uid && !uid.startsWith('wa_')) {
    const q = query(col, where('uid', '==', uid));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const d = snapshot.docs[0];
      return { id: d.id, ...d.data() };
    }
  }

  // Fallback: search by whatsapp or phone field (for WhatsApp OTP sessions)
  const searchPhone = phone || (uid?.startsWith('wa_') ? uid.replace('wa_', '') : null);
  if (searchPhone) {
    const normalized = searchPhone.startsWith('+') ? searchPhone : `+${searchPhone.replace(/\D/g, '')}`;
    const raw = searchPhone.replace(/\D/g, '');

    // Helper: pick active clinic over pending ones (multiple clinics may share same number)
    const pickBest = (docs) => {
      const active = docs.find(d => d.data().subscriptionStatus === 'active');
      const nonPending = docs.find(d => d.data().subscriptionStatus !== 'pending_approval');
      const chosen = active || nonPending || docs[0];
      return chosen ? { id: chosen.id, ...chosen.data() } : null;
    };

    // Try whatsapp field
    for (const fieldVal of [normalized, raw, searchPhone]) {
      const q2 = query(col, where('whatsapp', '==', fieldVal), limit(10));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        const result = pickBest(snap2.docs);
        if (result) return result;
      }
      const q3 = query(col, where('phone', '==', fieldVal), limit(10));
      const snap3 = await getDocs(q3);
      if (!snap3.empty) {
        const result = pickBest(snap3.docs);
        if (result) return result;
      }
    }
  }

  return null;
}

/**
 * Get all available slots for a given date (ISO string YYYY-MM-DD).
 * @param {string} clinicSlug
 * @param {string} dateStr
 */
export async function getSlotsForDate(clinicSlug, dateStr) {
  return queryByField('clinics', clinicSlug, 'slots', dateStr);
}

/**
 * Get all bookings for a patient.
 * @param {string} patientId
 */
export async function getPatientBookings(patientId) {
  return queryByField('bookings', 'patientId', patientId);
}

/**
 * Get a booking by ID.
 * @param {string} bookingId
 */
export async function getBooking(bookingId) {
  return getDocument('bookings', bookingId);
}

/**
 * Get all bookings for a physio/clinic.
 * @param {string} uid  — Firebase auth UID of the physio
 * @returns {Promise<Array>}
 */
export async function getPhysioBookings(uid) {
  if (!db) return [];
  const col = collection(db, 'bookings');
  const q = query(col, where('physioId', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Get all patients (unique by phone) for a physio.
 * @param {string} uid
 * @returns {Promise<Array>}
 */
export async function getPhysioPatients(uid) {
  if (!db) return [];
  const col = collection(db, 'patients');
  const q = query(col, where('physioId', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Save patient intake data (SOAP notes) after booking confirmation.
 * @param {string} bookingId
 * @param {object} intakeData
 */
export async function saveIntakeData(bookingId, intakeData) {
  if (!db) return;
  const ref = doc(db, 'bookings', bookingId);
  return setDoc(ref, {
    intake: intakeData,
    intakeCompletedAt: serverTimestamp(),
    status: 'pending_payment',
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Save a HEP (Home Exercise Plan) for a patient.
 * @param {string} patientId
 * @param {object} hepData  — { exercises, patientName, physioName, createdAt }
 */
export async function saveHEP(patientId, hepData) {
  if (!db) return;
  const col = collection(db, 'patients', patientId, 'hep');
  return addDoc(col, { ...hepData, createdAt: serverTimestamp() });
}

/**
 * Block a time slot for a physio.
 * @param {string} uid
 * @param {string} dateStr  — YYYY-MM-DD
 * @param {object} blockData — { startTime, endTime, reason }
 */
export async function blockSlot(uid, dateStr, blockData) {
  if (!db) return;
  const col = collection(db, 'blockedSlots');
  return addDoc(col, {
    uid,
    date: dateStr,
    ...blockData,
    createdAt: serverTimestamp(),
  });
}

/**
 * Get blocked slots for a physio.
 * @param {string} uid
 * @param {string} dateStr
 */
export async function getBlockedSlots(uid, dateStr) {
  if (!db) return [];
  const col = collection(db, 'blockedSlots');
  const q = query(col, where('uid', '==', uid), where('date', '==', dateStr));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Create a new booking.
 * @param {object} data
 */
export async function createBooking(data) {
  return addDocument('bookings', {
    ...data,
    status: 'pending_payment',
  });
}

/**
 * Update booking status.
 * @param {string} bookingId
 * @param {string} status
 * @param {object} extraFields
 */
export async function updateBookingStatus(bookingId, status, extraFields = {}) {
  return updateDocument('bookings', bookingId, { status, ...extraFields });
}

/**
 * Check if a booking is within the rescheduling window (e.g., at least 12 hours before).
 * @param {object} booking
 * @param {number} hours
 */
export function isWithinRescheduleWindow(booking, hours = 12) {
  if (!booking || !booking.date || !booking.slot) return false;
  
  let bDate;
  try {
    if (booking.date instanceof Date) {
      bDate = new Date(booking.date);
    } else if (booking.date?.toDate) {
      bDate = booking.date.toDate();
    } else {
      bDate = new Date(booking.date);
    }

    // Extract time from slot (e.g., "09:00 AM")
    const timeStr = (typeof booking.slot === 'object' ? booking.slot?.label : booking.slot) || '';
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    
    if (timeMatch) {
      let [_, h, m, meridiem] = timeMatch;
      h = parseInt(h);
      m = parseInt(m);
      if (meridiem) {
        if (meridiem.toUpperCase() === 'PM' && h < 12) h += 12;
        if (meridiem.toUpperCase() === 'AM' && h === 12) h = 0;
      }
      bDate.setHours(h, m, 0, 0);
    }

    const now = new Date();
    const diffMs = bDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return diffHours >= hours;
  } catch (err) {
    console.error('Window Check Error:', err);
    return false;
  }
}

/**
 * Reschedule a booking (can only be done once, at least 4h before).
 * @param {string} bookingId
 * @param {object} newSlot  - { date, slot }
 */
export async function rescheduleBooking(bookingId, newSlot) {
  const booking = await getBooking(bookingId);
  if (!booking) throw new Error('Booking not found.');
  
  const count = (booking.rescheduleCount || 0);
  if (count >= 1) {
    throw new Error('Appointment has already been rescheduled once and cannot be moved again.');
  }

  if (!isWithinRescheduleWindow(booking, 12)) {
    throw new Error('Appointments can only be rescheduled at least 12 hours before the scheduled time.');
  }

  return updateDocument('bookings', bookingId, {
    date: newSlot.date,
    slot: newSlot.slot,
    rescheduleCount: count + 1,
    status: 'rescheduled',
    isRescheduled: true,
  });
}

/**
 * Get all platform bookings for Super Admin.
 */
export async function getAllPlatformBookings() {
  if (!db) return [];
  try {
    const col = collection(db, 'bookings');
    // We remove orderBy from query because it requires a manual index in Firestore.
    // If the index isn't created yet, the query returns empty or errors.
    // We'll sort locally instead for the Super Admin view.
    const q = query(col, limit(1000)); 
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Local sort by createdAt desc
    return results.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  } catch (err) {
    console.error('Failed to get platform bookings:', err);
    return [];
  }
}
