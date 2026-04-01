import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
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
 * Get a clinic by its owner's UID.
 * @param {string} uid
 */
export async function getClinicByOwner(uid) {
  if (!db) return null;
  const col = collection(db, 'clinics');
  const q = query(col, where('uid', '==', uid));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
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
  return updateDoc(ref, {
    intake: intakeData,
    intakeCompletedAt: serverTimestamp(),
  });
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
