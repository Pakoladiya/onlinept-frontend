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
