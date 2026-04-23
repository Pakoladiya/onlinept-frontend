
import 'dotenv/config';
import { notifyPatientBooking } from './services/whatsapp.js';

async function test() {
  console.log('Testing AiSensy WhatsApp Integration...');
  console.log('API Key:', process.env.AISENSY_API_KEY ? 'Present' : 'MISSING');
  console.log('Booking Campaign:', process.env.AISENSY_CAMPAIGN_BOOKING);

  // This matches the notifyPatientBooking signature
  const testData = {
    phone: '9518536838', // Ensure this is correct for your test
    name: 'Test Patient',
    clinicName: 'OnlinePT Demo',
    dateDisplay: '2026-04-22',
    slotLabel: '10:00 AM',
    meetingLink: 'https://onlinept.in/join/test'
  };

  console.log('Sending message to:', testData.phone);
  
  const result = await notifyPatientBooking(testData);
  console.log('Result:', JSON.stringify(result, null, 2));
}

test();
