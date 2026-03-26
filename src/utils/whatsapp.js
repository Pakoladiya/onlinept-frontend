import { derivedConfig } from '@/config/clinicConfig';

/**
 * Build a WhatsApp deep link for a given message.
 * Uses the cleaned WhatsApp number from derivedConfig.
 */
export function whatsappLink(message = '') {
  const num = derivedConfig.whatsappClean;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${num}${encoded ? `?text=${encoded}` : ''}`;
}

/**
 * Appointment reminder message for the patient.
 */
export function appointmentReminder({ patientName, serviceName, date, time, bookingId, clinicName }) {
  return `Hi ${patientName}! This is a reminder for your upcoming physiotherapy appointment at ${clinicName}.\n\n` +
    `Service: ${serviceName}\nDate: ${date}\nTime: ${time}\nBooking ID: ${bookingId}\n\n` +
    `If you need to reschedule or have any questions, please contact us. We look forward to seeing you!`;
}

/**
 * Post-session follow-up message sent to patient.
 */
export function postSessionMessage({ patientName, physioName, followUpDate, clinicName }) {
  return `Hi ${patientName}! Thank you for your session with ${physioName} at ${clinicName}.\n\n` +
    `Your prescribed exercises have been shared. Please complete them as instructed.\n\n` +
    `${followUpDate ? `Your next appointment is scheduled for ${followUpDate}.\n\n` : ''}` +
    `Get well soon!`;
}

/**
 * Payment confirmation message.
 */
export function paymentConfirmation({ patientName, amount, serviceName, bookingId, clinicName }) {
  const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
  return `Hi ${patientName}, your payment of ${fmt.format(amount)} for ${serviceName} has been received.\n\n` +
    `Booking ID: ${bookingId}\nClinic: ${clinicName}\n\n` +
    `You will receive a confirmation message with your session details shortly.`;
}
