# 🏗️ Architecture Overview — Online Consultation App

## 🎯 Goal

Define how frontend, backend, and database interact in a scalable way.

---

# 🧩 High-Level Architecture

```
Frontend (React)
      ↓
Firebase (Auth + Firestore)
      ↓
External Services
  - Zoom API
  - Razorpay
  - WhatsApp
```

---

# 📁 Folder Structure (Frontend)

```
src/
├── components/        # Reusable UI
├── pages/             # Screens
├── layouts/           # App structure
├── hooks/             # Custom hooks
├── services/          # API calls
├── store/             # Global state
├── utils/             # Helpers
├── config/            # White-label config
└── assets/
```

---

# 🧠 State Management

* Use React Context (initially)
* Avoid Redux for MVP
* Store:

  * User data
  * Booking state
  * Clinic config

---

# 🔥 Firebase Architecture

## Collections:

* clinics
* patients
* bookings
* slots

## Flow:

1. Patient selects slot
2. Booking created
3. Payment processed
4. Status updated
5. Zoom link attached

---

# 🔐 Authentication Flow

* Firebase Email/Password
* Role-based:

  * Admin (physio)
  * Patient (optional later)

---

# 💳 Payment Flow (Razorpay)

1. Create order (backend)
2. Open checkout
3. Verify payment
4. Update booking status

---

# 🎥 Video Flow

* Booking confirmed
* Zoom meeting auto-created
* Link stored in DB
* Patient joins via "Join Session"

---

# 📡 API Structure (if needed later)

```
/api/
├── create-booking
├── verify-payment
├── create-zoom-link
```

---

# 🎨 White Label System

* Config-driven UI
* Dynamic theme loading
* Subdomain-based clinic loading

---

# 🚀 Scalability Plan

* Start with Firebase
* Move to Node backend later if needed
* Add caching for slots

---

# ⚠️ Important Rules

* Keep components reusable
* Avoid hardcoding clinic data
* Always use config file
* Keep UI clean (Apple style)

---
