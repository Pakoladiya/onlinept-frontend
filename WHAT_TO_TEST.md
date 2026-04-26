# What to Test

Test the app in the following order. Each section builds on the previous.

---

## 1. Public Patient Flow

### Landing Page (`/`)
- [ ] Clinic branding (name, colors, logo) displays correctly
- [ ] Hero section CTA navigates to `/book`
- [ ] Services section shows services from `clinicConfig.js`
- [ ] Physio profile section renders
- [ ] How It Works section renders
- [ ] Mobile layout looks correct

### Booking Page (`/book`)
- [ ] Service selector shows all services with prices
- [ ] Calendar shows available dates (working days only)
- [ ] Selecting a date shows time slots
- [ ] Slots are grouped: Morning / Afternoon / Evening
- [ ] Booked slots appear disabled (grayed out)
- [ ] Clicking "Book" navigates to intake form
- [ ] Intake form receives correct date, slot, and service data

### Intake Form (`/intake/:bookingId`)
- [ ] Step 1: Personal details form validates required fields
- [ ] Step 2: Body map hotspots are clickable and highlight on select
- [ ] Step 2: VAS pain slider changes color (green → yellow → red)
- [ ] Step 2: Duration radio buttons work
- [ ] Step 3: Medical history checkboxes toggle
- [ ] Step 3: File upload accepts images
- [ ] Step 4: Review shows all entered data
- [ ] Edit button navigates back to correct step
- [ ] Confirm button navigates to payment

### Payment Page (`/payment/:bookingId`)
- [ ] Booking summary shows correct service, date, time
- [ ] Promo code `FIRST10` applies 10% discount
- [ ] Promo code `HEALTH20` applies 20% discount
- [ ] Promo code `MAKWANA` applies 15% discount
- [ ] Invalid promo code shows error message
- [ ] Invoice button opens print dialog with formatted invoice
- [ ] **Demo mode** (no Razorpay): "Simulate Payment" navigates to confirmation
- [ ] **Live mode** (Razorpay configured): Pay button opens Razorpay checkout
- [ ] Security badges display (SSL, Razorpay, PCI)

### Confirmation Page (`/confirmation/:id`)
- [ ] Success animation plays
- [ ] Booking details (date, time, service) display correctly
- [ ] "Add to Google Calendar" downloads .ics file
- [ ] "Share via WhatsApp" opens WhatsApp with pre-filled message
- [ ] "Go to Join Page" navigates to `/join/:bookingId`
- [ ] Copy booking ID button works
- [ ] "Back to Home" navigates to `/`

### Join Session Page (`/join/:bookingId`)
- [ ] Countdown timer counts down to session time
- [ ] Session status badge shows: Upcoming / Starting Soon / Live Now
- [ ] Preparation checklist items can be checked
- [ ] Checked items persist on page refresh (localStorage)
- [ ] "Join Now" button opens video link (Zoom / Meet / WhatsApp)
- [ ] Copy meeting link works
- [ ] Technical issues accordion expands with troubleshooting tips

---

## 2. Physio Dashboard

### Login (`/dashboard-login`)
- [ ] Email/password form validates
- [ ] Wrong password shows error message
- [ ] Correct credentials redirect to `/dashboard`
- [ ] Eye icon toggles password visibility

### Dashboard — Today Tab
- [ ] Today's appointments show with correct times
- [ ] Stats grid shows correct counts
- [ ] "Start" button changes status to "In Session"
- [ ] "End Session" button marks as completed
- [ ] Completed appointments show green avatar

### Dashboard — Patients Tab
- [ ] All patients listed with avatar initials
- [ ] Search filters patients by name, phone, city
- [ ] Clicking patient opens Patient Modal
- [ ] Patient Modal shows all SOAP notes
- [ ] SOAP notes fields are editable (Edit button)
- [ ] Save button persists changes
- [ ] Call and WhatsApp buttons work

### Dashboard — Slots Tab
- [ ] Date navigation (prev/next day) works
- [ ] Available slots show green badge
- [ ] Booked slots show red badge
- [ ] Block/Unblock toggle works
- [ ] Blocked slots show yellow badge

### Dashboard — Analytics Tab
- [ ] Stats cards show correct values
- [ ] Weekly bar chart renders
- [ ] Monthly patient volume bars render

### Dashboard — Settings Tab
- [ ] Clinic name is editable
- [ ] Primary color picker updates in real time
- [ ] Color change affects entire app theme
- [ ] Save button shows "Saved!" confirmation

---

## 3. HEP Builder (`/hep`)

- [ ] Exercise library loads with 30 exercises
- [ ] Category filter tabs work (Stretches, Strengthening, Cardio, Balance, Posture)
- [ ] Search filters by name and description
- [ ] Clicking "+" adds exercise to assigned list
- [ ] Sets counter increments/decrements
- [ ] Reps field is editable
- [ ] "Copy to Clipboard" copies formatted exercise list
- [ ] WhatsApp button opens WhatsApp with full HEP text

---

## 4. Post Session (`/post-session/:bookingId`)

- [ ] Star rating (1-5) is selectable with hover preview
- [ ] Text feedback textarea accepts input
- [ ] Yes/No recommendation buttons toggle correctly
- [ ] Submit button sends feedback (mock)
- [ ] Success screen shows after submission
- [ ] WhatsApp exercises button opens WhatsApp

---

## 5. White-Label

### Onboarding (`/setup`)
- [ ] 6-step wizard navigates correctly
- [ ] Clinic info step saves data
- [ ] Services step allows add/remove of services
- [ ] Branding step shows live color preview
- [ ] Features step toggles work
- [ ] Video step highlights selected platform
- [ ] Hours step allows day selection and time range
- [ ] Finish button shows success screen
- [ ] Completing setup navigates to home

### Theme System
- [ ] Changing `primaryColor` in clinicConfig updates all buttons, badges, accents
- [ ] Theme changes persist after page refresh

---

## 6. PWA

- [ ] App installs on mobile ("Add to Home Screen" prompt)
- [ ] App icon shows on home screen
- [ ] App opens in standalone mode (no browser chrome)
- [ ] Offline: cached pages load without internet
- [ ] Service worker updates on new version

---

## 7. Backend APIs

Test all routes with `curl` or Postman:

```bash
# Create appointment
curl -X POST https://onlinept-render.onrender.com/api/appointments/create \
  -H "Content-Type: application/json" \
  -d '{"patientName":"Test","serviceId":"initial","date":"2026-03-27","slot":"10:00"}'

# Get slots
curl "https://onlinept-render.onrender.com/api/slots/nfc_surat?date=2026-03-27"

# Create Zoom meeting (mock mode)
curl -X POST https://onlinept-render.onrender.com/api/zoom/create-meeting \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"test123","dateTime":"2026-03-27T10:00:00","duration":30}'

# Create payment order (mock mode)
curl -X POST https://onlinept-render.onrender.com/api/payments/create-order \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"test123","amount":50000}'
```

---

## 8. Error Cases

- [ ] Empty booking form shows validation errors
- [ ] Double-booking same slot returns 409 Conflict
- [ ] Invalid promo code shows error
- [ ] Unauthenticated access to `/dashboard` redirects to login
- [ ] Missing API keys show mock responses (not crashes)
