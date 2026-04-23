import axios from 'axios';

/**
 * Onbbits WhatsApp API Service
 * Endpoint: https://api.onbbits.io/api/campaigns/send
 */

const ONBBITS_URL = 'https://api.onbbits.io/api/campaigns/send';

/**
 * Generic function to trigger an Onbbits Campaign
 */
export async function sendOnbbitsCampaign(to, campaignName, params = [], config = {}) {
  const token = config.token || process.env.AISENSY_API_KEY; // Reusing env var name or mapping to a new one
  const userName = config.userName || 'User';

  if (!to || !token || !campaignName) {
    const missing = [];
    if (!to) missing.push('recipient number');
    if (!token) missing.push('Token');
    if (!campaignName) missing.push('Campaign Name');
    console.warn(`[Onbbits] Missing config (${missing.join(', ')}). Message not sent.`);
    return { success: false, error: `Missing configuration: ${missing.join(', ')}` };
  }

  // Ensure format is +91XXXXXXXXXX
  const formattedNumber = to.startsWith('+') ? to : `+${to.replace(/\D/g, '')}`;

  try {
    // Construct components based on params
    // Assuming params[0] is for body, others might be for buttons or additional body parts
    const components = [
      {
        type: 'body',
        parameters: params.map(p => ({
          type: 'text',
          text: String(p)
        }))
      }
    ];

    // If there's a button parameter (e.g., OTP code in a button or link)
    if (config.buttonParam) {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [
          {
            type: 'text',
            text: String(config.buttonParam)
          }
        ]
      });
    }

    const payload = {
      token: token,
      campaignName: campaignName,
      destination: formattedNumber,
      userName: userName,
      components: components
    };

    const response = await axios.post(ONBBITS_URL, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    return { success: true, data: response.data };
  } catch (error) {
    const errorData = error.response?.data || error.message;
    console.error('[Onbbits Service Error]:', errorData);
    return { success: false, error: errorData };
  }
}

/**
 * Send OTP via WhatsApp
 */
export async function sendOTP(to, otp, userName = 'User') {
  const campaign = process.env.AISENSY_CAMPAIGN_BOOKING || 'OTP Campaing Through API';
  
  // For Onbbits OTP template, we usually put the OTP in the body or button
  // Based on user's cURL, there are params in both body and button.
  // We'll put OTP in both for safety or follow the template.
  
  return sendOnbbitsCampaign(to, campaign, [otp], {
    userName,
    buttonParam: otp // Also pass as button param if needed
  });
}

/**
 * 1. Notify Patient of Booking Success
 */
export async function notifyPatientBooking(patientData, config = {}) {
  const campaign = process.env.AISENSY_CAMPAIGN_BOOKING || 'booking_confirmation';
  
  const params = [
    patientData.name,
    patientData.clinicName,
    patientData.dateDisplay,
    patientData.slotLabel,
    patientData.meetingLink
  ];

  return sendOnbbitsCampaign(patientData.phone, campaign, params, {
    ...config,
    userName: patientData.name
  });
}

/**
 * 2. Notify Therapist of New Appointment
 */
export async function notifyTherapistNewLead(therapistPhone, patientName, date, time, summary, config = {}) {
  if (!therapistPhone) return;
  const campaign = process.env.AISENSY_CAMPAIGN_THERAPIST_ALERT || 'therapist_alert';
  
  const params = [
    patientName,
    date,
    time,
    summary || 'No additional details.'
  ];

  return sendOnbbitsCampaign(therapistPhone, campaign, params, {
    ...config,
    userName: 'Therapist'
  });
}

/**
 * 3. Appointment Reminder (Automatic)
 */
export async function sendAppointmentReminder(type, to, data, config = {}) {
  const campaign = type === 'patient_reminder' 
    ? (process.env.AISENSY_CAMPAIGN_REMINDER_PATIENT || 'patient_reminder')
    : (process.env.AISENSY_CAMPAIGN_REMINDER_THERAPIST || 'therapist_nudge');

  const params = [
    data.name,
    data.time,
    data.link
  ];

  return sendOnbbitsCampaign(to, campaign, params, {
    ...config,
    userName: data.name
  });
}

/**
 * Legacy compatibility: sendTemplate
 */
export async function sendTemplate(to, templateName, components = [], config = {}) {
  const params = components[0]?.parameters?.map(p => p.text) || [];
  return sendOnbbitsCampaign(to, templateName, params, config);
}


