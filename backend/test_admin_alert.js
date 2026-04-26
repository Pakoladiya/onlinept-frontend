import dotenv from 'dotenv';
dotenv.config();
import { notifySuperAdminNewClinic } from './services/whatsapp.js';

async function testAdmin() {
  const data = {
    clinicName: 'Test Clinic',
    ownerName: 'Test Owner',
    phone: '919228108454',
    subdomain: 'testclinic',
    plan: 'Starter'
  };

  try {
    console.log('Testing Admin Alert...');
    const result = await notifySuperAdminNewClinic(data);
    console.log('Result:', result);
  } catch (err) {
    console.error('Error:', err);
  }
}

testAdmin();
