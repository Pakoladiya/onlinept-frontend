import admin from 'firebase-admin';

let _db = null;

export function getDb() {
  if (_db) return _db;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    return null;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        type: 'service_account',
        project_id: projectId,
        private_key: privateKey.replace(/\\n/g, '\n'),
        client_email: clientEmail,
      }),
    });
  }
  _db = admin.firestore();
  return _db;
}

export default { getDb };