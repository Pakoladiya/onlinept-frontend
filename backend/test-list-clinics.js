
import 'dotenv/config';
import { getDb } from './services/firebase-admin.js';

async function listClinics() {
    const db = await getDb();
    if (!db) {
        console.error('FAILED_TO_CONNECT_DB');
        return;
    }
    const snap = await db.collection('clinics').get();
    console.log('TOTAL_CLINICS:', snap.size);
    snap.forEach(doc => {
        console.log(`- ${doc.id} (${doc.data().clinicName})`);
    });
    process.exit();
}

listClinics();
