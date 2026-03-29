/**
 * White-Label Clinic Configuration — FULL SCHEMA
 * ────────────────────────────────────────────────
 * Edit this file to rebrand the entire app for a new clinic.
 * All colors, clinic info, services, and feature flags live here.
 *
 * HOW COLORS FLOW:
 *   clinicConfig.js → derivedConfig.cssVariables
 *   → ThemeProvider injects into :root
 *   → TailwindCSS uses CSS variable token classes (bg-primary, text-primary, etc.)
 *
 * TO ADD A NEW CLINIC:
 *   1. Update clinicId, clinicName, tagline
 *   2. Update physioName, qualifications, experience
 *   3. Set primaryColor + secondaryColor
 *   4. Add/update services array
 *   5. Configure videoMode + razorpayEnabled
 *   6. Done — entire app theme updates automatically
 */

export const updateClinicConfig = (newConfig) => {
  // Deep merge for nested config elements like 'features', 'workingHours', 'services'
  Object.keys(newConfig).forEach(key => {
    if (typeof newConfig[key] === 'object' && newConfig[key] !== null && !Array.isArray(newConfig[key])) {
      if (!clinicConfig[key]) clinicConfig[key] = {};
      Object.assign(clinicConfig[key], newConfig[key]);
    } else {
      clinicConfig[key] = newConfig[key];
    }
  });

  // Re-compute derived config values globally
  if (clinicConfig.primaryColor) {
    derivedConfig.cssVariables['--color-primary'] = clinicConfig.primaryColor;
    derivedConfig.cssVariables['--color-primary-hover'] = shadeColor(clinicConfig.primaryColor, -10);
    derivedConfig.cssVariables['--color-primary-light'] = shadeColor(clinicConfig.primaryColor, 92);
    derivedConfig.cssVariables['--color-primary-dark'] = shadeColor(clinicConfig.primaryColor, -15);
  }
  if (clinicConfig.secondaryColor) {
    derivedConfig.cssVariables['--color-secondary'] = clinicConfig.secondaryColor;
    derivedConfig.cssVariables['--color-secondary-hover'] = shadeColor(clinicConfig.secondaryColor, -10);
    derivedConfig.cssVariables['--color-secondary-light'] = shadeColor(clinicConfig.secondaryColor, 92);
  }

  derivedConfig.whatsappClean = (clinicConfig.whatsappNumber || '').replace(/\s|\+|\D/g, '');
  derivedConfig.whatsappLink = clinicConfig.whatsappNumber 
    ? `https://wa.me/${derivedConfig.whatsappClean}?text=${encodeURIComponent(clinicConfig.whatsappMessagePrefill || '')}`
    : '';
};

const clinicConfig = {
  // ── Clinic Identity ──────────────────────────────────────────
  clinicId: 'nfc_surat',
  clinicName: 'Nijanand Fitness Centre',
  tagline: 'Expert physiotherapy & fitness consultations online',
  logo: '/assets/nfc-logo.png',

  // ── Physio Profile ──────────────────────────────────────────
  physioName: 'Dr. Jiten Makwana',
  qualifications: 'BPT, MIAP',
  experience: '8+ years',
  photo: '/assets/physio-photo.jpg',
  bio: 'Specializes in musculoskeletal disorders, sports rehabilitation, and online physiotherapy consultation. Committed to evidence-based practice and personalized care plans.',
  bio_hi: '',
  bio_gu: '',

  // ── Brand Colors ─────────────────────────────────────────────
  // primaryColor: CTAs, active states, primary actions
  primaryColor: '#39A900',
  // secondaryColor: accents, highlights, secondary actions
  secondaryColor: '#F6A000',

  // ── Contact Information ───────────────────────────────────────
  phone: '+91 63551 08454',
  whatsapp: '916355108454',
  email: 'info@nijanandfitness.com',
  address: '241, Royal Arcade, 2nd Floor, Varachha, Surat',
  mapUrl: '',
  city: 'Surat',
  state: 'Gujarat',
  timezone: 'Asia/Kolkata',

  // ── WhatsApp Integration ────────────────────────────────────
  whatsappNumber: '916355108454',
  whatsappMessagePrefill: 'Hi, I would like to book a physiotherapy consultation.',

  // ── Social & Reputation ──────────────────────────────────────
  instagramUrl: '',
  facebookUrl: '',
  youtubeUrl: '',
  twitterUrl: '',
  googleReviewUrl: '',

  // ── Gallery Showcase ────────────────────────────────────────
  galleryBanner: '',
  galleryImage1: '',
  galleryImage2: '',

  // ── Video Platform ─────────────────────────────────────────
  // "zoom" | "meet" | "whatsapp"
  videoMode: 'zoom',
  meetLink: '',

  // ── Payments ────────────────────────────────────────────────
  razorpayEnabled: false,
  razorpayKeyId: '',
  razorpayKeySecret: '',
  currency: 'INR',
  gstNumber: '',

  // ── Services ────────────────────────────────────────────────
  services: [
    {
      id: 'initial',
      name: 'Initial Consultation',
      duration: 45,
      price: 500,
      description: 'First-time comprehensive assessment, diagnosis discussion, and personalized treatment plan.',
    },
    {
      id: 'followup',
      name: 'Follow-up Session',
      duration: 30,
      price: 300,
      description: 'Progress review, continued treatment, and exercise plan updates.',
    },
    {
      id: 'report',
      name: 'Report Review',
      duration: 20,
      price: 200,
      description: 'MRI, X-ray, or lab report analysis with expert interpretation.',
    },
  ],

  // Default consultation fee (falls back to first service price if not set)
  consultationFee: 500,

  // ── Slot Duration (minutes) ─────────────────────────────────
  slotDurationMinutes: 30,

  // ── Working Hours ───────────────────────────────────────────
  workingHours: {
    start: '09:00',
    end: '19:00',
    days: [1, 2, 3, 4, 5, 6], // Mon–Sat
  },

  // ── Locale ─────────────────────────────────────────────────
  locale: 'en',

  // ── Features ────────────────────────────────────────────────
  features: {
    payments: true,
    hepBuilder: true,
    soapNotes: true,
    invoicing: true,
    analytics: true,
    multiPhysio: false,
  },
};

/**
 * Derived values — do not edit directly.
 */
export const derivedConfig = {
  cssVariables: {
    '--color-primary': clinicConfig.primaryColor,
    '--color-primary-hover': shadeColor(clinicConfig.primaryColor, -10),
    '--color-primary-light': shadeColor(clinicConfig.primaryColor, 92),
    '--color-primary-dark': shadeColor(clinicConfig.primaryColor, -15),
    '--color-secondary': clinicConfig.secondaryColor,
    '--color-secondary-hover': shadeColor(clinicConfig.secondaryColor, -10),
    '--color-secondary-light': shadeColor(clinicConfig.secondaryColor, 92),
    '--color-background': '#ffffff',
    '--color-surface': '#f9fafb',
    '--color-text-primary': '#111827',
    '--color-text-secondary': '#6b7280',
    '--color-border': '#e5e7eb',
    '--color-success': '#10b981',
    '--color-error': '#ef4444',
    '--color-warning': '#f59e0b',
    '--color-info': '#3b82f6',
  },

  whatsappLink: '',
  whatsappClean: '',
};

// Initialize safe values
updateClinicConfig({});

/**
 * Shade a hex color.
 * @param {string} hex
 * @param {number} percent
 */
function shadeColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

export default clinicConfig;
