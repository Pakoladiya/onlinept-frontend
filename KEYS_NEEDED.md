# API Keys Needed

## Frontend — `.env`

| Variable | Where to Get | Required For |
|----------|-------------|-------------|
| `VITE_RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys | Payment checkout |
| `VITE_RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys | — (server-side only) |
| `VITE_API_URL` | Your deployed backend URL (e.g. `https://api.yourapp.onrender.com`) | API calls |
| `VITE_FIREBASE_*` | Firebase Console → Project Settings → Your Apps → SDK setup | Auth (see Firebase config) |

### Firebase Config Fields (src/firebase/config.js)

| Field | Where to Get |
|-------|-------------|
| `apiKey` | Firebase Console → Project Settings → Your Apps → SDK setup |
| `authDomain` | Same — `your-project.firebaseapp.com` |
| `projectId` | Same — `your-project-id` |
| `storageBucket` | Same — `your-project.appspot.com` |
| `messagingSenderId` | Same |
| `appId` | Same |

---

## Backend — `backend/.env`

| Variable | Where to Get | Required For |
|----------|-------------|-------------|
| `PORT` | Set manually | Server port (default 5000) |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys | Order creation |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys | Signature verification |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Dashboard → Settings → Webhooks | Webhook verification |
| `ZOOM_ACCOUNT_ID` | Zoom Marketplace → Your Server-to-Server App | Meeting creation |
| `ZOOM_CLIENT_ID` | Zoom Marketplace → Your Server-to-Server App | Meeting creation |
| `ZOOM_CLIENT_SECRET` | Zoom Marketplace → Your Server-to-Server App | Meeting creation |
| `FIREBASE_PROJECT_ID` | Firebase Console → Project Settings | Token verification |
| `FIREBASE_CLIENT_EMAIL` | Firebase Console → Project Settings → Service Accounts | Token verification |
| `FIREBASE_PRIVATE_KEY` | Firebase Console → Project Settings → Service Accounts → Generate new private key | Token verification |
| `WHATSAPP_PHONE_ID` | Meta for Developers → WhatsApp → API Setup | WhatsApp notifications |
| `WHATSAPP_ADMIN_TOKEN` | (Configured ✅) | WhatsApp notifications |

### Firebase Admin Setup

1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Copy values to backend `.env`:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

---

## Development Placeholders (for demo mode)

If keys are not configured, the app automatically falls back to **mock mode**:

- **Zoom mock**: Returns fake meeting URLs (visible as `mode: 'mock'` in response)
- **Razorpay mock**: Simulates payment success without real charges
- **Firebase mock**: App still works, but auth is non-functional

This allows full UI testing without any API keys.

---

## Priority Order for Real Keys

1. **Firebase** — needed for dashboard login
2. **Zoom** — needed for real video meetings
3. **Razorpay** — needed for real payments
