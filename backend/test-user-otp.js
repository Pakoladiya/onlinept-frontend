
import 'dotenv/config';
import { sendOTP } from './services/whatsapp.js';

async function testOTP() {
    const phone = '919427285154'; // Number from screenshot
    console.log('Sending test OTP to:', phone);
    try {
        const res = await sendOTP(phone, '123456', 'Test User');
        console.log('RESULT:', JSON.stringify(res, null, 2));
    } catch (e) {
        console.error('ERROR:', e.message);
    }
    process.exit();
}

testOTP();
