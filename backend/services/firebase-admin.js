import admin from 'firebase-admin';

let _db = null;

export function getDb() {
  if (!_db) {
    if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            type: 'service_account',
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
          }),
        });
      } catch (err) {
        console.warn('[firebase-admin] Failed to initialize Firebase Admin:', err.message);
        return null;
      }
    }
    _db = admin.firestore();
  }
  return _db;
}

export default { getDb };