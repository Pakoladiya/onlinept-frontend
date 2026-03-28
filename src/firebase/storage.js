import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Upload a file to Firebase Storage and return the download URL.
 * @param {File} file
 * @param {string} path — e.g. 'clinics/nfc_surat/logo.png'
 * @returns {Promise<string>} download URL
 */
export async function uploadFile(file, path) {
  if (!storage) throw new Error('Firebase Storage is not configured.');
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}
