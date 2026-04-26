import axios from 'axios';

/**
 * Onbbits WhatsApp API Service
 * Endpoint: https://api.onbbits.io/api/campaigns/send
 */

const ONBBITS_URL = 'https://api.onbbits.io/api/campaigns/send';

const toTitleCase = (str) => (str || '').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

/**
 * Generic function to trigger an Onbbits Campaign
 */
export async function sendOnbbitsCampaign(to, campaignName, params = [], config = {}) {
  const token = config.token || process.env.AISENSY_API_KEY;
  const userName = config.userName || 'User';

  if (!to || !token || !campaignName) {
    const missing = [];
    if (!to) missing.push('recipient number');
    if (!token) missing.push('Token/Key');
    if (!campaignName) missing.push('Campaign Name');
    console.warn(`[Onbbits] Missing config (${missing.join(', ')}). Message not sent.`);
    return { success: false, error: `Missing configuration: ${missing.join(', ')}` };
  }

  // Normalize to E.164 with '+' prefix
  const digits = String(to).replace(/\D/g, '');
  if (!digits) return { success: false, error: 'Invalid phone number' };
  
  // If it starts with '0', remove it (common in some formats)
  const cleanDigits = digits.startsWith('0') ? digits.substring(1) : digits;
  const formattedNumber = `+${cleanDigits.startsWith('91') ? cleanDigits : '91' + cleanDigits}`;
  
  console.log(`[Onbbits] Attempting send to: ${formattedNumber}, campaign: ${campaignName}`);

  try {
    const components = [];

    // Body Parameters
    if (params && params.length > 0) {
      components.push({
        type: 'body',
        parameters: params.map(p => ({
          type: 'text',
          text: String(p)
        }))
      });
    }
    
    // Header Parameters
    if (config.headerParams && config.headerParams.length > 0) {
      components.unshift({
        type: 'header',
        parameters: config.headerParams.map(p => ({
          type: 'text',
          text: String(p)
        }))
      });
    }

    // Button Parameters (Essential for OTP templates with buttons)
    if (config.buttonParam) {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: config.buttonIndex !== undefined ? Number(config.buttonIndex) : 0,
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

    if (response.data && response.data.success === false) {
      console.error('[Onbbits API Failure]:', response.data);
      return { success: false, error: response.data.message || 'API rejected the request' };
    }

    return { success: true, data: response.data };
  } catch (error) {
    const errorData = error.response?.data || error.message;
    console.error('[Onbbits Service Exception]:', errorData);
    return { success: false, error: errorData };
  }
}

/**
 * Send OTP via WhatsApp
 */
export async function sendOTP(to, otp, userName = 'User') {
  const campaign = process.env.AISENSY_CAMPAIGN_OTP || 'opt';
  
  // The template 'OTP Campaing Through API' (and likely others) 
  // requires the OTP in both the body and as a button parameter.
  return sendOnbbitsCampaign(to, campaign, [otp], {
    userName,
    buttonParam: otp
  });
}

/**
 * 1. Notify Patient of Booking Confirmation
 *    Template: patient_booking_confirmed
 *    {{1}} = patient name
 *    {{2}} = clinic subdomain (e.g. "drjiten")
 *    {{3}} = appointment date (e.g. "25 Apr 2025")
 *    {{4}} = appointment time (e.g. "10:00 AM")
 *    Button = "Talk To Clinic" → session/join link
 */
export async function notifyPatientBooking(patientData, config = {}) {
  const campaign = process.env.AISENSY_CAMPAIGN_BOOKING || 'patient_booking_confirmed';

  const params = [
    patientData.name,       // {{1}} Hi {name}!
    patientData.subdomain || patientData.clinicName, // {{2}} appointment at {subdomain}
    patientData.dateDisplay, // {{3}} Date
    patientData.slotLabel,   // {{4}} Time
  ];

  const campaignName = process.env.AISENSY_CAMPAIGN_BOOKING || 'patient_booking_confirmed';

  return sendOnbbitsCampaign(patientData.phone, campaignName, params, {
    ...config,
    userName: patientData.name,
    // No buttonParam — both templates use static URL buttons
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
 * 3. Notify Therapist of New Appointment
 *    ─────────────────────────────────────────────────────────────
 *    Approved Template: applointment_booking_therapist_notification
 *    Category: UTILITY  |  Language: EN-US  |  Status: SUBMITTED
 *    ─────────────────────────────────────────────────────────────
 *    Header : "New Appointment Booked"
 *
 *    Body   : "Hi! You have a new appointment booking on your domain.
 *
 *              Patient: {{1}} Phone: {{2}} Date: {{3}} Time: {{4}}
 *              Service: {{5}} Platform: {{6}}.
 *              You can check dashboard for further details."
 *
 *    Footer : "OnlinePT: Excellent care, Anywhere"
 *    ─────────────────────────────────────────────────────────────
 *    {{1}} = Patient name
 *    {{2}} = Patient phone number
 *    {{3}} = Appointment date   (e.g. "25 Apr 2026")
 *    {{4}} = Appointment time   (e.g. "10:00 AM")
 *    {{5}} = Service name       (e.g. "Back Pain Consultation")
 *    {{6}} = Platform           (e.g. "WhatsApp Video")
 *    ─────────────────────────────────────────────────────────────
 */
export async function notifyTherapistNewBooking(therapistPhone, data, config = {}) {
  if (!therapistPhone) return;
  const campaign = process.env.AISENSY_CAMPAIGN_THERAPIST_BOOKING || 'applointment_booking_therapist_notification';

  const params = [
    data.patientName,                           // {{1}} Patient
    data.patientPhone,                          // {{2}} Phone
    data.date,                                  // {{3}} Date
    data.time,                                  // {{4}} Time
    data.serviceName || 'Consultation',         // {{5}} Service
    data.preferredPlatform || 'WhatsApp Video', // {{6}} Platform
  ];

  return sendOnbbitsCampaign(therapistPhone, campaign, params, {
    ...config,
    userName: 'Physio'
  });
}

/**
 * 4. Notify Therapist of Reschedule
 *    ─────────────────────────────────────────────────────────────
 *    Approved Template: therapist_reschedule_alert
 *    Category: UTILITY  |  Language: EN-US  |  Status: SUBMITTED
 *    ─────────────────────────────────────────────────────────────
 *    Header : "Appointment Rescheduled."
 *
 *    Body   : "Hi! An appointment has been rescheduled on your domain.
 *
 *              Patient: {{1}} Phone: {{2}} New Date: {{3}} New Time: {{4}}
 *              Platform{{5}}.
 *              View updated schedule: https://{{6}}.onlinept.in/dashboard"
 *
 *    Footer : "OnlinePT: Excellent care, Anywhere."
 *    ─────────────────────────────────────────────────────────────
 *    {{1}} = Patient name
 *    {{2}} = Patient phone number
 *    {{3}} = New appointment date  (e.g. "25 Apr 2026")
 *    {{4}} = New appointment time  (e.g. "10:00 AM")
 *    {{5}} = Platform              (e.g. "WhatsApp Video")
 *    {{6}} = Clinic subdomain      (e.g. "drjiten")
 *    ─────────────────────────────────────────────────────────────
 */
export async function notifyTherapistReschedule(therapistPhone, data, config = {}) {
  if (!therapistPhone) return;
  const campaign = process.env.AISENSY_CAMPAIGN_THERAPIST_RESCHEDULE || 'therapist_reschedule_alert';

  const params = [
    data.patientName,                           // {{1}} Patient
    data.patientPhone,                          // {{2}} Phone
    data.date,                                  // {{3}} New Date
    data.time,                                  // {{4}} New Time
    data.preferredPlatform || 'WhatsApp Video', // {{5}} Platform
    data.subdomain                              // {{6}} subdomain → https://{{6}}.onlinept.in/dashboard
  ];

  return sendOnbbitsCampaign(therapistPhone, campaign, params, {
    ...config,
    userName: 'Physio'
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

/**
 * ─── Super Admin Configuration ──────────────────────────────────────────────
 */
const SUPER_ADMIN_PHONE = process.env.SUPER_ADMIN_PHONE || '919228108454';

/**
 * 5. Notify Super Admin of New Clinic Signup
 *    ─────────────────────────────────────────────────────────────
 *    Approved Template: new_clinic_signup_alert
 *    Category: UTILITY  |  Language: EN-US  |  Status: SUBMITTED
 *    ─────────────────────────────────────────────────────────────
 *    Header : "New Clinic Registered"
 *
 *    Body   : "Hi Admin! A new clinic has registered on OnlinePT
 *              and is pending your approval.
 *
 *              Clinic: {{1}}
 *              Owner: {{2}}
 *              Phone: {{3}}
 *              Subdomain: {{4}}.onlinept.in
 *              Plan: {{5}}
 *
 *              Please review and approve from the admin dashboard."
 *
 *    Footer : (none)
 *    ─────────────────────────────────────────────────────────────
 *    {{1}} = Clinic name
 *    {{2}} = Owner / therapist name
 *    {{3}} = Phone number
 *    {{4}} = Requested subdomain
 *    {{5}} = Selected plan
 *    ─────────────────────────────────────────────────────────────
 */
export async function notifySuperAdminNewClinic(data, config = {}) {
  let campaign = process.env.AISENSY_CAMPAIGN_NEW_CLINIC || 'new_clinic_signup_alert';

  let params = [
    toTitleCase(data.clinicName),                // {{1}} Clinic
    toTitleCase(data.ownerName),                 // {{2}} Owner
    data.phone,                                  // {{3}} Phone
    data.subdomain.toLowerCase(),                // {{4}} Subdomain (always lower)
    data.plan || 'Starter',                      // {{5}} Plan
  ];

  // If using the generic OTP campaign as a fallback (which only has 1 param and 15 char limit)
  if (campaign === 'OTP Campaing Through API') {
    params = [`Clinic: ${toTitleCase(data.clinicName).slice(0, 7)}`]; 
  } else if (campaign === 'appointment confirmation to patients2') {
    // If we're forced to use the booking template for an admin alert, at least make the labels clear
    params = [
      `ADMIN: ${toTitleCase(data.ownerName).slice(0, 20)}`, // {{1}} Name
      toTitleCase(data.clinicName).slice(0, 30),          // {{2}} Clinic
      `SUBDOMAIN: ${data.subdomain.toLowerCase()}`,        // {{3}} Date field used for subdomain
      `PLAN: ${data.plan || 'Starter'}`                   // {{4}} Time field used for plan
    ];
  }

  console.log(`[Notify] Super Admin alert: New clinic "${data.clinicName}" by ${data.ownerName}`);

  return sendOnbbitsCampaign(SUPER_ADMIN_PHONE, campaign, params, {
    ...config,
    userName: 'Admin'
  });
}

/**
 * 6. Notify Patient of Appointment Cancellation
 *    ─────────────────────────────────────────────────────────────
 *    Approved Template: patient_booking_cancelled
 *    Category: UTILITY  |  Language: EN-US
 *    ─────────────────────────────────────────────────────────────
 *    Body   : "Hi {{1}},
 *
 *              Your appointment on {{2}} at {{3}} has been cancelled.
 *
 *              We're here whenever you need us.
 *
 *              — OnlinePT"
 *    ─────────────────────────────────────────────────────────────
 *    {{1}} = Patient name
 *    {{2}} = Date
 *    {{3}} = Time
 *    ─────────────────────────────────────────────────────────────
 */
export async function notifyPatientCancellation(data, config = {}) {
  const campaign = process.env.AISENSY_CAMPAIGN_PATIENT_CANCEL || 'patient_booking_cancelled';
  const to = data.phone;

  if (!to) {
    console.error('[WA] Cannot notify cancellation: No patient phone');
    return;
  }

  const params = [
    data.name || 'Patient',  // {{1}}
    data.date,               // {{2}}
    data.time,               // {{3}}
  ];

  console.log(`[Notify] Sending cancellation alert to patient ${data.name} (${to})`);

  return sendOnbbitsCampaign(to, campaign, params, {
    ...config,
    userName: data.name,
    headerParams: [data.name || 'Patient'] // {{1}} in Header
  });
}

/**
 * 7. Notify Clinic Owner of Approval
 *    ─────────────────────────────────────────────────────────────
 *    Approved Template: clinic_approved_notification
 *    Category: UTILITY  |  Language: EN-US
 *    ─────────────────────────────────────────────────────────────
 *    Header : "Welcome Onboard {{1}}"
 *    Body   : "Congratulations {{1}}!
 *
 *              Your clinic \"{{2}}\" has been approved on OnlinePT!
 *
 *              Your portal is now LIVE at: {{3}}.onlinept.in
 *
 *              Welcome aboard! 🚀
 *              Wish you a fruitful staying.
 *
 *              — OnlinePT Platform Team"
 *    ─────────────────────────────────────────────────────────────
 *    {{1}} = Therapist Name (Header & Body)
 *    {{2}} = Clinic Name
 *    {{3}} = Subdomain
 *    ─────────────────────────────────────────────────────────────
 */
export async function notifyClinicApproval(data, config = {}) {
  const campaign = process.env.AISENSY_CAMPAIGN_APPROVAL || 'clinic_approved_notification';
  const to = data.phone;

  if (!to) {
    console.error('[WA] Cannot notify approval: No owner phone');
    return;
  }

  let params = [
    data.ownerName || 'Therapist', // {{1}} - Header & Body
    data.clinicName,              // {{2}}
    data.subdomain,               // {{3}}
  ];

  // Fallback for if they use the patient appointment template for clinic approval
  if (campaign === 'appointment confirmation to patients2') {
    params = [
      toTitleCase(data.ownerName).slice(0, 30),    // {{1}} Therapist Name
      toTitleCase(data.clinicName).slice(0, 30),   // {{2}} Clinic Name
      'PORTAL ACTIVATED',                          // {{3}} Date field
      `${data.subdomain}.onlinept.in`              // {{4}} Time field
    ];
  }

  console.log(`[Notify] Sending approval alert to clinic owner ${data.ownerName} (${to})`);

  return sendOnbbitsCampaign(to, campaign, params, {
    ...config,
    userName: data.ownerName,
    headerParams: [data.ownerName || 'Therapist'] 
  });
}
