
import 'dotenv/config';
import { notifyPatientBooking } from './services/whatsapp.js';

async function test() {
  console.log('Testing Onbbits WhatsApp Integration...');
  console.log('API Key:', process.env.AISENSY_API_KEY ? 'Present ✅' : 'MISSING ❌');
  console.log('Booking Campaign:', process.env.AISENSY_CAMPAIGN_BOOKING);

  const testData = {
    phone: '9228108454',          // ← real patient number
    name: 'Test Patient',
    subdomain: 'nijanand',        // ← real clinic subdomain
    dateDisplay: '25 Apr 2026',
    slotLabel: '10:00 AM',
    meetingLink: 'https://nijanand.onlinept.in/join/test'
  };

  console.log('\nSending booking confirmation to:', testData.phone);
  
  const result = await notifyPatientBooking(testData);
  
  if (result.success) {
    console.log('✅ SUCCESS! Message sent.');
    console.log('Message ID:', result.data?.messageId);
  } else {
    console.log('❌ FAILED:', JSON.stringify(result.error, null, 2));
  }
}

test();
