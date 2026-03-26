# Setup Guide — Physio Consultation PWA

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- Git

---

## Quick Start

### 1. Clone / Navigate

```bash
cd "C:\Users\jiten\Documents\Online Consultation"
```

### 2. Install Dependencies

```bash
npm install
cd backend && npm install && cd ..
```

### 3. Configure Environment Variables

```bash
# Frontend — copy and fill in values
cp .env.example .env

# Backend — copy and fill in values
cp backend/.env.example backend/.env
```

See `KEYS_NEEDED.md` for the full list of required API keys.

### 4. Start Development Servers

**Terminal 1 — Frontend (port 5173):**
```bash
npm run dev
```

**Terminal 2 — Backend (port 5000):**
```bash
cd backend && node server.js
```

### 5. Open App

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password provider
4. Create a **Web App** in Project Settings → copy the `firebaseConfig` object
5. Enable **Firestore Database** (start in test mode for development)
6. Update `src/firebase/config.js` with your Firebase config
7. In Firebase Console → Authentication → Users → Add your physio account

---

## Deploy to Production

### Frontend (Vercel — recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
# VITE_RAZORPAY_KEY_ID
# VITE_RAZORPAY_KEY_SECRET
# VITE_API_URL = https://your-backend.onrender.com
```

### Backend (Render)

1. Create account at [render.com](https://render.com)
2. Connect GitHub repo
3. Create **Web Service**:
   - Build command: `npm install`
   - Start command: `node server.js`
   - Environment: Node
4. Add environment variables from `KEYS_NEEDED.md`
5. Set `VITE_API_URL` in Vercel to your Render URL

---

## Customizing for Your Clinic

### Option A: Use the Setup Wizard

Navigate to `http://localhost:5173/setup` after deployment to configure:

1. Clinic name, physiotherapist name, contact info
2. Services (name, duration, price)
3. Branding (primary color, secondary color)
4. Feature toggles (payments, HEP, analytics)
5. Video platform (Zoom / Google Meet / WhatsApp)
6. Working hours

### Option B: Edit clinicConfig.js Directly

Edit `src/config/clinicConfig.js`:

```js
const clinicConfig = {
  clinicName: 'Your Clinic Name',
  physioName: 'Dr. Your Name',
  primaryColor: '#YOUR_COLOR',
  services: [
    { id: 'svc1', name: 'Service Name', duration: 30, price: 500, description: '...' },
  ],
  // ...
};
export { derivedConfig };
```

---

## WhatsApp Business Setup

1. Get a WhatsApp Business account number
2. Add the number to `clinicConfig.whatsappNumber` in `clinicConfig.js`
3. The app will auto-generate WhatsApp links for sharing

---

## Zoom Server-to-Server OAuth Setup

1. Go to [marketplace.zoom.us](https://marketplace.zoom.us)
2. Develop → Create App → Server-to-Server OAuth
3. Copy Account ID, Client ID, Client Secret to backend `.env`
4. Add to `backend/.env`:
   ```
   ZOOM_ACCOUNT_ID=your_account_id
   ZOOM_CLIENT_ID=your_client_id
   ZOOM_CLIENT_SECRET=your_client_secret
   ```

---

## Razorpay Payment Setup

1. Create account at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Get API Key ID and Secret from Settings → API Keys
3. Set up Webhook in Settings → Webhooks:
   - URL: `https://your-backend.onrender.com/api/payments/webhook`
   - Events: `payment.captured`, `payment.failed`, `refund.created`
4. Add to both `backend/.env` and Vercel env vars:
   ```
   RAZORPAY_KEY_ID=your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```

---

## Firestore Security Rules (Production)

When ready to go live, apply these Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Appointments: only authenticated physio can read/write
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null;
    }
    // Slots: only authenticated physio can modify
    match /clinics/{clinicId}/slots/{date} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // Patients: only authenticated physio can read/write
    match /patients/{patientId} {
      allow read, write: if request.auth != null;
    }
  }
}
```
