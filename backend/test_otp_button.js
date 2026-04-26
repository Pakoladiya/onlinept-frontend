import dotenv from 'dotenv';
dotenv.config(); // Assuming run from backend dir
import axios from 'axios';

const ONBBITS_URL = 'https://api.onbbits.io/api/campaigns/send';

async function testOTP() {
  const token = process.env.AISENSY_API_KEY;
  const campaign = process.env.AISENSY_CAMPAIGN_OTP || 'OTP Campaing Through API';
  const to = '919228108454';
  
  console.log('Token exists:', !!token);
  console.log('Campaign:', campaign);

  const payload = {
    token: token,
    campaignName: campaign,
    destination: `+${to}`,
    userName: 'TestUser',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: '123456' }
        ]
      },
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [
          { type: 'text', text: '123456' }
        ]
      }
    ]
  };

  try {
    const res = await axios.post(ONBBITS_URL, payload);
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error Details:', JSON.stringify(err.response?.data || err.message, null, 2));
  }
}

testOTP();
