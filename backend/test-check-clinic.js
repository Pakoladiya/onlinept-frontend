
import 'dotenv/config';
import { getDb } from './services/firebase-admin.js';

async function checkClinic(id) {
    const db = await getDb();
    if (!db) {
        console.error('FAILED_TO_CONNECT_DB');
        return;
    }
    const doc = await db.collection('clinics').doc(id).get();
    if (doc.exists) {
        console.log('CLINIC_EXISTS:', JSON.stringify(doc.data(), null, 2));
    } else {
        console.log('CLINIC_NOT_FOUND');
    }
    process.exit();
}

const target = process.argv[2] || 'draruna';
checkClinic(target);
