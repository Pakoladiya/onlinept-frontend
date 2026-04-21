import { derivedConfig } from '@/config/clinicConfig';

/**
 * Build a WhatsApp deep link for a given message.
 */
export function whatsappLink(message = '', phone = '') {
  const num = phone?.replace(/\D/g, '') || derivedConfig.whatsappClean;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${num}${encoded ? `?text=${encoded}` : ''}`;
}

export function appointmentReminder({ patientName, serviceName, date, time, bookingId, clinicName }) {
  return `Hi ${patientName}! This is a reminder for your upcoming physiotherapy appointment at ${clinicName}.\n\n` +
    `Service: ${serviceName}\nDate: ${date}\nTime: ${time}\nBooking ID: ${bookingId}\n\n` +
    `If you need to reschedule or have any questions, please contact us. We look forward to seeing you!`;
}

/**
 * Post-session follow-up message.
 * Extended version supports HEP, VAS, appointment data.
 */
export function postSessionMessage({ patientName, physioName, followUpDate, clinicName }) {
  return `Hi ${patientName}! Thank you for your session with ${physioName} at ${clinicName}.\n\n` +
    `Your prescribed exercises have been shared. Please complete them as instructed.\n\n` +
    `${followUpDate ? `Your next appointment is scheduled for ${followUpDate}.\n\n` : ''}` +
    `Get well soon!`;
}

/**
 * Full session summary message with HEP, VAS, next appointment.
 */
export function sessionSummaryMessage({ patientName, physioName, clinicName, sessionDate, vasScore, hepExercises, nextAppointment, pdfUrl }) {
  const parts = [];
  parts.push(`Hi ${patientName}! Thank you for your session with ${physioName} at ${clinicName}.`);

  if (sessionDate) parts.push(`\n📅 Session Date: ${sessionDate}`);
  if (vasScore !== undefined && vasScore !== null) parts.push(`\n📊 Pain Score (VAS): ${vasScore}/10`);

  if (hepExercises && hepExercises.length > 0) {
    parts.push('\n\n🏋️ Home Exercises Prescribed:');
    hepExercises.forEach((ex, i) => {
      parts.push(`\n${i + 1}. ${ex.name} — ${ex.sets} sets × ${ex.reps} reps, ${ex.frequency}`);
      if (ex.notes) parts.push(`   Note: ${ex.notes}`);
    });
  }

  if (nextAppointment) {
    parts.push(`\n\n📆 Next Appointment: ${nextAppointment.date} at ${nextAppointment.time}`);
  }

  if (pdfUrl) {
    parts.push(`\n\n📄 Session Summary PDF: ${pdfUrl}`);
  }

  parts.push('\n\nPlease complete your exercises as instructed. Get well soon! 🙏');
  return parts.join('');
}

export function paymentConfirmation({ patientName, amount, serviceName, bookingId, clinicName }) {
  const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
  return `Hi ${patientName}, your payment of ${fmt.format(amount)} for ${serviceName} has been received.\n\n` +
    `Booking ID: ${bookingId}\nClinic: ${clinicName}\n\n` +
    `You will receive a confirmation message with your session details shortly.`;
}

/**
 * Expand {{variable}} placeholders in a message template.
 * @param {string} template - e.g. "Hi {{patientName}}, your appointment is at {{time}}"
 * @param {object} vars - { patientName, serviceName, date, time, bookingId, clinicName, physioName, vasScore, ... }
 * @returns {string}
 */
export function expandMessageVariables(template, vars = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : match;
  });
}

/**
 * Build WhatsApp deep link for session summary.
 */
export function sessionSummaryWhatsAppLink(params) {
  return whatsappLink(sessionSummaryMessage(params));
}