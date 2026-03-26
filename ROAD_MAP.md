# 🏥 Online Consultation Web App (Physio / Fitness)

## 🎯 Vision

A white-label, Apple iOS–inspired web application for online physiotherapy and fitness consultations.

* Clean UI (Apple-style minimal design)
* Multi-clinic white-label support
* Seamless booking → payment → consultation → follow-up flow

---

## 🎨 Design System (Apple-Inspired)

### UI Principles

* Minimal
* High whitespace
* Soft shadows
* Rounded corners (12–16px)
* Smooth transitions

### Typography

* Font: Inter / SF Pro (fallback)
* Headings: Semi-bold
* Body: Regular
* Line height: 1.5+

### Colors (Example NFC Branding)

```js
export const clinicConfig = {
  clinicName: "Nijanand Fitness Centre",
  primaryColor: "#39A900",
  secondaryColor: "#F6A000",
  logo: "/assets/nfc-logo.png",
  phone: "6355108454",
  videoMode: "zoom"
}
```

---

# 📦 Phase 1 — Project Setup

**Timeline: Week 1–2**

### Goal:

Foundation + reusable architecture

### Tasks:

* [ ] Create GitHub repository
* [ ] Setup React + Vite
* [ ] Install Tailwind CSS
* [ ] Setup folder structure
* [ ] Create white-label config system
* [ ] Build basic layout (Navbar + Container)

---

# 📦 Phase 2 — Patient Booking Flow

**Timeline: Week 3–4**

### Goal:

Patient can book a consultation slot

### Screens:

* [ ] Landing Page (Profile + Services)
* [ ] Slot Selection (Calendar UI)
* [ ] Intake Form

  * Name
  * Age
  * Complaint
  * Pain Area
* [ ] Confirmation Page

### Backend:

* [ ] Firebase setup
* [ ] Slot management API
* [ ] Patient registration
* [ ] Booking creation
* [ ] WhatsApp redirect link

### Database Structure:

```
Firebase/
├── clinics/
│   └── nfc/
│       ├── config
│       └── slots/
├── patients/
│   └── {patientId}/
│       ├── profile
│       └── bookings/
└── bookings/
    └── {bookingId}/
        ├── patientId
        ├── dateTime
        ├── status
        └── zoomLink
```

---

# 📦 Phase 3 — Video Integration

**Timeline: Week 5**

### Goal:

Auto-generate consultation link

### Tasks:

* [ ] Zoom OAuth integration
* [ ] Auto-create meeting
* [ ] Store meeting link
* [ ] Join Session Page
* [ ] Countdown Timer
* [ ] Google Meet fallback

---

# 📦 Phase 4 — Payments

**Timeline: Week 6**

### Goal:

Collect payment before session

### Tasks:

* [ ] Razorpay integration
* [ ] Payment success → confirm booking
* [ ] Payment failure → release slot
* [ ] Invoice generation (PDF)
* [ ] GST toggle option

### Flow:

```
Form → Payment → Confirmation → Meeting Link → WhatsApp
```

---

# 📦 Phase 5 — Physio Dashboard

**Timeline: Week 7–8**

### Goal:

Complete control panel for physio

### Features:

* [ ] Login (Firebase Auth)
* [ ] Today’s appointments
* [ ] Patient history
* [ ] SOAP notes editor
* [ ] Slot management
* [ ] Analytics dashboard

---

# 📦 Phase 6 — Post Session Features

**Timeline: Week 9–10**

### Goal:

Improve patient outcomes

### Features:

* [ ] HEP (Home Exercise Plan)
* [ ] Exercise library
* [ ] Session summary
* [ ] Feedback form
* [ ] Follow-up booking

---

# 📦 Phase 7 — White Label System

**Timeline: Week 11–12**

### Goal:

Make it scalable for multiple clinics

### Features:

* [ ] Admin onboarding form
* [ ] Theme generator
* [ ] Subdomain support
* [ ] Multi-clinic backend
* [ ] Setup documentation

---

# 🗓️ Timeline Summary

| Phase | Feature      | Duration |
| ----- | ------------ | -------- |
| 1     | Setup        | 2 weeks  |
| 2     | Booking Flow | 2 weeks  |
| 3     | Video        | 1 week   |
| 4     | Payment      | 1 week   |
| 5     | Dashboard    | 2 weeks  |
| 6     | Post-care    | 2 weeks  |
| 7     | White-label  | 2 weeks  |

---

# 🚀 Immediate Next Steps

```
1. Create GitHub repo
2. Setup React + Vite + Tailwind
3. Implement clinicConfig system
4. Build landing page (NFC branding)
5. Add slot selection UI
```

---

# 💡 Future Enhancements

* AI-based exercise recommendations
* Voice notes for physio
* WhatsApp bot integration
* Mobile app version (React Native)

---

# 🧠 Tech Stack

* Frontend: React + Vite + Tailwind
* Backend: Firebase (Firestore + Auth)
* Payments: Razorpay
* Video: Zoom API / Google Meet
* Hosting: Vercel / Firebase Hosting

---

# 📌 Notes

* Keep UI extremely clean (Apple-like)
* Focus on UX > features
* Build MVP fast → improve later
* Reuse yoga app components where possible

---
